import { Pool } from "mysql2/promise";
import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import { broadcastToUsers } from '../api/ws/user-ws';

export interface AlarmData {
  id: number;
  description: string;
  user_id: number;
  device_id: number;
  datastream_id: number;
  is_active: boolean;
  cooldown_minutes: number;
  last_triggered?: Date;
  created_at: Date;
  updated_at: Date;
  
  // Fields from joined tables
  field_name: string;        // dari datastreams.pin
  data_type: string;         // dari datastreams.type
  datastream_description: string; // dari datastreams.description
  device_description: string; // dari devices.description
  whatsapp_number: string;   // dari users.phone
  user_name: string;         // dari users.name
  user_email: string;        // dari users.email
  condition_operator: string; // dari alarm_conditions.operator
  condition_value: string;   // dari alarm_conditions.threshold
}

export interface NotificationResult {
  success: boolean;
  whatsapp_message_id?: string;
  error_message?: string;
}

export interface AlarmLog {
  id?: number;
  alarm_id: number;
  user_id: number;
  device_id: number;
  datastream_id: number;
  sensor_value: number;
  conditions_text: string;
  notification_type: "browser" | "all";
  whatsapp_message_id?: string;
  error_message?: string;
  triggered_at: Date;
}

export class AlarmNotificationService {
  public db: Pool; // Changed to public for API access
  private lastNotificationTime: number = 0;
  private minNotificationInterval = 500; // delay 500ms
  
  // WhatsApp Web client properties
  private whatsAppClient!: Client;
  private isWhatsAppReady: boolean = false;
  private isWhatsAppInitializing: boolean = false;

  constructor(database: Pool) {
    this.db = database;
    // Initialize WhatsApp Web client
    this.initializeWhatsAppClient();
  }

  /**
   * Initialize WhatsApp Web client with LocalAuth
   */
  private initializeWhatsAppClient(): void {
    // Create client with LocalAuth for persistent sessions
    this.whatsAppClient = new Client({
      authStrategy: new LocalAuth({
        dataPath: '.wwebjs_auth' // Session storage path
      }),
      puppeteer: {
        // Headless environment flags for VPS
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ],
        headless: true // Force headless mode
      }
    });

    this.setupWhatsAppEventHandlers();
    
    // Start initialization asynchronously
    this.startWhatsAppInitialization().catch(error => {
      console.error('❌ Failed to initialize WhatsApp Web in constructor:', error);
    });
  }

  /**
   * Setup event handlers for WhatsApp client
   */
  private setupWhatsAppEventHandlers(): void {
    // Client ready event
    this.whatsAppClient.on('ready', () => {
      console.log('✅ WhatsApp Web client sudah aktif!');
      this.isWhatsAppReady = true;
      this.isWhatsAppInitializing = false;
    });

    // QR Code event - display QR for initial setup
    this.whatsAppClient.on('qr', (qr) => {
      console.log('📱 WhatsApp Web QR Code:');
      console.log('Scan QR code ini dengan aplikasi WhatsApp anda');
      console.log('═'.repeat(50));
      qrcode.generate(qr, { small: true });
      console.log('═'.repeat(50));
    });

    // Authentication success
    this.whatsAppClient.on('authenticated', () => {
      console.log('✅ WhatsApp Web berhasil terkoneksi!');
    });

    // Authentication failure
    this.whatsAppClient.on('auth_failure', (msg) => {
      console.error('❌ Koneksi WhatsApp Web gagal:', msg);
      this.isWhatsAppReady = false;
      this.isWhatsAppInitializing = false;
    });

    // Disconnected event
    this.whatsAppClient.on('disconnected', (reason) => {
      console.log('⚠️ WhatsApp Web disconnected:', reason);
      this.isWhatsAppReady = false;
    });

    // Error event
    this.whatsAppClient.on('error', (error) => {
      console.error('❌ WhatsApp Web error:', error);
    });

    // Message sent acknowledgment
    this.whatsAppClient.on('message_ack', (message, ack) => {
      console.log(`📧 Message ${message.id.id} status: ${ack}`);
    });
  }

  /**
   * Start WhatsApp client initialization
   */
  private async startWhatsAppInitialization(): Promise<void> {
    if (this.isWhatsAppInitializing || this.isWhatsAppReady) {
      // console.log('⚠️ WhatsApp client already initialized or initializing');
      return;
    }

    try {
      console.log('🚀Menginisialisasi WhatsApp Web client...');
      this.isWhatsAppInitializing = true;
      await this.whatsAppClient.initialize();
    } catch (error) {
      console.error('❌ Gagal menginisialisasi WhatsApp client:', error);
      this.isWhatsAppInitializing = false;
      throw error;
    }
  }

  /**
   * Wait for WhatsApp client to be ready
   */
  private async waitForWhatsAppReady(timeoutMs: number = 60000): Promise<boolean> {
    const startTime = Date.now();
    
    while (!this.isWhatsAppReady && (Date.now() - startTime) < timeoutMs) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return this.isWhatsAppReady;
  }

  /**
   * Format phone number untuk Indonesia
   */
  private formatPhoneNumber(phone: string): string {
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Handle Indonesia format
    if (cleaned.startsWith('0')) {
      return '62' + cleaned.substring(1);
    } else if (cleaned.startsWith('62')) {
      return cleaned;
    } else {
      return '62' + cleaned;
    }
  }

  /**
   * Kirim notifikasi WhatsApp via WhatsApp-web.js
   */
  async sendWhatsAppNotification(
    phone: string,
    message: string,
    retryCount: number = 0
  ): Promise<NotificationResult> {
    try {
      if (!phone || phone === "") {
        throw new Error("Phone number is required");
      }

      // Global rate limiting untuk mencegah spam
      const now = Date.now();
      const timeSinceLastNotification = now - this.lastNotificationTime;
      
      if (timeSinceLastNotification < this.minNotificationInterval) {
        const waitTime = this.minNotificationInterval - timeSinceLastNotification;
        // console.log(`⏳ Global rate limit: waiting ${waitTime}ms before sending`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }

      // console.log(`📱 Sending WhatsApp to: ${phone} (Attempt ${retryCount + 1})`);
      // console.log(`📝 Message preview: ${message.substring(0, 100)}...`);

      // Check if WhatsApp Web is ready
      if (!this.isWhatsAppReady) {
        // console.log('⚠️ WhatsApp Web not ready, attempting to initialize...');
        await this.startWhatsAppInitialization();
        
        // Wait for ready
        const isReady = await this.waitForWhatsAppReady(30000);
        if (!isReady) {
          throw new Error('WhatsApp Web belum aktif. Tolong scan ulang QR Code.');
        }
      }

      const formattedPhone = this.formatPhoneNumber(phone);
      const chatId = `${formattedPhone}@c.us`;

      // console.log(`📱 Formatted WhatsApp ID: ${chatId}`);

      // Check if number is registered
      const isRegistered = await this.whatsAppClient.isRegisteredUser(chatId);
      if (!isRegistered) {
        throw new Error(`Phone number ${phone} is not registered on WhatsApp`);
      }

      // Send message via WhatsApp Web
      const sentMessage = await this.whatsAppClient.sendMessage(chatId, message);

      // Update last notification time on success
      this.lastNotificationTime = Date.now();

      // console.log(`✅ WhatsApp sent successfully! Message ID: ${sentMessage.id.id}`);
      
      return {
        success: true,
        whatsapp_message_id: sentMessage.id.id,
      };

    } catch (error) {
      console.error("❌ WhatsApp notification failed:", error);
      
      // Retry logic for WhatsApp Web errors
      if (retryCount < 2) {
        const delay = Math.pow(2, retryCount) * 2000; // 2s, 4s
        // console.log(`⏳ Retrying WhatsApp send in ${delay}ms (attempt ${retryCount + 1}/2)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.sendWhatsAppNotification(phone, message, retryCount + 1);
      }

      return {
        success: false,
        error_message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Kirim notifikasi browser via WebSocket
   */
  async sendBrowserNotification(
    alarm: AlarmData,
    sensorValue: number,
    triggeredAt: Date = new Date()
  ): Promise<NotificationResult> {
    try {
      const notificationPayload = {
        type: "alarm_notification",
        data: {
          id: `alarm_${alarm.id}_${Date.now()}`,
          title: alarm.description,
          message: `Device: ${alarm.device_description}\nDatastream: ${alarm.datastream_description}(${alarm.field_name})\nNilai: ${sensorValue} (${alarm.condition_operator} ${alarm.condition_value})`,
          isRead: false,
          createdAt: triggeredAt.toISOString(),
          priority: "high",
          alarm_id: alarm.id,
          device_id: alarm.device_id,
          datastream_id: alarm.datastream_id,
          sensor_value: sensorValue,
          user_id: alarm.user_id,
          device_description: alarm.device_description,
          datastream_description: alarm.datastream_description,
          condition_text: `${alarm.field_name} ${alarm.condition_operator} ${alarm.condition_value}`,
          user_email: alarm.user_email
        }
      };

      // Broadcast ke semua user yang sedang online via WebSocket
      broadcastToUsers(notificationPayload);
      
      console.log(`📱 Browser notification sent for alarm ${alarm.id}`);
      
      return {
        success: true,
        whatsapp_message_id: `browser_${alarm.id}_${Date.now()}`, // Using this field for tracking
      };

    } catch (error) {
      console.error("❌ Browser notification failed:", error);
      return {
        success: false,
        error_message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Cek alarm berdasarkan data device yang masuk
   */
  async checkAlarms(deviceId: number, receivedData: any): Promise<void> {
    try {
      // console.log(`🔍 Checking alarms for device ${deviceId} with data:`, receivedData);

      // Query untuk mendapatkan alarm yang aktif untuk device ini
      const [alarmRows] = await this.db.execute(`
        SELECT 
          a.id, a.description, a.user_id, a.device_id, a.datastream_id,
          a.is_active, a.cooldown_minutes, a.last_triggered,
          ds.pin as field_name, ds.type as data_type, ds.description as datastream_description,
          dev.description as device_description,
          u.phone as whatsapp_number, u.name as user_name, u.email as user_email,
          ac.operator as condition_operator, ac.threshold as condition_value
        FROM alarms a
        JOIN datastreams ds ON a.datastream_id = ds.id  
        JOIN devices dev ON a.device_id = dev.id
        JOIN users u ON a.user_id = u.id
        JOIN alarm_conditions ac ON a.id = ac.alarm_id
        WHERE a.device_id = ? AND a.is_active = 1
      `, [deviceId]);

      const alarms = alarmRows as any[];
      // console.log(`📋 Found ${alarms.length} active alarms for device ${deviceId}`);

      if (alarms.length === 0) {
        // console.log(`ℹ️ No active alarms configured for device ${deviceId}`);
        return;
      }

      // Loop melalui setiap alarm
      for (const alarm of alarms) {
        try {
          // console.log(`🔍 Processing alarm ${alarm.id}: ${alarm.description}`);
          // console.log(`📊 Checking field: ${alarm.field_name} (${alarm.condition_operator} ${alarm.condition_value})`);

          // Check cooldown period per alarm (berbeda untuk setiap sensor)
          if (alarm.last_triggered) {
            const lastTriggeredTime = new Date(alarm.last_triggered);
            const cooldownMinutes = alarm.cooldown_minutes || 1; // Default 1 menit
            const cooldownMs = cooldownMinutes * 60 * 1000;
            const timeSinceLastTrigger = Date.now() - lastTriggeredTime.getTime();
            
            if (timeSinceLastTrigger < cooldownMs) {
              const remainingCooldownSeconds = Math.ceil((cooldownMs - timeSinceLastTrigger) / 1000);
              const remainingMinutes = Math.floor(remainingCooldownSeconds / 60);
              const remainingSeconds = remainingCooldownSeconds % 60;
              
              console.log(`⏳ Alarm ${alarm.id} masih cooldown. Waktu cooldown yang tersisa: ${remainingCooldownSeconds}s (${cooldownMinutes}m total)`);
              
              // Kirim pesan cooldown untuk pengujian
              if (alarm.whatsapp_number) {
                const cooldownMessage = `⏳ Ini pesan untuk pengujian COOLDOWN. Sensor ${alarm.datastream_description}(${alarm.datastream_id}) pada ${alarm.device_description} masih dalam waktu tunggu ${cooldownMinutes} menit.\n\n` +
                                       `Sisa waktu cooldown: ${remainingMinutes} menit ${remainingSeconds} detik\n` +
                                       `Waktu: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB`;
                
                await this.sendWhatsAppNotification(alarm.whatsapp_number, cooldownMessage);
              }
              
              continue; // Skip this alarm, still in cooldown
            }
          }

          // Ambil nilai dari data yang diterima berdasarkan field_name
          const fieldValue = receivedData[alarm.field_name];
          // console.log(`📈 Current value: ${fieldValue} (type: ${typeof fieldValue})`);

          if (fieldValue === undefined || fieldValue === null) {
            // console.log(`⚠️ Field '${alarm.field_name}' not found in received data`);
            continue;
          }

          // Convert nilai ke number untuk perbandingan numerik
          const numericValue = parseFloat(fieldValue);
          const thresholdValue = parseFloat(alarm.condition_value);

          // console.log(`🔢 Numeric comparison: ${numericValue} ${alarm.condition_operator} ${thresholdValue}`);

          // Evaluasi kondisi alarm
          let conditionMet = false;
          switch (alarm.condition_operator) {
            case '>':
              conditionMet = numericValue > thresholdValue;
              break;
            case '<':
              conditionMet = numericValue < thresholdValue;
              break;
            case '>=':
              conditionMet = numericValue >= thresholdValue;
              break;
            case '<=':
              conditionMet = numericValue <= thresholdValue;
              break;
            case '==':
              conditionMet = numericValue === thresholdValue;
              break;
            case '!=':
              conditionMet = numericValue !== thresholdValue;
              break;
            default:
              // console.log(`❌ Unknown operator: ${alarm.condition_operator}`);
              continue;
          }

          // console.log(`🎯 Condition result: ${conditionMet}`);

          if (conditionMet) {
            // console.log(`🚨 ALARM TRIGGERED! ${alarm.description}`);
            
            // Update last_triggered timestamp untuk cooldown
            const currentTime = new Date();
            await this.db.execute(
              `UPDATE alarms SET last_triggered = ? WHERE id = ?`,
              [currentTime, alarm.id]
            );
            // console.log(`⏰ Updated last_triggered for alarm ${alarm.id} to ${currentTime.toISOString()}`);
            
            // Log alarm ke tabel alarm_notifications
            const conditionsText = `${alarm.field_name} ${alarm.condition_operator} ${alarm.condition_value}`;
            const alarmLog: AlarmLog = {
              alarm_id: alarm.id,
              user_id: alarm.user_id,
              device_id: alarm.device_id,
              datastream_id: alarm.datastream_id,
              sensor_value: numericValue,
              conditions_text: conditionsText,
              notification_type: "all",
              triggered_at: new Date()
            };

            const [logResult] = await this.db.execute(
              `INSERT INTO alarm_notifications (alarm_id, user_id, device_id, datastream_id, sensor_value, conditions_text, notification_type, triggered_at) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              [alarmLog.alarm_id, alarmLog.user_id, alarmLog.device_id, alarmLog.datastream_id, 
               alarmLog.sensor_value, alarmLog.conditions_text, alarmLog.notification_type, alarmLog.triggered_at]
            );

            const logId = (logResult as any).insertId;
            // console.log(`📝 Alarm notification logged with ID: ${logId}`);

            // Kirim notifikasi WhatsApp jika user memiliki nomor WhatsApp
            if (alarm.whatsapp_number) {
              // console.log(`📱 Sending WhatsApp notification to: ${alarm.whatsapp_number}`);

              // Format pesan alarm dengan data yang relevan
              const message = `🚨 PERINGATAN SENSOR ALARM 🚨\n\n` +
                             `📍 Alarm: ${alarm.description}\n` +
                             `⚙ Perangkat: ${alarm.device_description}\n` +
                             `📊 Sensor: ${alarm.datastream_description}(${alarm.field_name})\n` +
                             `📈 Nilai Saat Ini: ${numericValue}\n` +
                             `⚠️ Kondisi: ${alarm.field_name} ${alarm.condition_operator} ${alarm.condition_value}\n` +
                             `👤 Akun: ${alarm.user_email}\n` +
                             `🕐 Waktu: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB\n\n` +
                             `Mohon segera melakukan pengecekan!`;

              // console.log(`📝 Formatted message: ${message}`);

              const notificationResult = await this.sendWhatsAppNotification(
                alarm.whatsapp_number,
                message
              );

              // Update log dengan hasil notifikasi WhatsApp
              if (notificationResult.success) {
                await this.db.execute(
                  `UPDATE alarm_notifications SET 
                    whatsapp_message_id = ?
                  WHERE id = ?`,
                  [notificationResult.whatsapp_message_id, logId]
                );
              } else {
                await this.db.execute(
                  `UPDATE alarm_notifications SET 
                    error_message = ?
                  WHERE id = ?`,
                  [notificationResult.error_message, logId]
                );
              }

              if (notificationResult.success) {
                // console.log(`✅ WhatsApp notification sent successfully for alarm ${alarm.id}`);
              } else {
                console.log(`❌ WhatsApp notification failed for alarm ${alarm.id}: ${notificationResult.error_message}`);
              }
            } else {
              console.log(`ℹ️ Alarm ${alarm.id} has no WhatsApp number configured`);
            }

            // Kirim notifikasi browser via WebSocket untuk semua user
            try {
              const browserResult = await this.sendBrowserNotification(
                alarm,
                numericValue,
                currentTime
              );
              
              if (browserResult.success) {
                console.log(`✅ Browser notification sent successfully for alarm ${alarm.id}`);
              } else {
                console.log(`❌ Browser notification failed for alarm ${alarm.id}: ${browserResult.error_message}`);
              }
            } catch (browserError) {
              console.error(`❌ Error sending browser notification for alarm ${alarm.id}:`, browserError);
            }
          } else {
            console.log(`✅ Condition not met for alarm ${alarm.id}`);
          }
        } catch (alarmError) {
          console.error(`❌ Error processing alarm ${alarm.id}:`, alarmError);
        }
      }
    } catch (error) {
      console.error("❌ Error in checkAlarms:", error);
      throw error;
    }
  }

  /**
   * Test WhatsApp Web service connection
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      console.log("🧪 Testing WhatsApp Web connection...");
      
      if (!this.isWhatsAppReady) {
        return {
          success: false,
          message: this.isWhatsAppInitializing 
            ? "WhatsApp Web is initializing. Please wait or scan QR code if needed."
            : "WhatsApp Web not ready. Please scan QR code to authenticate.",
        };
      }

      // Get client info
      const info = this.whatsAppClient.info;
      
      return {
        success: true,
        message: `WhatsApp Web ready. Connected as: ${info.pushname || 'Unknown'} (${info.wid.user})`,
      };
    } catch (error) {
      console.error("❌ WhatsApp Web connection test failed:", error);
      return {
        success: false,
        message: `Connection test failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  /**
   * Get alarm statistics
   */
  async getAlarmStats(): Promise<any> {
    try {
      const [totalAlarms] = await this.db.execute(
        `SELECT COUNT(*) as total FROM alarms WHERE is_active = 1`
      );

      const [todayTriggers] = await this.db.execute(`
        SELECT COUNT(*) as today_triggers 
        FROM alarm_notifications 
        WHERE DATE(triggered_at) = CURDATE()
      `);

      const [recentLogs] = await this.db.execute(`
        SELECT 
          an.id, an.alarm_id, an.triggered_at, an.notification_type as notification_status,
          an.sensor_value, an.conditions_text,
          a.description, a.field_name as condition_field, a.condition_operator, a.condition_value
        FROM alarm_notifications an
        JOIN alarms a ON an.alarm_id = a.id
        ORDER BY an.triggered_at DESC
        LIMIT 10
      `);

      return {
        total_active_alarms: (totalAlarms as any[])[0].total,
        today_triggers: (todayTriggers as any[])[0].today_triggers,
        recent_logs: recentLogs,
        whatsapp_status: {
          ready: this.isWhatsAppReady,
          initializing: this.isWhatsAppInitializing
        }
      };
    } catch (error) {
      console.error("❌ Error getting alarm stats:", error);
      throw error;
    }
  }

  /**
   * Get WhatsApp client status
   */
  getWhatsAppStatus(): { ready: boolean; initializing: boolean } {
    return {
      ready: this.isWhatsAppReady,
      initializing: this.isWhatsAppInitializing
    };
  }

  /**
   * Force WhatsApp logout and reinitialize (untuk troubleshooting)
   */
  async resetWhatsApp(): Promise<void> {
    try {
      console.log('🔄 Resetting WhatsApp Web connection...');
      
      if (this.isWhatsAppReady) {
        await this.whatsAppClient.logout();
      }
      
      await this.whatsAppClient.destroy();
      this.isWhatsAppReady = false;
      this.isWhatsAppInitializing = false;
      
      // Reinitialize
      this.initializeWhatsAppClient();
      
      console.log('✅ WhatsApp Web reset complete');
    } catch (error) {
      console.error('❌ Error during WhatsApp reset:', error);
    }
  }
}

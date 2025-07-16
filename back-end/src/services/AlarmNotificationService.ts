import { Pool } from "mysql2/promise";

export interface AlarmData {
  id: number;
  description: string;
  user_id: number;
  device_id: number;
  datastream_id: number;
  operator: string;
  threshold: number;
  is_active: boolean;
  cooldown_minutes: number;
  notification_whatsapp: boolean;
  notification_browser: boolean;
  last_triggered: string | null;
  device_description: string;
  datastream_description: string;
  datastream_pin: string;
  user_phone: string;
  user_name: string;
}

export interface NotificationResult {
  success: boolean;
  whatsapp_message_id?: string;
  error_message?: string;
}

export class AlarmNotificationService {
  private db: Pool;
  private wahaBaseUrl = "http://localhost:8100";

  constructor(database: Pool) {
    this.db = database;
  }

  /**
   * Kirim notifikasi WhatsApp via WAHA
   */
  async sendWhatsAppNotification(
    phone: string,
    message: string
  ): Promise<NotificationResult> {
    try {
      if (!phone || phone === "") {
        throw new Error("Phone number is required");
      }

      // Format phone number untuk Indonesia
      const formattedPhone = phone.startsWith("62")
        ? phone
        : `62${phone.replace(/^0/, "")}`;
      const chatId = `${formattedPhone}@c.us`;

      console.log(`📱 Sending WhatsApp to: ${chatId}`);

      const response = await fetch(`${this.wahaBaseUrl}/api/sendText`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatId: chatId,
          text: message,
          session: "default",
        }),
      });

      if (!response.ok) {
        throw new Error(
          `WAHA API error: ${response.status} ${response.statusText}`
        );
      }

      const result = await response.json();

      return {
        success: true,
        whatsapp_message_id: result.id || result.messageId || null,
      };
    } catch (error) {
      console.error("❌ WhatsApp notification failed:", error);
      return {
        success: false,
        error_message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get active alarms untuk device tertentu
   */
  async getActiveAlarms(deviceId: number): Promise<AlarmData[]> {
    try {
      const query = `
        SELECT 
          a.id, a.description, a.user_id, a.device_id, a.datastream_id,
          a.operator, a.threshold, a.is_active, a.cooldown_minutes,
          a.notification_whatsapp, a.notification_browser, a.last_triggered,
          d.description as device_description,
          ds.description as datastream_description, ds.pin as datastream_pin,
          u.phone as user_phone, u.name as user_name
        FROM alarms a
        JOIN devices d ON a.device_id = d.id
        JOIN datastreams ds ON a.datastream_id = ds.id
        JOIN users u ON a.user_id = u.id
        WHERE a.device_id = ? AND a.is_active = 1
      `;

      const [rows] = await this.db.query(query, [deviceId]);
      return rows as AlarmData[];
    } catch (error) {
      console.error("Error getting active alarms:", error);
      return [];
    }
  }

  /**
   * Evaluasi kondisi alarm
   */
  evaluateCondition(
    sensorValue: number,
    operator: string,
    threshold: number
  ): boolean {
    switch (operator) {
      case ">":
        return sensorValue > threshold;
      case "<":
        return sensorValue < threshold;
      case ">=":
        return sensorValue >= threshold;
      case "<=":
        return sensorValue <= threshold;
      case "=":
        return Math.abs(sensorValue - threshold) < 0.001; // floating point comparison
      case "!=":
        return Math.abs(sensorValue - threshold) >= 0.001;
      default:
        return false;
    }
  }

  /**
   * Cek apakah alarm masih dalam cooldown period
   */
  isInCooldown(alarm: AlarmData): boolean {
    if (!alarm.last_triggered) return false;

    const lastTriggered = new Date(alarm.last_triggered);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastTriggered.getTime()) / (1000 * 60);

    return diffMinutes < alarm.cooldown_minutes;
  }

  /**
   * Generate pesan notifikasi
   */
  generateAlarmMessage(alarm: AlarmData, sensorValue: number): string {
    const conditionText = this.getConditionText(
      alarm.operator,
      alarm.threshold,
      sensorValue
    );

    return `🚨 PERINGATAN BAHAYA!

            📱 Device: #${alarm.device_id} - ${alarm.device_description}
            🔍 Sensor: #${alarm.datastream_id} - ${alarm.datastream_description}
            ⚠️ Kondisi: ${conditionText}

            Waktu: ${new Date().toLocaleString("id-ID", {
                timeZone: "Asia/Jakarta",
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                })}

            Silakan segera periksa perangkat Anda!`;
  }

  /**
   * Get condition text untuk pesan
   */
  private getConditionText(
    operator: string,
    threshold: number,
    sensorValue: number
  ): string {
    const operatorTexts = {
      ">": "di atas",
      "<": "di bawah",
      ">=": "di atas atau sama dengan",
      "<=": "di bawah atau sama dengan",
      "=": "sama dengan",
      "!=": "tidak sama dengan",
    };

    const operatorText =
      operatorTexts[operator as keyof typeof operatorTexts] || operator;
    return `Nilai sensor ${operatorText} ambang batas (${sensorValue} ${operator} ${threshold})`;
  }

  /**
   * Log notifikasi ke database
   */
  async logNotification(
    alarmId: number,
    userId: number,
    deviceId: number,
    datastreamId: number,
    sensorValue: number,
    threshold: number,
    operator: string,
    notificationType: "whatsapp" | "browser" | "both",
    whatsappMessageId?: string,
    errorMessage?: string
  ): Promise<number> {
    try {
      const whatsappStatus = errorMessage
        ? "failed"
        : whatsappMessageId
        ? "sent"
        : "pending";

      const query = `
        INSERT INTO alarm_notifications (
          alarm_id, user_id, device_id, datastream_id,
          sensor_value, threshold, operator, notification_type,
          whatsapp_message_id, error_message,
          triggered_at, sent_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `;

      const [result] = await this.db.query(query, [
        alarmId,
        userId,
        deviceId,
        datastreamId,
        sensorValue,
        threshold,
        operator,
        notificationType,
        whatsappStatus,
        whatsappMessageId,
        errorMessage,
      ]);

      return (result as any).insertId;
    } catch (error) {
      console.error("Error logging notification:", error);
      throw error;
    }
  }

  /**
   * Update last_triggered timestamp untuk alarm
   */
  async updateAlarmLastTriggered(alarmId: number): Promise<void> {
    try {
      await this.db.query(
        "UPDATE alarms SET last_triggered = CURRENT_TIMESTAMP WHERE id = ?",
        [alarmId]
      );
    } catch (error) {
      console.error("Error updating alarm last triggered:", error);
      throw error;
    }
  }

  /**
   * Trigger notifikasi untuk alarm tertentu
   */
  async triggerNotification(
    alarm: AlarmData,
    sensorValue: number
  ): Promise<boolean> {
    try {
      const message = this.generateAlarmMessage(alarm, sensorValue);
      let notificationType: "whatsapp" | "browser" | "both" = "both";
      let whatsappMessageId: string | undefined;
      let errorMessage: string | undefined;

      // Kirim WhatsApp jika diaktifkan
      if (alarm.notification_whatsapp && alarm.user_phone) {
        const whatsappResult = await this.sendWhatsAppNotification(
          alarm.user_phone,
          message
        );

        if (whatsappResult.success) {
          whatsappMessageId = whatsappResult.whatsapp_message_id;
          console.log(
            `✅ WhatsApp sent to user ${alarm.user_name}: ${whatsappMessageId}`
          );
        } else {
          errorMessage = whatsappResult.error_message;
          console.error(
            `❌ WhatsApp failed for user ${alarm.user_name}: ${errorMessage}`
          );
        }

        notificationType = alarm.notification_browser ? "both" : "whatsapp";
      } else if (alarm.notification_browser) {
        notificationType = "browser";
      }

      // Log notifikasi ke database
      await this.logNotification(
        alarm.id,
        alarm.user_id,
        alarm.device_id,
        alarm.datastream_id,
        sensorValue,
        alarm.threshold,
        alarm.operator,
        notificationType,
        whatsappMessageId,
        errorMessage
      );

      // Update last triggered
      await this.updateAlarmLastTriggered(alarm.id);

      return true;
    } catch (error) {
      console.error("Error triggering notification:", error);
      return false;
    }
  }

  /**
   * Check alarms untuk payload sensor data yang masuk
   */
  async checkAlarms(
    deviceId: number,
    sensorData: Record<string, any>
  ): Promise<void> {
    try {
      console.log(`🔍 Checking alarms for device ${deviceId}`);

      const alarms = await this.getActiveAlarms(deviceId);

      if (alarms.length === 0) {
        console.log(`ℹ️ No active alarms for device ${deviceId}`);
        return;
      }

      console.log(
        `📋 Found ${alarms.length} active alarms for device ${deviceId}`
      );

      for (const alarm of alarms) {
        // Get sensor value berdasarkan datastream pin
        const sensorValue = sensorData[alarm.datastream_pin];

        if (sensorValue === undefined || sensorValue === null) {
          console.log(
            `⚠️ Sensor value not found for pin ${alarm.datastream_pin}`
          );
          continue;
        }

        console.log(
          `🔍 Checking alarm "${alarm.description}": ${sensorValue} ${alarm.operator} ${alarm.threshold}`
        );

        // Evaluasi kondisi alarm
        if (
          this.evaluateCondition(
            Number(sensorValue),
            alarm.operator,
            alarm.threshold
          )
        ) {
          console.log(`🚨 Alarm condition met for "${alarm.description}"`);

          // Cek cooldown
          if (this.isInCooldown(alarm)) {
            console.log(`⏰ Alarm "${alarm.description}" still in cooldown`);
            continue;
          }

          // Trigger notifikasi
          const success = await this.triggerNotification(
            alarm,
            Number(sensorValue)
          );

          if (success) {
            console.log(
              `✅ Notification triggered for alarm "${alarm.description}"`
            );
          } else {
            console.log(
              `❌ Failed to trigger notification for alarm "${alarm.description}"`
            );
          }
        }
      }
    } catch (error) {
      console.error("Error checking alarms:", error);
    }
  }

  /**
   * Get notification history untuk user
   */
  async getNotificationHistory(
    userId: number,
    limit: number = 50
  ): Promise<any[]> {
    try {
      const query = `
        SELECT 
          an.*,
          a.description as alarm_name,
          d.description as device_description,
          ds.description as datastream_description
        FROM alarm_notifications an
        JOIN alarms a ON an.alarm_id = a.id
        JOIN devices d ON an.device_id = d.id
        JOIN datastreams ds ON an.datastream_id = ds.id
        WHERE an.user_id = ?
        ORDER BY an.triggered_at DESC
        LIMIT ?
      `;

      const [rows] = await this.db.query(query, [userId, limit]);
      return rows as any[];
    } catch (error) {
      console.error("Error getting notification history:", error);
      return [];
    }
  }

  /**
   * Test WAHA connection
   */
  async testWahaConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.wahaBaseUrl}/api/sessions`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      if (response.ok) {
        return {
          success: true,
          message: "WAHA connection successful",
        };
      } else {
        return {
          success: false,
          message: `WAHA connection failed: ${response.status}`,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `WAHA connection error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  }
}

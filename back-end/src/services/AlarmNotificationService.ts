import { Pool } from "mysql2/promise";
import { Client, LocalAuth } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import { broadcastToUsers } from "../api/ws/user-ws";

export interface AlarmData {
  id: number;
  description: string;
  user_id: number;
  device_id: number;
  datastream_id: number;
  is_active: boolean;
  cooldown_minutes: number;
  last_triggered?: string;
  created_at: string;
  updated_at: string;

  // Fields from joined tables
  field_name: string; // dari datastreams.pin
  data_type: string; // dari datastreams.type
  datastream_description: string; // dari datastreams.description
  device_description: string; // dari devices.description
  whatsapp_number: string; // dari users.phone
  user_name: string; // dari users.name
  user_email: string; // dari users.email
  condition_operator: string; // dari alarm_conditions.operator
  condition_value: string; // dari alarm_conditions.threshold
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
  private whatsAppDisabled: boolean = false; // Flag to disable WhatsApp if needed

  constructor(database: Pool) {
    this.db = database;

    // Check if WhatsApp should be disabled (e.g., in test environment or missing dependencies)
    const disableWhatsApp =
      process.env.DISABLE_WHATSAPP === "true" ||
      this.checkSystemCompatibility();
    if (disableWhatsApp) {
      console.log("⚠️ Notifikasi WhatsApp dinonaktifkan");
      if (process.env.DISABLE_WHATSAPP === "true") {
        console.log(
          "📝 Alasan: Dinonaktifkan melalui environment variable DISABLE_WHATSAPP=true"
        );
      } else {
        console.log(
          "📝 Alasan: Sistem tidak kompatibel atau dependencies tidak tersedia"
        );
      }
      console.log(
        "📧 Notifikasi alarm akan menggunakan browser/WebSocket saja"
      );
      this.whatsAppDisabled = true;
      return;
    }

    // Initialize WhatsApp Web client
    this.initializeWhatsAppClient();

    // Start health monitoring
    this.startHealthMonitoring();
  }

  /**
   * Check if system is compatible with WhatsApp Web (Puppeteer/Chrome)
   */
  private checkSystemCompatibility(): boolean {
    try {
      // Check if we're in a minimal container environment
      const fs = require("fs");

      // Common paths where Chrome dependencies should be
      const requiredLibs = [
        "/usr/lib/x86_64-linux-gnu/libatk-1.0.so.0",
        "/lib/x86_64-linux-gnu/libatk-1.0.so.0",
        "/usr/lib/libatk-1.0.so.0",
        "/lib/libatk-1.0.so.0",
      ];

      // Check if any of the required libraries exist
      const hasRequiredLibs = requiredLibs.some((path) => {
        try {
          fs.accessSync(path);
          return true;
        } catch {
          return false;
        }
      });

      if (!hasRequiredLibs) {
        console.log(
          "❌ Sistem tidak memiliki dependencies yang dibutuhkan untuk WhatsApp Web"
        );
        console.log(
          "💡 Untuk mengaktifkan WhatsApp di VPS Linux, install dependencies:"
        );
        console.log("   sudo apt-get update");
        console.log("   sudo apt-get install -y wget gnupg ca-certificates");
        console.log(
          "   sudo apt-get install -y fonts-liberation libasound2 libatk-bridge2.0-0"
        );
        console.log(
          "   sudo apt-get install -y libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3"
        );
        console.log(
          "   sudo apt-get install -y libexpat1 libfontconfig1 libgcc1 libgconf-2-4"
        );
        console.log(
          "   sudo apt-get install -y libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0"
        );
        console.log(
          "   sudo apt-get install -y libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0"
        );
        console.log(
          "   sudo apt-get install -y libstdc++6 libx11-6 libx11-xcb1 libxcb1"
        );
        console.log(
          "   sudo apt-get install -y libxcomposite1 libxcursor1 libxdamage1 libxext6"
        );
        console.log(
          "   sudo apt-get install -y libxfixes3 libxi6 libxrandr2 libxrender1"
        );
        console.log(
          "   sudo apt-get install -y libxss1 libxtst6 libxinerama1 xdg-utils"
        );
        return true; // Disable WhatsApp
      }

      // Check if we have display capabilities (X11)
      const hasDisplay = process.env.DISPLAY || process.env.WAYLAND_DISPLAY;
      if (!hasDisplay) {
        console.log(
          "ℹ️ Tidak ada display server, WhatsApp Web akan berjalan dalam mode headless"
        );
      }

      return false; // System is compatible
    } catch (error) {
      console.log("⚠️ Error checking system compatibility:", error);
      return true; // Disable WhatsApp on error
    }
  }

  /**
   * Start health monitoring for WhatsApp connection
   */
  private startHealthMonitoring(): void {
    // Check WhatsApp health every 5 minutes
    setInterval(async () => {
      try {
        await this.healthCheck();
      } catch (error) {
        console.error("❌ WhatsApp health check failed:", error);
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  /**
   * Perform health check on WhatsApp connection
   */
  private async healthCheck(): Promise<void> {
    try {
      if (this.whatsAppDisabled) {
        return;
      }

      if (!this.isWhatsAppReady && !this.isWhatsAppInitializing) {
        console.log(
          "🏥 WhatsApp health check: Not ready, attempting restart..."
        );
        await this.startWhatsAppInitialization();
      } else if (this.isWhatsAppReady) {
        // Try to get client info to verify connection
        try {
          const info = this.whatsAppClient.info;
          if (info) {
            console.log("🏥 WhatsApp health check: OK");
          }
        } catch (infoError) {
          console.log(
            "🏥 WhatsApp health check: Connection seems stale, restarting..."
          );
          await this.resetWhatsApp();
        }
      }
    } catch (error) {
      console.error("❌ Health check error:", error);
    }
  }

  /**
   * Initialize WhatsApp Web client with LocalAuth
   */
  private initializeWhatsAppClient(): void {
    try {
      console.log("📱 Creating WhatsApp client...");

      // Enhanced Puppeteer configuration for Linux VPS
      const puppeteerConfig = {
        // Konfigurasi khusus untuk VPS
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--single-process", // Penting untuk VPS dengan RAM terbatas
          "--disable-gpu",
          "--disable-web-security",
          "--disable-features=VizDisplayCompositor",
          "--disable-background-timer-throttling",
          "--disable-backgrounding-occluded-windows",
          "--disable-renderer-backgrounding",
          "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        ],
        // Timeout yang lebih besar
        timeout: 60000,
        // Disable images untuk menghemat bandwidth
        defaultViewport: null,
        ignoreDefaultArgs: ["--disable-extensions"],
      };

      // Create client with LocalAuth for persistent sessions
      this.whatsAppClient = new Client({
        authStrategy: new LocalAuth({
          clientId: "misred-iot-server",
          dataPath: "./wwebjs_auth",
        }),
        puppeteer: puppeteerConfig,
        webVersionCache: {
          type: "remote",
          remotePath:
            "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html",
        },
      });

      console.log(
        "📱 WhatsApp client created with enhanced Linux configuration"
      );

      this.setupWhatsAppEventHandlers();

      // Start initialization asynchronously dengan error handling
      this.startWhatsAppInitialization().catch((error) => {
        console.error(
          "❌ Failed to initialize WhatsApp Web in constructor:",
          error
        );
        console.log(
          "⚠️ WhatsApp notifications will be disabled. Service will continue without WhatsApp functionality."
        );
        this.whatsAppDisabled = true;
        // Don't throw error to prevent service crash
      });
    } catch (error) {
      console.error("❌ Error creating WhatsApp client:", error);
      this.whatsAppDisabled = true;
    }
  }

  /**
   * Find available Chromium/Chrome executable on the system
   */
  private findChromiumExecutable(): string | undefined {
    const fs = require("fs");

    // Common Chrome/Chromium paths on Linux
    const possiblePaths = [
      "/usr/bin/google-chrome-stable",
      "/usr/bin/google-chrome",
      "/usr/bin/chromium-browser",
      "/usr/bin/chromium",
      "/snap/bin/chromium",
      "/usr/bin/chrome",
      "/opt/google/chrome/chrome",
      process.env.CHROME_BIN,
      process.env.CHROMIUM_BIN,
    ].filter(Boolean);

    for (const path of possiblePaths) {
      try {
        if (path && fs.existsSync(path)) {
          console.log(`🔍 Found Chrome/Chromium executable: ${path}`);
          return path;
        }
      } catch (error) {
        // Continue to next path
      }
    }

    console.log(
      "⚠️ No system Chrome/Chromium found, using Puppeteer bundled version"
    );
    return undefined; // Let Puppeteer use its bundled version
  }

  /**
   * Setup event handlers for WhatsApp client
   */
  private setupWhatsAppEventHandlers(): void {
    // Loading event - shows session loading status
    this.whatsAppClient.on("loading_screen", (percent: number, message) => {
      console.log(`📱 WhatsApp Web loading: ${percent}% - ${message}`);

      // Provide more detailed feedback during loading
      if (percent === 0) {
        console.log("🚀 WhatsApp Web starting...");
      } else if (percent >= 50 && percent < 100) {
        console.log("⏳ WhatsApp Web loading session data...");
      } else if (percent === 100) {
        console.log("✅ WhatsApp Web loading completed, waiting for ready...");
      }
    });

    // Authentication event - session validation
    this.whatsAppClient.on("auth_failure", (msg) => {
      console.error("❌ WhatsApp Web authentication failed:", msg);
      this.isWhatsAppReady = false;
      this.isWhatsAppInitializing = false;

      // Clean up corrupted session on auth failure
      console.log("🗑️ Cleaning up corrupted session after auth failure...");
      this.cleanupSessionFiles().then(() => {
        console.log("✅ Session cleaned up, restart will generate new QR");
      });
    });

    // Client ready event
    this.whatsAppClient.on("ready", () => {
      console.log("✅ WhatsApp Web client sudah aktif!");
      this.isWhatsAppReady = true;
      this.isWhatsAppInitializing = false;
    });

    // QR Code event - display QR for initial setup
    this.whatsAppClient.on("qr", (qr) => {
      console.log("📱 WhatsApp Web QR Code Generated:");
      console.log("Silakan scan QR code ini dengan aplikasi WhatsApp anda");
      console.log("═".repeat(60));
      qrcode.generate(qr, { small: true });
      console.log("═".repeat(60));
      console.log("QR Code akan expired dalam 30 detik, scan sekarang!");
    });

    // Authentication success
    this.whatsAppClient.on("authenticated", (session) => {
      console.log("✅ WhatsApp Web berhasil terautentikasi!");
      console.log("💾 Session tersimpan dengan clientId: misred-iot-server");
      console.log("🔗 Session akan persist setelah restart server");
    });

    // Disconnected event
    this.whatsAppClient.on("disconnected", (reason) => {
      console.log("⚠️ WhatsApp Web disconnected:", reason);
      this.isWhatsAppReady = false;
      this.isWhatsAppInitializing = false;

      // Check if disconnect reason requires QR code
      if (
        reason === "LOGOUT" ||
        reason === "CONFLICT" ||
        reason === "UNLAUNCHED"
      ) {
        console.log("🔄 Session invalid, akan memerlukan QR code baru...");
        // Clean up corrupted session
        this.cleanupSessionFiles().then(() => {
          console.log("🗑️ Corrupted session cleaned up");
        });
      }

      // Auto-reconnect after disconnection (with delay)
      setTimeout(() => {
        console.log("🔄 Attempting to reconnect WhatsApp Web...");
        this.startWhatsAppInitialization().catch((error) => {
          console.error("❌ Auto-reconnect failed:", error);
        });
      }, 10000); // 10 second delay
    });

    // Error event
    this.whatsAppClient.on("error", (error) => {
      console.error("❌ WhatsApp Web error:", error);
      this.isWhatsAppReady = false;

      // Handle specific errors
      if (
        error.message.includes("Session closed") ||
        error.message.includes("Protocol error")
      ) {
        console.log("📱 Session/Protocol error, cleaning up...");
        this.cleanupSessionFiles().then(() => {
          console.log("🗑️ Session cleaned up due to error");
        });
      }
    });

    // Message sent acknowledgment
    this.whatsAppClient.on("message_ack", (message, ack) => {
      // Only log important ack states to reduce noise
      if (ack === 1) {
        console.log(`📧 Message ${message.id.id} delivered to server`);
      } else if (ack === 2) {
        console.log(`📧 Message ${message.id.id} delivered to recipient`);
      } else if (ack === 3) {
        console.log(`📧 Message ${message.id.id} read by recipient`);
      }
    });

    // Remote session saved event
    this.whatsAppClient.on("remote_session_saved", () => {
      console.log("💾 WhatsApp session remote saved successfully");
      console.log("🔗 Session persistence verified");
    });

    // Add change state event for better debugging
    this.whatsAppClient.on("change_state", (state) => {
      console.log(`🔄 WhatsApp state changed to: ${state}`);
    });
  }

  /**
   * Start WhatsApp client initialization
   */
  private async startWhatsAppInitialization(): Promise<void> {
    if (this.isWhatsAppInitializing) {
      console.log("⚠️ WhatsApp client already initializing, skipping...");
      return;
    }

    if (this.isWhatsAppReady) {
      console.log("✅ WhatsApp client already ready");
      return;
    }

    console.log("🚀 Starting WhatsApp Web initialization...");
    this.isWhatsAppInitializing = true;

    try {
      // Check if session exists before initializing
      const sessionExists = await this.checkSessionExists();
      console.log(`� Session exists: ${sessionExists ? "YES" : "NO"}`);

      if (sessionExists) {
        console.log("📱 Loading existing session...");
      } else {
        console.log("📱 No session found, will need QR scan...");
      }

      // Initialize with extended timeout for WhatsApp Web
      const initPromise = this.whatsAppClient.initialize();
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error("Initialization timeout after 60 seconds")),
          60000
        )
      );

      await Promise.race([initPromise, timeoutPromise]);
      console.log("✅ WhatsApp Web initialization completed successfully");
    } catch (error) {
      console.error("❌ WhatsApp initialization failed:", error);
      this.isWhatsAppInitializing = false;

      // If timeout, likely session is corrupted
      if (error instanceof Error && error.message.includes("timeout")) {
        console.log(
          "🗑️ Initialization timeout, cleaning up corrupted session..."
        );
        await this.cleanupSessionFiles();

        // Try one more time after cleanup with longer delay
        console.log("🔄 Retrying after session cleanup...");
        await new Promise((resolve) => setTimeout(resolve, 5000));

        try {
          this.isWhatsAppInitializing = true;
          console.log(
            "🔄 Second attempt: initializing fresh WhatsApp client..."
          );

          // Reinitialize client completely
          this.initializeWhatsAppClient();

          // Wait for initialization with longer timeout
          const isReady = await this.waitForWhatsAppReady(120000); // 2 minutes

          if (isReady) {
            console.log(
              "✅ WhatsApp Web initialization completed after cleanup"
            );
          } else {
            throw new Error("WhatsApp Web still not ready after retry");
          }
        } catch (retryError) {
          console.error(
            "❌ WhatsApp initialization failed even after cleanup:",
            retryError
          );
          this.isWhatsAppInitializing = false;
          this.whatsAppDisabled = true;
          console.log(
            "⚠️ WhatsApp notifications permanently disabled for this session"
          );
        }
      } else {
        // Other errors
        console.log("❌ Non-timeout error, disabling WhatsApp service");
        this.whatsAppDisabled = true;
      }
    }
  }

  /**
   * Wait for WhatsApp client to be ready
   */
  private async waitForWhatsAppReady(
    timeoutMs: number = 60000
  ): Promise<boolean> {
    const startTime = Date.now();

    while (!this.isWhatsAppReady && Date.now() - startTime < timeoutMs) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return this.isWhatsAppReady;
  }

  /**
   * Format phone number untuk Indonesia
   */
  private formatPhoneNumber(phone: string): string {
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, "");

    // Handle Indonesia format
    if (cleaned.startsWith("0")) {
      return "62" + cleaned.substring(1);
    } else if (cleaned.startsWith("62")) {
      return cleaned;
    } else {
      return "62" + cleaned;
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
      if (this.whatsAppDisabled) {
        console.log("📱 WhatsApp notifications disabled, skipping send");
        return {
          success: false,
          error_message: "WhatsApp notifications disabled",
        };
      }

      if (!phone || phone === "") {
        throw new Error("Phone number is required");
      }

      // Global rate limiting untuk mencegah spam
      const now = Date.now();
      const timeSinceLastNotification = now - this.lastNotificationTime;

      if (timeSinceLastNotification < this.minNotificationInterval) {
        const waitTime =
          this.minNotificationInterval - timeSinceLastNotification;
        // console.log(`⏳ Global rate limit: waiting ${waitTime}ms before sending`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }

      // console.log(`📱 Sending WhatsApp to: ${phone} (Attempt ${retryCount + 1})`);
      // console.log(`📝 Message preview: ${message.substring(0, 100)}...`);

      // Check if WhatsApp Web is ready
      if (!this.isWhatsAppReady) {
        console.log("⚠️ WhatsApp Web not ready, attempting to initialize...");

        try {
          await this.startWhatsAppInitialization();

          // Wait for ready
          const isReady = await this.waitForWhatsAppReady(10000);
          if (!isReady) {
            throw new Error(
              "WhatsApp Web belum aktif setelah initialization. Service mungkin tidak tersedia."
            );
          }
        } catch (initError) {
          console.error(
            "❌ Failed to initialize WhatsApp during send:",
            initError
          );
          throw new Error(
            "WhatsApp Web service tidak tersedia. Silakan periksa koneksi internet dan coba lagi nanti."
          );
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
      const sentMessage = await this.whatsAppClient.sendMessage(
        chatId,
        message
      );

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
        await new Promise((resolve) => setTimeout(resolve, delay));
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
          user_email: alarm.user_email,
        },
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
      const [alarmRows] = await this.db.execute(
        `
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
      `,
        [deviceId]
      );

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
            const timeSinceLastTrigger =
              Date.now() - lastTriggeredTime.getTime();

            if (timeSinceLastTrigger < cooldownMs) {
              const remainingCooldownSeconds = Math.ceil(
                (cooldownMs - timeSinceLastTrigger) / 1000
              );
              const remainingMinutes = Math.floor(
                remainingCooldownSeconds / 60
              );
              const remainingSeconds = remainingCooldownSeconds % 60;

              console.log(
                `⏳ Alarm ${alarm.id} masih cooldown. Waktu cooldown yang tersisa: ${remainingCooldownSeconds}s (${cooldownMinutes}m total)`
              );

              // Kirim pesan cooldown untuk pengujian
              // if (alarm.whatsapp_number) {
              //   const cooldownMessage = `⏳ Ini pesan untuk pengujian COOLDOWN. Sensor ${alarm.datastream_description}(${alarm.datastream_id}) pada ${alarm.device_description} masih dalam waktu tunggu ${cooldownMinutes} menit.\n\n` +
              //                          `Sisa waktu cooldown: ${remainingMinutes} menit ${remainingSeconds} detik\n` +
              //                          `Waktu: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB`;

              //   await this.sendWhatsAppNotification(alarm.whatsapp_number, cooldownMessage);
              // }

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
            case ">":
              conditionMet = numericValue > thresholdValue;
              break;
            case "<":
              conditionMet = numericValue < thresholdValue;
              break;
            case ">=":
              conditionMet = numericValue >= thresholdValue;
              break;
            case "<=":
              conditionMet = numericValue <= thresholdValue;
              break;
            case "==":
              conditionMet = numericValue === thresholdValue;
              break;
            case "!=":
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
              triggered_at: new Date(),
            };

            const [logResult] = await this.db.execute(
              `INSERT INTO alarm_notifications (alarm_id, user_id, device_id, datastream_id, sensor_value, conditions_text, notification_type, triggered_at) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                alarmLog.alarm_id,
                alarmLog.user_id,
                alarmLog.device_id,
                alarmLog.datastream_id,
                alarmLog.sensor_value,
                alarmLog.conditions_text,
                alarmLog.notification_type,
                alarmLog.triggered_at,
              ]
            );

            const logId = (logResult as any).insertId;
            // console.log(`📝 Alarm notification logged with ID: ${logId}`);

            // Kirim notifikasi WhatsApp jika user memiliki nomor WhatsApp
            if (alarm.whatsapp_number) {
              // console.log(`📱 Sending WhatsApp notification to: ${alarm.whatsapp_number}`);

              // Format pesan alarm dengan data yang relevan
              const message =
                `🚨 PERINGATAN SENSOR ALARM 🚨\n\n` +
                `📍 Alarm: ${alarm.description}\n` +
                `⚙ Perangkat: ${alarm.device_description}\n` +
                `📊 Sensor: ${alarm.datastream_description}(${alarm.field_name})\n` +
                `📈 Nilai Saat Ini: ${numericValue}\n` +
                `⚠️ Kondisi: ${alarm.field_name} ${alarm.condition_operator} ${alarm.condition_value}\n` +
                `👤 Akun: ${alarm.user_email}\n` +
                `🕐 Waktu: ${new Date().toLocaleString("id-ID", {
                  timeZone: "Asia/Jakarta",
                })} WIB\n\n` +
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
                console.log(
                  `❌ WhatsApp notification failed for alarm ${alarm.id}: ${notificationResult.error_message}`
                );
              }
            } else {
              console.log(
                `ℹ️ Alarm ${alarm.id} has no WhatsApp number configured`
              );
            }

            // Kirim notifikasi browser via WebSocket untuk semua user
            try {
              const browserResult = await this.sendBrowserNotification(
                alarm,
                numericValue,
                currentTime
              );

              if (browserResult.success) {
                console.log(
                  `✅ Browser notification sent successfully for alarm ${alarm.id}`
                );
              } else {
                console.log(
                  `❌ Browser notification failed for alarm ${alarm.id}: ${browserResult.error_message}`
                );
              }
            } catch (browserError) {
              console.error(
                `❌ Error sending browser notification for alarm ${alarm.id}:`,
                browserError
              );
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

      if (this.whatsAppDisabled) {
        return {
          success: false,
          message: "WhatsApp notifications are disabled by configuration.",
        };
      }

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
        message: `WhatsApp Web ready. Connected as: ${
          info.pushname || "Unknown"
        } (${info.wid.user})`,
      };
    } catch (error) {
      console.error("❌ WhatsApp Web connection test failed:", error);
      return {
        success: false,
        message: `Connection test failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
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
          initializing: this.isWhatsAppInitializing,
        },
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
      initializing: this.isWhatsAppInitializing,
    };
  }

  /**
   * Force WhatsApp logout and reinitialize (untuk troubleshooting)
   */
  async resetWhatsApp(): Promise<void> {
    try {
      console.log("🔄 Resetting WhatsApp Web connection...");

      this.isWhatsAppReady = false;
      this.isWhatsAppInitializing = false;

      if (this.whatsAppClient) {
        try {
          console.log("️ Destroying WhatsApp client...");
          await this.whatsAppClient.destroy();
        } catch (destroyError) {
          console.log("⚠️ Warning during client destruction:", destroyError);
        }
      }

      // Clean up session files
      await this.cleanupSessionFiles();

      // Wait a bit before reinitializing
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Reinitialize
      console.log("🔄 Reinitializing WhatsApp client...");
      this.initializeWhatsAppClient();

      console.log(
        "✅ WhatsApp Web reset complete, new QR code will be generated"
      );
    } catch (error) {
      console.error("❌ Error during WhatsApp reset:", error);
      this.whatsAppDisabled = true;
    }
  }

  /**
   * Clean up session files (for troubleshooting)
   */
  private async cleanupSessionFiles(): Promise<void> {
    try {
      const fs = require("fs").promises;
      const path = require("path");

      const sessionPath = path.join(process.cwd(), "wwebjs_auth");

      try {
        console.log("🗑️ Cleaning up session files at:", sessionPath);

        // Check if directory exists
        await fs.access(sessionPath);

        // List what we're about to delete
        const files = await fs.readdir(sessionPath);
        console.log(`🗑️ Found ${files.length} items to clean up`);

        // Remove the entire session directory recursively
        await fs.rm(sessionPath, { recursive: true, force: true });
        console.log("✅ Session files cleaned up successfully");

        // Wait a bit to ensure filesystem operations complete
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (accessError) {
        console.log("📁 No session files to clean up (directory not found)");
      }
    } catch (error) {
      console.log("⚠️ Warning: Could not clean up session files:", error);
    }
  }

  /**
   * Force generate new QR code
   */
  async forceNewQRCode(): Promise<void> {
    try {
      console.log("🔄 Forcing new QR code generation...");
      await this.resetWhatsApp();
    } catch (error) {
      console.error("❌ Error forcing new QR code:", error);
    }
  }

  /**
   * Check if session exists
   */
  async checkSessionExists(): Promise<boolean> {
    try {
      const fs = require("fs").promises;
      const path = require("path");

      const sessionPath = path.join(
        process.cwd(),
        "wwebjs_auth",
        "session-misred-iot-server"
      );

      try {
        await fs.access(sessionPath);

        // Check for various session file patterns
        const files = await fs.readdir(sessionPath);
        console.log(`📁 Session directory contains: ${files.length} files`);

        // Look for critical session files
        //@ts-ignore
        const hasWABrowserId = files.some((file) =>
          file.includes("WABrowserId")
        );
        //@ts-ignore
        const hasWASecretBundle = files.some((file) =>
          file.includes("WASecretBundle")
        );
        //@ts-ignore
        const hasWAToken = files.some((file) => file.includes("WAToken"));
        const hasDefault = files.includes("Default");

        console.log(
          `� Session validation - WABrowserId: ${hasWABrowserId}, WASecretBundle: ${hasWASecretBundle}, WAToken: ${hasWAToken}, Default: ${hasDefault}`
        );

        // Session is valid if we have at least some critical files or Default directory
        const isValid = hasWABrowserId || hasWASecretBundle || hasDefault;

        if (isValid && hasDefault) {
          // Also check Default directory for Chromium session files
          const defaultPath = path.join(sessionPath, "Default");
          try {
            const defaultFiles = await fs.readdir(defaultPath);
            //@ts-ignore
            const hasSessionStorage = defaultFiles.some(
              //@ts-ignore
              (file) =>
                file.includes("Session") ||
                file.includes("Local Storage") ||
                file.includes("IndexedDB")
            );
            console.log(
              `📁 Default directory has ${defaultFiles.length} files, session storage: ${hasSessionStorage}`
            );
            return hasSessionStorage;
          } catch {
            return hasWABrowserId || hasWASecretBundle;
          }
        }

        return isValid;
      } catch {
        console.log("📁 Session directory not found");
        return false;
      }
    } catch (error) {
      console.error("❌ Error checking session:", error);
      return false;
    }
  }

  /**
   * Get recent notifications for a user
   */
  async getRecentNotifications(userId: number): Promise<any[]> {
    try {
      const [rows] = await this.db.execute(
        `
        SELECT 
          an.id,
          an.alarm_id,
          an.sensor_value,
          an.conditions_text,
          an.triggered_at,
          COALESCE(an.is_saved, 0) as is_saved,
          an.saved_at,
          a.description as alarm_description,
          ds.description as datastream_description,
          ds.pin as field_name,
          dev.description as device_description,
          u.email as user_email
        FROM alarm_notifications an
        JOIN alarms a ON an.alarm_id = a.id
        JOIN datastreams ds ON an.datastream_id = ds.id
        JOIN devices dev ON an.device_id = dev.id
        JOIN users u ON an.user_id = u.id
        WHERE an.user_id = ? 
          AND COALESCE(an.is_saved, 0) = 1
        ORDER BY an.triggered_at DESC
        LIMIT 50
      `,
        [userId]
      );

      return rows as any[];
    } catch (error) {
      console.error("❌ Error getting recent notifications:", error);
      throw error;
    }
  }

  /**
   * Get notification history with pagination and time range filter
   */
  async getNotificationHistory(
    userId: number,
    page: number = 1,
    limit: number = 20,
    timeRange: string = "all"
  ): Promise<{ notifications: any[]; total: number }> {
    try {
      const offset = (page - 1) * limit;

      // Build time range condition
      let timeCondition = "";
      let timeParams: any[] = [];

      switch (timeRange) {
        case "1m":
          timeCondition =
            "AND an.triggered_at >= DATE_SUB(NOW(), INTERVAL 1 MINUTE)";
          break;
        case "1h":
          timeCondition =
            "AND an.triggered_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)";
          break;
        case "12h":
          timeCondition =
            "AND an.triggered_at >= DATE_SUB(NOW(), INTERVAL 12 HOUR)";
          break;
        case "1d":
        case "today":
          timeCondition = "AND an.triggered_at >= CURDATE()";
          break;
        case "1w":
        case "week":
          timeCondition =
            "AND an.triggered_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
          break;
        case "1M":
        case "month":
          timeCondition =
            "AND an.triggered_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
          break;
        case "1y":
          timeCondition =
            "AND an.triggered_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)";
          break;
        case "all":
        default:
          timeCondition = "";
      }

      // Build queries - fix parameter binding issue
      const baseCountQuery = `
        SELECT COUNT(*) as total
        FROM alarm_notifications an
        WHERE an.user_id = ? 
          AND COALESCE(an.is_saved, 0) = 1
      `;

      const baseDataQuery = `
        SELECT 
          an.id,
          an.alarm_id,
          an.sensor_value,
          an.conditions_text,
          an.triggered_at,
          COALESCE(an.notification_type, 'browser') as notification_type,
          an.whatsapp_message_id,
          an.is_saved,
          an.saved_at,
          a.description as alarm_description,
          ds.description as datastream_description,
          ds.pin as field_name,
          dev.description as device_description
        FROM alarm_notifications an
        LEFT JOIN alarms a ON an.alarm_id = a.id
        LEFT JOIN datastreams ds ON an.datastream_id = ds.id
        LEFT JOIN devices dev ON an.device_id = dev.id
        WHERE an.user_id = ? 
          AND COALESCE(an.is_saved, 0) = 1
      `;

      const countQuery =
        baseCountQuery + (timeCondition ? ` ${timeCondition}` : "");
      const dataQuery =
        baseDataQuery +
        (timeCondition ? ` ${timeCondition}` : "") +
        `
        ORDER BY an.triggered_at DESC 
        LIMIT ? OFFSET ?
      `;

      console.log("🔍 Service Debug SQL Query:", {
        timeRange: timeRange,
        timeCondition: timeCondition,
        countQuery: countQuery,
        dataQuery: dataQuery,
        userId: userId,
        limit: limit,
        offset: offset,
      });

      // Execute count query first
      console.log("🔍 Service executing count query with params:", [userId]);
      const [countResult] = await this.db.execute(countQuery, [
        parseInt(String(userId)),
      ]);
      const total = (countResult as any[])[0]?.total || 0;

      // Execute data query with pagination - ensure all parameters are integers
      const dataParams = [
        userId,
        parseInt(String(limit)),
        parseInt(String(offset)),
      ];
      console.log("🔍 Service executing data query with params:", dataParams);
      console.log(
        "🔍 Parameter types:",
        dataParams.map((p) => ({ value: p, type: typeof p }))
      );

      // Additional validation to ensure parameters are valid integers
      if (dataParams.some((p) => isNaN(p) || !Number.isInteger(p))) {
        throw new Error("Invalid integer parameters for SQL query");
      }

      const [rows] = await this.db.execute(dataQuery, dataParams);

      return {
        notifications: rows as any[],
        total: total,
      };
    } catch (error) {
      console.error("❌ Error getting notification history:", error);
      throw error;
    }
  }

  /**
   * Save all notifications for a user
   */
  async saveAllNotifications(userId: number): Promise<number> {
    try {
      const [result] = await this.db.execute(
        `
        UPDATE alarm_notifications 
        SET is_saved = TRUE, saved_at = NOW() 
        WHERE user_id = ? AND COALESCE(is_saved, 0) = 0
      `,
        [userId]
      );

      return (result as any).affectedRows;
    } catch (error) {
      console.error("❌ Error saving all notifications:", error);
      throw error;
    }
  }

  /**
   * Delete a single notification
   */
  async deleteNotification(
    notificationId: number,
    userId: number
  ): Promise<boolean> {
    try {
      const [result] = await this.db.execute(
        `
        DELETE FROM alarm_notifications 
        WHERE id = ? AND user_id = ?
      `,
        [notificationId, userId]
      );

      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error("❌ Error deleting notification:", error);
      throw error;
    }
  }

  /**
   * Delete all notifications for a user
   */
  async deleteAllNotifications(userId: number): Promise<number> {
    try {
      const [result] = await this.db.execute(
        `
        DELETE FROM alarm_notifications 
        WHERE user_id = ?
      `,
        [userId]
      );

      return (result as any).affectedRows;
    } catch (error) {
      console.error("❌ Error deleting all notifications:", error);
      throw error;
    }
  }

  /**
   * Get system health and WhatsApp status
   */
  public getSystemHealth() {
    return {
      whatsapp_ready: this.isWhatsAppReady,
      whatsapp_initializing: this.isWhatsAppInitializing,
      whatsapp_disabled: this.whatsAppDisabled,
      system_compatible: true, // Will be set during system check
      chrome_found: true, // Will be determined during initialization
    };
  }

  /**
   * Toggle WhatsApp service on/off (admin only)
   */
  public async toggleWhatsAppService(enabled: boolean): Promise<void> {
    if (enabled) {
      this.whatsAppDisabled = false;
      await this.initializeWhatsAppClient();
    } else {
      this.whatsAppDisabled = true;
      await this.resetWhatsApp();
    }
  }

  /**
   * Check if WhatsApp is disabled
   */
  public isWhatsAppDisabled(): boolean {
    return this.whatsAppDisabled;
  }

  /**
   * Manual restart WhatsApp (admin only)
   */
  public async restartWhatsApp(): Promise<void> {
    await this.resetWhatsApp();
  }
}

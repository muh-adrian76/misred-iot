/**
 * ===== ALARM NOTIFICATION SERVICE =====
 * Service untuk mengelola notifikasi alarm IoT
 * Mengirim notifikasi via WhatsApp dan browser push notification
 *
 * Fitur utama:
 * - WhatsApp integration dengan qrcode-terminal
 * - Browser push notification via WebSocket
 * - Log history semua notifikasi alarm
 * - Cooldown management untuk prevent spam
 * - Auto retry mechanism untuk WhatsApp failed
 * - Template pesan yang customizable
 */
import { Pool } from "mysql2/promise";
import { Client, LocalAuth } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import { broadcastToSpecificUser } from "../api/ws/user-ws";

// Interface data alarm lengkap dengan JOIN fields
export interface AlarmData {
  id: number;
  description: string; // Deskripsi alarm
  user_id: number; // ID user pemilik
  device_id: number; // ID device yang trigger
  datastream_id: number; // ID datastream yang dipantau
  is_active: boolean; // Status alarm aktif/tidak
  cooldown_minutes: number; // Waktu cooldown dalam menit
  last_triggered?: string; // Waktu terakhir trigger
  created_at: string;
  updated_at: string;

  // Fields dari JOIN dengan tabel lain
  field_name: string; // Nama field sensor (dari datastreams.pin)
  data_type: string; // Tipe data sensor (dari datastreams.type)
  datastream_description: string; // Deskripsi datastream
  device_description: string; // Deskripsi device
  whatsapp_number: string; // Nomor WhatsApp user (dari users.phone)
  whatsapp_notification_enabled: boolean; // Status aktif notifikasi WhatsApp (dari users.whatsapp_notif)
  user_name: string; // Nama user
  user_email: string; // Email user
  condition_operator: string; // Operator kondisi (>, <, =, dll)
  condition_value: string; // Nilai threshold kondisi
}

// Interface hasil pengiriman notifikasi
export interface NotificationResult {
  success: boolean; // Status berhasil/gagal
  whatsapp_message_id?: string; // ID pesan WhatsApp jika berhasil
  error_message?: string; // Pesan error jika gagal
}

// Interface log alarm untuk database (Updated untuk new schema)
export interface NotificationLog {
  id?: number;
  type: "alarm" | "device_status" | "firmware_update"; // Tipe notifikasi
  title: string; // Judul notifikasi
  message: string; // Isi pesan notifikasi
  priority: "low" | "medium" | "high"; // Prioritas notifikasi
  user_id: number; // ID user penerima notifikasi
  device_id?: number; // ID device (nullable untuk firmware notifications)
  alarm_id?: number; // ID alarm (nullable untuk non-alarm notifications)
  datastream_id?: number; // ID datastream (nullable untuk non-alarm notifications)
  sensor_value?: number; // Nilai sensor (nullable untuk non-alarm notifications)
  conditions_text?: string; // Kondisi dalam bentuk text (nullable)
  triggered_at: Date; // Waktu trigger
  is_read: boolean; // Status sudah dibaca atau belum
}

export class NotificationService {
  public db: Pool; // Public untuk akses dari API
  private lastNotificationTime: number = 0;
  private minNotificationInterval = 500; // Delay 500ms antar notifikasi

  // Properties WhatsApp Web client
  private whatsAppClient!: Client;
  private isWhatsAppReady: boolean = false; // Status WhatsApp siap
  private isWhatsAppInitializing: boolean = false; // Status sedang inisialisasi
  private whatsAppDisabled: boolean = false; // Flag disable WhatsApp

  constructor(database: Pool) {
    this.db = database;
    this.initializeWhatsAppClient(); // Inisialisasi WhatsApp client
    this.startHealthMonitoring(); // Mulai monitoring kesehatan
  }

  // ===== CHECK SYSTEM COMPATIBILITY =====
  // Mengecek apakah sistem support WhatsApp Web (Puppeteer/Chrome)
  private checkSystemCompatibility(): boolean {
    try {
      // Cek apakah berjalan di container environment minimal
      const fs = require("fs");

      // Path umum dimana Chrome dependencies seharusnya ada
      const requiredLibs = [
        "/usr/lib/x86_64-linux-gnu/libatk-1.0.so.0",
        "/lib/x86_64-linux-gnu/libatk-1.0.so.0",
        "/usr/lib/libatk-1.0.so.0",
        "/lib/libatk-1.0.so.0",
      ];

      // Cek apakah ada library yang dibutuhkan
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
        return true; // Disable WhatsApp
      }

      return false; // Sistem kompatibel
    } catch (error) {
      console.log("⚠️ Error saat memeriksa kompatibilitas sistem:", error);
      return true; // Disable WhatsApp jika error
    }
  }

  // ===== START HEALTH MONITORING =====
  // Memulai monitoring kesehatan koneksi WhatsApp
  private startHealthMonitoring(): void {
    // Cek kesehatan WhatsApp setiap 5 menit
    setInterval(async () => {
      try {
        await this.healthCheck();
      } catch (error) {
        console.error("❌ WhatsApp health check gagal:", error);
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
            "🏥 WhatsApp health check: Gagal, Mencoba reset koneksi..."
          );
          await this.resetWhatsApp();
        }
      }
    } catch (error) {
      console.error("❌ Health check gagal:", error);
    }
  }

  /**
   * Initialize WhatsApp Web client with LocalAuth
   */
  private initializeWhatsAppClient(): void {
    try {
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

      this.setupWhatsAppEventHandlers();

      // Start initialization asynchronously dengan error handling
      this.startWhatsAppInitialization().catch((error) => {
        console.error("❌ Gagal menginisialisasi WhatsApp Web:", error);
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
          // console.log(`🔍 Chrome/Chromium path: ${path}`);
          return path;
        }
      } catch (error) {
        // Continue to next path
      }
    }
    return undefined; // Default Puppeteer
  }

  /**
   * Setup event handlers for WhatsApp client
   */
  private setupWhatsAppEventHandlers(): void {
    // Loading event - shows session loading status
    this.whatsAppClient.on("loading_screen", (percent: number, message) => {
      console.log(`📱 WhatsApp Web loading: ${percent}% - ${message}`);
      if (percent === 100) {
        console.log("⏳ Berhasil memulai ulang session dari cache...");
      }
    });

    // Authentication event - session validation
    this.whatsAppClient.on("auth_failure", (msg) => {
      console.error("❌ Gagal otentikasi WhatsApp Web:", msg);
      this.isWhatsAppReady = false;
      this.isWhatsAppInitializing = false;

      // Bersihkan sesi yang korup saat gagal otentikasi
      this.cleanupSessionFiles().then(() => {
        console.log("✅ Sesi telah di-reset karena kegagalan otentikasi");
      });
    });

    // Client ready event
    this.whatsAppClient.on("ready", () => {
      console.log("✅ Klien WhatsApp Web sudah aktif!");
      this.isWhatsAppReady = true;
      this.isWhatsAppInitializing = false;
    });

    // QR Code event - display QR for initial setup
    this.whatsAppClient.on("qr", (qr) => {
      console.log("📱 WhatsApp Web QR Code:");
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
    });

    // Disconnected event
    this.whatsAppClient.on("disconnected", (reason) => {
      console.log("⚠️ WhatsApp Web terputus:", reason);
      this.isWhatsAppReady = false;
      this.isWhatsAppInitializing = false;

      // Periksa apakah alasan putus membutuhkan QR code baru
      if (
        reason === "LOGOUT" ||
        reason === "CONFLICT" ||
        reason === "UNLAUNCHED"
      ) {
        console.log("🔄 Sesi tidak valid, akan membutuhkan QR code baru...");
        // Bersihkan sesi yang korup
        this.cleanupSessionFiles().then(() => {
          console.log("🗑️ Sesi yang korup telah dibersihkan");
        });
      }

      // Auto-reconnect setelah terputus (dengan jeda)
      setTimeout(() => {
        console.log("🔄 Mencoba menyambungkan kembali WhatsApp Web...");
        this.startWhatsAppInitialization().catch((error) => {
          console.error("❌ Gagal auto-reconnect:", error);
        });
      }, 10000); // Jeda 10 detik
    });

    // Error event
    this.whatsAppClient.on("error", (error) => {
      console.error("❌ Error WhatsApp Web:", error);
      this.isWhatsAppReady = false;

      // Tangani error spesifik
      if (
        error.message.includes("Session closed") ||
        error.message.includes("Protocol error")
      ) {
        console.log("📱 Error sesi/protokol, membersihkan...");
        this.cleanupSessionFiles().then(() => {
          console.log("🗑️ Sesi dibersihkan karena error");
        });
      }
    });

    // Aktifkan ini untuk memantau pengiriman pesan
    // this.whatsAppClient.on("message_ack", (message, ack) => {
    //   if (ack === 1) {
    //     console.log(`📧 Pesan ${message.id.id} telah dikirim ke server.`);
    //   } else if (ack === 2) {
    //     console.log(`📧 Pesan ${message.id.id} telah diterima oleh penerima.`);
    //   } else if (ack === 3) {
    //     console.log(`📧 Pesan ${message.id.id} telah dibaca oleh penerima.`);
    //   }
    // });

    // Remote session saved event
    this.whatsAppClient.on("remote_session_saved", () => {
      console.log("💾 Sesi WhatsApp remote berhasil disimpan");
      console.log("🔗 Persistensi sesi terverifikasi");
    });

    // Add change state event for better debugging
    this.whatsAppClient.on("change_state", (state) => {
      console.log(`🔄 Status WhatsApp berubah menjadi: ${state}`);
    });
  }

  /**
   * Mulai inisialisasi klien WhatsApp
   */
  private async startWhatsAppInitialization(): Promise<void> {
    if (this.isWhatsAppInitializing) {
      console.log(
        "⚠️ Klien WhatsApp sedang dalam proses inisialisasi, lewati..."
      );
      return;
    }

    if (this.isWhatsAppReady) {
      console.log("✅ Klien WhatsApp sudah siap");
      return;
    }

    console.log("🚀 Memulai inisialisasi WhatsApp Web...");
    this.isWhatsAppInitializing = true;

    try {
      // Cek apakah sesi sudah ada sebelum inisialisasi
      const sessionExists = await this.checkSessionExists();
      console.log(`📁 Status sesi: ${sessionExists ? "ADA" : "TIDAK ADA"}`);

      if (sessionExists) {
        console.log("📱 Mencari sesi yang ada...");
      } else {
        console.log("📱 Tidak ada sesi yang ditemukan.");
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
    } catch (error) {
      console.error("❌ Inisialisasi WhatsApp gagal:", error);
      this.isWhatsAppInitializing = false;

      // Jika timeout, kemungkinan sesi korup
      if (error instanceof Error && error.message.includes("timeout")) {
        console.log("🗑️ Timeout inisialisasi, membersihkan sesi yang korup...");
        await this.cleanupSessionFiles();

        // Coba sekali lagi setelah pembersihan dengan jeda lebih lama
        console.log("🔄 Mencoba lagi setelah pembersihan sesi...");
        await new Promise((resolve) => setTimeout(resolve, 5000));

        try {
          this.isWhatsAppInitializing = true;
          console.log(
            "🔄 Percobaan kedua: menginisialisasi klien WhatsApp baru..."
          );

          // Reinitialize client completely
          this.initializeWhatsAppClient();

          // Wait for initialization with longer timeout
          const isReady = await this.waitForWhatsAppReady(120000); // 2 minutes

          if (!isReady) {
            throw new Error(
              "WhatsApp Web masih belum siap setelah percobaan ulang"
            );
          }
        } catch (retryError) {
          console.error(
            "❌ Inisialisasi WhatsApp gagal meskipun sudah dibersihkan:",
            retryError
          );
          this.isWhatsAppInitializing = false;
          this.whatsAppDisabled = true;
          console.log(
            "⚠️ Notifikasi WhatsApp dinonaktifkan permanen untuk sesi ini"
          );
        }
      } else {
        // Error lainnya
        console.log("❌ Bukan error timeout, menonaktifkan layanan WhatsApp");
        this.whatsAppDisabled = true;
      }
    }
  }

  /**
   * Tunggu sampai klien WhatsApp siap digunakan
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
      console.log(
        `📲 [WHATSAPP] Memulai pengiriman WhatsApp ke: ${phone} (Percobaan ${
          retryCount + 1
        })`
      );
      console.log(
        `📝 [WHATSAPP] Preview pesan: ${message.substring(0, 100)}...`
      );

      if (this.whatsAppDisabled) {
        console.log(
          "⚠️ [WHATSAPP] WhatsApp notifications disabled, melewati pengiriman"
        );
        return {
          success: false,
          error_message: "WhatsApp notifications disabled",
        };
      }

      if (!phone || phone === "") {
        console.error("❌ [WHATSAPP] Nomor telepon tidak valid");
        throw new Error("Phone number is required");
      }

      // Global rate limiting untuk mencegah spam
      const now = Date.now();
      const timeSinceLastNotification = now - this.lastNotificationTime;

      if (timeSinceLastNotification < this.minNotificationInterval) {
        const waitTime =
          this.minNotificationInterval - timeSinceLastNotification;
        console.log(
          `⏳ [WHATSAPP] Rate limit: menunggu ${waitTime}ms sebelum mengirim`
        );
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }

      // Check if WhatsApp Web is ready
      if (!this.isWhatsAppReady) {
        console.log(
          "⚠️ [WHATSAPP] WhatsApp Web belum siap, mencoba menginisialisasi..."
        );

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

      console.log(`📞 [WHATSAPP] Memformat nomor telepon: ${phone}`);
      const formattedPhone = this.formatPhoneNumber(phone);
      const chatId = `${formattedPhone}@c.us`;

      console.log(`📱 [WHATSAPP] WhatsApp ID yang diformat: ${chatId}`);

      // Check if number is registered
      console.log(`🔍 [WHATSAPP] Memeriksa registrasi nomor di WhatsApp...`);
      const isRegistered = await this.whatsAppClient.isRegisteredUser(chatId);
      if (!isRegistered) {
        console.error(
          `❌ [WHATSAPP] Nomor ${phone} tidak terdaftar di WhatsApp`
        );
        throw new Error(`Phone number ${phone} is not registered on WhatsApp`);
      }

      console.log(`✅ [WHATSAPP] Nomor terdaftar, mengirim pesan...`);
      // Send message via WhatsApp Web
      const sentMessage = await this.whatsAppClient.sendMessage(
        chatId,
        message
      );

      // Update last notification time on success
      this.lastNotificationTime = Date.now();

      console.log(
        `🎉 [WHATSAPP] WhatsApp berhasil dikirim! Message ID: ${sentMessage.id.id}`
      );

      return {
        success: true,
        whatsapp_message_id: sentMessage.id.id,
      };
    } catch (error) {
      console.error("❌ [WHATSAPP] WhatsApp notification gagal:", error);

      // Retry logic for WhatsApp Web errors
      if (retryCount < 2) {
        const delay = Math.pow(2, retryCount) * 2000; // 2s, 4s
        console.log(
          `⏳ [WHATSAPP] Mencoba ulang pengiriman WhatsApp dalam ${delay}ms (percobaan ${
            retryCount + 1
          }/2)`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.sendWhatsAppNotification(phone, message, retryCount + 1);
      }

      console.error(`❌ [WHATSAPP] Semua percobaan gagal untuk nomor ${phone}`);
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
      console.log(
        `📱 [BROWSER NOTIF] Mengirim notifikasi browser untuk alarm ${alarm.id}`
      );
      console.log(
        `👤 [BROWSER NOTIF] Target user: ${alarm.user_name} (ID: ${alarm.user_id})`
      );

      const notificationPayload = {
        type: "alarm_notification",
        data: {
          id: `alarm_${alarm.id}_${Date.now()}`,
          title: alarm.description,
          message: `Perangkat: ${alarm.device_description}\nDatastream: ${alarm.datastream_description}(${alarm.field_name})\nNilai: ${sensorValue} (${alarm.condition_operator} ${alarm.condition_value})`,
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

      console.log(
        `📤 [BROWSER NOTIF] Payload notifikasi:`,
        notificationPayload
      );

      // Broadcast ONLY to the user who owns the alarm via WebSocket
      broadcastToSpecificUser(alarm.user_id.toString(), notificationPayload);

      console.log(
        `✅ [BROWSER NOTIF] Notifikasi browser berhasil dikirim untuk alarm ${alarm.id} ke user ${alarm.user_id}`
      );

      return {
        success: true,
        whatsapp_message_id: `browser_${alarm.id}_${Date.now()}`, // Using this field for tracking
      };
    } catch (error) {
      console.error("❌ [BROWSER NOTIF] Browser notification failed:", error);
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
      console.log(
        `� [ALARM CHECK] Memulai pemeriksaan alarm untuk device ${deviceId}`
      );

      // Query untuk mendapatkan alarm yang aktif untuk device ini
      const [alarmRows] = await (this.db as any).safeQuery(
        `
        SELECT 
          a.id, a.description, a.user_id, a.device_id, a.datastream_id,
          a.is_active, a.cooldown_minutes, a.last_triggered,
          ds.pin as field_name, ds.type as data_type, ds.description as datastream_description,
          dev.description as device_description,
          u.phone as whatsapp_number, u.name as user_name, u.email as user_email,
          u.whatsapp_notif as whatsapp_notification_enabled,
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
      console.log(
        `📋 [ALARM CHECK] Ditemukan ${alarms.length} alarm aktif untuk device ${deviceId}`
      );

      if (alarms.length === 0) {
        console.log(
          `ℹ️ [ALARM CHECK] Tidak ada alarm aktif untuk device ${deviceId}`
        );
        return;
      }

      // Loop melalui setiap alarm
      for (const alarm of alarms) {
        try {
          // console.log(`🔍 [ALARM CHECK] Memproses alarm ${alarm.id}: "${alarm.description}"`);
          // console.log(`📊 [ALARM CHECK] Kondisi: ${alarm.field_name} ${alarm.condition_operator} ${alarm.condition_value}`);

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
                `⏳ [ALARM CHECK] Alarm ${alarm.id} masih dalam cooldown. Sisa waktu: ${remainingCooldownSeconds}s (${cooldownMinutes}m total)`
              );

              continue; // Skip this alarm, still in cooldown
            }
          }

          // Ambil nilai dari data yang diterima berdasarkan field_name
          const fieldValue = receivedData[alarm.field_name];
          // console.log(`📈 [ALARM CHECK] Nilai saat ini untuk "${alarm.field_name}": ${fieldValue} (tipe: ${typeof fieldValue})`);

          if (fieldValue === undefined || fieldValue === null) {
            console.log(
              `⚠️ [ALARM CHECK] Field '${alarm.field_name}' tidak ditemukan dalam data yang diterima`
            );
            continue;
          }

          // Convert nilai ke number untuk perbandingan numerik
          const numericValue = parseFloat(fieldValue);
          const thresholdValue = parseFloat(alarm.condition_value);

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
              console.log(
                `❌ [ALARM CHECK] Operator tidak dikenal: ${alarm.condition_operator}`
              );
              continue;
          }

          // console.log(
          //   `🎯 [ALARM CHECK] Hasil evaluasi kondisi: ${
          //     conditionMet ? "TERPENUHI ✅" : "TIDAK TERPENUHI ❌"
          //   }`
          // );

          if (conditionMet) {
            console.log(
              `🚨 [ALARM TRIGGERED] ALARM TERPICU! Alarm ${alarm.id} untuk device ${deviceId}`
            );
            console.log(
              `📱 [ALARM TRIGGERED] Mengirim notifikasi ke user: ${alarm.user_name} (${alarm.whatsapp_number})`
            );

            // Update last_triggered timestamp
            await (this.db as any).safeQuery(
              "UPDATE alarms SET last_triggered = NOW() WHERE id = ?",
              [alarm.id]
            );

            // Log alarm ke database dengan schema baru
            const conditionsText = `${alarm.field_name} ${alarm.condition_operator} ${alarm.condition_value}`;
            const alarmTitle = `${alarm.description}`;
            const alarmMessage = `Perangkat: ${
              alarm.device_description
            }\nDatastream: ${alarm.datastream_description} (${
              alarm.field_name
            })\nNilai pemicu: ${numericValue}\nKondisi: ${conditionsText}\nWaktu: ${new Date().toLocaleString(
              "id-ID",
              { timeZone: "Asia/Jakarta" }
            )} WIB`;

            const [logResult] = await (this.db as any).safeQuery(
              `INSERT INTO notifications (type, title, message, priority, user_id, device_id, alarm_id, datastream_id, sensor_value, conditions_text, triggered_at, is_read) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), FALSE)`,
              [
                "alarm",
                alarmTitle,
                alarmMessage,
                "high",
                alarm.user_id,
                alarm.device_id,
                alarm.id,
                alarm.datastream_id,
                numericValue,
                conditionsText,
              ]
            );
            const logId = (logResult as any).insertId;

            // Kirim notifikasi browser
            console.log(`📱 [ALARM TRIGGERED] Mengirim notifikasi browser`);
            await this.sendBrowserNotification(alarm, numericValue);

            // Kirim notifikasi WhatsApp jika user mengaktifkan dan nomor tersedia
            // console.log(`🔍 [ALARM TRIGGERED] Checking WhatsApp notification conditions:`, {
            //   whatsapp_number: alarm.whatsapp_number,
            //   whatsapp_notification_enabled: alarm.whatsapp_notification_enabled,
            //   should_send: Boolean(alarm.whatsapp_notification_enabled) && Boolean(alarm.whatsapp_number)
            // });

            if (
              Boolean(alarm.whatsapp_notification_enabled) &&
              alarm.whatsapp_number &&
              alarm.whatsapp_number.trim() !== ""
            ) {
              console.log(
                `📲 [ALARM TRIGGERED] Mengirim notifikasi WhatsApp ke ${alarm.whatsapp_number} untuk alarm ${alarm.id}`
              );
              const whatsappMessage = this.formatAlarmMessage(
                alarm,
                numericValue
              );
              const whatsappResult = await this.sendWhatsAppNotification(
                alarm.whatsapp_number,
                whatsappMessage
              );

              if (whatsappResult.success) {
                console.log(
                  `✅ [ALARM TRIGGERED] WhatsApp notification berhasil dikirim untuk alarm ${alarm.id}`
                );
              } else {
                console.warn(
                  `⚠️ [ALARM TRIGGERED] WhatsApp notification gagal untuk alarm ${alarm.id}:`,
                  whatsappResult.error_message
                );
              }
            }
          }
        } catch (alarmError) {
          console.error(
            `❌ [ALARM CHECK] Error memproses alarm ${alarm.id}:`,
            alarmError
          );
        }
      }
    } catch (error) {
      console.error("❌ [ALARM CHECK] Error dalam pemeriksaan alarm:", error);
    }
  }

  // Helper method untuk format pesan alarm
  private formatAlarmMessage(alarm: AlarmData, numericValue: number): string {
    return (
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
      `Mohon segera melakukan pengecekan!`
    );
  }

  /**
   * Test WhatsApp Web service connection
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      console.log("🧪 Menguji koneksi WhatsApp Web...");

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
      console.error("❌ Uji koneksi WhatsApp Web gagal:", error);
      return {
        success: false,
        message: `Uji koneksi gagal: ${
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
      const [totalAlarms] = await (this.db as any).safeQuery(
        `SELECT COUNT(*) as total FROM alarms WHERE is_active = 1`
      );

      const [todayTriggers] = await (this.db as any).safeQuery(`
        SELECT COUNT(*) as today_triggers 
        FROM notifications 
        WHERE DATE(triggered_at) = CURDATE()
      `);

      const [recentLogs] = await (this.db as any).safeQuery(`
        SELECT 
          an.id, an.alarm_id, an.triggered_at, an.notification_type as notification_status,
          an.sensor_value, an.conditions_text,
          a.description, a.field_name as condition_field, a.condition_operator, a.condition_value
        FROM notifications an
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
      console.error("❌ Gagal mengambil statistik alarm:", error);
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
      console.log("🔄 Mereset koneksi WhatsApp Web...");

      this.isWhatsAppReady = false;
      this.isWhatsAppInitializing = false;

      if (this.whatsAppClient) {
        try {
          console.log("🛑 Menghentikan klien WhatsApp...");
          await this.whatsAppClient.destroy();
        } catch (destroyError) {
          console.log("⚠️ Peringatan saat menghentikan klien:", destroyError);
        }
      }

      // Clean up session files
      await this.cleanupSessionFiles();

      // Wait a bit before reinitializing
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Inisialisasi ulang
      console.log("🔄 Menginisialisasi ulang klien WhatsApp...");
      this.initializeWhatsAppClient();

      console.log(
        "✅ Reset WhatsApp Web selesai, QR code baru akan dihasilkan"
      );
    } catch (error) {
      console.error("❌ Error saat mereset WhatsApp:", error);
      this.whatsAppDisabled = true;
    }
  }

  /**
   * Bersihkan berkas sesi (untuk troubleshooting)
   */
  private async cleanupSessionFiles(): Promise<void> {
    try {
      const fs = require("fs").promises;
      const path = require("path");

      const sessionPath = path.join(process.cwd(), "wwebjs_auth");

      try {
        // Check if directory exists
        await fs.access(sessionPath);

        // List what we're about to delete
        const files = await fs.readdir(sessionPath);

        // Remove the entire session directory recursively
        await fs.rm(sessionPath, { recursive: true, force: true });

        // Wait a bit to ensure filesystem operations complete
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (accessError) {
        console.log(
          "📁 Tidak ada berkas sesi untuk dibersihkan (direktori tidak ditemukan)"
        );
      }
    } catch (error) {
      console.log(
        "⚠️ Peringatan: Tidak dapat membersihkan berkas sesi:",
        error
      );
    }
  }

  /**
   * Paksa generate QR code baru
   */
  async forceNewQRCode(): Promise<void> {
    try {
      console.log("🔄 Memaksa pembuatan QR code baru...");
      await this.resetWhatsApp();
    } catch (error) {
      console.error("❌ Error saat memaksa QR code baru:", error);
    }
  }

  /**
   * Cek apakah sesi tersedia
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
        console.log(`📁 Direktori sesi berisi: ${files.length} berkas`);

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
          `🧪 Validasi sesi - WABrowserId: ${hasWABrowserId}, WASecretBundle: ${hasWASecretBundle}, WAToken: ${hasWAToken}, Default: ${hasDefault}`
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
              `📁 Direktori Default memiliki ${defaultFiles.length} berkas, session storage: ${hasSessionStorage}`
            );
            return hasSessionStorage;
          } catch {
            return hasWABrowserId || hasWASecretBundle;
          }
        }

        return isValid;
      } catch {
        console.log("📁 Direktori sesi tidak ditemukan");
        return false;
      }
    } catch (error) {
      console.error("❌ Error saat memeriksa sesi:", error);
      return false;
    }
  }

  /**
   * Get recent notifications for a user (Updated untuk schema baru)
   */
  async getRecentNotifications(userId: number): Promise<any[]> {
    try {
      const [rows] = await (this.db as any).safeQuery(
        `
        SELECT 
          n.id,
          n.type,
          n.title,
          n.message,
          n.priority,
          n.alarm_id,
          n.device_id,
          n.datastream_id,
          n.sensor_value,
          n.conditions_text,
          n.triggered_at,
          n.is_read,
          COALESCE(a.description, '') as alarm_description,
          COALESCE(ds.description, '') as datastream_description,
          COALESCE(ds.pin, '') as field_name,
          COALESCE(dev.description, '') as device_description,
          u.email as user_email
        FROM notifications n
        LEFT JOIN alarms a ON n.alarm_id = a.id
        LEFT JOIN datastreams ds ON n.datastream_id = ds.id
        LEFT JOIN devices dev ON n.device_id = dev.id
        JOIN users u ON n.user_id = u.id
        WHERE n.user_id = ? AND n.is_read = FALSE
        ORDER BY n.triggered_at DESC
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
   * Get notification history with pagination, time range filter, and type filter
   */
  async getNotificationHistory(
    userId: number,
    page: number = 1,
    limit: number = 20,
    timeRange: string = "all",
    type: string = ""
  ): Promise<{ notifications: any[]; total: number }> {
    try {
      // Validate input parameters first - STRICT type conversion
      const validUserId = parseInt(String(userId));
      const validPage = Math.max(1, parseInt(String(page)) || 1);
      const validLimit = Math.max(
        1,
        Math.min(100, parseInt(String(limit)) || 20)
      );

      if (isNaN(validUserId) || validUserId <= 0) {
        throw new Error(`Invalid userId: ${userId}`);
      }

      const validOffset = Math.max(0, (validPage - 1) * validLimit);

      // Build time range condition
      let timeCondition = "";
      switch (timeRange) {
        case "today":
          timeCondition = "AND n.triggered_at >= CURDATE()";
          break;
        case "week":
          timeCondition =
            "AND n.triggered_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
          break;
        case "month":
          timeCondition =
            "AND n.triggered_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
          break;
        case "all":
        default:
          timeCondition = "";
      }

      // Build type filter condition
      let typeCondition = "";
      let typeParam = null;
      if (
        type &&
        type !== "" &&
        (type === "alarm" || type === "device_status")
      ) {
        typeCondition = "AND n.type = ?";
        typeParam = type;
      }

      // Build base queries
      const baseCountQuery = `
        SELECT COUNT(*) as total
        FROM notifications n
        WHERE n.user_id = ?
        ${timeCondition}
        ${typeCondition}
      `;

      const baseDataQuery = `
        SELECT 
          n.id,
          n.type,
          n.title,
          n.message,
          n.priority,
          n.alarm_id,
          n.device_id,
          n.datastream_id,
          n.sensor_value,
          n.conditions_text,
          n.triggered_at,
          n.is_read,
          COALESCE(a.description, '') as alarm_description,
          COALESCE(ds.description, '') as datastream_description,
          COALESCE(ds.pin, '') as field_name,
          COALESCE(dev.description, '') as device_description
        FROM notifications n
        LEFT JOIN alarms a ON n.alarm_id = a.id
        LEFT JOIN datastreams ds ON n.datastream_id = ds.id
        LEFT JOIN devices dev ON n.device_id = dev.id
        WHERE n.user_id = ?
        ${timeCondition}
        ${typeCondition}
        ORDER BY n.triggered_at DESC 
        LIMIT ${validLimit} OFFSET ${validOffset}
      `;

      // Build parameter arrays (NO LIMIT/OFFSET in params - use string interpolation for compatibility)
      const countParams: any[] = [validUserId];
      const dataParams: any[] = [validUserId];

      // Add type parameter if type filter is applied
      if (typeParam) {
        countParams.push(typeParam);
        dataParams.push(typeParam);
      }

      // Execute count query first
      // console.log("🔍 Service executing count query with params:", countParams);
      const [countResult] = await (this.db as any).safeQuery(
        baseCountQuery,
        countParams
      );
      const total = (countResult as any[])[0]?.total || 0;
      // console.log(`📊 Total notifications found: ${total}`);

      // Execute data query with pagination - using string interpolation for LIMIT/OFFSET
      // console.log("🔍 Service executing data query with params:", dataParams);
      // console.log("🔍 SQL query:", baseDataQuery);

      const [rows] = await (this.db as any).safeQuery(
        baseDataQuery,
        dataParams
      );
      // console.log(`📊 Data query returned ${(rows as any[]).length} rows`);

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
   * Mark all notifications as read for a user (Updated untuk schema baru)
   */
  async markAllAsRead(userId: number): Promise<number> {
    try {
      console.log(
        "🔄 AlarmNotificationService.markAllAsRead called with userId:",
        userId
      );

      // First, check how many unread notifications exist for this user
      const [checkResult] = await (this.db as any).safeQuery(
        `
        SELECT COUNT(*) as unread_count 
        FROM notifications 
        WHERE user_id = ? AND is_read = FALSE
      `,
        [userId]
      );

      const unreadCount = (checkResult as any)[0]?.unread_count || 0;
      if (unreadCount === 0) {
        return 0;
      }

      // Now mark them as read
      const [result] = await (this.db as any).safeQuery(
        `
        UPDATE notifications 
        SET is_read = TRUE
        WHERE user_id = ? AND is_read = FALSE
      `,
        [userId]
      );

      const affectedRows = (result as any).affectedRows;
      return affectedRows;
    } catch (error) {
      console.error("❌ Error marking all notifications as read:", error);
      throw error;
    }
  }

  /**
   * Delete all notifications for a user (Updated untuk schema baru)
   */
  async deleteAllNotifications(userId: number): Promise<number> {
    try {
      const [result] = await (this.db as any).safeQuery(
        `
        DELETE FROM notifications 
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

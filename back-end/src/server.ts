// ===== IMPORTS PLUGINS & MIDDLEWARE =====
// Import plugin CORS untuk mengatur berbagi sumber daya lintas origin
import { cors } from "@elysiajs/cors";
// Import plugin JWT untuk autentikasi menggunakan token web JSON
import { jwt } from "@elysiajs/jwt";
// Import plugin Swagger untuk dokumentasi API otomatis
import { swagger } from "@elysiajs/swagger";
// Import plugin static untuk melayani file statis (gambar, dokumen, dll)
import { staticPlugin } from "@elysiajs/static";

// ===== IMPORTS ELYSIA FRAMEWORK =====
// Import framework Elysia untuk membangun REST API
import { Elysia } from "elysia";

// ===== IMPORTS MIDDLEWARE & UTILITIES =====
// Import middleware database MySQL dan MQTT client
import { MySQLDatabase, MQTTClient } from "./lib/middleware";
// Import utilities untuk API tags, subdomain, dan konversi age
import { apiTags, subDomain, ageConverter } from "./lib/utils";

// ===== IMPORTS API ROUTES =====
// Import semua route untuk berbagai endpoint API
import { authRoutes } from "./api/auth"; // Route autentikasi (login, register, logout)
import { userRoutes } from "./api/user"; // Route manajemen user
import { deviceRoutes } from "./api/device"; // Route manajemen device IoT
import { deviceCommandRoutes } from "./api/device-command"; // Route command device
import { payloadRoutes } from "./api/payload"; // Route data payload dari sensor
import { widgetRoutes } from "./api/widget"; // Route widget dashboard
import { alarmRoutes } from "./api/alarm"; // Route sistem alarm
import { notificationRoutes } from "./api/notification"; // Route notifikasi alarm
import { dashboardRoutes } from "./api/dashboard"; // Route dashboard
import { datastreamRoutes } from "./api/datastream"; // Route datastream sensor
import { otaaRoutes } from "./api/otaa"; // Route aktivasi udara otomatis (OTAA)
import { adminRoutes } from "./api/admin"; // Route admin panel
import { healthCheckRoutes } from "./api/health"; // Route pemantauan kesehatan sistem

// ===== IMPORTS WEBSOCKET ROUTES =====
// Import route WebSocket untuk komunikasi real-time
import { userWsRoutes, broadcastToSpecificUser, broadcastToAllUsers } from "./api/ws/user-ws"; // WebSocket user
import { deviceWsRoutes } from "./api/ws/device-ws"; // WebSocket device

// ===== IMPORTS SERVICES =====
// Import semua service class untuk logika bisnis aplikasi
import { AuthService } from "./services/AuthService"; // Service autentikasi
import { UserService } from "./services/UserService"; // Service manajemen user
import { DeviceService } from "./services/DeviceService"; // Service manajemen device IoT
import { PayloadService } from "./services/PayloadService"; // Service data payload sensor
import { WidgetService } from "./services/WidgetService"; // Service widget dashboard
import { AlarmService } from "./services/AlarmService"; // Service sistem alarm
import { NotificationService } from "./services/NotificationService"; // Service notifikasi alarm
import { DashboardService } from "./services/DashboardService"; // Service dashboard
import { DatastreamService } from "./services/DatastreamService"; // Service datastream sensor
import { DeviceCommandService } from "./services/DeviceCommandService"; // Service command device
import { DeviceStatusService } from "./services/DeviceStatusService"; // Service status device
import { OtaaUpdateService } from "./services/OtaaUpdateService"; // Service OTAA update
import { AdminService } from "./services/AdminService"; // Service admin panel
import { MQTTService } from "./services/MiddlewareService"; // Service MQTT messaging

// ===== MAIN SERVER CLASS =====
// Class utama untuk mengelola server IoT dengan semua service dan middleware
class Server {
  // ===== CORE PROPERTIES =====
  private app: Elysia; // Instance aplikasi Elysia
  private db!: Awaited<ReturnType<typeof MySQLDatabase.getInstance>>; // Instance database MySQL
  private mqttClient!: ReturnType<typeof MQTTClient.getInstance>; // Instance MQTT client

  // ===== SERVICE INSTANCES =====
  // Deklarasi semua service yang akan digunakan dalam aplikasi
  private authService!: AuthService; // Service untuk autentikasi user
  private userService!: UserService; // Service untuk manajemen user
  private deviceService!: DeviceService; // Service untuk manajemen device IoT
  private payloadService!: PayloadService; // Service untuk data sensor payload
  private widgetService!: WidgetService; // Service untuk widget dashboard
  private alarmService!: AlarmService; // Service untuk sistem alarm
  private notificationService!: NotificationService; // Service untuk notifikasi alarm
  private dashboardService!: DashboardService; // Service untuk dashboard
  private datastreamService!: DatastreamService; // Service untuk datastream
  private otaaService!: OtaaUpdateService; // Service untuk OTAA updates
  private deviceStatusService!: DeviceStatusService; // Service untuk status device
  private adminService!: AdminService; // Service untuk admin panel
  private mqttService!: MQTTService; // Service untuk MQTT messaging

  // ===== CONSTRUCTOR =====
  constructor() {
    this.app = new Elysia(); // Inisialisasi aplikasi Elysia
  }

  // ===== INITIALIZATION METHOD =====
  // Method utama untuk menginisialisasi semua komponen server
  async init() {
    // ===== DATABASE & MQTT INITIALIZATION =====
    // Inisialisasi koneksi database MySQL dan MQTT client
    this.db = MySQLDatabase.getInstance(); // Pola instance tunggal untuk database
    this.mqttClient = MQTTClient.getInstance(); // Pola instance tunggal untuk MQTT

    // ===== SERVICE INITIALIZATION (PHASE 1) =====
    // Inisialisasi service yang tidak memiliki dependencies terlebih dahulu
    this.authService = new AuthService(this.db); // Service autentikasi
    this.userService = new UserService(this.db); // Service user management
    this.widgetService = new WidgetService(this.db); // Service widget dashboard
    this.alarmService = new AlarmService(this.db); // Service sistem alarm
    this.notificationService = new NotificationService(this.db); // Service notifikasi
    this.dashboardService = new DashboardService(this.db); // Service dashboard
    this.datastreamService = new DatastreamService(this.db); // Service datastream
    this.otaaService = new OtaaUpdateService(this.db); // Service OTAA
    this.adminService = new AdminService(this.db); // Service admin
    this.deviceStatusService = new DeviceStatusService(this.db, this.notificationService); // Service status device dengan shared notification

    // ===== MQTT SERVICE INITIALIZATION =====
    // Inisialisasi MQTT service dengan dependencies untuk notifikasi dan status
    this.mqttService = new MQTTService(this.db, this.notificationService, this.deviceStatusService);

    // ===== DEVICE SERVICE INITIALIZATION =====
    // Inisialisasi device service dengan callback MQTT untuk subscribe/unsubscribe topic
    this.deviceService = new DeviceService(
      this.db, // Database connection
      this.otaaService, // OTAA service untuk device activation
      this.mqttService.subscribeTopic.bind(this.mqttService), // Callback subscribe topic
      this.mqttService.unSubscribeTopic.bind(this.mqttService) // Callback unsubscribe topic
    );

    // ===== MQTT-DEVICE SERVICE LINKING =====
    // Set device service ke MQTT service untuk JWT verification dan device management
    this.mqttService.setDeviceService(this.deviceService);

    // ===== PAYLOAD SERVICE INITIALIZATION (PHASE 2) =====
    // Inisialisasi payload service dengan semua dependencies yang diperlukan
    this.payloadService = new PayloadService(
      this.db, // Database connection
      this.deviceService, // Device service untuk validasi device
      this.notificationService, // Service notifikasi untuk alarm
      this.deviceStatusService // Service status untuk update status device
    );

    // ===== JWT CONFIGURATION =====
    // Konfigurasi JWT untuk autentikasi dengan secret dan expiration dari environment
    const jwtInstance = jwt({
      name: "jwt", // Nama instance JWT
      secret: process.env.JWT_SECRET!, // Secret key dari environment variable
      exp: process.env.ACCESS_TOKEN_AGE!, // Expiration time dari environment variable
    });

    // ===== MQTT LISTENER START =====
    // Mulai mendengarkan pesan MQTT dari device IoT
    this.mqttService.listen();

    this.app
      // ===== SECURITY MIDDLEWARE =====
      // Middleware untuk security headers dan perlindungan keamanan
      .onRequest(({ set, request }) => {
        // Sembunyikan informasi server
        set.headers["server"] = "Misred-IoT";
        delete set.headers["x-powered-by"];
        
        // Header keamanan
        set.headers["x-content-type-options"] = "nosniff";
        set.headers["x-frame-options"] = "DENY";
        set.headers["x-xss-protection"] = "1; mode=block";
        set.headers["referrer-policy"] = "strict-origin-when-cross-origin";
        
        // HSTS untuk production dengan HTTPS
        if (process.env.NODE_ENV === "production") {
          set.headers["strict-transport-security"] = "max-age=31536000; includeSubDomains";
        }
        
        // Blokir upaya scanning vulnerability yang umum
        const url = request.url.toLowerCase();
        const suspiciousPatterns = [
          '.env', 'config.', 'wp-', 'admin.php', 'phpmyadmin',
          'environment.ts', 'package.json', '.git', 'server.ts',
          'config.js', 'config.json', '.htaccess', 'web.config'
        ];
        
        if (suspiciousPatterns.some(pattern => url.includes(pattern))) {
          // Ambil informasi client yang lebih lengkap
          const clientIP = request.headers.get("x-forwarded-for") || 
                          request.headers.get("x-real-ip") || 
                          request.headers.get("cf-connecting-ip") || 
                          request.headers.get("x-client-ip") ||
                          "tidak diketahui";
          const userAgent = request.headers.get("user-agent") || "tidak diketahui";
          
          console.warn("🚨 Upaya akses mencurigakan diblokir:", request.url);
          console.warn("   📍 Dari IP:", clientIP);
          console.warn("   🌐 User Agent:", userAgent.substring(0, 100) + (userAgent.length > 100 ? "..." : ""));
          
          throw new Error("BLOCKED_REQUEST");
        }
      })
      
      // ===== HEALTH CHECK ENDPOINT =====
      // Endpoint untuk monitoring kesehatan server dan database
      .get("/health-check", () => ({
        status: "ok", // Status server
        timestamp: new Date().toISOString(), // Timestamp saat ini
        uptime: process.uptime(), // Waktu server berjalan (dalam detik)
        database: "connected", // Status database (bisa ditambah health check aktual)
      }))

      // ===== API ROUTES REGISTRATION =====
      // Registrasi semua route API dengan service yang sesuai
      .use(healthCheckRoutes(this.mqttClient)) // Route pemantauan kesehatan sistem
      .use(authRoutes(this.authService, this.userService)) // Route autentikasi
      .use(userRoutes(this.userService)) // Route manajemen user
      .use(deviceRoutes(this.deviceService, this.deviceStatusService)) // Route device IoT
      .use(deviceCommandRoutes(this.db)) // Route command device
      .use(payloadRoutes(this.payloadService)) // Route payload data sensor
      .use(widgetRoutes(this.widgetService)) // Route widget dashboard
      .use(alarmRoutes(this.alarmService)) // Route sistem alarm
      .use(notificationRoutes(this.notificationService)) // Route notifikasi
      .use(dashboardRoutes(this.dashboardService)) // Route dashboard
      .use(datastreamRoutes(this.datastreamService)) // Route datastream
      .use(otaaRoutes(this.otaaService)) // Route OTAA
      .use(adminRoutes(this.adminService, this.userService, this.otaaService)) // Route admin panel

      // ===== WEBSOCKET ROUTES =====
      // Registrasi route WebSocket untuk komunikasi real-time
      .use(userWsRoutes(this.db)) // WebSocket untuk user dengan database injection
      .use(deviceWsRoutes(this.deviceService, this.deviceStatusService, this.db)) // WebSocket untuk device

      // ===== PLUGINS CONFIGURATION =====
      // ===== CORS PLUGIN =====
      // Konfigurasi berbagi sumber daya lintas origin untuk frontend
      .use(
        cors({
          origin: [
            process.env.FRONTEND_URL!, // URL frontend utama
            subDomain(process.env.FRONTEND_URL!), // Subdomain frontend
            process.env.FRONTEND_ADMIN_URL!, // URL admin frontend
          ],
          preflight: true, // Enable preflight requests
          credentials: true, // Allow credentials (cookies, auth headers)
          methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // HTTP methods yang diizinkan
          allowedHeaders: ["Content-Type", "Authorization"], // Headers yang diizinkan
        })
      )
      // ===== JWT PLUGIN =====
      // Registrasi plugin JWT untuk autentikasi token
      .use(jwtInstance)
      
      // ===== SWAGGER PLUGIN =====
      // Plugin dokumentasi API otomatis dengan Swagger UI
      .use(
        swagger({
          documentation: {
            info: {
              title: "REST API Misred-IoT", // Judul dokumentasi API
              description: "Dokumentasi API untuk proyek Misred-IoT", // Deskripsi API
              version: "1.0.0", // Versi API
            },
            tags: apiTags, // Tags untuk kategorisasi endpoint
            components: {
              securitySchemes: {
                bearerAuth: {
                  type: "http", // Tipe autentikasi HTTP
                  scheme: "bearer", // Skema bearer token
                  bearerFormat: "JWT", // Format token JWT
                },
              },
            },
          },
        })
      )
      
      // ===== STATIC FILES PLUGIN =====
      // Plugin untuk melayani file statis (gambar, dokumen, firmware, dll)
      .use(
        staticPlugin({
          prefix: "/public", // URL prefix untuk file statis
          assets: "./src/assets", // Direktori file statis
        })
      )
      
      // ===== CUSTOM ENDPOINTS =====
      // ===== DOCUMENTATION ENDPOINT =====
      // Endpoint kustom untuk dokumentasi API dengan favicon
      .get("/docs", async () => {
        const res = await fetch(`${process.env.BACKEND_URL}/swagger`); // Ambil HTML swagger
        let html = await res.text();
        // Inject favicon ke dalam HTML dokumentasi
        html = html.replace(
          "</head>",
          `<link rel="icon" type="image/svg+xml" href="/public/web-logo.svg" /></head>`
        );
        return new Response(html, {
          headers: {
            "Content-Type": "text/html", // Set content type HTML
          },
        });
      })

      // ===== ERROR HANDLING =====
      // Global error handler untuk menangani semua error yang terjadi
      .onError(({ error, code, request }) => {
        // ===== PENANGANAN REQUEST YANG DIBLOKIR =====
        if (error instanceof Error && error.message === "BLOCKED_REQUEST") {
          return new Response("Akses ditolak", { status: 403 });
        }
        
        // ===== 404 NOT FOUND HANDLING =====
        // Redirect ke halaman 404 frontend jika endpoint tidak ditemukan
        if (code === "NOT_FOUND") {
          // Skip logging untuk favicon.ico yang normal dari browser
          if (!request.url.includes('/favicon.ico')) {
            // Log dengan informasi client yang lebih lengkap untuk keamanan
            const clientIP = request.headers.get("x-forwarded-for") || 
                            request.headers.get("x-real-ip") || 
                            request.headers.get("cf-connecting-ip") || 
                            request.headers.get("x-client-ip") ||
                            "localhost/development";
            const userAgent = request.headers.get("user-agent") || "tidak diketahui";
            
            console.warn("⚠️ Upaya akses 404:", request.url);
            console.warn("   📍 Dari IP:", clientIP);
            console.warn("   🌐 User Agent:", userAgent.substring(0, 80) + (userAgent.length > 80 ? "..." : ""));
          }
          
          return new Response(null, {
            status: 302, // HTTP 302 redirect
            headers: {
              Location: `${process.env.FRONTEND_URL}/404` // Redirect ke 404 page
            }
          });
        } else {
          console.error("❌ Terjadi kesalahan server:", code);
        }
        
        // ===== 401 VALIDATION ERROR HANDLING =====
        // Redirect ke halaman 401 frontend jika ada error validasi/autentikasi
        if (typeof code === "string" && code === "VALIDATION") {
          return new Response(null, {
            status: 302, // HTTP 302 redirect
            headers: {
              Location: `${process.env.FRONTEND_URL}/401` // Redirect ke 401 page
            }
          });
        }
        
        // ===== RESPONSE ERROR DEFAULT =====
        // Response default untuk error yang tidak spesifik
        return new Response("Terjadi kesalahan pada server", { status: 500 });
      })
      
      // ===== SERVER LISTENER =====
      // Konfigurasi dan start server dengan hostname dan port dari environment
      .listen(
        {
          hostname: "0.0.0.0", // Listen pada semua interface network
          port: Number(process.env.BACKEND_PORT), // Port dari environment variable
        },
        () => {
          // Callback ketika server berhasil start
          console.log(
            `🦊 Server Backend telah berjalan pada ${this.app.server?.hostname}:${this.app.server?.port}`
          );
        }
      );

    // ===== BACKGROUND TASKS & INTERVALS =====
    
    // ===== PENYIMPANAN INTERVALS CLEANUP =====
    const intervals: ReturnType<typeof setInterval>[] = []; // Kompatibel dengan Bun dan Node
    
    // ===== DEVICE COMMAND CLEANUP TASK =====
    // Cleanup command lama yang pending setiap 30 detik untuk mencegah command menumpuk
    const commandCleanupInterval = setInterval(async () => {
      try {
        // ===== DATABASE HEALTH CHECK =====
        // Test koneksi database sebelum melakukan operasi
        const isHealthy = await MySQLDatabase.healthCheck();
        if (!isHealthy) {
          console.log("⚠️ Database tidak sehat selama command cleanup, dilewati...");
          return;
        }
        
        // ===== COMMAND CLEANUP EXECUTION =====
        // Buat instance service dan cleanup command lama
        const commandService = new DeviceCommandService(this.db);
        const affected = await commandService.markOldCommandsAsFailed(0.17); // 10 detik timeout
        if (affected > 0) {
          console.log(`🧹 Menandai ${affected} command device lama sebagai gagal`);
        }
      } catch (error: any) {
        console.error("❌ Kesalahan saat membersihkan command device:", error);
        
        // ===== PENANGANAN ERROR KONEKSI =====
        // Check jika error disebabkan oleh masalah koneksi database
        if (error.code === "PROTOCOL_CONNECTION_LOST" || 
            error.code === "ER_CONNECTION_LOST" || 
            error.code === "ECONNRESET" ||
            error.code === "ENOTFOUND" ||
            error.code === "ETIMEDOUT" ||
            error.message?.includes('Pool is closed')) {
          console.log("🔄 Kesalahan koneksi database terdeteksi saat pembersihan command");
          // Biarkan health check mechanism menangani reconnection
        }
      }
    }, 30000); // Interval 30 detik
    intervals.push(commandCleanupInterval);

    // ===== DEVICE SECRET REFRESH TASK =====
    // Refresh variable secret semua device secara berkala untuk keamanan
    const secretRefreshInterval = setInterval(async () => {
      try {
        // ===== DATABASE HEALTH CHECK =====
        // Test koneksi database sebelum refresh secret
        const isHealthy = await MySQLDatabase.healthCheck();
        if (!isHealthy) {
          console.log("⚠️ Database tidak sehat selama refresh secret, dilewati...");
          return;
        }
        
        // ===== SECRET REFRESH EXECUTION =====
        // Refresh secret semua device untuk keamanan
        await this.deviceService.refreshAllDeviceSecrets();
        console.log("🔄 Berhasil me-refresh secret dari semua device ");
        
        // ===== BROADCAST UPDATE TO USERS =====
        // Broadcast notifikasi ke semua user melalui WebSocket
        broadcastToAllUsers({
          type: "device_secret_refreshed", // Tipe event
          message: "Secret perangkat telah diperbarui", // Pesan notifikasi
        });
      } catch (error: any) {
        console.error("Gagal refresh secret:", error);
        
        // ===== PENANGANAN ERROR KONEKSI =====
        // Check jika error disebabkan oleh masalah koneksi database
        if (error.code === "PROTOCOL_CONNECTION_LOST" || 
            error.code === "ER_CONNECTION_LOST" || 
            error.code === "ECONNRESET" ||
            error.code === "ENOTFOUND" ||
            error.code === "ETIMEDOUT" ||
            error.message?.includes('Pool is closed')) {
          console.log("🔄 Kesalahan koneksi database saat refresh secret");
          // Biarkan health check mechanism menangani reconnection
        }
        return; // Keluar dari fungsi jika terjadi error
      }
    }, ageConverter(process.env.DEVICE_SECRET_REFRESH_AGE!) * 1000); // Interval dari environment variable
    intervals.push(secretRefreshInterval);

    // ===== DATABASE HEALTH MONITOR =====
    // Monitor kesehatan database dan auto-reconnect jika diperlukan
    const healthCheckInterval = setInterval(async () => {
      try {
        const isHealthy = await MySQLDatabase.healthCheck();
        if (!isHealthy) {
          console.log("🔄 Pemeriksaan kesehatan database gagal, mencoba reconnect...");
          this.db = await MySQLDatabase.forceReconnectWithRetry();
          
          // Reinitialize services dengan database connection baru
          await this.reinitializeServices();
        }
      } catch (error) {
        console.error("❌ Kesalahan monitor pemeriksaan kesehatan:", error);
      }
    }, 60000); // Check setiap 1 menit
    intervals.push(healthCheckInterval);

    // ===== PENANGANAN SHUTDOWN GRACEFUL =====
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n🛑 Menerima signal ${signal}. Memulai shutdown graceful...`);
      
      // Clear semua intervals (kompatibel dengan Bun)
      intervals.forEach(interval => clearInterval(interval));
      
      // Tutup koneksi database
      try {
        await MySQLDatabase.shutdown();
        console.log("✅ Koneksi database ditutup");
      } catch (error) {
        console.error("❌ Kesalahan saat menutup database:", error);
      }
      
      // Tutup koneksi MQTT
      try {
        this.mqttClient.end();
        console.log("✅ Koneksi MQTT ditutup");
      } catch (error) {
        console.error("❌ Kesalahan saat menutup MQTT:", error);
      }
      
      console.log("👋 Shutdown graceful selesai");
      process.exit(0);
    };

    // Daftarkan shutdown handlers (kompatibel dengan Bun runtime)
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    // Catatan: SIGUSR2 terutama untuk nodemon, tetapi tetap disimpan untuk kompatibilitas
    if (process.platform !== 'win32') {
      process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2'));
    }
  }

  // ===== REINITIALIZE SERVICES =====
  // Method untuk reinisialisasi services dengan koneksi database baru
  private async reinitializeServices(): Promise<void> {
    try {
      console.log("🔄 Menginisialisasi ulang service dengan koneksi database baru...");
      
      // Reinitialize service inti
      this.authService = new AuthService(this.db);
      this.userService = new UserService(this.db);
      this.widgetService = new WidgetService(this.db);
      this.alarmService = new AlarmService(this.db);
      this.notificationService = new NotificationService(this.db);
      this.dashboardService = new DashboardService(this.db);
      this.datastreamService = new DatastreamService(this.db);
      this.otaaService = new OtaaUpdateService(this.db);
      this.adminService = new AdminService(this.db);
      this.deviceStatusService = new DeviceStatusService(this.db, this.notificationService);

      // Reinitialize MQTT service
      this.mqttService = new MQTTService(this.db, this.notificationService, this.deviceStatusService);

      // Reinitialize device service
      this.deviceService = new DeviceService(
        this.db,
        this.otaaService,
        this.mqttService.subscribeTopic.bind(this.mqttService),
        this.mqttService.unSubscribeTopic.bind(this.mqttService)
      );

      // Set device service ke MQTT service
      this.mqttService.setDeviceService(this.deviceService);

      // Reinitialize payload service
      this.payloadService = new PayloadService(
        this.db,
        this.deviceService,
        this.notificationService,
        this.deviceStatusService
      );

      console.log("✅ Service berhasil diinisialisasi ulang");
    } catch (error) {
      console.error("❌ Gagal menginisialisasi ulang service:", error);
      throw error;
    }
  }
}

// ===== SERVER INSTANTIATION & STARTUP =====
// Buat instance server dan jalankan inisialisasi
const server = new Server();
server.init(); // Mulai server dengan semua konfigurasi

// ===== IMPORTS PLUGINS & MIDDLEWARE =====
// Import plugin CORS untuk mengatur Cross-Origin Resource Sharing
import { cors } from "@elysiajs/cors";
// Import plugin JWT untuk autentikasi menggunakan JSON Web Token
import { jwt } from "@elysiajs/jwt";
// Import plugin Swagger untuk dokumentasi API otomatis
import { swagger } from "@elysiajs/swagger";
// Import plugin static untuk melayani file statis (gambar, dokumen, dll)
import { staticPlugin } from "@elysiajs/static";

// ===== IMPORTS NODE.JS MODULES =====
// Import fungsi filesystem untuk operasi file dan direktori
import { existsSync, readdirSync, readFileSync } from "fs";
// Import fungsi path untuk manipulasi path file
import { join } from "path";

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
import { otaaRoutes } from "./api/otaa"; // Route Over-The-Air-Activation
import { adminRoutes } from "./api/admin"; // Route admin panel

// ===== IMPORTS WEBSOCKET ROUTES =====
// Import route WebSocket untuk komunikasi real-time
import { userWsRoutes, broadcastToSpecificUser, broadcastToAllUsers } from "./api/ws/user-ws"; // WebSocket user
import { deviceWsRoutes } from "./api/ws/device-ws"; // WebSocket device

// ===== IMPORTS SERVICES =====
// Import semua service class untuk business logic
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
    this.db = MySQLDatabase.getInstance(); // Singleton pattern untuk database
    this.mqttClient = MQTTClient.getInstance(); // Singleton pattern untuk MQTT

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
    this.deviceStatusService = new DeviceStatusService(this.db); // Service status device

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
      // Konfigurasi Cross-Origin Resource Sharing untuk frontend
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
        console.error("❌ Terjadi kesalahan:", error, `Halaman yang dicoba oleh user: ${request.url}`);
        
        // ===== 404 NOT FOUND HANDLING =====
        // Redirect ke halaman 404 frontend jika endpoint tidak ditemukan
        if (code === "NOT_FOUND") {
          return new Response(null, {
            status: 302, // HTTP 302 redirect
            headers: {
              Location: `${process.env.FRONTEND_URL}/404` // Redirect ke 404 page
            }
          });
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
        
        // ===== DEFAULT ERROR RESPONSE =====
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
            `🦊 Backend Server telah berjalan pada ${this.app.server?.hostname}:${this.app.server?.port}`
          );
        }
      );

    // ===== BACKGROUND TASKS & INTERVALS =====
    
    // ===== DEVICE COMMAND CLEANUP TASK =====
    // Cleanup command lama yang pending setiap 30 detik untuk mencegah command menumpuk
    setInterval(async () => {
      try {
        // ===== DATABASE HEALTH CHECK =====
        // Test koneksi database sebelum melakukan operasi
        const isHealthy = await MySQLDatabase.healthCheck();
        if (!isHealthy) {
          console.log("🔄 Database unhealthy, attempting reconnection...");
          this.db = MySQLDatabase.forceReconnect(); // Force reconnect jika tidak sehat
        }
        
        // ===== COMMAND CLEANUP EXECUTION =====
        // Buat instance service dan cleanup command lama
        const commandService = new DeviceCommandService(this.db);
        const affected = await commandService.markOldCommandsAsFailed(0.17); // 10 detik timeout
        if (affected > 0) {
          console.log(`🧹 Marked ${affected} old device commands as failed`);
        }
      } catch (error: any) {
        console.error("Error cleaning up device commands:", error);
        
        // ===== CONNECTION ERROR HANDLING =====
        // Check jika error disebabkan oleh masalah koneksi database
        if (error.code === "PROTOCOL_CONNECTION_LOST" || 
            error.code === "ER_CONNECTION_LOST" || 
            error.code === "ECONNRESET" ||
            error.code === "ENOTFOUND" ||
            error.code === "ETIMEDOUT") {
          console.log("🔄 Database connection error detected, forcing reconnection...");
          try {
            // ===== FORCE RECONNECTION =====
            // Paksa reconnect database jika ada masalah koneksi
            this.db = MySQLDatabase.forceReconnect();
            console.log("✅ Database connection restored for command cleanup");
          } catch (reconnectError) {
            console.error("❌ Failed to reconnect to database:", reconnectError);
          }
        }
      }
    }, 30000); // Interval 30 detik

    // ===== DEVICE SECRET REFRESH TASK =====
    // Refresh variable secret semua device secara berkala untuk keamanan
    setInterval(async () => {
      try {
        // ===== DATABASE HEALTH CHECK =====
        // Test koneksi database sebelum refresh secret
        const isHealthy = await MySQLDatabase.healthCheck();
        if (!isHealthy) {
          console.log("🔄 Database unhealthy, attempting reconnection...");
          this.db = MySQLDatabase.forceReconnect(); // Force reconnect jika tidak sehat
          
          // ===== REINITIALIZE DEVICE SERVICE =====
          // Reinisialisasi device service dengan koneksi database baru
          this.deviceService = new DeviceService(
            this.db,
            this.otaaService,
            this.mqttService.subscribeTopic.bind(this.mqttService),
            this.mqttService.unSubscribeTopic.bind(this.mqttService)
          );
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
        
        // ===== CONNECTION ERROR HANDLING =====
        // Check jika error disebabkan oleh masalah koneksi database
        if (error.code === "PROTOCOL_CONNECTION_LOST" || 
            error.code === "ER_CONNECTION_LOST" || 
            error.code === "ECONNRESET" ||
            error.code === "ENOTFOUND" ||
            error.code === "ETIMEDOUT") {
          console.log("🔄 Database connection error during secret refresh, forcing reconnection...");
          try {
            // ===== FORCE RECONNECTION =====
            // Paksa reconnect database jika ada masalah koneksi
            this.db = MySQLDatabase.forceReconnect();
            
            // ===== REINITIALIZE DEVICE SERVICE =====
            // Reinisialisasi device service dengan koneksi database baru
            this.deviceService = new DeviceService(
              this.db,
              this.otaaService,
              this.mqttService.subscribeTopic.bind(this.mqttService),
              this.mqttService.unSubscribeTopic.bind(this.mqttService)
            );
          } catch (reconnectError) {
            console.error("❌ Failed to reconnect to database:", reconnectError);
          }
        }
        return; // Exit dari fungsi jika terjadi error
      }
    }, ageConverter(process.env.DEVICE_SECRET_REFRESH_AGE!) * 1000); // Interval dari environment variable
  }
}

// ===== SERVER INSTANTIATION & STARTUP =====
// Buat instance server dan jalankan inisialisasi
const server = new Server();
server.init(); // Mulai server dengan semua konfigurasi

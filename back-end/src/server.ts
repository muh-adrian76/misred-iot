import { cors } from "@elysiajs/cors";
import { jwt } from "@elysiajs/jwt";
import { swagger } from "@elysiajs/swagger";
import { staticPlugin } from "@elysiajs/static";
import { existsSync, readdirSync, readFileSync } from "fs";
import { join } from "path";
import { Elysia } from "elysia";
import { MySQLDatabase, MQTTClient } from "./lib/middleware";
import { apiTags, subDomain, ageConverter } from "./lib/utils";

import { authRoutes } from "./api/auth";
import { userRoutes } from "./api/user";
import { deviceRoutes } from "./api/device";
import { deviceCommandRoutes } from "./api/device-command";
import { payloadRoutes } from "./api/payload";
import { widgetRoutes } from "./api/widget";
import { alarmRoutes } from "./api/alarm";
import { alarmNotificationRoutes } from "./api/alarm/notifications";
import { dashboardRoutes } from "./api/dashboard";
import { datastreamRoutes } from "./api/datastream";
import { otaaRoutes } from "./api/otaa";
import { adminRoutes } from "./api/admin";
import { userWsRoutes, broadcastToUsers } from "./api/ws/user-ws";
import { deviceWsRoutes } from "./api/ws/device-ws";

import { AuthService } from "./services/AuthService";
import { UserService } from "./services/UserService";
import { DeviceService } from "./services/DeviceService";
import { PayloadService } from "./services/PayloadService";
import { WidgetService } from "./services/WidgetService";
import { AlarmService } from "./services/AlarmService";
import { AlarmNotificationService } from "./services/AlarmNotificationService";
import { DashboardService } from "./services/DashboardService";
import { DatastreamService } from "./services/DatastreamService";
import { DeviceCommandService } from "./services/DeviceCommandService";
import { DeviceStatusService } from "./services/DeviceStatusService";
import { OtaaUpdateService } from "./services/OtaaUpdateService";
import { AdminService } from "./services/AdminService";
import { MQTTService } from "./services/MiddlewareService";

class Server {
  private app: Elysia;
  private db!: Awaited<ReturnType<typeof MySQLDatabase.getInstance>>;
  private mqttClient!: ReturnType<typeof MQTTClient.getInstance>;

  private authService!: AuthService;
  private userService!: UserService;
  private deviceService!: DeviceService;
  private payloadService!: PayloadService;
  private widgetService!: WidgetService;
  private alarmService!: AlarmService;
  private alarmNotificationService!: AlarmNotificationService;
  private dashboardService!: DashboardService;
  private datastreamService!: DatastreamService;
  private otaaService!: OtaaUpdateService;
  private deviceStatusService!: DeviceStatusService;
  private adminService!: AdminService;
  private mqttService!: MQTTService;

  constructor() {
    this.app = new Elysia();
  }

  async init() {
    this.db = MySQLDatabase.getInstance();
    this.mqttClient = MQTTClient.getInstance();

    // Init services yang tidak butuh dependencies dulu
    this.authService = new AuthService(this.db);
    this.userService = new UserService(this.db);
    this.widgetService = new WidgetService(this.db);
    this.alarmService = new AlarmService(this.db);
    this.alarmNotificationService = new AlarmNotificationService(this.db);
    this.dashboardService = new DashboardService(this.db);
    this.datastreamService = new DatastreamService(this.db);
    this.otaaService = new OtaaUpdateService(this.db);
    this.adminService = new AdminService(this.db);
    this.deviceStatusService = new DeviceStatusService(this.db);

    // Init MQTT service dengan alarm notification
    this.mqttService = new MQTTService(this.db, this.alarmNotificationService, this.deviceStatusService);

    // Init device service dengan MQTT callbacks
    this.deviceService = new DeviceService(
      this.db,
      this.otaaService,
      this.mqttService.subscribeTopic.bind(this.mqttService),
      this.mqttService.unSubscribeTopic.bind(this.mqttService)
    );

    // Set device service ke MQTT service (untuk JWT verification)
    this.mqttService.setDeviceService(this.deviceService);

    // Init payload service dengan dependencies
    this.payloadService = new PayloadService(
      this.db,
      this.deviceService,
      this.alarmNotificationService,
      this.deviceStatusService
    );

    // Create JWT instance
    const jwtInstance = jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET!,
      exp: process.env.ACCESS_TOKEN_AGE!,
    });

    // Start MQTT listener
    this.mqttService.listen();

    this.app
      // Health check endpoint
      .get("/health-check", () => ({
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: "connected", // You can add actual DB health check here
      }))

      // API
      .use(authRoutes(this.authService, this.userService))
      .use(userRoutes(this.userService))
      .use(deviceRoutes(this.deviceService, this.deviceStatusService))
      .use(deviceCommandRoutes(this.db))
      .use(payloadRoutes(this.payloadService))
      .use(widgetRoutes(this.widgetService))
      .use(alarmRoutes(this.alarmService))
      .use(alarmNotificationRoutes(this.alarmNotificationService))
      .use(dashboardRoutes(this.dashboardService))
      .use(datastreamRoutes(this.datastreamService))
      .use(otaaRoutes(this.otaaService))
      .use(adminRoutes(this.adminService, this.userService))

      // Websocket
      .use(userWsRoutes)
      .use(deviceWsRoutes(this.deviceService, this.db))

      // Plugin
      .use(
        cors({
          origin: [
            process.env.FRONTEND_URL!,
            subDomain(process.env.FRONTEND_URL!),
            process.env.FRONTEND_ADMIN_URL!,
          ],
          preflight: true,
          credentials: true,
          methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
          allowedHeaders: ["Content-Type", "Authorization"],
        })
      )
      .use(jwtInstance)
      .use(
        swagger({
          documentation: {
            info: {
              title: "REST API Misred-IoT",
              description: "Dokumentasi API untuk proyek Misred-IoT",
              version: "1.0.0",
            },
            tags: apiTags,
            components: {
              securitySchemes: {
                bearerAuth: {
                  type: "http",
                  scheme: "bearer",
                  bearerFormat: "JWT",
                },
              },
            },
          },
        })
      )
      .use(
        staticPlugin({
          prefix: "/public",
          assets: "./src/assets",
        })
      )
      // Dokumentasi REST API
      .get("/docs", async () => {
        const res = await fetch(`${process.env.BACKEND_URL}/swagger`);
        let html = await res.text();
        html = html.replace(
          "</head>",
          `<link rel="icon" type="image/svg+xml" href="/public/web-logo.svg" /></head>`
        );
        return new Response(html, {
          headers: {
            "Content-Type": "text/html",
          },
        });
      })

      // Error handler
      .onError(({ error, code, request }) => {
        console.error("❌ Terjadi kesalahan:", error, `Halaman yang dicoba oleh user: ${request.url}`);
        // Redirect to frontend 404 page
        if (code === "NOT_FOUND") {
          return new Response(null, {
            status: 302,
            headers: {
              Location: `${process.env.FRONTEND_URL}/404`
            }
          });
        }
        // Redirect to frontend 401 page
        if (typeof code === "string" && code === "VALIDATION") {
          return new Response(null, {
            status: 302,
            headers: {
              Location: `${process.env.FRONTEND_URL}/401`
            }
          });
        }
        // Default error message
        return new Response("Terjadi kesalahan pada server", { status: 500 });
      })
      .listen(
        {
          hostname: "0.0.0.0",
          port: Number(process.env.BACKEND_PORT),
        },
        () => {
          console.log(
            `🦊 Backend Server telah berjalan pada ${this.app.server?.hostname}:${this.app.server?.port}`
          );
        }
      );

    // Cleanup old pending device commands setiap 30 detik
    setInterval(async () => {
      try {
        // Test database connection first
        const isHealthy = await MySQLDatabase.healthCheck();
        if (!isHealthy) {
          console.log("🔄 Database unhealthy, attempting reconnection...");
          this.db = MySQLDatabase.forceReconnect();
        }
        
        const commandService = new DeviceCommandService(this.db);
        const affected = await commandService.markOldCommandsAsFailed(0.17); // 10 seconds timeout
        if (affected > 0) {
          console.log(`🧹 Marked ${affected} old device commands as failed`);
        }
      } catch (error: any) {
        console.error("Error cleaning up device commands:", error);
        
        // Check if it's a connection error
        if (error.code === "PROTOCOL_CONNECTION_LOST" || 
            error.code === "ER_CONNECTION_LOST" || 
            error.code === "ECONNRESET" ||
            error.code === "ENOTFOUND" ||
            error.code === "ETIMEDOUT") {
          console.log("🔄 Database connection error detected, forcing reconnection...");
          try {
            // Force reconnection
            this.db = MySQLDatabase.forceReconnect();
            console.log("✅ Database connection restored for command cleanup");
          } catch (reconnectError) {
            console.error("❌ Failed to reconnect to database:", reconnectError);
          }
        }
      }
    }, 30000); // 30 seconds interval

    // Refresh variabel secret semua device setiap 5 menit
    setInterval(async () => {
      try {
        // Test database connection first
        const isHealthy = await MySQLDatabase.healthCheck();
        if (!isHealthy) {
          console.log("🔄 Database unhealthy, attempting reconnection...");
          this.db = MySQLDatabase.forceReconnect();
          
          // Reinitialize device service with new db connection
          this.deviceService = new DeviceService(
            this.db,
            this.otaaService,
            this.mqttService.subscribeTopic.bind(this.mqttService),
            this.mqttService.unSubscribeTopic.bind(this.mqttService)
          );
        }
        
        await this.deviceService.refreshAllDeviceSecrets();
        console.log("🔄 Berhasil me-refresh secret dari semua device ");
        broadcastToUsers({
          type: "device_secret_refreshed",
          message: "Secret perangkat telah diperbarui",
        });
      } catch (error: any) {
        console.error("Gagal refresh secret:", error);
        
        // Check if it's a connection error
        if (error.code === "PROTOCOL_CONNECTION_LOST" || 
            error.code === "ER_CONNECTION_LOST" || 
            error.code === "ECONNRESET" ||
            error.code === "ENOTFOUND" ||
            error.code === "ETIMEDOUT") {
          console.log("🔄 Database connection error during secret refresh, forcing reconnection...");
          try {
            // Force reconnection
            this.db = MySQLDatabase.forceReconnect();
            
            // Reinitialize device service with new db connection
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
        return;
      }
    }, ageConverter(process.env.DEVICE_SECRET_REFRESH_AGE!) * 1000);
  }
}

// Jalankan server
const server = new Server();
server.init();

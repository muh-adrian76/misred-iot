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
import { OtaaUpdateService } from "./services/OtaaUpdateService";
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

    // Init MQTT service dengan alarm notification
    this.mqttService = new MQTTService(this.db, this.alarmNotificationService);

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
      this.alarmNotificationService
    );

    // Create JWT instance
    const jwtInstance = jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET!,
      exp: process.env.ACCESS_TOKEN_AGE,
    });

    // Set JWT instance ke MQTT service
    this.mqttService.setJWTInstance(jwtInstance);

    // Start MQTT listener
    this.mqttService.listen();

    this.app
      // API
      .use(authRoutes(this.authService))
      .use(userRoutes(this.userService))
      .use(deviceRoutes(this.deviceService))
      .use(deviceCommandRoutes(this.db))
      .use(payloadRoutes(this.payloadService))
      .use(widgetRoutes(this.widgetService))
      .use(alarmRoutes(this.alarmService))
      .use(alarmNotificationRoutes(this.alarmNotificationService))
      .use(dashboardRoutes(this.dashboardService))
      .use(datastreamRoutes(this.datastreamService))
      .use(otaaRoutes(this.otaaService))

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
      .onError(({ error, code }) => {
        console.error("❌ Terjadi kesalahan:", error);
        if (code === "NOT_FOUND") return "Anda salah alamat :(";
        if (code === "VALIDATION") return "Invalid user";
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

    // Refresh variabel secret semua device setiap 5 menit
    setInterval(async () => {
      try {
        await this.deviceService.refreshAllDeviceSecrets();
        console.log("🔄 Berhasil me-refresh secret dari semua device ");
        broadcastToUsers({
          type: "device_secret_refreshed",
          message: "Secret perangkat telah diperbarui",
        });
      } catch (error) {
        console.error("Gagal refresh secret:", error);
        return;
      }
    }, ageConverter(process.env.DEVICE_SECRET_REFRESH_AGE!) * 1000);
  }
}

// Jalankan server
const server = new Server();
server.init();

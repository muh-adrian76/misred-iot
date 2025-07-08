import { cors } from "@elysiajs/cors";
import { jwt } from "@elysiajs/jwt";
import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";
import { MySQLDatabase, MQTTClient } from "./lib/middleware";
import { apiTags, subDomain } from "./lib/utils";

import { authRoutes } from "./api/auth";
import { userRoutes } from "./api/user";
import { deviceRoutes } from "./api/device";
import { payloadRoutes } from "./api/payload";
import { widgetRoutes } from "./api/widget";
import { alarmRoutes } from "./api/alarm";
import { dashboardRoutes } from "./api/dashboard";
import { datastreamRoutes } from "./api/datastream";
import { userWsApi } from "./api/ws/user-ws";
import { deviceWsApi } from "./api/ws/device-ws";


import { AuthService } from "./services/AuthService";
import { UserService } from "./services/UserService";
import { DeviceService } from "./services/DeviceService";
import { PayloadService } from "./services/PayloadService";
import { WidgetService } from "./services/WidgetService";
import { AlarmService } from "./services/AlarmService";
import { DashboardService } from "./services/DashboardService";
import { DatastreamService } from "./services/DatastreamService";

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
  private dashboardService!: DashboardService;
  private datastreamService!: DatastreamService;

  constructor() {
    this.app = new Elysia();
  }

  async init() {
    this.db = MySQLDatabase.getInstance();
    this.mqttClient = MQTTClient.getInstance();
    this.authService = new AuthService(this.db);
    this.userService = new UserService(this.db);
    this.deviceService = new DeviceService(this.db);
    this.payloadService = new PayloadService(this.db);
    this.widgetService = new WidgetService(this.db);
    this.alarmService = new AlarmService(this.db);
    this.dashboardService = new DashboardService(this.db);
    this.datastreamService = new DatastreamService(this.db);

    this.setupMQTT();

    this.app
      // API
      .use(authRoutes(this.authService))
      .use(userRoutes(this.userService))
      .use(deviceRoutes(this.deviceService))
      .use(payloadRoutes(this.payloadService))
      .use(widgetRoutes(this.widgetService))
      .use(alarmRoutes(this.alarmService))
      .use(dashboardRoutes(this.dashboardService))
      .use(datastreamRoutes(this.datastreamService))

      // Websocket
      .use(userWsApi)
      .use(deviceWsApi(this.deviceService))

      // Plugin
      .use(
        cors({
          origin: [process.env.FRONTEND_URL!, subDomain(process.env.FRONTEND_URL!), process.env.FRONTEND_ADMIN_URL!],
          preflight: true,
          credentials: true,
          methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
          allowedHeaders: ["Content-Type", "Authorization"],
        })
      )
      .use(
        jwt({
          name: "jwt",
          secret: process.env.JWT_SECRET!,
          exp: process.env.ACCESS_TOKEN_AGE,
        })
      )
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
  }

  private setupMQTT() {
    this.mqttClient.on("connect", () => {
      console.log("✅ Berhasil terkoneksi ke MQTT broker");
      const topics = ["device/data", "device_2/data"];
      topics.forEach((topic) => {
        this.mqttClient.subscribe(topic, (err) => {
          if (!err) {
            console.log(`✅ Berhasil subscribe topik: ${topic}`);
          } else {
            console.error(`❌ Gagal subscribe topik: ${topic}`, err);
          }
        });
      });
    });

    this.mqttClient.on("message", async (topic, message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log(`Menerima payload dari topik ${topic}:`, data);

        await this.payloadService.saveMqttPayload(data);
        console.log(
          `Berhasil menyimpan data sensor pada topik ${topic} ke database.`
        );
      } catch (error) {
        console.error("❌ Gagal memproses pesan publisher:", error);
      }
    });
  }
}

// Jalankan server
const server = new Server();
server.init();

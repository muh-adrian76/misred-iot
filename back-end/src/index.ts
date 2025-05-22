import { cors } from "@elysiajs/cors";
import { jwt } from "@elysiajs/jwt";
import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";
import { db, mqttClient } from "./utils/middleware";

import { authRoutes } from "./routes/auth";
import { userRoutes } from "./routes/users";
import { deviceRoutes } from "./routes/devices";
import { sensorRoutes } from "./routes/payloads";
import { widgetRoutes } from "./routes/widgets";
import { alarmRoutes } from "./routes/alarms";

const app = new Elysia()
  .use(
    cors({
      preflight: true,
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  )
  .use(
    jwt({
      name: "jwt",
      secret: Bun.env.JWT_SECRET!,
      exp: Bun.env.ACCESS_TOKEN_AGE,
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
        tags: [
          {
            name: "Auth",
            description:
              "Endpoint untuk keperluan autentikasi user atau pengguna",
          },
          { name: "JWT", description: "Endpoint untuk keperluan token JWT" },
          {
            name: "User",
            description: "Endpoint untuk keperluan user atau pengguna",
          },
          {
            name: "Device",
            description: "Endpoint untuk keperluan device atau perangkat IoT",
          },
          {
            name: "Widget",
            description: "Endpoint untuk keperluan widget pada dashboard",
          },
          {
            name: "Payload",
            description: "Endpoint untuk keperluan data sensor",
          },
          {
            name: "Alarm",
            description: "Endpoint untuk keperluan alarm notifikasi",
          },
        ],
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
  .use(authRoutes)
  .use(userRoutes)
  .use(deviceRoutes)
  .use(sensorRoutes)
  .use(widgetRoutes)
  .use(alarmRoutes)
  .onError(({ error, code }) => {
    console.error("❌ Terjadi kesalahan:", error);
    if (code === "NOT_FOUND") return "Anda salah alamat :(";
    if (code === "VALIDATION") return "Invalid user";
  });

app.listen(Bun.env.SERVER_PORT!, () => {
  // MQTT Setup
  mqttClient.on("connect", () => {
    console.log("✅ Berhasil terkoneksi ke MQTT broker");
    const topics = ["device/data", "device_2/data"];
    topics.forEach((topic) => {
      mqttClient.subscribe(topic, (err) => {
        if (!err) {
          console.log(`✅ Berhasil subscribe topik: ${topic}`);
        } else {
          console.error(`❌ Gagal subscribe topik: ${topic}`, err);
        }
      });
    });
  });

  mqttClient.on("message", async (topic, message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log(`Menerima payload dari topik ${topic}:`, data);

      await db.query(
        `INSERT INTO payloads (device_id, ph, cod, tss, nh3n, flow, server_time)
        VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [data.device_id, data.ph, data.cod, data.tss, data.nh3n, data.flow]
      );

      console.log(
        `Berhasil menyimpan data sensor pada topik ${topic} ke database.`
      );
    } catch (error) {
      console.error("❌ Gagal memproses pesan publisher:", error);
    }
  });

  console.log(
    `🦊 Server telah berjalan pada ${app.server?.hostname}:${app.server?.port}`
  );
});

import { cors } from "@elysiajs/cors";
import { jwt } from "@elysiajs/jwt";
import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";
import { db, mqttClient } from "./utils/middleware";

import { alarmRoutes } from "./routes/alarms";
import { deviceRoutes } from "./routes/devices";
import { sensorRoutes } from "./routes/payloads";
import { userRoutes } from "./routes/users";
import { widgetRoutes } from "./routes/widgets";

const app = new Elysia()
  .use(
    cors({
      preflight: true,
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  )
  .use(swagger())
  .use(
    jwt({
      name: "jwt",
      secret: Bun.env.JWT_SECRET!,
      exp: Bun.env.ACCESS_TOKEN_AGE
    })
  )
  .use(userRoutes)
  .use(deviceRoutes)
  .use(sensorRoutes)
  .use(widgetRoutes)
  .use(alarmRoutes)
  .onError(({ code }) => {
    if (code === "NOT_FOUND") {
      return "Route not found :(";
    }
  });

app.listen(Bun.env.SERVER_PORT!, () => {
  // MQTT Setup
  // connectRabbitMQ();
  mqttClient.on('connect', () => {
    console.log('✅ Berhasil terkoneksi ke MQTT broker');
    
    // MQTT Topic
    const topics = ['device/data', 'device_2/data'];

    topics.forEach(topic => {
      mqttClient.subscribe(topic, (err) => {
        if (!err) {
          console.log(`✅ Berhasil subscribe topik: ${topic}`);
        } else {
          console.error(`❌ Gagal subscribe topik: ${topic}`, err);
        }
      });
    });
  });
  
  mqttClient.on('message', async (topic, message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log(`Menerima payload dari topik ${topic}:`, data);
  
      // Simpan data ke database
      await db.query(
        `INSERT INTO payloads (device_id, ph, cod, tss, nh3n, flow, server_time)
        VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [data.device_id, data.ph, data.cod, data.tss, data.nh3n, data.flow]
      );
  
      console.log(`Berhasil menyimpan data sensor pada topik ${topic} ke database.`);
    } catch (error) {
      console.error("❌ Gagal memproses pesan publisher:", error);
    }
  });
  
  console.log(
    `🦊 Server is running at ${app.server?.hostname}:${app.server?.port}`
  );
});



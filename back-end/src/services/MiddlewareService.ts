import { MQTTClient } from "../lib/middleware";
import { Pool } from "mysql2/promise";
import { decryptAES } from "../lib/utils";
import { DeviceService } from "./DeviceService";
import { jwt } from "@elysiajs/jwt";
import crypto from "crypto";

export class MQTTService {
  private mqttClient: ReturnType<typeof MQTTClient.getInstance>;
  private db: Pool;
  private deviceService: DeviceService;

  constructor(db: Pool) {
    this.db = db;
    this.mqttClient = MQTTClient.getInstance();
    this.deviceService = new DeviceService(db);
  }

  subscribeTopic(topic: string) {
    this.mqttClient.subscribe(topic, (err) => {
      if (!err) {
        console.log(`✅ Berhasil subscribe topik: ${topic}`);
      } else {
        console.error(`❌ Gagal subscribe topik: ${topic}`, err);
      }
    });
  }

  unSubscribeTopic(topic: string) {
    this.mqttClient.unsubscribe(topic, (err) => {
      if (!err) {
        console.log(`✅ Berhasil unsubscribe topik: ${topic}`);
      } else {
        console.error(`❌ Gagal unsubscribe topik: ${topic}`, err);
      }
    });
  }

  async subscribeAllDeviceTopics() {
    const [devices] = await this.db.query(
      "SELECT mqtt_topic FROM devices WHERE mqtt_topic IS NOT NULL"
    );
    // @ts-ignore
    devices.forEach((dev: any) => {
      if (dev.mqtt_topic) {
        this.mqttClient.subscribe(dev.mqtt_topic, (err) => {
          if (!err) {
            console.log(`✅ Berhasil subscribe topik: ${dev.mqtt_topic}`);
          } else {
            console.error(`❌ Gagal subscribe topik: ${dev.mqtt_topic}`, err);
          }
        });
      }
    });
  }

  // Fungsi verifikasi JWT dan dekripsi payload
  async verifyDeviceJWTAndDecrypt({
    jwt,
    device_id,
    token,
  }: {
    jwt: any;
    device_id: string;
    token: string;
  }) {
    // Ambil secret dari database
    const device = await this.deviceService.getDeviceById(device_id);
    //@ts-ignore
    const secret = device.new_secret;
    if (!secret) throw new Error("Device tidak terdaftar");

    // Verifikasi JWT
    const decoded = jwt.verify(token, secret, {
      algorithms: ["HS256"],
    });
    if (typeof decoded !== "object" || !decoded.encryptedData)
      throw new Error("Payload tidak valid");

    // Dekripsi AES
    const decrypted = decryptAES(crypto, decoded.encryptedData, secret);
    return decrypted;
  }

  async saveMqttPayload(data: any) {
    try {
      // Ambil JWT dan device_id dari payload MQTT
      const { device_id, jwt: token } = data;
      if (!device_id || !token)
        throw new Error("device_id atau jwt tidak ada di payload");

      // Verifikasi JWT dan dekripsi AES (gunakan fungsi yang sama seperti HTTP)
      const decrypted = await this.verifyDeviceJWTAndDecrypt({
        jwt,
        device_id,
        token,
      });

      await this.db.query(
        `INSERT INTO payloads (device_id, value, server_time)
        VALUES (?, ?, NOW())`,
        [device_id, JSON.stringify(decrypted)]
      );
    } catch (error) {
      console.error("Error saving MQTT payload:", error);
      throw new Error("Failed to save MQTT payload");
    }
  }

  listen() {
    this.mqttClient.on("connect", async () => {
      console.log("✅ Berhasil terkoneksi ke MQTT broker");
      await this.subscribeAllDeviceTopics();
    });

    this.mqttClient.on("message", async (topic, message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log(`Menerima payload dari topik ${topic}:`, data);
        await this.saveMqttPayload(data);
        console.log(
          `Berhasil menyimpan data sensor pada topik ${topic} ke database.`
        );
      } catch (error) {
        console.error("❌ Gagal memproses pesan publisher:", error);
      }
    });

    this.mqttClient.on("offline", () => {
      console.log("⚠️  MQTT client offline");
    });
  }
}

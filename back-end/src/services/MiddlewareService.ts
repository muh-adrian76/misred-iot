import { MQTTClient } from "../lib/middleware";
import { Pool, ResultSetHeader } from "mysql2/promise";
import { 
  verifyDeviceJWTAndDecrypt, 
  parseAndNormalizePayload, 
  broadcastSensorUpdates 
} from "../lib/utils";
import { DeviceService } from "./DeviceService";
import { AlarmNotificationService } from "./AlarmNotificationService";
import { broadcastToUsers } from "../api/ws/user-ws";
import { jwt } from "@elysiajs/jwt";
import crypto from "crypto";

export class MQTTService {
  private mqttClient: ReturnType<typeof MQTTClient.getInstance>;
  private db: Pool;
  private deviceService!: DeviceService;
  private alarmNotificationService?: AlarmNotificationService;
  private jwtInstance: any;

  constructor(db: Pool, alarmNotificationService?: AlarmNotificationService) {
    this.db = db;
    this.mqttClient = MQTTClient.getInstance();
    this.alarmNotificationService = alarmNotificationService;
  }

  // Setter untuk deviceService (dipanggil dari server.ts setelah deviceService dibuat)
  setDeviceService(deviceService: DeviceService) {
    this.deviceService = deviceService;
  }

  // Setter untuk JWT instance
  setJWTInstance(jwtInstance: any) {
    this.jwtInstance = jwtInstance;
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
    // Gunakan topic manager dari device service untuk subscribe
    const topicManager = this.deviceService?.getMQTTTopicManager();
    if (topicManager) {
      await topicManager.subscribeToAllActiveTopics((topic: string) => {
        this.mqttClient.subscribe(topic, (err) => {
          if (!err) {
            console.log(`✅ Berhasil subscribe topik: ${topic}`);
          } else {
            console.error(`❌ Gagal subscribe topik: ${topic}`, err);
          }
        });
      });
    } else {
      // Fallback ke method lama jika topic manager tidak tersedia
      const [devices] = await this.db.query(
        "SELECT DISTINCT mqtt_topic FROM devices WHERE mqtt_topic IS NOT NULL AND protocol = 'MQTT'"
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
    if (!this.deviceService) {
      throw new Error("DeviceService not initialized");
    }

    return await verifyDeviceJWTAndDecrypt({
      deviceService: this.deviceService,
      deviceId: device_id,
      token,
    });
  }

  async saveMqttPayload(data: any) {
    try {
      // Ambil JWT dan device_id dari payload MQTT
      const { device_id, jwt: token } = data;
      if (!device_id || !token)
        throw new Error("device_id atau jwt tidak ada di payload");

      // Verifikasi JWT dan dekripsi AES (gunakan fungsi yang sama seperti HTTP)
      const decrypted = await this.verifyDeviceJWTAndDecrypt({
        jwt: this.jwtInstance,
        device_id,
        token,
      });

      // STEP 1: Simpan raw data untuk backup dan debugging
      const [rawResult] = await this.db.query<ResultSetHeader>(
        `INSERT INTO raw_payloads (device_id, raw_data, parsed_at)
        VALUES (?, ?, NOW())`,
        [device_id, JSON.stringify({ ...decrypted, protocol: 'mqtt', topic: data.topic || 'unknown' })]
      );
      
      // STEP 2: Parse dan normalisasi data ke tabel payloads
      const normalizedPayloads = await parseAndNormalizePayload(
        this.db,
        Number(device_id), 
        decrypted, 
        rawResult.insertId
      );
      
      // STEP 3: Broadcast real-time data ke user pemilik device
      await broadcastSensorUpdates(this.db, broadcastToUsers, Number(device_id), decrypted, "mqtt");
      
      // STEP 4: Check alarms setelah payload disimpan (sama seperti HTTP)
      if (this.alarmNotificationService) {
        await this.alarmNotificationService.checkAlarms(Number(device_id), decrypted);
      }

      return rawResult.insertId;
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
        // console.log(`📡 Menerima payload MQTT dari topik ${topic}:`, data);
        
        // Tambahkan informasi topic ke data untuk debugging
        const dataWithTopic = { ...data, topic };
        await this.saveMqttPayload(dataWithTopic);
        
        // console.log(
        //   `✅ Berhasil menyimpan data sensor MQTT pada topik ${topic} ke database.`
        // );
      } catch (error) {
        console.error(`❌ Gagal memproses pesan MQTT dari topik ${topic}:`, error);
      }
    });

    this.mqttClient.on("offline", () => {
      console.log("⚠️  MQTT client offline");
    });

    // Optional: Periodic sync setiap 5 menit untuk memastikan consistency
    // setInterval(async () => {
    //   const topicManager = this.deviceService?.getMQTTTopicManager();
    //   if (topicManager) {
    //     try {
    //       await topicManager.syncSubscriptions(
    //         (topic: string) => {
    //           this.mqttClient.subscribe(topic, (err) => {
    //             if (!err) {
    //               console.log(`✅ Sync: Subscribed to topic: ${topic}`);
    //             } else {
    //               console.error(`❌ Sync: Failed to subscribe to topic: ${topic}`, err);
    //             }
    //           });
    //         },
    //         (topic: string) => {
    //           this.mqttClient.unsubscribe(topic, (err) => {
    //             if (!err) {
    //               console.log(`✅ Sync: Unsubscribed from topic: ${topic}`);
    //             } else {
    //               console.error(`❌ Sync: Failed to unsubscribe from topic: ${topic}`, err);
    //             }
    //           });
    //         }
    //       );
    //     } catch (error) {
    //       console.error("❌ MQTT topic sync error:", error);
    //     }
    //   }
    // }, 5 * 60 * 1000); // 5 minutes
  }
}

/**
 * ===== MQTT SERVICE =====
 * Service untuk mengelola komunikasi MQTT dengan IoT devices
 * Menangani receive data dari devices dan forward ke sistem
 *
 * Fitur utama:
 * - MQTT client management dan connection handling
 * - Topic subscription/unsubscription management
 * - JWT verification dan AES decryption untuk security
 * - Real-time data processing dan normalization
 * - WebSocket broadcasting untuk frontend updates
 * - Alarm checking setelah data diterima
 * - Device status monitoring integration
 */
import { MQTTClient } from "../lib/middleware";
import { Pool, ResultSetHeader } from "mysql2/promise";
import {
  verifyDeviceJWTAndDecrypt,
  parseAndNormalizePayload,
  broadcastSensorUpdates,
  extractDeviceIdFromJWT,
} from "../lib/utils";
import { DeviceService } from "./DeviceService";
import { AlarmNotificationService } from "./AlarmNotificationService";
import { DeviceStatusService } from "./DeviceStatusService";
import { broadcastToUsersByDevice } from "../api/ws/user-ws";

export class MQTTService {
  private mqttClient: ReturnType<typeof MQTTClient.getInstance>;
  private db: Pool;
  private deviceService!: DeviceService;
  private alarmNotificationService?: AlarmNotificationService;
  private deviceStatusService?: DeviceStatusService;

  constructor(
    db: Pool,
    alarmNotificationService?: AlarmNotificationService,
    deviceStatusService?: DeviceStatusService
  ) {
    this.db = db;
    this.mqttClient = MQTTClient.getInstance();
    this.alarmNotificationService = alarmNotificationService;
    this.deviceStatusService = deviceStatusService;
  }

  // Setter untuk deviceService (dipanggil dari server.ts setelah deviceService dibuat)
  setDeviceService(deviceService: DeviceService) {
    this.deviceService = deviceService;
  }

  // ===== SUBSCRIBE TOPIC =====
  // Subscribe ke MQTT topic tertentu
  subscribeTopic(topic: string) {
    this.mqttClient.subscribe(topic, (err) => {
      if (!err) {
        console.log(`✅ Berhasil subscribe topik: ${topic}`);
      } else {
        console.error(`❌ Gagal subscribe topik: ${topic}`, err);
      }
    });
  }

  // ===== UNSUBSCRIBE TOPIC =====
  // Unsubscribe dari MQTT topic tertentu
  unSubscribeTopic(topic: string) {
    this.mqttClient.unsubscribe(topic, (err) => {
      if (!err) {
        console.log(`✅ Berhasil unsubscribe topik: ${topic}`);
      } else {
        console.error(`❌ Gagal unsubscribe topik: ${topic}`, err);
      }
    });
  }

  // ===== SUBSCRIBE ALL DEVICE TOPICS =====
  // Subscribe ke semua topic aktif dari devices
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
    device_id,
    token,
  }: {
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
      console.log(`📡 [MQTT PAYLOAD] Memulai proses penyimpanan payload MQTT`);
      console.log(`📊 [MQTT PAYLOAD] Data yang diterima:`, data);

      // Ambil JWT dan device_id dari payload MQTT
      let { device_id, jwt: token } = data;
      if (!token) {
        console.error(
          `❌ [MQTT PAYLOAD] device_id atau jwt tidak ada di payload`
        );
        throw new Error("device_id atau jwt tidak ada di payload");
      }

      // Atau ambil dari payload JWT
      if (!device_id) {
        console.log(
          `🔍 [MQTT PAYLOAD] Device ID tidak ada, mengekstrak dari JWT...`
        );
        device_id = extractDeviceIdFromJWT(token);
        if (!device_id) {
          console.error(
            `❌ [MQTT PAYLOAD] Device ID tidak ditemukan di payload atau JWT token`
          );
          throw new Error(
            "Device ID tidak ditemukan di payload atau JWT token"
          );
        }
        console.log(
          `✅ [MQTT PAYLOAD] Device ID berhasil diekstrak dari JWT: ${device_id}`
        );
      }

      console.log(
        `🔐 [MQTT PAYLOAD] Memulai verifikasi JWT dan dekripsi untuk device: ${device_id}`
      );

      // Verifikasi JWT dan dekripsi AES (gunakan fungsi yang sama seperti HTTP)
      const decrypted = await this.verifyDeviceJWTAndDecrypt({
        device_id,
        token,
      });

      console.log(
        `✅ [MQTT PAYLOAD] JWT berhasil diverifikasi dan data didekripsi`
      );
      console.log(`📊 [MQTT PAYLOAD] Data hasil dekripsi:`, decrypted);

      // STEP 1: Simpan raw data untuk backup dan debugging
      console.log(`💾 [MQTT PAYLOAD] Menyimpan raw data ke database...`);
      const [rawResult] = await this.db.query<ResultSetHeader>(
        `INSERT INTO raw_payloads (device_id, raw_data, parsed_at)
        VALUES (?, ?, NOW())`,
        [
          device_id,
          JSON.stringify({
            ...decrypted,
            protocol: "mqtt",
            topic: data.topic || "unknown",
          }),
        ]
      );

      console.log(
        `✅ [MQTT PAYLOAD] Raw payload berhasil disimpan dengan ID: ${rawResult.insertId}`
      );

      // STEP 2: Parse dan normalisasi data ke tabel payloads
      console.log(`🔄 [MQTT PAYLOAD] Memulai parsing dan normalisasi data...`);
      const normalizedPayloads = await parseAndNormalizePayload(
        this.db,
        Number(device_id),
        decrypted,
        rawResult.insertId
      );

      console.log(
        `✅ [MQTT PAYLOAD] Berhasil memproses ${
          normalizedPayloads.length
        } pembacaan sensor ke database - Timestamp: ${Date.now()} ms`
      );

      // STEP 3: Broadcast real-time data ke user pemilik device
      console.log(`📡 [MQTT PAYLOAD] Mengirim data real-time ke WebSocket...`);
      await broadcastSensorUpdates(
        this.db,
        broadcastToUsersByDevice,
        Number(device_id),
        decrypted,
        "mqtt"
      );
      console.log(`✅ [MQTT PAYLOAD] Data real-time berhasil dikirim`);

      // STEP 4: Update device status to online (real-time)
      if (this.deviceStatusService) {
        console.log(
          `⏰ [MQTT PAYLOAD] Memperbarui status device terakhir dilihat...`
        );
        await this.deviceStatusService.updateDeviceLastSeen(Number(device_id));
        console.log(`✅ [MQTT PAYLOAD] Status device berhasil diperbarui`);
      }

      // STEP 5: Check alarms setelah payload disimpan (sama seperti HTTP)
      if (this.alarmNotificationService) {
        console.log(
          `🚨 [MQTT PAYLOAD] Memeriksa kondisi alarm untuk device ${device_id}...`
        );
        await this.alarmNotificationService.checkAlarms(
          Number(device_id),
          decrypted
        );
        console.log(`✅ [MQTT PAYLOAD] Pemeriksaan alarm selesai`);
      }

      console.log(
        `🎉 [MQTT PAYLOAD] Semua proses MQTT payload berhasil diselesaikan untuk device ${device_id}`
      );
      return rawResult.insertId;
    } catch (error) {
      console.error(
        "❌ [MQTT PAYLOAD] Error dalam menyimpan MQTT payload:",
        error
      );
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
        const timestamp = Math.floor(Date.now() / 1000);
        console.log(`Timestamp saat payload diterima di server: ${timestamp}`);
        console.log(`📥 [MQTT] Menerima pesan dari topik: ${topic}`);
        console.log(`📊 [MQTT] Raw message:`, message.toString());

        const data = JSON.parse(message.toString());
        console.log(`✅ [MQTT] Pesan berhasil diparsing:`, data);

        // Tambahkan informasi topic ke data untuk debugging
        const dataWithTopic = { ...data, topic };
        await this.saveMqttPayload(dataWithTopic);

        console.log(
          `🎉 [MQTT] Berhasil menyimpan data sensor MQTT dari topik ${topic} ke database`
        );
      } catch (error) {
        console.error(
          `❌ [MQTT] Gagal memproses pesan MQTT dari topik ${topic}:`,
          error
        );
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

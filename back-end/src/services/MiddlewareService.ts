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
import { Pool, ResultSetHeader, FieldPacket } from "mysql2/promise";
import {
  verifyDeviceJWTAndDecrypt,
  parseAndNormalizePayload,
  broadcastSensorUpdates,
  extractDeviceIdFromJWT,
} from "../lib/utils";
import { DeviceService } from "./DeviceService";
import { NotificationService } from "./NotificationService";
import { DeviceStatusService } from "./DeviceStatusService";
import { broadcastToDeviceOwner } from "../api/ws/user-ws";

export class MQTTService {
  private mqttClient: ReturnType<typeof MQTTClient.getInstance>;
  private db: Pool;
  private deviceService!: DeviceService;
  private notificationService?: NotificationService;
  private deviceStatusService?: DeviceStatusService;

  constructor(
    db: Pool,
    notificationService?: NotificationService,
    deviceStatusService?: DeviceStatusService
  ) {
    this.db = db;
    this.mqttClient = MQTTClient.getInstance();
    this.notificationService = notificationService;
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

  async publishResponse(topic: string,responseData: any) {
    try {
      const responseMessage = JSON.stringify({
        ...responseData,
        serverTimestamp: Math.floor(Date.now()),
      });

      console.log(`📤 [MQTT RESPONSE] Mengirim respons ke topik: ${topic}`);

      this.mqttClient.publish(topic, responseMessage, { 
        retain: false,
        qos: 1,
      }, (err) => {
        if (!err) {
          console.log(`✅ [MQTT RESPONSE] Respons berhasil dikirim ke ${topic}`);
        } else {
          console.error(`❌ [MQTT RESPONSE] Gagal mengirim respons ke topik ${topic}:`, err);
        }
      });

    } catch (error) {
      console.error(`❌ [MQTT RESPONSE] Error dalam mengirim respons:`, error);
    }
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
      const [devices] = await (this.db as any).safeQuery(
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
      throw new Error("DeviceService belum diinisialisasi");
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
      
      const { jwt: token } = data;
      
      if (!token) {
        console.error(`❌ [MQTT PAYLOAD] JWT token tidak ada di payload`);
        throw new Error("JWT token tidak ada di payload");
      }

      // Ekstrak device_id dari JWT payload
      console.log(`🔍 [MQTT PAYLOAD] Mengekstrak device_id dari JWT...`);
      let device_id;
      try {
        device_id = extractDeviceIdFromJWT(token);
        if (!device_id) {
          throw new Error("Device ID tidak ditemukan di JWT token (sub field)");
        }
        console.log(`✅ [MQTT PAYLOAD] Device ID berhasil diekstrak: ${device_id}`);
      } catch (extractError) {
        console.error(`❌ [MQTT PAYLOAD] Gagal mengekstrak device_id dari JWT:`, extractError);
        const errorMessage = extractError instanceof Error ? extractError.message : 'Unknown error';
        throw new Error(`Gagal mengekstrak device_id dari JWT: ${errorMessage}`);
      }

      console.log(`🔐 [MQTT PAYLOAD] Memulai verifikasi JWT dan dekripsi untuk device: ${device_id}`);
      
      // Verifikasi JWT dan dekripsi AES
      const verificationResult = await this.verifyDeviceJWTAndDecrypt({
        device_id,
        token,
      });

      console.log(`✅ [MQTT PAYLOAD] JWT berhasil diverifikasi dan data didekripsi`);

      // STEP 1: Simpan raw data untuk backup dan debugging
      console.log(`💾 [MQTT PAYLOAD] Menyimpan raw data ke database...`);
      const [rawResult] = await (this.db as any).safeQuery(
        `INSERT INTO raw_payloads (device_id, raw_data, parsed_at)
        VALUES (?, ?, NOW())`,
        [
          device_id,
          JSON.stringify({
            ...verificationResult.decryptedData,
            protocol: "mqtt",
            topic: data.topic || "unknown",
          }),
        ]
      ) as [ResultSetHeader, FieldPacket[]];

      console.log(`✅ [MQTT PAYLOAD] Raw payload berhasil disimpan dengan ID: ${rawResult.insertId}`);

      // STEP 2: Parse dan normalisasi data ke tabel payloads
      console.log(`🔄 [MQTT PAYLOAD] Memulai parsing dan normalisasi data...`);
      const normalizedPayloads = await parseAndNormalizePayload(
        this.db,
        Number(device_id),
        verificationResult.decryptedData,
        rawResult.insertId,
        verificationResult.jwtPayload
      );

      console.log(`✅ [MQTT PAYLOAD] Berhasil memproses ${normalizedPayloads.length} pembacaan sensor ke database`);

      // STEP 3: Broadcast real-time data ke user pemilik device
      console.log(`📡 [MQTT PAYLOAD] Mengirim data real-time ke WebSocket...`);
      await broadcastSensorUpdates(
        this.db,
        broadcastToDeviceOwner,
        Number(device_id),
        verificationResult.decryptedData,
        "mqtt",
        verificationResult.jwtPayload.type || "none" // Tambahkan variabel type pada saat membuat JWT untuk menentukan sifat data (realtime / pending)
      );
      console.log(`✅ [MQTT PAYLOAD] Data real-time berhasil dikirim`);

      // STEP 4: Update device status to online dan last_seen_at (real-time)
      if (this.deviceStatusService) {
        console.log(`⏰ [MQTT PAYLOAD] Memperbarui status device ke online dan timestamp...`);
        // Update status ke online DAN last_seen_at sekaligus
        await this.deviceStatusService.updateDeviceStatusOnly(device_id, "online");
        await this.deviceStatusService.updateDeviceLastSeen(Number(device_id));
        console.log(`✅ [MQTT PAYLOAD] Device ${device_id} status updated to online`);
        
        // Broadcast status online ke user pemilik device untuk real-time update
        await broadcastToDeviceOwner(this.db, Number(device_id), {
          type: "status_update",
          device_id: Number(device_id),
          status: "online",
          last_seen: new Date().toISOString(),
        });
      }

      // STEP 5: Check alarms setelah payload disimpan
      if (this.notificationService) {
        console.log(`🚨 [MQTT PAYLOAD] Memeriksa kondisi alarm untuk device ${device_id}...`);
        await this.notificationService.checkAlarms(
          Number(device_id),
          verificationResult.decryptedData
        );
        console.log(`✅ [MQTT PAYLOAD] Pemeriksaan alarm selesai`);
      }
      
      return rawResult.insertId;
    } catch (error) {
      console.error("❌ [MQTT PAYLOAD] Error dalam menyimpan MQTT payload:", error);
      throw new Error("Gagal menyimpan MQTT payload");
    }
  }

  listen() {
    this.mqttClient.on("connect", async () => {
      console.log("✅ Berhasil terkoneksi ke MQTT broker");
      await this.subscribeAllDeviceTopics();
    });

    this.mqttClient.on("message", async (topic, message) => {
      const timestamp = Math.floor(Date.now());
      try {
        console.log(`📥 [MQTT] Menerima pesan dari topik: ${topic} - Timestamp server: ${timestamp}`);

        const messageStr = message.toString().trim();
        let data: any;

        // Cek apakah payload adalah JWT token langsung atau JSON object
        if (messageStr.startsWith('eyJ') && messageStr.includes('.')) {
          // Payload adalah JWT token langsung
          console.log(`🔐 [MQTT] Payload adalah JWT token langsung`);
          data = { jwt: messageStr, topic: topic };
        } else {
          // Payload adalah JSON object
          try {
            data = JSON.parse(messageStr);
            data.topic = topic; // Tambahkan topic information
            
            // FILTER: Abaikan respons server untuk mencegah infinite loop
            if (data.status && (data.status === 'success' || data.status === 'failed') && data.serverTimestamp) {
              console.log(`🔄 [MQTT] Mengabaikan respons server dari topik ${topic}`);
              return; // Skip processing respons server
            }
            
            console.log(`✅ [MQTT] Pesan berhasil diparsing sebagai JSON`);
          } catch (parseError) {
            console.error(`❌ [MQTT] Gagal parsing JSON payload:`, parseError);
            const errorMessage = parseError instanceof Error ? parseError.message : 'Kesalahan parsing yang tidak diketahui';
            throw new Error(`Format payload tidak valid: ${errorMessage}`);
          }
        }

        // Proses payload MQTT (device_id sekarang selalu dari JWT sub field)
        const insertId = await this.saveMqttPayload(data);

        // Kirim respons balik ke ESP setelah berhasil menyimpan
        await this.publishResponse(topic, {
          status: "success",
          message: "Payload berhasil disimpan dan diproses",
          data: {
            insertId: insertId,
            processedAt: new Date().toISOString(),
            timestamp: timestamp
          }
        });

        console.log(`🎉 [MQTT] Berhasil memproses payload dari topik ${topic}`);

      } catch (error) {
        // Kirim respons error balik ke ESP
        await this.publishResponse(topic, {
          status: "failed",
          message: "Gagal memproses payload",
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: timestamp
        });

        console.error(
          `❌ [MQTT] Gagal memproses pesan MQTT dari topik ${topic}:`,
          error
        );
      }
    });

    this.mqttClient.on("offline", () => {
      console.log("⚠️  Klien MQTT offline");
    });

    // Optional: Cek penggunaan topik setiap 5 menit
    setInterval(async () => {
      const topicManager = this.deviceService?.getMQTTTopicManager();
      if (topicManager) {
        try {
          await topicManager.syncSubscriptions(
            (topic: string) => {
              this.mqttClient.subscribe(topic, (err) => {
                if (!err) {
                  console.log(`✅ Sinkronisasi: Berhasil subscribe topik: ${topic}`);
                } else {
                  console.error(`❌ Sinkronisasi: Gagal subscribe topik: ${topic}`, err);
                }
              });
            },
            (topic: string) => {
              this.mqttClient.unsubscribe(topic, (err) => {
                if (!err) {
                  console.log(`✅ Sinkronisasi: Berhasil unsubscribe topik: ${topic}`);
                } else {
                  console.error(`❌ Sinkronisasi: Gagal unsubscribe topik: ${topic}`, err);
                }
              });
            }
          );
        } catch (error) {
          console.error("❌ Kesalahan sinkronisasi topik MQTT:", error);
        }
      }
    }, 5 * 60 * 1000); // 5 minutes
  }
}

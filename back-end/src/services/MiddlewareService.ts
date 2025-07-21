import { MQTTClient } from "../lib/middleware";
import { Pool, ResultSetHeader } from "mysql2/promise";
import { decryptAES } from "../lib/utils";
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

    // Ambil secret dari database
    const devices = await this.deviceService.getDeviceById(device_id);
    //@ts-ignore
    if (!devices || devices.length === 0) {
      throw new Error("Device tidak terdaftar");
    }
    
    //@ts-ignore
    const device = devices[0]; // getDeviceById returns array
    const secret = device.new_secret;
    if (!secret) throw new Error("Device secret tidak valid");

    // Manual JWT verification with device-specific secret (same as PayloadService)
    try {
      // console.log("🔍 MQTT: Starting JWT verification...");
      // console.log("🔑 MQTT: Device secret:", secret);
      // console.log("🎫 MQTT: Token:", token);
      
      const [header, payload, signature] = token.split('.');
      
      if (!header || !payload || !signature) {
        throw new Error("Invalid JWT format");
      }
      
      // console.log("📋 MQTT: JWT parts:", { header, payload, signature });
      
      // Verify signature
      const data = `${header}.${payload}`;
      const expectedSignature = crypto.createHmac('sha256', secret).update(data).digest('base64url');
      
      // console.log("🔍 MQTT: Expected signature:", expectedSignature);
      // console.log("🔍 MQTT: Received signature:", signature);
      
      if (signature !== expectedSignature) {
        throw new Error("JWT signature verification failed");
      }
      
      // Decode payload
      let decodedPayload;
      try {
        decodedPayload = JSON.parse(Buffer.from(payload, 'base64url').toString());
      } catch (decodeError) {
        throw new Error("Failed to decode JWT payload");
      }
      
      // Check expiration
      if (decodedPayload.exp && Date.now() / 1000 > decodedPayload.exp) {
        throw new Error("JWT token expired");
      }
      
      if (!decodedPayload.encryptedData) {
        throw new Error("Missing encryptedData in JWT payload");
      }
      
      // console.log("✅ MQTT: JWT verified successfully with device secret");
      // console.log("📦 MQTT: Encrypted data:", decodedPayload.encryptedData);
      
      // Handle different encryption methods
      let decrypted;
      try {
        // Method 1: Try parsing as JSON directly (for CustomJWT)
        decrypted = JSON.parse(decodedPayload.encryptedData);
        // console.log("📦 (MQTT) Berhasil mem-parsing payload CustomJWT langsung");
      } catch (parseError) {
        try {
          // Method 2: Try Base64 decoding (for non-AES testing)
          const base64Decoded = Buffer.from(decodedPayload.encryptedData, 'base64').toString('utf8');
          decrypted = JSON.parse(base64Decoded);
          // console.log("📦 (MQTT) Berhasil mem-parsing payload dengan Base64 decoding");
        } catch (base64Error) {
          // Method 3: Fallback to AES decryption (for production devices)
          // console.log("🔄 (MQTT) Mencoba menggunakan metode dekripsi AES");
          try {
            const aesDecrypted = decryptAES(crypto, decodedPayload.encryptedData, secret);
            decrypted = JSON.parse(aesDecrypted);
            // console.log("✅ (MQTT) Berhasil mem-parsing payload dengan dekripsi AES");
          } catch (aesError) {
            console.error("❌ MQTT: Semua metode dekripsi gagal");
            console.error("   - Direct JSON parse:", parseError);
            console.error("   - Base64 decode:", base64Error);
            console.error("   - AES decrypt:", aesError);
            throw new Error(`All decryption methods failed. Data format not recognized.`);
          }
        }
      }
      
      return decrypted;
      
    } catch (error) {
      console.error("MQTT JWT verification failed:", error);
      // Return more specific error for debugging
      throw new Error(`Payload tidak valid: ${error instanceof Error ? error.message : String(error)}`);
    }
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
      const normalizedPayloads = await this.parseAndNormalizePayload(
        Number(device_id), 
        decrypted, 
        rawResult.insertId
      );
      
      // STEP 3: Broadcast real-time data ke user pemilik device
      await this.broadcastSensorUpdates(Number(device_id), decrypted);
      
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

  // SIMPLE MQTT parsing - use existing datastream structure  
  private async parseAndNormalizePayload(
    deviceId: number, 
    rawData: any, 
    rawPayloadId: number
  ): Promise<number[]> {
    try {
      // Ambil datastreams yang ada untuk device ini
      const [datastreams]: any = await this.db.query(
        `SELECT id, pin, type, unit FROM datastreams WHERE device_id = ?`,
        [deviceId]
      );
      
      const insertedIds: number[] = [];
      
      // Parse setiap pin di raw data
      for (const [pin, value] of Object.entries(rawData)) {
        if (typeof value === 'number' && pin !== 'timestamp' && pin !== 'device_id') {
          
          // Cari datastream yang cocok dengan pin
          const datastream = datastreams.find((ds: any) => ds.pin === pin);
          
          if (datastream) {
            try {
              // Insert ke tabel payloads yang sudah ada
              const [result] = await this.db.query<ResultSetHeader>(
                `INSERT INTO payloads (device_id, datastream_id, value, raw_data, server_time)
                VALUES (?, ?, ?, ?, NOW())`,
                [
                  deviceId, 
                  datastream.id, 
                  value,
                  JSON.stringify({ 
                    raw_payload_id: rawPayloadId, 
                    pin, 
                    value, 
                  })
                ]
              );
              
              insertedIds.push(result.insertId);
              // console.log(`📊 Berhasil menyimpan payload MQTT pada database.`);
              
            } catch (error) {
              console.error(`Error saving MQTT sensor data for pin ${pin}:`, error);
            }
          } else {
            console.warn(`⚠️ MQTT: No datastream found for pin ${pin}`);
          }
        }
      }
      return insertedIds;
      
    } catch (error) {
      console.error("Error parsing and normalizing MQTT payload:", error);
      throw error;
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

  // Real-time broadcasting method for MQTT
  private async broadcastSensorUpdates(deviceId: number, rawData: any) {
    try {
      // Get device info and owner
      const [deviceRows]: any = await this.db.query(
        `SELECT d.id, d.description as device_name, d.user_id, u.name as user_name
         FROM devices d 
         LEFT JOIN users u ON d.user_id = u.id 
         WHERE d.id = ?`,
        [deviceId]
      );

      if (!deviceRows.length) {
        console.warn(`MQTT: Device ${deviceId} not found for broadcasting`);
        return;
      }

      const device = deviceRows[0];
      
      // Get datastreams for this device to map pin data
      const [datastreams]: any = await this.db.query(
        `SELECT id, pin, description, unit, type FROM datastreams WHERE device_id = ?`,
        [deviceId]
      );

      // Broadcast each sensor value with datastream info
      for (const [pin, value] of Object.entries(rawData)) {
        if (typeof value === 'number' && pin !== 'timestamp' && pin !== 'device_id') {
          const datastream = datastreams.find((ds: any) => ds.pin === pin);
          
          if (datastream) {
            // Broadcast real-time sensor update to all users (akan difilter oleh frontend berdasarkan user_id)
            broadcastToUsers({
              type: "sensor_update",
              device_id: deviceId,
              datastream_id: datastream.id,
              value: value,
              timestamp: new Date().toISOString(),
              device_name: device.device_name,
              sensor_name: datastream.description,
              unit: datastream.unit,
              user_id: device.user_id, // Frontend akan filter berdasarkan ini
              pin: pin,
              protocol: "mqtt"
            });
            
            // console.log(`📡 MQTT: Broadcasted sensor update: Device ${deviceId} → Pin ${pin} → Value ${value}`);
          }
        }
      }
    } catch (error) {
      console.error("MQTT: Error broadcasting sensor updates:", error);
      // Don't throw error to avoid breaking payload saving
    }
  }
}

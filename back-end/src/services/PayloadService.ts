import { Pool, ResultSetHeader } from "mysql2/promise";
import { DeviceService } from "./DeviceService";
import { AlarmNotificationService } from "./AlarmNotificationService";
import { broadcastToUsers } from "../api/ws/user-ws";
import { decryptAES } from "../lib/utils";
import crypto from "crypto";

export class PayloadService {
  private db: Pool;
  private deviceService: DeviceService;
  private alarmNotificationService?: AlarmNotificationService;

  constructor(
    db: Pool, 
    deviceService: DeviceService, 
    alarmNotificationService?: AlarmNotificationService
  ) {
    this.db = db;
    this.deviceService = deviceService;
    this.alarmNotificationService = alarmNotificationService;
  }

  // Fungsi verifikasi JWT dan dekripsi payload
  async verifyDeviceJWTAndDecrypt({
    jwt,
    deviceId,
    token,
  }: {
    jwt: any;
    deviceId: string;
    token: string;
  }) {
    // Ambil secret dari database
    const devices = await this.deviceService.getDeviceById(deviceId);
    //@ts-ignore
    if (!devices || devices.length === 0) {
      throw new Error("Device tidak terdaftar");
    }
    
    //@ts-ignore
    const device = devices[0]; // getDeviceById returns array
    const secret = device.new_secret;
    if (!secret) throw new Error("Device secret tidak valid");

    // Manual JWT verification with device-specific secret
    try {
      console.log("🔍 Starting JWT verification...");
      console.log("🔑 Device secret:", secret);
      console.log("🎫 Token:", token);
      
      const [header, payload, signature] = token.split('.');
      
      if (!header || !payload || !signature) {
        throw new Error("Invalid JWT format");
      }
      
      console.log("📋 JWT parts:", { header, payload, signature });
      
      // Verify signature
      const data = `${header}.${payload}`;
      const expectedSignature = crypto.createHmac('sha256', secret).update(data).digest('base64url');
      
      console.log("🔍 Expected signature:", expectedSignature);
      console.log("🔍 Received signature:", signature);
      
      if (signature !== expectedSignature) {
        throw new Error("Invalid JWT signature");
      }
      
      // Decode payload
      let decodedPayload;
      try {
        decodedPayload = JSON.parse(Buffer.from(payload, 'base64url').toString());
        console.log("📋 Decoded JWT payload:", decodedPayload);
      } catch (decodeError) {
        console.error("❌ Failed to decode JWT payload:", decodeError);
        throw new Error("Invalid JWT payload encoding");
      }
      
      // Check expiration
      if (decodedPayload.exp && Date.now() / 1000 > decodedPayload.exp) {
        throw new Error("JWT expired");
      }
      
      if (!decodedPayload.encryptedData) {
        throw new Error("Missing encryptedData in JWT");
      }
      
      console.log("✅ JWT verified successfully with device secret");
      console.log("📦 Encrypted data:", decodedPayload.encryptedData);
      
      // Karena CustomJWT mengirim data langsung sebagai "encryptedData"
      // kita akan parse langsung tanpa dekripsi AES tambahan
      let decrypted;
      try {
        // Coba parse sebagai JSON langsung (untuk CustomJWT)
        console.log("🔄 Trying to parse as direct JSON...");
        decrypted = JSON.parse(decodedPayload.encryptedData);
        console.log("📦 CustomJWT payload parsed successfully:", decrypted);
      } catch (parseError) {
        console.log("Parse error, trying base64 decode:", parseError);
        try {
          // Coba decode base64 dulu
          console.log("🔄 Trying base64 decode...");
          const decodedData = Buffer.from(decodedPayload.encryptedData, 'base64').toString();
          console.log("📄 Base64 decoded string:", decodedData);
          decrypted = JSON.parse(decodedData);
          console.log("📦 Base64 decoded payload:", decrypted);
        } catch (base64Error) {
          console.log("Base64 decode failed:", base64Error);
          // Fallback ke AES decryption untuk backward compatibility
          console.log("🔄 Falling back to AES decryption");
          try {
            const decryptedString = decryptAES(crypto, decodedPayload.encryptedData, secret);
            console.log("📦 AES decrypted payload:", decryptedString);
            decrypted = JSON.parse(decryptedString);
            console.log("📦 AES parsed JSON:", decrypted);
          } catch (aesError) {
            console.error("❌ All decryption methods failed:", aesError);
            throw new Error("Unable to decrypt payload data");
          }
        }
      }
      
      return decrypted;
      
    } catch (error) {
      console.error("JWT verification failed:", error);
      // Return more specific error for debugging
      throw new Error(`Payload tidak valid: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async saveHttpPayload({
    deviceId,
    decrypted,
  }: {
    deviceId: string | number;
    decrypted: any;
  }): Promise<number> {
    try {
      // STEP 1: Simpan raw data untuk backup dan debugging
      const [rawResult] = await this.db.query<ResultSetHeader>(
        `INSERT INTO raw_payloads (device_id, raw_data, parsed_at)
        VALUES (?, ?, NOW())`,
        [deviceId, JSON.stringify(decrypted)]
      );
      
      console.log(`📥 Raw payload saved with ID: ${rawResult.insertId}`);
      
      // STEP 2: Parse dan normalisasi data ke tabel payloads
      const normalizedPayloads = await this.parseAndNormalizePayload(
        Number(deviceId), 
        decrypted, 
        rawResult.insertId
      );
      
      console.log(`✅ Parsed ${normalizedPayloads.length} sensor readings`);

      // STEP 3: Broadcast real-time data ke user pemilik device
      await this.broadcastSensorUpdates(Number(deviceId), decrypted);

      // STEP 4: Check alarms setelah payload disimpan
      if (this.alarmNotificationService) {
        console.log(`🔍 Checking alarms for device ${deviceId}`);
        await this.alarmNotificationService.checkAlarms(Number(deviceId), decrypted);
      }

      return rawResult.insertId;
    } catch (error) {
      console.error("Error saving HTTP payload:", error);
      throw new Error("Failed to save HTTP payload");
    }
  }

  // SIMPLE parsing - gunakan existing datastream structure
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
                  JSON.stringify({ raw_payload_id: rawPayloadId, pin, value })
                ]
              );
              insertedIds.push(result.insertId);
              
              console.log(`📊 Sensor data saved: Pin ${pin} → Value ${value} ${datastream.unit}`);
              
            } catch (error) {
              console.error(`Error saving sensor data for pin ${pin}:`, error);
            }
          } else {
            console.warn(`⚠️ No datastream found for pin ${pin}`);
          }
        }
      }
      
      return insertedIds;
    } catch (error) {
      console.error("Error in parseAndNormalizePayload:", error);
      throw new Error("Failed to parse and normalize payload");
    }
  }

  async getAll() {
    try {
      // Gunakan view untuk data yang sudah joined  
      const [rows] = await this.db.query("SELECT * FROM dashboard_sensor_data ORDER BY recorded_at DESC");
      return rows;
    } catch (error) {
      console.error("Error fetching all payloads:", error);
      throw new Error("Failed to fetch payloads");
    }
  }

  async getByDeviceId(device_id: string) {
    try {
      // Query data ternormalisasi dengan informasi sensor
      const [rows] = await this.db.query(
        `SELECT 
          p.id, p.device_id, p.datastream_id, p.value, p.server_time,
          ds.description as sensor_name, ds.pin, ds.unit, ds.type
        FROM payloads p
        LEFT JOIN datastreams ds ON p.datastream_id = ds.id 
        WHERE p.device_id = ? 
        ORDER BY p.server_time DESC`,
        [device_id]
      );
      return rows;
    } catch (error) {
      console.error("Error fetching payloads by device ID:", error);
      throw new Error("Failed to fetch payloads");
    }
  }

  async getByDeviceAndDatastream(device_id: string, datastream_id: string) {
    try {
      // Query untuk widget dashboard - data sensor spesifik
      const [rows] = await this.db.query(
        `SELECT 
          p.id, p.device_id, p.datastream_id, p.value, p.server_time,
          ds.description as sensor_name, ds.pin, ds.unit, ds.type,
          ds.min_value, ds.max_value
        FROM payloads p
        LEFT JOIN datastreams ds ON p.datastream_id = ds.id 
        WHERE p.device_id = ? AND p.datastream_id = ?
        ORDER BY p.server_time DESC 
        LIMIT 100`, // Limit untuk performa
        [device_id, datastream_id]
      );
      return rows;
    } catch (error) {
      console.error("Error fetching payloads by device and datastream:", error);
      throw new Error("Failed to fetch payloads");
    }
  }

  // Fungsi untuk mendapatkan data widget menggunakan view
  async getWidgetData(widget_id: string) {
    try {
      const [rows]: any = await this.db.query(
        `SELECT * FROM widget_data WHERE widget_id = ?`,
        [widget_id]
      );
      return rows[0]; // Single widget data
    } catch (error) {
      console.error("Error fetching widget data:", error);
      throw new Error("Failed to fetch widget data");
    }
  }

  // Fungsi untuk mendapatkan time series data untuk chart
  async getTimeSeriesData(device_id: string, datastream_id: string, timeRange: string = '24h') {
    try {
      let timeCondition = '';
      switch (timeRange) {
        case '1m': timeCondition = 'AND p.server_time >= NOW() - INTERVAL 1 MINUTE'; break;
        case '1h': timeCondition = 'AND p.server_time >= NOW() - INTERVAL 1 HOUR'; break;
        case '6h': timeCondition = 'AND p.server_time >= NOW() - INTERVAL 6 HOUR'; break;
        case '12h': timeCondition = 'AND p.server_time >= NOW() - INTERVAL 12 HOUR'; break;
        case '24h':
        case '1d': timeCondition = 'AND p.server_time >= NOW() - INTERVAL 1 DAY'; break;
        case '7d':
        case '1w': timeCondition = 'AND p.server_time >= NOW() - INTERVAL 7 DAY'; break;
        case '30d':
        case '1M': timeCondition = 'AND p.server_time >= NOW() - INTERVAL 30 DAY'; break;
        case '1y': timeCondition = 'AND p.server_time >= NOW() - INTERVAL 1 YEAR'; break;
        case 'all': timeCondition = ''; break; // Semua data
        default: timeCondition = 'AND p.server_time >= NOW() - INTERVAL 1 DAY';
      }

      const [rows] = await this.db.query(
        `SELECT 
          p.value, p.server_time,
          ds.unit, ds.description as sensor_name
        FROM payloads p
        LEFT JOIN datastreams ds ON p.datastream_id = ds.id 
        WHERE p.device_id = ? AND p.datastream_id = ? ${timeCondition}
        ORDER BY p.server_time ASC`,
        [device_id, datastream_id]
      );
      return rows;
    } catch (error) {
      console.error("Error fetching time series data:", error);
      throw new Error("Failed to fetch time series data");
    }
  }

  async saveLoraPayload(dev_eui: string, datastream_id: number, value: any) {
    try {
      // Cari device_id dari dev_eui
      const [devices]: any = await this.db.query(
        "SELECT id FROM devices WHERE dev_eui = ?",
        [dev_eui]
      );
      if (!devices.length) throw new Error("Device not found");
      
      const device_id = devices[0].id;
      
      // Simpan raw payload untuk LoRa juga
      const [rawResult] = await this.db.query<ResultSetHeader>(
        `INSERT INTO raw_payloads (device_id, raw_data, parsed_at)
        VALUES (?, ?, NOW())`,
        [device_id, JSON.stringify({ dev_eui, datastream_id, value, protocol: 'lora' })]
      );
      
      // Simpan ke payloads (normalized)
      const [result] = await this.db.query<ResultSetHeader>(
        `INSERT INTO payloads (device_id, datastream_id, value, raw_data, server_time)
        VALUES (?, ?, ?, ?, NOW())`,
        [
          device_id, 
          datastream_id, 
          value,
          JSON.stringify({ raw_payload_id: rawResult.insertId, protocol: 'lora', dev_eui })
        ]
      );
      
      console.log(`📡 LoRa payload saved: Device ${device_id} → Datastream ${datastream_id} → Value ${value}`);
      return result.insertId;
      
    } catch (error) {
      console.error("Error saving Lora payload:", error);
      throw error;
    }
  }

  // Real-time broadcasting method
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
        console.warn(`Device ${deviceId} not found for broadcasting`);
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
              pin: pin
            });
            
            console.log(`📡 Broadcasted sensor update: Device ${deviceId} → Pin ${pin} → Value ${value}`);
          }
        }
      }
    } catch (error) {
      console.error("Error broadcasting sensor updates:", error);
      // Don't throw error to avoid breaking payload saving
    }
  }
}

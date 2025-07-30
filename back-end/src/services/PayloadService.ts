import { Pool, ResultSetHeader } from "mysql2/promise";
import { DeviceService } from "./DeviceService";
import { AlarmNotificationService } from "./AlarmNotificationService";
import { DeviceStatusService } from "./DeviceStatusService";
import { broadcastToUsersByDevice } from "../api/ws/user-ws";
import { 
  verifyDeviceJWTAndDecrypt, 
  parseAndNormalizePayload, 
  broadcastSensorUpdates,
  validateAndNormalizeValue
} from "../lib/utils";

export class PayloadService {
  private db: Pool;
  private deviceService: DeviceService;
  private alarmNotificationService?: AlarmNotificationService;
  private deviceStatusService?: DeviceStatusService;

  constructor(
    db: Pool, 
    deviceService: DeviceService, 
    alarmNotificationService?: AlarmNotificationService,
    deviceStatusService?: DeviceStatusService
  ) {
    this.db = db;
    this.deviceService = deviceService;
    this.alarmNotificationService = alarmNotificationService;
    this.deviceStatusService = deviceStatusService;
  }

  // Fungsi verifikasi JWT dan dekripsi payload
  async verifyDeviceJWTAndDecrypt({
    deviceId,
    token,
  }: {
    deviceId: string;
    token: string;
  }) {
    return await verifyDeviceJWTAndDecrypt({
      deviceService: this.deviceService,
      deviceId,
      token,
    });
  }

  async saveHttpPayload({
    deviceId,
    decrypted,
  }: {
    deviceId: string | number;
    decrypted: any;
  }): Promise<number> {
    try {
      console.log(`📡 [HTTP PAYLOAD] Memulai proses penyimpanan payload untuk device ID: ${deviceId}`);
      console.log(`📊 [HTTP PAYLOAD] Data yang sudah didekripsi:`, decrypted);
      
      // STEP 1: Simpan raw data untuk backup dan debugging
      const [rawResult] = await this.db.query<ResultSetHeader>(
        `INSERT INTO raw_payloads (device_id, raw_data, parsed_at)
        VALUES (?, ?, NOW())`,
        [deviceId, JSON.stringify(decrypted)]
      );

      console.log(`� [DATABASE] Raw payload berhasil disimpan dengan ID: ${rawResult.insertId}`);
      
      // STEP 2: Parse dan normalisasi data ke tabel payloads
      console.log(`🔄 [PARSING] Memulai parsing dan normalisasi data sensor...`);
      const normalizedPayloads = await parseAndNormalizePayload(
        this.db,
        Number(deviceId), 
        decrypted, 
        rawResult.insertId
      );
      
      console.log(`✅ [PARSING] Berhasil memproses ${normalizedPayloads.length} sensor readings ke database`);

      // STEP 3: Broadcast real-time data ke user pemilik device
      console.log(`📡 [BROADCAST] Mengirim data real-time ke user via WebSocket...`);
      await broadcastSensorUpdates(this.db, broadcastToUsersByDevice, Number(deviceId), decrypted, "http");
      console.log(`✅ [BROADCAST] Data real-time berhasil dikirim ke WebSocket`);

      // STEP 4: Update device status to online (real-time)
      if (this.deviceStatusService) {
        console.log(`⏰ [DEVICE STATUS] Memperbarui status device terakhir dilihat...`);
        await this.deviceStatusService.updateDeviceLastSeen(Number(deviceId));
        console.log(`✅ [DEVICE STATUS] Status device berhasil diperbarui`);
      }

      // STEP 5: Check alarms setelah payload disimpan
      if (this.alarmNotificationService) {
        console.log(`� [ALARM] Memeriksa kondisi alarm untuk device ${deviceId}...`);
        await this.alarmNotificationService.checkAlarms(Number(deviceId), decrypted);
        console.log(`✅ [ALARM] Pemeriksaan alarm selesai`);
      }

      console.log(`🎉 [HTTP PAYLOAD] Semua proses payload berhasil diselesaikan untuk device ${deviceId}`);
      return rawResult.insertId;
    } catch (error) {
      console.error("❌ [HTTP PAYLOAD] Error dalam menyimpan HTTP payload:", error);
      throw new Error("Failed to save HTTP payload");
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
          p.id, p.device_id, p.datastream_id, p.value, 
          p.device_time as timestamp,
          p.device_time,
          ds.description as sensor_name, ds.pin, ds.unit, ds.type,
          ds.min_value, ds.max_value
        FROM payloads p
        LEFT JOIN datastreams ds ON p.datastream_id = ds.id 
        WHERE p.device_id = ? AND p.datastream_id = ? AND p.device_time IS NOT NULL
        ORDER BY p.device_time DESC 
        LIMIT 500`, // Tingkatkan limit untuk memastikan semua data terambil
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
  async getTimeSeriesData(device_id: string, datastream_id: string, timeRange: string = '1h', count?: string) {
    try {
      let query = '';
      let queryParams: any[] = [device_id, datastream_id];

      // Jika filter berdasarkan count (jumlah data terakhir)
      if (count && count !== 'all') {
        const limitCount = parseInt(count);
        if (!isNaN(limitCount) && limitCount > 0) {
          query = `SELECT 
            p.value, 
            p.device_time as timestamp,
            p.device_time,
            ds.unit, ds.description as sensor_name,
            d.description as device_name
          FROM payloads p
          LEFT JOIN datastreams ds ON p.datastream_id = ds.id 
          LEFT JOIN devices d ON p.device_id = d.id
          WHERE p.device_id = ? AND p.datastream_id = ? AND p.device_time IS NOT NULL
          ORDER BY p.device_time DESC
          LIMIT ?`;
          queryParams.push(limitCount);
        } else {
          // Invalid count, fallback to time-based
          count = undefined;
        }
      }

      // Jika filter berdasarkan time range (atau fallback dari count invalid)
      if (!count || count === 'all') {
        let timeCondition = '';
        // PERBAIKAN: Gunakan UTC_TIMESTAMP() untuk konsistensi dengan frontend
        // dan pastikan perbandingan timezone yang tepat
        switch (timeRange) {
          case '1h': timeCondition = 'AND p.device_time >= UTC_TIMESTAMP() - INTERVAL 1 HOUR'; break;
          case '12h': timeCondition = 'AND p.device_time >= UTC_TIMESTAMP() - INTERVAL 12 HOUR'; break;
          case '1d': timeCondition = 'AND p.device_time >= UTC_TIMESTAMP() - INTERVAL 1 DAY'; break;
          case '1w': timeCondition = 'AND p.device_time >= UTC_TIMESTAMP() - INTERVAL 7 DAY'; break;
          case 'all': timeCondition = ''; break; // Semua data
          default: timeCondition = 'AND p.device_time >= UTC_TIMESTAMP() - INTERVAL 1 HOUR';
        }

        query = `SELECT 
          p.value, 
          p.device_time as timestamp,
          p.device_time,
          ds.unit, ds.description as sensor_name,
          d.description as device_name
        FROM payloads p
        LEFT JOIN datastreams ds ON p.datastream_id = ds.id 
        LEFT JOIN devices d ON p.device_id = d.id
        WHERE p.device_id = ? AND p.datastream_id = ? AND p.device_time IS NOT NULL ${timeCondition}
        ORDER BY p.device_time ASC`;
      }

      const [rows] = await this.db.query(query, queryParams);
      
      // Jika menggunakan count filter, perlu reverse order untuk menampilkan chronological
      if (count && count !== 'all') {
        return (rows as any[]).reverse();
      }
      
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
      
      // Ambil informasi datastream untuk validasi
      const [datastreams]: any = await this.db.query(
        `SELECT id, pin, type, unit, min_value, max_value, decimal_value, description 
         FROM datastreams WHERE id = ? AND device_id = ?`,
        [datastream_id, device_id]
      );
      
      if (!datastreams.length) {
        throw new Error(`Datastream ${datastream_id} not found for device ${device_id}`);
      }
      
      const datastream = datastreams[0];
      
      // Validasi dan normalisasi nilai menggunakan fungsi yang sama
      const { validatedValue, hasWarning, warningMessage } = validateAndNormalizeValue(value, datastream);
      
      if (hasWarning && warningMessage) {
        console.warn(`📡 LoRa data validation: ${warningMessage} for datastream ${datastream.description}`);
      }
      
      // Simpan raw payload untuk LoRa juga
      const [rawResult] = await this.db.query<ResultSetHeader>(
        `INSERT INTO raw_payloads (device_id, raw_data, parsed_at)
        VALUES (?, ?, NOW())`,
        [device_id, JSON.stringify({ 
          dev_eui, 
          datastream_id, 
          original_value: value,
          validated_value: validatedValue,
          validation_applied: hasWarning,
          protocol: 'lora' 
        })]
      );
      
      // Simpan ke payloads (normalized) dengan nilai yang sudah divalidasi
      const [result] = await this.db.query<ResultSetHeader>(
        `INSERT INTO payloads (device_id, datastream_id, value, raw_data, device_time, server_time)
        VALUES (?, ?, ?, ?, NULL, NOW())`,
        [
          device_id, 
          datastream_id, 
          validatedValue, // Gunakan nilai yang sudah divalidasi
          JSON.stringify({ 
            raw_payload_id: rawResult.insertId, 
            protocol: 'lora', 
            dev_eui,
            original_value: value,
            validated_value: validatedValue,
            validation_applied: hasWarning
          })
        ]
      );
      
      console.log(`📡 LoRa payload saved: Device ${device_id} → Datastream ${datastream_id} → Value ${value} → Validated: ${validatedValue}`);
      return result.insertId;
      
    } catch (error) {
      console.error("Error saving Lora payload:", error);
      throw error;
    }
  }
}

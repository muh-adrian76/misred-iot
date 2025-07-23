import { Pool, ResultSetHeader } from "mysql2/promise";
import { DeviceService } from "./DeviceService";
import { AlarmNotificationService } from "./AlarmNotificationService";
import { broadcastToUsers } from "../api/ws/user-ws";
import { 
  verifyDeviceJWTAndDecrypt, 
  parseAndNormalizePayload, 
  broadcastSensorUpdates 
} from "../lib/utils";

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
      // STEP 1: Simpan raw data untuk backup dan debugging
      const [rawResult] = await this.db.query<ResultSetHeader>(
        `INSERT INTO raw_payloads (device_id, raw_data, parsed_at)
        VALUES (?, ?, NOW())`,
        [deviceId, JSON.stringify(decrypted)]
      );
      
      // console.log(`📥 Raw payload saved with ID: ${rawResult.insertId}`);
      
      // STEP 2: Parse dan normalisasi data ke tabel payloads
      const normalizedPayloads = await parseAndNormalizePayload(
        this.db,
        Number(deviceId), 
        decrypted, 
        rawResult.insertId
      );
      
      // console.log(`✅ Parsed ${normalizedPayloads.length} sensor readings`);

      // STEP 3: Broadcast real-time data ke user pemilik device
      await broadcastSensorUpdates(this.db, broadcastToUsers, Number(deviceId), decrypted);

      // STEP 4: Check alarms setelah payload disimpan
      if (this.alarmNotificationService) {
        // console.log(`🔍 Checking alarms for device ${deviceId}`);
        await this.alarmNotificationService.checkAlarms(Number(deviceId), decrypted);
      }

      return rawResult.insertId;
    } catch (error) {
      console.error("Error saving HTTP payload:", error);
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
      
      // Simpan ke payloads (normalized) - LoRa biasanya tidak memiliki device timestamp
      const [result] = await this.db.query<ResultSetHeader>(
        `INSERT INTO payloads (device_id, datastream_id, value, raw_data, device_time, server_time)
        VALUES (?, ?, ?, ?, NULL, NOW())`,
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
}

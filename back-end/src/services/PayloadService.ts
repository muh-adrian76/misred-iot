/**
 * ===== PAYLOAD SERVICE =====
 * Service untuk mengelola data payload dari IoT devices
 * Menangani HTTP, MQTT, dan LoRa payload processing
 * 
 * Fitur utama:
 * - JWT verification dan AES decryption untuk security
 * - Multi-protocol payload handling (HTTP, MQTT, LoRa)
 * - Raw data backup dan normalized data processing
 * - Real-time data broadcasting via WebSocket
 * - Device status monitoring integration
 * - Alarm checking dan notification trigger
 * - Time series data untuk charts dan analytics
 */
import { Pool, ResultSetHeader } from "mysql2/promise";
import { DeviceService } from "./DeviceService";
import { NotificationService } from "./NotificationService";
import { DeviceStatusService } from "./DeviceStatusService";
import { broadcastToDeviceOwner } from "../api/ws/user-ws";
import { 
  verifyDeviceJWTAndDecrypt, 
  parseAndNormalizePayload, 
  broadcastSensorUpdates,
  validateAndNormalizeValue
} from "../lib/utils";

export class PayloadService {
  private db: Pool;
  private deviceService: DeviceService;
  private notificationService?: NotificationService;
  private deviceStatusService?: DeviceStatusService;

  constructor(
    db: Pool, 
    deviceService: DeviceService, 
    notificationService?: NotificationService,
    deviceStatusService?: DeviceStatusService
  ) {
    this.db = db;
    this.deviceService = deviceService;
    this.notificationService = notificationService;
    this.deviceStatusService = deviceStatusService;
  }

  // ===== VERIFY DEVICE JWT AND DECRYPT =====
  // Fungsi verifikasi JWT dan dekripsi payload untuk keamanan
  async verifyDeviceJWTAndDecrypt({
    deviceId,
    token,
  }: {
    deviceId: string;
    token: string;
  }) {
    const result = await verifyDeviceJWTAndDecrypt({
      deviceService: this.deviceService,
      deviceId,
      token,
    });
    
    // Backward compatibility: return hanya decrypted data
    return result.decryptedData;
  }

  // ===== SAVE HTTP PAYLOAD =====
  // Menyimpan payload yang diterima via HTTP dari devices
  async saveHttpPayload({
    deviceId,
    decrypted,
    dataType,
  }: {
    deviceId: string | number;
    decrypted: any;
    dataType: string | undefined;
  }): Promise<number> {
    try {
      // console.log(`[HTTP PAYLOAD] Memulai proses penyimpanan payload untuk device ID: ${deviceId}`);
      // console.log(`📊 [HTTP PAYLOAD] Data yang sudah didekripsi:`, decrypted);
      
      // STEP 1: Simpan raw data untuk backup dan debugging
      const [rawResult] = await (this.db as any).safeQuery(
        `INSERT INTO raw_payloads (device_id, raw_data, parsed_at)
        VALUES (?, ?, NOW())`,
        [deviceId, JSON.stringify(decrypted)]
      );

      // console.log(`[DATABASE] Raw payload berhasil disimpan dengan ID: ${rawResult.insertId}`);
      
      // STEP 2: Parse dan normalisasi data ke tabel payloads
      // console.log(`🔄 [PARSING] Memulai parsing dan normalisasi data sensor...`);
      const normalizedPayloads = await parseAndNormalizePayload(
        this.db,
        Number(deviceId), 
        decrypted, 
        rawResult.insertId,
        undefined // Tidak ada JWT payload tersedia di HTTP endpoint
      );
      
      // console.log(`✅ [PARSING] Berhasil memproses ${normalizedPayloads.length} pembacaan sensor ke database`);

      // STEP 3: Broadcast real-time data ke user pemilik device
      // console.log(`[BROADCAST] Mengirim data real-time ke user via WebSocket...`);
      await broadcastSensorUpdates(this.db, broadcastToDeviceOwner, Number(deviceId), decrypted, "http", dataType);
      // console.log(`✅ [BROADCAST] Data real-time berhasil dikirim ke WebSocket`);

      // STEP 4: Update device status to online dan last_seen_at (real-time)
      if (this.deviceStatusService) {
        // console.log(`[DEVICE STATUS] Memperbarui status device ke online dan timestamp...`);
        // Update status ke online DAN last_seen_at sekaligus
        await this.deviceStatusService.updateDeviceStatusOnly(deviceId.toString(), "online");
        await this.deviceStatusService.updateDeviceLastSeen(Number(deviceId));
        // console.log(`✅ [DEVICE STATUS] Device ${deviceId} status updated to online`);
        
        // Broadcast status online ke user pemilik device untuk real-time update
        await broadcastToDeviceOwner(this.db, Number(deviceId), {
          type: "status_update",
          device_id: Number(deviceId),
          status: "online",
          last_seen: new Date().toISOString(),
        });
      }

      // STEP 5: Check alarms setelah payload disimpan
      if (this.notificationService) {
        // console.log(`[ALARM] Memeriksa kondisi alarm untuk device ${deviceId}...`);
        await this.notificationService.checkAlarms(Number(deviceId), decrypted);
        // console.log(`✅ [ALARM] Pemeriksaan alarm selesai`);
      }

      // console.log(`🎉 [HTTP PAYLOAD] Semua proses payload berhasil diselesaikan untuk device ${deviceId}`);
      return rawResult.insertId;
    } catch (error) {
      console.error("❌ [HTTP PAYLOAD] Error dalam menyimpan HTTP payload:", error);
      throw new Error("Gagal menyimpan HTTP payload");
    }
  }

    async getByDeviceId(device_id: string) {
    try {
      // Query data ternormalisasi dengan informasi sensor dan device
      const [rows] = await (this.db as any).safeQuery(
        `SELECT 
          p.id, p.device_id, p.datastream_id, p.value, p.server_time,
          ds.description as sensor_name, ds.pin, ds.unit, ds.type,
          d.description as device_name
        FROM payloads p
        LEFT JOIN datastreams ds ON p.datastream_id = ds.id 
        LEFT JOIN devices d ON p.device_id = d.id
        WHERE p.device_id = ? 
        ORDER BY p.server_time DESC`,
        [device_id]
      );
      return rows;
    } catch (error) {
      console.error("Gagal mengambil payload berdasarkan device ID:", error);
      throw new Error("Gagal mengambil data payload");
    }
  }

  async getByDeviceAndDatastream(device_id: string, datastream_id: string) {
    try {
      // Query untuk widget dashboard - data sensor spesifik
      const [rows] = await (this.db as any).safeQuery(
        `SELECT 
          p.id, p.device_id, p.datastream_id, p.value, 
          COALESCE(p.device_time, p.server_time) as timestamp,
          p.device_time,
          p.server_time,
          ds.description as sensor_name, ds.pin, ds.unit, ds.type,
          ds.min_value, ds.max_value,
          d.description as device_name
        FROM payloads p
        LEFT JOIN datastreams ds ON p.datastream_id = ds.id 
        LEFT JOIN devices d ON p.device_id = d.id
        WHERE p.device_id = ? AND p.datastream_id = ?
        ORDER BY COALESCE(p.device_time, p.server_time) DESC 
        LIMIT 500`, // Tingkatkan limit untuk memastikan semua data terambil
        [device_id, datastream_id]
      );
      return rows;
    } catch (error) {
      console.error("Gagal mengambil payload berdasarkan device dan datastream:", error);
      throw new Error("Gagal mengambil data payload");
    }
  }

  // Fungsi untuk mendapatkan data widget menggunakan view
  async getWidgetData(widget_id: string) {
    try {
      const [rows]: any = await (this.db as any).safeQuery(
        `SELECT * FROM widget_data WHERE widget_id = ?`,
        [widget_id]
      );
      return rows[0]; // Single widget data
    } catch (error) {
      console.error("Gagal mengambil data widget:", error);
      throw new Error("Gagal mengambil data widget");
    }
  }

  // Fungsi untuk mendapatkan time series data untuk chart
  async getTimeSeriesData(device_id: string, datastream_id: string, timeRange: string = '1h', count?: string) {
    try {
      console.log(`🔍 [DEBUG PAYLOAD SERVICE] Input parameters:`, { 
        device_id, 
        datastream_id, 
        timeRange, 
        count 
      });

      let query = '';
      let queryParams: any[] = [device_id, datastream_id];
      let timeCondition = ''; // Deklarasi di scope yang tepat

      // Jika filter berdasarkan count (jumlah data terakhir)
      if (count && count !== 'all') {
        const limitCount = parseInt(count);
        if (!isNaN(limitCount) && limitCount > 0) {
          query = `SELECT 
            p.value, 
            COALESCE(p.device_time, p.server_time) as timestamp,
            p.device_time,
            p.server_time,
            ds.unit, ds.description as sensor_name,
            d.description as device_name
          FROM payloads p
          LEFT JOIN datastreams ds ON p.datastream_id = ds.id 
          LEFT JOIN devices d ON p.device_id = d.id
          WHERE p.device_id = ? AND p.datastream_id = ?
          ORDER BY COALESCE(p.device_time, p.server_time) DESC
          LIMIT ?`;
          queryParams.push(limitCount);
        } else {
          // Invalid count, fallback to time-based
          count = undefined;
        }
      }

      // Jika filter berdasarkan time range (atau fallback dari count invalid)
      if (!count || count === 'all') {
        // Jika tidak ada parameter range atau range kosong, ambil semua data
        if (!timeRange || timeRange === 'all') {
          timeCondition = ''; // Tidak ada filter waktu = semua data
        } else {
          // dan pastikan perbandingan timezone yang tepat
          switch (timeRange) {
            case '1h': timeCondition = 'AND COALESCE(p.device_time, p.server_time) >= UTC_TIMESTAMP() - INTERVAL 1 HOUR'; break;
            case '12h': timeCondition = 'AND COALESCE(p.device_time, p.server_time) >= UTC_TIMESTAMP() - INTERVAL 12 HOUR'; break;
            case '1d': timeCondition = 'AND COALESCE(p.device_time, p.server_time) >= UTC_TIMESTAMP() - INTERVAL 1 DAY'; break;
            case '1w': timeCondition = 'AND COALESCE(p.device_time, p.server_time) >= UTC_TIMESTAMP() - INTERVAL 7 DAY'; break;
            case '1m': timeCondition = 'AND COALESCE(p.device_time, p.server_time) >= UTC_TIMESTAMP() - INTERVAL 30 DAY'; break; // Tambahan: Support filter 1 bulan (30 hari)
            default: timeCondition = 'AND COALESCE(p.device_time, p.server_time) >= UTC_TIMESTAMP() - INTERVAL 1 HOUR';
          }
        }

        query = `SELECT 
          p.value, 
          COALESCE(p.device_time, p.server_time) as timestamp,
          p.device_time,
          p.server_time,
          ds.unit, ds.description as sensor_name,
          d.description as device_name
        FROM payloads p
        LEFT JOIN datastreams ds ON p.datastream_id = ds.id 
        LEFT JOIN devices d ON p.device_id = d.id
        WHERE p.device_id = ? AND p.datastream_id = ? ${timeCondition}
        ORDER BY COALESCE(p.device_time, p.server_time) ASC`;
      }

      // DEBUG: Log query yang akan dijalankan
      console.log(`📊 [DEBUG PAYLOAD SERVICE] SQL Query:`, query);
      console.log(`🔍 [DEBUG PAYLOAD SERVICE] Query Parameters:`, queryParams);
      console.log(`⏰ [DEBUG PAYLOAD SERVICE] Time Condition Applied:`, timeCondition || 'NONE (all data)');

      const [rows]: any = await (this.db as any).safeQuery(query, queryParams);
      
      // Debug: Log sample of returned data
      // if (rows && rows.length > 0) {
      //   console.log(`📊 [PAYLOAD SERVICE] Time series data sample for device ${device_id}, datastream ${datastream_id}:`, {
      //     totalRows: rows.length,
      //     firstRow: rows[0],
      //     lastRow: rows[rows.length - 1],
      //     sampleTimestamps: rows.slice(0, 3).map((r: any) => ({
      //       timestamp: r.timestamp,
      //       device_time: r.device_time,
      //       server_time: r.server_time,
      //       value: r.value
      //     }))
      //   });
      // } else {
      //   console.log(`⚠️ [PAYLOAD SERVICE] No data found for device ${device_id}, datastream ${datastream_id}`);
      // }
      
      // Jika menggunakan count filter, perlu reverse order untuk menampilkan chronological
      if (count && count !== 'all') {
        return (rows as any[]).reverse();
      }
      
      return rows;
    } catch (error) {
      console.error("❌ [PAYLOAD SERVICE] Gagal mengambil data time series:", error);
      throw new Error("Gagal mengambil data time series");
    }
  }

  async saveLoraPayload(dev_eui: string, datastream_id: number, value: any) {
    try {
      // Cari device_id dari dev_eui
      const [devices]: any = await (this.db as any).safeQuery(
        "SELECT id FROM devices WHERE dev_eui = ?",
        [dev_eui]
      );
      if (!devices.length) throw new Error("Device not found");
      
      const device_id = devices[0].id;
      
      // Ambil informasi datastream untuk validasi
      const [datastreams]: any = await (this.db as any).safeQuery(
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
      const [rawResult] = await (this.db as any).safeQuery(
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
      const [result] = await (this.db as any).safeQuery(
        `INSERT INTO payloads (device_id, datastream_id, raw_payload_id, value, device_time, server_time)
        VALUES (?, ?, ?, ?, NULL, NOW())`,
        [
          device_id, 
          datastream_id, 
          rawResult.insertId, // Simpan ID raw payload untuk referensi
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
      
      // console.log(`📡 LoRa payload saved: Device ${device_id} → Datastream ${datastream_id} → Value ${value} → Validated: ${validatedValue}`);
      return result.insertId;
      
    } catch (error) {
      console.error("Gagal menyimpan payload LoRa:", error);
      throw error;
    }
  }
}

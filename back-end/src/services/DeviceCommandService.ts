/**
 * ===== DEVICE COMMAND SERVICE =====
 * Service untuk mengelola perintah ke perangkat IoT
 * Mendukung komunikasi via MQTT, WebSocket, dan HTTP polling
 * 
 * Fitur utama:
 * - Kirim perintah ke perangkat (set_value, toggle, reset)
 * - Dukungan multi-protokol (MQTT, WebSocket, HTTP)
 * - Pelacakan status perintah dan konfirmasi (ack)
 * - Riwayat perintah dan statistik
 * - Pembersihan otomatis untuk perintah pending
 * - Notifikasi real-time via WebSocket
 */
import mysql, { Pool } from "mysql2/promise";
import { type DeviceCommand, type CommandStatus } from "../lib/types";
import { MQTTClient } from "../lib/middleware";
import { broadcastToDeviceOwner } from "../api/ws/user-ws";

// Lazy import untuk menghindari circular dependency
let sendToDevice: any = null;

// Inisialisasi fungsi broadcast untuk komunikasi WebSocket
const initializeBroadcasting = async () => {
  if (!sendToDevice) {
    try {
      const deviceWs = await import("../api/ws/device-ws");
      sendToDevice = deviceWs.sendToDevice;
    } catch (error) {
      console.warn("Gagal mengimpor fungsi WebSocket sendToDevice:", error);
    }
  }
};

export class DeviceCommandService {
  private db: Pool;
  private mqttClient: ReturnType<typeof MQTTClient.getInstance>;

  constructor(db: Pool) {
    this.db = db;
    this.mqttClient = MQTTClient.getInstance();
    
    // Inisialisasi fungsi broadcast untuk WebSocket
    initializeBroadcasting();
  }

  // ===== CREATE COMMAND =====
  // Membuat command baru dan mengirim ke device
  async createCommand(
    deviceId: number,
    datastreamId: number,
    commandType: "set_value" | "toggle" | "reset",
    value: number,
    userId: number
  ): Promise<number> {
    try {
      // Validasi datastream harus actuator (string atau boolean type)
      const [datastreamRows]: any = await (this.db as any).safeQuery(
        `SELECT ds.*, d.protocol, d.description as device_name 
         FROM datastreams ds 
         JOIN devices d ON ds.device_id = d.id 
         WHERE ds.id = ? AND ds.device_id = ?`,
        [datastreamId, deviceId]
      );

      if (!datastreamRows.length) {
        throw new Error("Datastream tidak ditemukan");
      }

      const datastream = datastreamRows[0];
      
      // Cek apakah datastream adalah actuator (string atau boolean)
      if (!['string', 'boolean'].includes(datastream.type)) {
        throw new Error("Datastream ini bukan aktuator. Hanya tipe 'string' atau 'boolean' yang dapat dikontrol.");
      }

      // Validasi nilai untuk boolean type (harus 0 atau 1)
      if (datastream.type === 'boolean' && ![0, 1].includes(value)) {
        throw new Error("Nilai untuk tipe boolean harus 0 atau 1");
      }

      // Validasi range nilai untuk tipe lain
      if (datastream.type === 'string' && (value < datastream.min_value || value > datastream.max_value)) {
        throw new Error(`Nilai harus antara ${datastream.min_value} dan ${datastream.max_value}`);
      }

      // Buat record command di database
      const [result] = await (this.db as any).safeQuery(
        `INSERT INTO device_commands 
         (device_id, datastream_id, command_type, value, user_id, status)
         VALUES (?, ?, ?, ?, ?, 'pending')`,
        [deviceId, datastreamId, commandType, value, userId]
      );
      
      const commandId = (result as any).insertId;

      // Kirim command ke device sesuai protokol
      await this.sendCommandToDevice(commandId, deviceId, datastream, commandType, value);

      // Broadcast status command ke frontend via WebSocket
      await broadcastToDeviceOwner(this.db, deviceId, {
        type: "command_status",
        command_id: commandId,
        device_id: deviceId,
        datastream_id: datastreamId,
        status: "sent",
        timestamp: new Date().toISOString()
      });

      return commandId;
    } catch (error) {
      console.error("Gagal membuat command:", error);
      throw error;
    }
  }

  /**
   * Kirim command ke device sesuai protokol yang tepat
   */
  private async sendCommandToDevice(
    commandId: number,
    deviceId: number,
    datastream: any,
    commandType: string,
    value: number
  ): Promise<void> {
    try {
      const commandPayload = {
        command_id: commandId,
        device_id: deviceId,
        datastream_id: datastream.id,
        pin: datastream.pin,
        command_type: commandType,
        value: value,
        timestamp: new Date().toISOString()
      };

      console.log(`📤 Mengirim command ke device ${deviceId} via ${datastream.protocol}:`, commandPayload);

      // Update status command menjadi 'sent'
      await this.updateCommandStatus(commandId, 'sent');

      switch (datastream.protocol?.toLowerCase()) {
        case 'mqtt':
          await this.sendViaMQTT(deviceId, commandPayload);
          break;
        case 'websocket':
        case 'ws':
          await this.sendViaWebSocket(deviceId, commandPayload);
          break;
        case 'http':
        default:
          // HTTP akan ditangani oleh perangkat melalui endpoint polling /device-command/pending
          console.log(`📋 Command ${commandId} diantrekan untuk device HTTP ${deviceId}`);
          break;
      }
    } catch (error) {
      console.error(`❌ Gagal mengirim command ${commandId}:`, error);
      await this.updateCommandStatus(commandId, 'failed');
      throw error;
    }
  }

  /**
   * Kirim command via MQTT
   */
  private async sendViaMQTT(deviceId: number, commandPayload: any): Promise<void> {
    try {
      const topic = `command/${deviceId}`;
      const message = JSON.stringify(commandPayload);
      
      this.mqttClient.publish(topic, message, { qos: 1 }, (error) => {
        if (error) {
          console.error(`❌ Gagal publish command MQTT untuk device ${deviceId}:`, error);
        } else {
          console.log(`✅ Command MQTT terkirim ke device ${deviceId} pada topik ${topic}`);
        }
      });
    } catch (error) {
      console.error(`❌ Error pengiriman MQTT:`, error);
      throw error;
    }
  }

  /**
   * Kirim command via WebSocket
   */
  private async sendViaWebSocket(deviceId: number, commandPayload: any): Promise<void> {
    try {
      if (!sendToDevice) {
        throw new Error("Fungsi WebSocket sendToDevice tidak tersedia");
      }

      const sent = sendToDevice(deviceId.toString(), {
        type: "device_command",
        ...commandPayload
      });

      if (!sent) {
        throw new Error(`Device ${deviceId} tidak terhubung via WebSocket`);
      }

      console.log(`✅ Command WebSocket terkirim ke device ${deviceId}`);
    } catch (error) {
      console.error(`❌ Error pengiriman WebSocket:`, error);
      throw error;
    }
  }

  /**
   * Perbarui status command
   */
  async updateCommandStatus(
    commandId: number,
    status: CommandStatus,
    acknowledgedAt?: Date
  ): Promise<boolean> {
    const [result] = await (this.db as any).safeQuery(
      `UPDATE device_commands 
       SET status = ?, acknowledged_at = ?
       WHERE id = ?`,
      [status, acknowledgedAt ? acknowledgedAt.toISOString() : null, commandId]
    );
    
    return (result as any).affectedRows > 0;
  }

  /**
   * Ambil command pending untuk device
   */
  async getPendingCommands(deviceId: number): Promise<DeviceCommand[]> {
    const [rows] = await (this.db as any).safeQuery(
      `SELECT dc.*, ds.pin, ds.type as datastream_type, ds.description as datastream_name
       FROM device_commands dc
       JOIN datastreams ds ON dc.datastream_id = ds.id
       WHERE dc.device_id = ? AND dc.status = 'pending'
       ORDER BY dc.sent_at ASC`,
      [deviceId]
    );
    
    return rows as DeviceCommand[];
  }

  /**
   * Ambil riwayat command untuk device
   */
  async getCommandHistory(
    deviceId: number,
    limit: number = 50,
    offset: number = 0
  ): Promise<DeviceCommand[]> {
    // Pastikan parameter bertipe integer yang valid
    const validDeviceId = parseInt(String(deviceId));
    const validLimit = Math.max(1, Math.min(100, parseInt(String(limit)) || 50));
    const validOffset = Math.max(0, parseInt(String(offset)) || 0);
    
    const [rows] = await (this.db as any).safeQuery(
      `SELECT dc.*, ds.pin, ds.type as datastream_type, ds.description as datastream_name,
              u.name as user_name
       FROM device_commands dc
       JOIN datastreams ds ON dc.datastream_id = ds.id
       JOIN users u ON dc.user_id = u.id
       WHERE dc.device_id = ?
       ORDER BY dc.sent_at DESC
       LIMIT ${validLimit} OFFSET ${validOffset}`,
      [validDeviceId]
    );
    
    return rows as DeviceCommand[];
  }

  /**
   * Ambil command berdasarkan status
   */
  async getCommandsByStatus(status: CommandStatus): Promise<DeviceCommand[]> {
    const [rows] = await (this.db as any).safeQuery(
      `SELECT dc.*, ds.pin, ds.type as datastream_type, ds.description as datastream_name,
              d.description as device_name
       FROM device_commands dc
       JOIN datastreams ds ON dc.datastream_id = ds.id
       JOIN devices d ON dc.device_id = d.id
       WHERE dc.status = ?
       ORDER BY dc.sent_at DESC`,
      [status]
    );
    
    return rows as DeviceCommand[];
  }

  /**
   * Tandai command pending lama menjadi failed (pembersihan) - timeout ~10 detik
   */
  async markOldCommandsAsFailed(olderThanMinutes: number = 0.17): Promise<number> {
    const cutoffTime = new Date(Date.now() - olderThanMinutes * 60 * 1000);
    
    const [result] = await (this.db as any).safeQuery(
      `UPDATE device_commands 
       SET status = 'failed'
       WHERE status = 'pending' 
       AND sent_at < ?`,
      [cutoffTime.toISOString()]
    );
    
    return (result as any).affectedRows;
  }

  /**
   * Ambil statistik command untuk device
   */
  async getCommandStats(deviceId: number, days: number = 7): Promise<any> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const [rows] = await (this.db as any).safeQuery(
      `SELECT 
         status,
         COUNT(*) as count
       FROM device_commands
       WHERE device_id = ? AND sent_at >= ?
       GROUP BY status`,
      [deviceId, startDate.toISOString()]
    );
    
    const results = rows as any[];
    
    return {
      total: results.reduce((sum, row) => sum + row.count, 0),
      byStatus: results.reduce((acc, row) => {
        acc[row.status] = row.count;
        return acc;
      }, {} as Record<string, number>)
    };
  }
}

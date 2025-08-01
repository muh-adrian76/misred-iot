/**
 * ===== DEVICE COMMAND SERVICE =====
 * Service untuk mengelola perintah ke IoT devices
 * Mendukung komunikasi via MQTT, WebSocket, dan HTTP polling
 * 
 * Fitur utama:
 * - Send command ke device (set_value, toggle, reset)
 * - Multi-protocol support (MQTT, WebSocket, HTTP)
 * - Command status tracking dan acknowledgment
 * - Command history dan statistics
 * - Auto cleanup untuk pending commands
 * - Real-time notification via WebSocket
 */
import mysql, { Pool } from "mysql2/promise";
import { type DeviceCommand, type CommandStatus } from "../lib/types";
import { MQTTClient } from "../lib/middleware";

// Lazy import untuk menghindari circular dependency
let broadcastToUsersByDevice: any = null;
let sendToDevice: any = null;

// Initialize broadcast functions untuk WebSocket communication
const initializeBroadcasting = async () => {
  if (!broadcastToUsersByDevice) {
    try {
      const userWs = await import("../api/ws/user-ws");
      broadcastToUsersByDevice = userWs.broadcastToUsersByDevice;
    } catch (error) {
      console.warn("Failed to import broadcastToUsersByDevice:", error);
    }
  }
  
  if (!sendToDevice) {
    try {
      const deviceWs = await import("../api/ws/device-ws");
      sendToDevice = deviceWs.sendToDevice;
    } catch (error) {
      console.warn("Failed to import sendToDevice:", error);
    }
  }
};

export class DeviceCommandService {
  private db: Pool;
  private mqttClient: ReturnType<typeof MQTTClient.getInstance>;

  constructor(db: Pool) {
    this.db = db;
    this.mqttClient = MQTTClient.getInstance();
    
    // Initialize broadcasting functions untuk WebSocket
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
      const [datastreamRows]: any = await this.db.execute(
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
      const [result] = await this.db.execute(
        `INSERT INTO device_commands 
         (device_id, datastream_id, command_type, value, user_id, status)
         VALUES (?, ?, ?, ?, ?, 'pending')`,
        [deviceId, datastreamId, commandType, value, userId]
      );
      
      const commandId = (result as any).insertId;

      // Kirim command ke device sesuai protokol
      await this.sendCommandToDevice(commandId, deviceId, datastream, commandType, value);

      // Broadcast status command ke frontend via WebSocket
      if (broadcastToUsersByDevice) {
        await broadcastToUsersByDevice(this.db, deviceId, {
          type: "command_status",
          command_id: commandId,
          device_id: deviceId,
          datastream_id: datastreamId,
          status: "sent",
          timestamp: new Date().toISOString()
        });
      }

      return commandId;
    } catch (error) {
      console.error("Error creating command:", error);
      throw error;
    }
  }

  /**
   * Send command to device via appropriate protocol
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

      console.log(`📤 Sending command to device ${deviceId} via ${datastream.protocol}:`, commandPayload);

      // Update command status to 'sent'
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
          // HTTP will be handled by device polling /device-command/pending endpoint
          console.log(`📋 Command ${commandId} queued for HTTP device ${deviceId}`);
          break;
      }
    } catch (error) {
      console.error(`❌ Failed to send command ${commandId}:`, error);
      await this.updateCommandStatus(commandId, 'failed');
      throw error;
    }
  }

  /**
   * Send command via MQTT
   */
  private async sendViaMQTT(deviceId: number, commandPayload: any): Promise<void> {
    try {
      const topic = `command/${deviceId}`;
      const message = JSON.stringify(commandPayload);
      
      this.mqttClient.publish(topic, message, { qos: 1 }, (error) => {
        if (error) {
          console.error(`❌ MQTT command publish failed for device ${deviceId}:`, error);
        } else {
          console.log(`✅ MQTT command sent to device ${deviceId} on topic ${topic}`);
        }
      });
    } catch (error) {
      console.error(`❌ MQTT send error:`, error);
      throw error;
    }
  }

  /**
   * Send command via WebSocket
   */
  private async sendViaWebSocket(deviceId: number, commandPayload: any): Promise<void> {
    try {
      if (!sendToDevice) {
        throw new Error("WebSocket sendToDevice function not available");
      }

      const sent = sendToDevice(deviceId.toString(), {
        type: "device_command",
        ...commandPayload
      });

      if (!sent) {
        throw new Error(`Device ${deviceId} tidak terhubung via WebSocket`);
      }

      console.log(`✅ WebSocket command sent to device ${deviceId}`);
    } catch (error) {
      console.error(`❌ WebSocket send error:`, error);
      throw error;
    }
  }

  /**
   * Update command status
   */
  async updateCommandStatus(
    commandId: number,
    status: CommandStatus,
    acknowledgedAt?: Date
  ): Promise<boolean> {
    const [result] = await this.db.execute(
      `UPDATE device_commands 
       SET status = ?, acknowledged_at = ?
       WHERE id = ?`,
      [status, acknowledgedAt ? acknowledgedAt.toISOString() : null, commandId]
    );
    
    return (result as any).affectedRows > 0;
  }

  /**
   * Get pending commands for a device
   */
  async getPendingCommands(deviceId: number): Promise<DeviceCommand[]> {
    const [rows] = await this.db.execute(
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
   * Get command history for a device
   */
  async getCommandHistory(
    deviceId: number,
    limit: number = 50,
    offset: number = 0
  ): Promise<DeviceCommand[]> {
    const [rows] = await this.db.execute(
      `SELECT dc.*, ds.pin, ds.type as datastream_type, ds.description as datastream_name,
              u.name as user_name
       FROM device_commands dc
       JOIN datastreams ds ON dc.datastream_id = ds.id
       JOIN users u ON dc.user_id = u.id
       WHERE dc.device_id = ?
       ORDER BY dc.sent_at DESC
       LIMIT ? OFFSET ?`,
      [deviceId, limit, offset]
    );
    
    return rows as DeviceCommand[];
  }

  /**
   * Get commands by status
   */
  async getCommandsByStatus(status: CommandStatus): Promise<DeviceCommand[]> {
    const [rows] = await this.db.execute(
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
   * Mark old pending commands as failed (cleanup) - updated timeout to 10 seconds
   */
  async markOldCommandsAsFailed(olderThanMinutes: number = 0.17): Promise<number> { // 0.17 minutes = ~10 seconds
    const cutoffTime = new Date(Date.now() - olderThanMinutes * 60 * 1000);
    
    const [result] = await this.db.execute(
      `UPDATE device_commands 
       SET status = 'failed'
       WHERE status = 'pending' 
       AND sent_at < ?`,
      [cutoffTime.toISOString()]
    );
    
    return (result as any).affectedRows;
  }

  /**
   * Get command statistics for a device
   */
  async getCommandStats(deviceId: number, days: number = 7): Promise<any> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const [rows] = await this.db.execute(
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

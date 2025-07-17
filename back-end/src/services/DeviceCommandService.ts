import mysql, { Pool } from "mysql2/promise";
import { type DeviceCommand, type CommandStatus } from "../lib/types";

export class DeviceCommandService {
  private db: Pool;

  constructor(db: Pool) {
    this.db = db;
  }

  /**
   * Create a new device command
   */
  async createCommand(
    deviceId: number,
    datastreamId: number,
    commandType: "set_value" | "toggle" | "reset",
    value: number,
    userId: number
  ): Promise<number> {
    const [result] = await this.db.execute(
      `INSERT INTO device_commands 
       (device_id, datastream_id, command_type, value, user_id, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [deviceId, datastreamId, commandType, value, userId]
    );
    
    return (result as any).insertId;
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
   * Mark old pending commands as failed (cleanup)
   */
  async markOldCommandsAsFailed(olderThanMinutes: number = 5): Promise<number> {
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

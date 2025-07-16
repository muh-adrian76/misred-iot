import { Pool, ResultSetHeader } from "mysql2/promise";

export interface CreateAlarmData {
  description: string;
  user_id: number;
  device_id: number;
  datastream_id: number;
  operator: '=' | '<' | '>' | '<=' | '>=' | '!=';
  threshold: number;
  cooldown_minutes?: number;
  notification_whatsapp?: boolean;
  notification_browser?: boolean;
}

export interface UpdateAlarmData {
  description?: string;
  operator?: '=' | '<' | '>' | '<=' | '>=' | '!=';
  threshold?: number;
  is_active?: boolean;
  cooldown_minutes?: number;
  notification_whatsapp?: boolean;
  notification_browser?: boolean;
}

export class AlarmService {
  private db: Pool;

  constructor(database: Pool) {
    this.db = database;
  }

  /**
   * Create new alarm
   */
  async createAlarm(data: CreateAlarmData): Promise<number> {
    try {
      const query = `
        INSERT INTO alarms (
          description, user_id, device_id, datastream_id,
          operator, threshold, cooldown_minutes,
          notification_whatsapp, notification_browser
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const [result] = await this.db.query(query, [
        data.description,
        data.user_id,
        data.device_id,
        data.datastream_id,
        data.operator,
        data.threshold,
        data.cooldown_minutes || 5,
        data.notification_whatsapp !== false,
        data.notification_browser !== false
      ]);

      return (result as any).insertId;
    } catch (error) {
      console.error("Error creating alarm:", error);
      throw error;
    }
  }

  /**
   * Get all alarms untuk user tertentu
   */
  async getAlarmsByUserId(userId: number): Promise<any[]> {
    try {
      const query = `
        SELECT 
          a.*,
          d.description as device_description,
          ds.description as datastream_description,
          ds.pin as datastream_pin,
          ds.unit as datastream_unit
        FROM alarms a
        JOIN devices d ON a.device_id = d.id
        JOIN datastreams ds ON a.datastream_id = ds.id
        WHERE a.user_id = ?
        ORDER BY a.created_at DESC
      `;

      const [rows] = await this.db.query(query, [userId]);
      return rows as any[];
    } catch (error) {
      console.error("Error getting alarms by user:", error);
      return [];
    }
  }

  /**
   * Get alarm by ID
   */
  async getAlarmById(alarmId: number, userId: number): Promise<any | null> {
    try {
      const query = `
        SELECT 
          a.*,
          d.description as device_description,
          ds.description as datastream_description,
          ds.pin as datastream_pin,
          ds.unit as datastream_unit
        FROM alarms a
        JOIN devices d ON a.device_id = d.id
        JOIN datastreams ds ON a.datastream_id = ds.id
        WHERE a.id = ? AND a.user_id = ?
      `;

      const [rows] = await this.db.query(query, [alarmId, userId]);
      const result = rows as any[];
      
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error("Error getting alarm by ID:", error);
      return null;
    }
  }

  /**
   * Update alarm
   */
  async updateAlarm(alarmId: number, userId: number, data: UpdateAlarmData): Promise<boolean> {
    try {
      const updates: string[] = [];
      const values: any[] = [];

      // Build dynamic update query
      if (data.description !== undefined) {
        updates.push('description = ?');
        values.push(data.description);
      }
      if (data.operator !== undefined) {
        updates.push('operator = ?');
        values.push(data.operator);
      }
      if (data.threshold !== undefined) {
        updates.push('threshold = ?');
        values.push(data.threshold);
      }
      if (data.is_active !== undefined) {
        updates.push('is_active = ?');
        values.push(data.is_active);
      }
      if (data.cooldown_minutes !== undefined) {
        updates.push('cooldown_minutes = ?');
        values.push(data.cooldown_minutes);
      }
      if (data.notification_whatsapp !== undefined) {
        updates.push('notification_whatsapp = ?');
        values.push(data.notification_whatsapp);
      }
      if (data.notification_browser !== undefined) {
        updates.push('notification_browser = ?');
        values.push(data.notification_browser);
      }

      if (updates.length === 0) {
        return false;
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(alarmId, userId);

      const query = `
        UPDATE alarms 
        SET ${updates.join(', ')}
        WHERE id = ? AND user_id = ?
      `;

      const [result] = await this.db.query(query, values);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error("Error updating alarm:", error);
      throw error;
    }
  }

  /**
   * Delete alarm
   */
  async deleteAlarm(alarmId: number, userId: number): Promise<boolean> {
    try {
      const query = "DELETE FROM alarms WHERE id = ? AND user_id = ?";
      const [result] = await this.db.query(query, [alarmId, userId]);
      
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error("Error deleting alarm:", error);
      throw error;
    }
  }

  /**
   * Toggle alarm status (active/inactive)
   */
  async toggleAlarmStatus(alarmId: number, userId: number): Promise<boolean> {
    try {
      const query = `
        UPDATE alarms 
        SET is_active = NOT is_active, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_id = ?
      `;

      const [result] = await this.db.query(query, [alarmId, userId]);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error("Error toggling alarm status:", error);
      throw error;
    }
  }

  /**
   * Get alarms untuk device tertentu
   */
  async getAlarmsByDeviceId(deviceId: number, userId: number): Promise<any[]> {
    try {
      const query = `
        SELECT 
          a.*,
          d.description as device_description,
          ds.description as datastream_description,
          ds.pin as datastream_pin,
          ds.unit as datastream_unit
        FROM alarms a
        JOIN devices d ON a.device_id = d.id
        JOIN datastreams ds ON a.datastream_id = ds.id
        WHERE a.device_id = ? AND a.user_id = ?
        ORDER BY a.created_at DESC
      `;

      const [rows] = await this.db.query(query, [deviceId, userId]);
      return rows as any[];
    } catch (error) {
      console.error("Error getting alarms by device:", error);
      return [];
    }
  }

  /**
   * Validate alarm data
   */
  validateAlarmData(data: CreateAlarmData | UpdateAlarmData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if ('description' in data && (!data.description || data.description.trim().length === 0)) {
      errors.push("Description is required");
    }

    if ('threshold' in data && (data.threshold === undefined || isNaN(data.threshold))) {
      errors.push("Threshold must be a valid number");
    }

    if ('operator' in data && data.operator && !['=', '<', '>', '<=', '>=', '!='].includes(data.operator)) {
      errors.push("Invalid operator");
    }

    if ('cooldown_minutes' in data && data.cooldown_minutes !== undefined) {
      if (isNaN(data.cooldown_minutes) || data.cooldown_minutes < 0) {
        errors.push("Cooldown minutes must be a non-negative number");
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Legacy methods untuk backward compatibility
  async createAlarmLegacy({ description, user_id, widget_id, operator, threshold }: any) {
    try {
      const [result] = await this.db.query<ResultSetHeader>(
        `INSERT INTO alarms (description, user_id, widget_id, operator, threshold, last_sended)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [description, user_id, widget_id, operator, threshold]
      );
      return result.insertId;
    } catch (error) {
      console.error("Error creating alarm:", error);
      throw new Error("Failed to create alarm");
    }
  }

  async getAllAlarms(user_id: string) {
    try {
      const [rows] = await this.db.query(
        "SELECT * FROM alarms WHERE user_id = ?",
        [user_id]
      );
      return rows;
    } catch (error) {
      console.error("Error fetching all alarms:", error);
      throw new Error("Failed to fetch alarms");
    }
  }

  async getAlarmsByWidgetId(widget_id: number, user_id: string) {
    try {
      const [rows] = await this.db.query(
        "SELECT * FROM alarms WHERE widget_id = ? AND user_id = ?",
        [widget_id, user_id]
      );
      return rows;
    } catch (error) {
      console.error("Error fetching alarms by widget ID:", error);
      throw new Error("Failed to fetch alarms");
    }
  }
}
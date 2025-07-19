import { Pool, ResultSetHeader } from "mysql2/promise";

export interface CreateAlarmData {
  description: string;
  user_id: number;
  device_id: number;
  datastream_id: number;
  is_active: boolean;
  conditions: Array<{
    operator: '=' | '<' | '>' | '<=' | '>=';
    threshold: number;
  }>;
  cooldown_minutes?: number;
}

export interface UpdateAlarmData {
  description?: string;
  conditions?: Array<{
    operator: '=' | '<' | '>' | '<=' | '>=';
    threshold: number;
  }>;
  is_active?: boolean;
  cooldown_minutes?: number;
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
      // Start transaction
      await this.db.query('START TRANSACTION');
      
      const query = `
        INSERT INTO alarms (
          description, user_id, device_id, datastream_id,
          is_active, cooldown_minutes
        ) VALUES (?, ?, ?, ?, ?, ?)
      `;

      const [result] = await this.db.query(query, [
        data.description,
        data.user_id,
        data.device_id,
        data.datastream_id,
        data.is_active,
        data.cooldown_minutes || 5
      ]);

      const alarmId = (result as any).insertId;

      // Insert conditions
      for (const condition of data.conditions) {
        const conditionQuery = `
          INSERT INTO alarm_conditions (alarm_id, operator, threshold) 
          VALUES (?, ?, ?)
        `;
        await this.db.query(conditionQuery, [
          alarmId,
          condition.operator,
          condition.threshold
        ]);
      }

      await this.db.query('COMMIT');
      return alarmId;
    } catch (error) {
      await this.db.query('ROLLBACK');
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
      const alarms = rows as any[];

      // Get conditions for each alarm and format data properly
      for (const alarm of alarms) {
        const conditionsQuery = `
          SELECT operator, threshold 
          FROM alarm_conditions 
          WHERE alarm_id = ? 
          ORDER BY id
        `;
        const [conditions] = await this.db.query(conditionsQuery, [alarm.id]);
        
        // Convert threshold from string to number
        alarm.conditions = (conditions as any[]).map(condition => ({
          operator: condition.operator,
          threshold: Number(condition.threshold)
        }));

        // Convert boolean fields from tinyint to actual boolean
        alarm.is_active = Boolean(alarm.is_active);
        
        // Ensure dates are strings in ISO format
        if (alarm.created_at) {
          alarm.created_at = new Date(alarm.created_at).toISOString();
        }
        if (alarm.updated_at) {
          alarm.updated_at = new Date(alarm.updated_at).toISOString();
        }
        if (alarm.last_triggered) {
          alarm.last_triggered = new Date(alarm.last_triggered).toISOString();
        }
      }

      return alarms;
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
      
      if (result.length === 0) {
        return null;
      }

      const alarm = result[0];

      // Get conditions for this alarm
      const conditionsQuery = `
        SELECT operator, threshold 
        FROM alarm_conditions 
        WHERE alarm_id = ? 
        ORDER BY id
      `;
      const [conditions] = await this.db.query(conditionsQuery, [alarmId]);
      
      // Convert threshold from string to number
      alarm.conditions = (conditions as any[]).map(condition => ({
        operator: condition.operator,
        threshold: Number(condition.threshold)
      }));

      // Convert boolean fields from tinyint to actual boolean
      alarm.is_active = Boolean(alarm.is_active);
      
      // Ensure dates are strings in ISO format
      if (alarm.created_at) {
        alarm.created_at = new Date(alarm.created_at).toISOString();
      }
      if (alarm.updated_at) {
        alarm.updated_at = new Date(alarm.updated_at).toISOString();
      }
      if (alarm.last_triggered) {
        alarm.last_triggered = new Date(alarm.last_triggered).toISOString();
      }

      return alarm;
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
      await this.db.query('START TRANSACTION');

      const updates: string[] = [];
      const values: any[] = [];

      // Build dynamic update query
      if (data.description !== undefined) {
        updates.push('description = ?');
        values.push(data.description);
      }
      if (data.is_active !== undefined) {
        updates.push('is_active = ?');
        values.push(data.is_active);
      }
      if (data.cooldown_minutes !== undefined) {
        updates.push('cooldown_minutes = ?');
        values.push(data.cooldown_minutes);
      }

      // Update alarm table if there are changes
      if (updates.length > 0) {
        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(alarmId, userId);

        const query = `
          UPDATE alarms 
          SET ${updates.join(', ')}
          WHERE id = ? AND user_id = ?
        `;

        const [result] = await this.db.query(query, values);
        
        if ((result as any).affectedRows === 0) {
          await this.db.query('ROLLBACK');
          return false;
        }
      }

      // Update conditions if provided
      if (data.conditions !== undefined) {
        // Delete existing conditions
        await this.db.query('DELETE FROM alarm_conditions WHERE alarm_id = ?', [alarmId]);
        
        // Insert new conditions
        for (const condition of data.conditions) {
          const conditionQuery = `
            INSERT INTO alarm_conditions (alarm_id, operator, threshold) 
            VALUES (?, ?, ?)
          `;
          await this.db.query(conditionQuery, [
            alarmId,
            condition.operator,
            condition.threshold
          ]);
        }
      }

      await this.db.query('COMMIT');
      return true;
    } catch (error) {
      await this.db.query('ROLLBACK');
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
      const alarms = rows as any[];

      // Get conditions for each alarm
      for (const alarm of alarms) {
        const conditionsQuery = `
          SELECT operator, threshold 
          FROM alarm_conditions 
          WHERE alarm_id = ? 
          ORDER BY id
        `;
        const [conditions] = await this.db.query(conditionsQuery, [alarm.id]);
        alarm.conditions = conditions;
      }

      return alarms;
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

    if ('conditions' in data && data.conditions) {
      if (!Array.isArray(data.conditions) || data.conditions.length === 0) {
        errors.push("At least one condition is required");
      } else if (data.conditions.length > 5) {
        errors.push("Maximum 5 conditions allowed");
      } else {
        for (let i = 0; i < data.conditions.length; i++) {
          const condition = data.conditions[i];
          
          if (!condition.operator || !['=', '<', '>', '<=', '>='].includes(condition.operator)) {
            errors.push(`Invalid operator in condition ${i + 1}`);
          }
          
          if (condition.threshold === undefined || condition.threshold === null || isNaN(condition.threshold)) {
            errors.push(`Invalid threshold in condition ${i + 1}`);
          }
        }
      }
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

  // Get alarms with complete data including conditions
  async getAllAlarms(user_id: string) {
    try {
      const [rows] = await this.db.query(`
        SELECT 
          a.*,
          d.description as device_description,
          ds.description as datastream_description,
          ds.pin as datastream_pin,
          ds.unit as datastream_unit
        FROM alarms a
        LEFT JOIN devices d ON a.device_id = d.id
        LEFT JOIN datastreams ds ON a.datastream_id = ds.id
        WHERE a.user_id = ?
        ORDER BY a.created_at DESC
      `, [user_id]);

      // Get conditions for each alarm and format data properly
      const alarms = rows as any[];
      for (const alarm of alarms) {
        const [conditionRows] = await this.db.query(
          "SELECT operator, threshold FROM alarm_conditions WHERE alarm_id = ?",
          [alarm.id]
        );
        
        // Convert threshold from string to number
        alarm.conditions = (conditionRows as any[]).map(condition => ({
          operator: condition.operator,
          threshold: Number(condition.threshold)
        }));
        
        // Convert boolean fields from tinyint to actual boolean
        alarm.is_active = Boolean(alarm.is_active);
        
        // Ensure dates are strings in ISO format
        if (alarm.created_at) {
          alarm.created_at = new Date(alarm.created_at).toISOString();
        }
        if (alarm.updated_at) {
          alarm.updated_at = new Date(alarm.updated_at).toISOString();
        }
        if (alarm.last_triggered) {
          alarm.last_triggered = new Date(alarm.last_triggered).toISOString();
        }
      }

      return alarms;
    } catch (error) {
      console.error("Error fetching all alarms:", error);
      throw new Error("Failed to fetch alarms");
    }
  }

}
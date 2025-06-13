import { Connection, ResultSetHeader } from "mysql2/promise";

export class AlarmService {
  private db: Connection;

  constructor(db: Connection) {
    this.db = db;
  }

  async createAlarm({ name, device_id, operator, threshold, sensor }: any) {
    try {
      const [result] = await this.db.query<ResultSetHeader>(
        `INSERT INTO alarms (description, device_id, operator, threshold, last_sended, sensor_type)
         VALUES (?, ?, ?, ?, NOW(), ?)`,
        [name, device_id, operator, threshold, sensor]
      );
      return result.insertId;
    } catch (error) {
      console.error("Error creating alarm:", error);
      throw new Error("Failed to create alarm");
    }
  }

  async getAllAlarms() {
    try {
      const [rows] = await this.db.query("SELECT * FROM alarms");
      return rows;
    } catch (error) {
      console.error("Error fetching all alarms:", error);
      throw new Error("Failed to fetch alarms");
    }
  }

  async getAlarmsByDeviceId(device_id: string) {
    try {
      const [rows] = await this.db.query(
        "SELECT * FROM alarms WHERE device_id = ?",
        [device_id]
      );
      return rows;
    } catch (error) {
      console.error("Error fetching alarms by device ID:", error);
      throw new Error("Failed to fetch alarms");
    }
  }

  async updateAlarm(id: string, { name, device_id, operator, threshold, sensor }: any) {
    try {
      const [result] = await this.db.query<ResultSetHeader>(
        `UPDATE alarms SET description = ?, device_id = ?, operator = ?, threshold = ?, sensor_type = ? WHERE id = ?`,
        [name, device_id, operator, threshold, sensor, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error updating alarm:", error);
      throw new Error("Failed to update alarm");
    }
  }

  async deleteAlarm(id: string) {
    try {
      const [result] = await this.db.query<ResultSetHeader>(
        "DELETE FROM alarms WHERE id = ?",
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error deleting alarm:", error);
      throw new Error("Failed to delete alarm");
    }
  }
}
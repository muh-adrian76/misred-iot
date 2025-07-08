import { Pool, ResultSetHeader } from "mysql2/promise";

export class AlarmService {
  private db: Pool;

  constructor(db: Pool) {
    this.db = db;
  }

  async createAlarm({ description, user_id, widget_id, operator, threshold }: any) {
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

  async updateAlarm(id: string, user_id: string, { description, widget_id, operator, threshold }: any) {
    try {
      const [result] = await this.db.query<ResultSetHeader>(
        `UPDATE alarms SET description = ?, widget_id = ?, operator = ?, threshold = ? WHERE id = ? AND user_id = ?`,
        [description, widget_id, operator, threshold, id, user_id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error updating alarm:", error);
      throw new Error("Failed to update alarm");
    }
  }

  async deleteAlarm(id: string, user_id: string) {
    try {
      const [result] = await this.db.query<ResultSetHeader>(
        "DELETE FROM alarms WHERE id = ? AND user_id = ?",
        [id, user_id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error deleting alarm:", error);
      throw new Error("Failed to delete alarm");
    }
  }
}
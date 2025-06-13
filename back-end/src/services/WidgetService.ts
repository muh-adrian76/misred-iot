import { Connection, ResultSetHeader } from "mysql2/promise";

export class WidgetService {
  private db: Connection;

  constructor(db: Connection) {
    this.db = db;
  }

  async createWidget({ description, device_id, sensor_type }: any) {
    try {
      const [result] = await this.db.query<ResultSetHeader>(
        `INSERT INTO widgets (description, device_id, sensor_type) VALUES (?, ?, ?)`,
        [description, device_id, sensor_type]
      );
      return result.insertId;
    } catch (error) {
      console.error("Error creating widget:", error);
      throw new Error("Failed to create widget");
    }
  }

  async getWidgetsByDashboardId(dashboardId: string) {
    try {
      const [rows] = await this.db.query(
        "SELECT * FROM widgets WHERE dashboard_id = ?",
        [dashboardId]
      );
      return rows;
    } catch (error) {
      console.error("Error fetching widgets by dashboard ID:", error);
      throw new Error("Failed to fetch widgets");
    }
  }

  async getWidgetsByDeviceId(device_id: string) {
    try {
      const [rows] = await this.db.query(
        "SELECT * FROM widgets WHERE device_id = ?",
        [device_id]
      );
      return rows;
    } catch (error) {
      console.error("Error fetching widgets by device ID:", error);
      throw new Error("Failed to fetch widgets");
    }
  }

  async updateWidget(id: string, { description, device_id, sensor_type }: any) {
    try {
      const [result] = await this.db.query<ResultSetHeader>(
        `UPDATE widgets SET description = ?, device_id = ?, sensor_type = ? WHERE id = ?`,
        [description, device_id, sensor_type, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error updating widget:", error);
      throw new Error("Failed to update widget");
    }
  }

  async deleteWidget(id: string) {
    try {
      const [result] = await this.db.query<ResultSetHeader>(
        "DELETE FROM widgets WHERE id = ?",
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error deleting widget:", error);
      throw new Error("Failed to delete widget");
    }
  }
}
import { Pool, ResultSetHeader } from "mysql2/promise";

export class WidgetService {
  private db: Pool;

  constructor(db: Pool) {
    this.db = db;
  }

  async createWidget({
    description,
    dashboard_id,
    device_id,
    datastream_id,
    type,
    layout,
  }: any) {
    try {
      const [result] = await this.db.query<ResultSetHeader>(
        `INSERT INTO widgets (description, dashboard_id, device_id, datastream_id, type, layout) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          description,
          dashboard_id,
          device_id,
          datastream_id,
          type,
          JSON.stringify(layout),
        ]
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

  async updateWidget(
    id: string,
    {
      description,
      dashboard_id,
      device_id,
      datastream_id,
      type,
      layout,
    }: any
  ) {
    try {
      const [result] = await this.db.query<ResultSetHeader>(
        `UPDATE widgets SET description = ?, dashboard_id = ?, device_id = ?, datastream_id = ?, type = ?, layout = ? WHERE id = ?`,
        [
          description,
          dashboard_id,
          device_id,
          datastream_id,
          type,
          JSON.stringify(layout),
          id,
        ]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error updating widget:", error);
      throw new Error("Failed to update widget");
    }
  }

  async updateWidgetLayout(id: string, layout: any) {
    try {
      const [result] = await this.db.query<ResultSetHeader>(
        `UPDATE widgets SET layout = ? WHERE id = ?`,
        [JSON.stringify(layout), id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error updating widget layout:", error);
      throw new Error("Failed to update widget layout");
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

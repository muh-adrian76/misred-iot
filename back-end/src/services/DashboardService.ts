import { Pool, ResultSetHeader } from "mysql2/promise";

export class DashboardService {
  private db: Pool;

  constructor(db: Pool) {
    this.db = db;
  }

  async getDashboardsByUserId(userId: string) {
    try {
      const [rows] = await this.db.query(
        "SELECT * FROM dashboards WHERE user_id = ?",
        [userId]
      );
      return rows;
    } catch (error) {
      console.error("Error fetching dashboards by user ID:", error);
      throw new Error("Failed to fetch dashboards");
    }
  }

  async createDashboard(userId: string, description: string, widgetCount: number, layout?: any) {
    try {
      const [result] = await this.db.query<ResultSetHeader>(
        "INSERT INTO dashboards (user_id, description, widget_count, layout) VALUES (?, ?, ?, ?)",
        [userId, description, widgetCount, layout ? JSON.stringify(layout) : null]
      );
      return result.insertId;
    } catch (error) {
      console.error("Error creating dashboard:", error);
      throw new Error("Failed to create dashboard");
    }
  }

  async updateDashboard(userId: string, dashboardId: string, description: string, widgetCount:number, layout?: any) {
    try {
      const [result] = await this.db.query<ResultSetHeader>(
        "UPDATE dashboards SET description = ?, layout = ?, widget_count = ? WHERE id = ? AND user_id = ?",
        [description, layout ? JSON.stringify(layout) : null, widgetCount, dashboardId, userId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error updating dashboard:", error);
      throw new Error("Failed to update dashboard");
    }
  }

  async deleteDashboard(userId: string, dashboardId: string) {
    try {
      const [result] = await this.db.query<ResultSetHeader>(
        "DELETE FROM dashboards WHERE id = ? AND user_id = ?",
        [dashboardId, userId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error deleting dashboard:", error);
      throw new Error("Failed to delete dashboard");
    }
  }
}
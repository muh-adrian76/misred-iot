/**
 * ===== DASHBOARD SERVICE =====
 * Service untuk mengelola dashboard user dalam sistem IoT
 * Menyediakan CRUD operations untuk dashboard dan layout management
 * 
 * Fitur utama:
 * - Get dashboard berdasarkan user ID
 * - Create dashboard baru dengan layout JSON
 * - Update dashboard dan layout widget
 * - Delete dashboard
 * - Widget count management
 */
import { Pool, ResultSetHeader } from "mysql2/promise";

export class DashboardService {
  private db: Pool;

  constructor(db: Pool) {
    this.db = db;
  }

  // ===== GET DASHBOARDS BY USER ID =====
  // Mengambil semua dashboard milik user tertentu
  async getDashboardsByUserId(userId: string) {
    try {
      const [rows] = await (this.db as any).safeQuery(
        "SELECT * FROM dashboards WHERE user_id = ?",
        [userId]
      );
      
      // Debug log untuk melihat struktur data dashboard
      // if (Array.isArray(rows)) {
      //   rows.forEach((dashboard: any) => {
      //     console.log(`Dashboard ${dashboard.id}:`, {
      //       description: dashboard.description,
      //       widget_count: dashboard.widget_count,
      //       layout_type: typeof dashboard.layout,
      //       layout_length: dashboard.layout ? dashboard.layout.length : 0,
      //       layout_preview: dashboard.layout ? dashboard.layout.substring(0, 100) + '...' : null
      //     });
      //   });
      // }
      
      return rows;
    } catch (error) {
      console.error("Error fetching dashboards by user ID:", error);
      throw new Error("Failed to fetch dashboards");
    }
  }

  // ===== CREATE DASHBOARD =====
  // Membuat dashboard baru dengan deskripsi, widget count, dan layout
  async createDashboard(userId: string, description: string, widgetCount: number, layout?: any) {
    try {
      const [result] = await (this.db as any).safeQuery(
        "INSERT INTO dashboards (user_id, description, widget_count, layout) VALUES (?, ?, ?, ?)",
        [userId, description, widgetCount, layout ? JSON.stringify(layout) : null]
      );
      return result.insertId;
    } catch (error) {
      console.error("Error creating dashboard:", error);
      throw new Error("Failed to create dashboard");
    }
  }

  // ===== UPDATE DASHBOARD =====
  // Update dashboard dengan deskripsi, widget count, dan layout baru
  async updateDashboard(userId: string, dashboardId: string, description: string, widgetCount:number, layout?: any) {
    try {
      if (layout) {
        // Debug layout untuk troubleshooting
        // console.log('Layout JSON string:', JSON.stringify(layout));
        // console.log('Layout JSON string length:', JSON.stringify(layout).length);
      }
      
      const [result] = await (this.db as any).safeQuery(
        "UPDATE dashboards SET description = ?, layout = ?, widget_count = ? WHERE id = ? AND user_id = ?",
        [description, layout ? JSON.stringify(layout) : null, widgetCount, dashboardId, userId]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error updating dashboard:", error);
      throw new Error("Failed to update dashboard");
    }
  }

  // ===== DELETE DASHBOARD =====
  // Menghapus dashboard berdasarkan ID dan user ID
  async deleteDashboard(userId: string, dashboardId: string) {
    try {
      const [result] = await (this.db as any).safeQuery(
        "DELETE FROM dashboards WHERE id = ? AND user_id = ?",
        [dashboardId, userId]
      );
      return result.affectedRows > 0;
    } catch (error: any) {
      console.error("Error deleting dashboard:", error);
      throw new Error(error.message);
    }
  }
}
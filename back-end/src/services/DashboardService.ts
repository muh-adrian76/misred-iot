/**
 * ===== DASHBOARD SERVICE =====
 * Service untuk mengelola dashboard user dalam sistem IoT
 * Menyediakan operasi CRUD untuk dashboard dan pengelolaan layout
 * 
 * Fitur utama:
 * - Ambil dashboard berdasarkan user ID
 * - Buat dashboard baru dengan layout JSON
 * - Perbarui dashboard dan layout widget
 * - Hapus dashboard
 * - Manajemen jumlah widget
 */
import { Pool, ResultSetHeader } from "mysql2/promise";

export class DashboardService {
  private db: Pool;

  constructor(db: Pool) {
    this.db = db;
  }

  // ===== AMBIL DASHBOARD BERDASARKAN USER ID =====
  // Mengambil semua dashboard milik user tertentu
  async getDashboardsByUserId(userId: string) {
    try {
      const [rows] = await (this.db as any).safeQuery(
        "SELECT * FROM dashboards WHERE user_id = ?",
        [userId]
      );
      
      // Log debug (opsional) untuk melihat struktur data dashboard
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
      console.error("Gagal mengambil dashboard berdasarkan user ID:", error);
      throw new Error("Gagal mengambil data dashboard");
    }
  }

  // ===== BUAT DASHBOARD =====
  // Membuat dashboard baru dengan deskripsi, jumlah widget, dan layout
  async createDashboard(userId: string, description: string, widgetCount: number, layout?: any) {
    try {
      const [result] = await (this.db as any).safeQuery(
        "INSERT INTO dashboards (user_id, description, widget_count, layout) VALUES (?, ?, ?, ?)",
        [userId, description, widgetCount, layout ? JSON.stringify(layout) : null]
      );
      return (result as any).insertId;
    } catch (error) {
      console.error("Gagal membuat dashboard:", error);
      throw new Error("Gagal membuat dashboard");
    }
  }

  // ===== PERBARUI DASHBOARD =====
  // Perbarui dashboard dengan deskripsi, jumlah widget, dan layout baru
  async updateDashboard(userId: string, dashboardId: string, description: string, widgetCount:number, layout?: any) {
    try {
      if (layout) {
        // Debug layout (opsional) untuk troubleshooting
        // console.log('String JSON layout:', JSON.stringify(layout));
        // console.log('Panjang string JSON layout:', JSON.stringify(layout).length);
      }
      
      const [result] = await (this.db as any).safeQuery(
        "UPDATE dashboards SET description = ?, layout = ?, widget_count = ? WHERE id = ? AND user_id = ?",
        [description, layout ? JSON.stringify(layout) : null, widgetCount, dashboardId, userId]
      );
      
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error("Gagal memperbarui dashboard:", error);
      throw new Error("Gagal memperbarui dashboard");
    }
  }

  // ===== HAPUS DASHBOARD =====
  // Menghapus dashboard berdasarkan ID dan user ID
  async deleteDashboard(userId: string, dashboardId: string) {
    try {
      const [result] = await (this.db as any).safeQuery(
        "DELETE FROM dashboards WHERE id = ? AND user_id = ?",
        [dashboardId, userId]
      );
      return (result as any).affectedRows > 0;
    } catch (error: any) {
      console.error("Gagal menghapus dashboard:", error);
      throw new Error(error.message);
    }
  }
}
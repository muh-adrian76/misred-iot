/**
 * ===== WIDGET SERVICE =====
 * Service untuk mengelola widgets dalam dashboard IoT
 * Menyediakan CRUD operations untuk widget management
 * 
 * Fitur utama:
 * - Widget CRUD operations (create, read, update, delete)
 * - Multi-format input support (inputs array, datastream_ids, single device/datastream)
 * - Dashboard integration dengan widget layouts
 * - Device-widget relationship management
 * - Backward compatibility untuk format lama
 * - JSON input handling untuk flexible widget configurations
 */
import { Pool, ResultSetHeader, FieldPacket } from "mysql2/promise";

export class WidgetService {
  private db: Pool;

  constructor(db: Pool) {
    this.db = db;
  }

  // ===== CREATE WIDGET =====
  // Membuat widget baru dengan support multiple input formats
  async createWidget({
    description,
    dashboard_id,
    device_id,
    datastream_id,
    datastream_ids,
    inputs,
    type,
  }: any) {
    try {
      // Convert ke format inputs baru dengan backward compatibility
      let finalInputs: any[];
      
      if (inputs && Array.isArray(inputs)) {
        // Format inputs langsung (preferred format)
        finalInputs = inputs;
      } else if (datastream_ids && Array.isArray(datastream_ids)) {
        // Format datastream_ids (compatibility)
        finalInputs = datastream_ids;
      } else if (device_id && datastream_id) {
        // Format lama single device/datastream (compatibility)
        finalInputs = [{ device_id: parseInt(device_id), datastream_id: parseInt(datastream_id) }];
      } else {
        throw new Error("Harus menyertakan salah satu: inputs, datastream_ids, atau gabungan device_id+datastream_id");
      }
      
      const query = `INSERT INTO widgets (description, dashboard_id, inputs, type) VALUES (?, ?, ?, ?)`;
      const params = [
        description,
        dashboard_id,
        JSON.stringify(finalInputs),  // Simpan sebagai JSON string
        type,
      ];
      
      const [result] = await (this.db as any).safeQuery(query, params);
      return result.insertId;
    } catch (error) {
      console.error("Gagal membuat widget:", error);
      throw new Error("Gagal membuat widget");
    }
  }

  // ===== GET WIDGETS BY DASHBOARD ID =====
  // Mengambil semua widget dalam dashboard tertentu
  async getWidgetsByDashboardId(dashboardId: string) {
    try {
      const [rows] = await (this.db as any).safeQuery(
        "SELECT * FROM widgets WHERE dashboard_id = ?",
        [dashboardId]
      );
      return rows;
    } catch (error) {
      console.error("Gagal mengambil widget berdasarkan ID dashboard:", error);
      throw new Error("Gagal mengambil widget");
    }
  }

  // ===== GET WIDGETS BY DEVICE ID =====
  // Mengambil widget yang menggunakan device tertentu
  async getWidgetsByDeviceId(device_id: string) {
    try {
      // Cari widget yang mengandung device_id dalam JSON inputs
      const [rows] = await (this.db as any).safeQuery(
        "SELECT * FROM widgets WHERE JSON_SEARCH(inputs, 'one', ?, NULL, '$[*].device_id') IS NOT NULL",
        [device_id]
      );
      return rows;
    } catch (error) {
      console.error("Gagal mengambil widget berdasarkan ID perangkat:", error);
      throw new Error("Gagal mengambil widget");
    }
  }

  // ===== UPDATE WIDGET =====
  // Update widget dengan support multiple input formats
  async updateWidget(
    id: string,
    {
      description,
      dashboard_id,
      device_id,
      datastream_id,
      datastream_ids,
      inputs,
      type,
    }: any
  ) {
    try {
      // Convert ke format inputs baru dengan backward compatibility
      let finalInputs: any[];
      
      if (inputs && Array.isArray(inputs)) {
        // Format inputs langsung (preferred format)
        finalInputs = inputs;
      } else if (datastream_ids && Array.isArray(datastream_ids)) {
        // Format datastream_ids (compatibility)
        finalInputs = datastream_ids;
      } else if (device_id && datastream_id) {
        // Format lama single device/datastream (compatibility)
        finalInputs = [{ device_id: parseInt(device_id), datastream_id: parseInt(datastream_id) }];
      } else {
        throw new Error("Harus menyertakan salah satu: inputs, datastream_ids, atau gabungan device_id+datastream_id");
      }
      
      const query = `UPDATE widgets SET description = ?, dashboard_id = ?, inputs = ?, type = ? WHERE id = ?`;
      const params = [
        description,
        dashboard_id,
        JSON.stringify(finalInputs),  // Update sebagai JSON string
        type,
        id,
      ];
      
      const [result] = await (this.db as any).safeQuery(query, params);
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Gagal memperbarui widget:", error);
      throw new Error("Gagal memperbarui widget");
    }
  }

  // ===== DELETE WIDGET =====
  // Menghapus widget berdasarkan ID
  async deleteWidget(id: string) {
    try {
      const [result] = await (this.db as any).safeQuery(
        "DELETE FROM widgets WHERE id = ?",
        [id]
      ) as [ResultSetHeader, FieldPacket[]];
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Gagal menghapus widget:", error);
      throw new Error("Gagal menghapus widget");
    }
  }
}
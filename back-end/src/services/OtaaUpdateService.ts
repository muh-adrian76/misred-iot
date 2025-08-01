/**
 * ===== OTAA UPDATE SERVICE =====
 * Service untuk mengelola Over-The-Air (OTA) firmware updates
 * Menyediakan upload, management, dan distribusi firmware untuk IoT devices
 * 
 * Fitur utama:
 * - Firmware upload dan versioning per board type
 * - Multi-user firmware management
 * - Automatic old firmware cleanup
 * - Firmware update checking untuk devices
 * - File management dengan path handling
 * - Board type compatibility checking
 */
import { Pool, ResultSetHeader } from "mysql2/promise";
import { existsSync, unlinkSync } from "fs";

export class OtaaUpdateService {
  private db: Pool;

  constructor(db: Pool) {
    this.db = db;
  }

  // ===== CREATE OR UPDATE FIRMWARE =====
  // Membuat atau update firmware untuk board type tertentu
  async createOrUpdateFirmware({
    board_type,
    firmware_version,
    firmware_url,
    user_id,
  }: {
    board_type: string;
    firmware_version: string;
    firmware_url: string;
    user_id: number;
  }) {
    try {
      // Cek apakah firmware sudah ada untuk board type dan user ini
      const [existing]: any = await this.db.query(
        "SELECT id, firmware_url FROM otaa_updates WHERE board_type = ? AND user_id = ?",
        [board_type, user_id]
      );

      if (existing.length > 0) {
        // Hapus file firmware lama jika ada
        if (existing[0].firmware_url) {
          try {
            const oldFilePath = existing[0].firmware_url.replace('/public/', `${process.cwd()}/src/assets/`);
            if (existsSync(oldFilePath)) {
              unlinkSync(oldFilePath);
            }
          } catch (error) {
            console.warn("Failed to delete old firmware file:", error);
          }
        }

        // Update firmware yang sudah ada
        await this.db.query(
          "UPDATE otaa_updates SET firmware_version = ?, firmware_url = ?, updated_at = CURRENT_TIMESTAMP WHERE board_type = ? AND user_id = ?",
          [firmware_version, firmware_url, board_type, user_id]
        );
        return existing[0].id;
      } else {
        // Buat entry firmware baru
        const [result] = await this.db.query<ResultSetHeader>(
          "INSERT INTO otaa_updates (board_type, firmware_version, firmware_url, user_id) VALUES (?, ?, ?, ?)",
          [board_type, firmware_version, firmware_url, user_id]
        );
        return result.insertId;
      }
    } catch (error) {
      console.error("Error creating/updating firmware:", error);
      throw new Error("Failed to save firmware");
    }
  }

  // ===== GET FIRMWARE BY BOARD TYPE =====
  // Mengambil firmware berdasarkan tipe board dan user
  async getFirmwareByBoardType(board_type: string, user_id?: number) {
    try {
      let query = "SELECT * FROM otaa_updates WHERE board_type = ? ORDER BY updated_at DESC LIMIT 1";
      let params: any[] = [board_type];
      
      if (user_id) {
        query = "SELECT * FROM otaa_updates WHERE board_type = ? AND user_id = ? ORDER BY updated_at DESC LIMIT 1";
        params = [board_type, user_id];
      }

      const [rows]: any = await this.db.query(query, params);
      return rows[0] || null;
    } catch (error) {
      console.error("Error fetching firmware by board type:", error);
      throw new Error("Failed to fetch firmware");
    }
  }

  // ===== GET ALL FIRMWARES =====
  // Mengambil semua firmware milik user tertentu
  async getAllFirmwares(user_id: number) {
    try {
      const query = "SELECT * FROM otaa_updates WHERE user_id = ? ORDER BY updated_at DESC";
      const params = [user_id];

      const [rows] = await this.db.query(query, params);
      return rows;
    } catch (error) {
      console.error("Error fetching all firmwares:", error);
      throw new Error("Failed to fetch firmwares");
    }
  }

  // ===== DELETE FIRMWARE =====
  // Menghapus firmware beserta file fisiknya
  async deleteFirmware(id: string, user_id: number) {
    try {
      console.log(`🗑️ [DELETE FIRMWARE] Starting deletion for ID: ${id}, User: ${user_id}`);
      
      // Get firmware info sebelum menghapus
      const [firmware]: any = await this.db.query(
        "SELECT firmware_url FROM otaa_updates WHERE id = ? AND user_id = ?",
        [id, user_id]
      );

      if (firmware.length > 0 && firmware[0].firmware_url) {
        // Hapus file fisik dari storage
        try {
          const filePath = firmware[0].firmware_url.replace('/public/', `${process.cwd()}/src/assets/`);
          console.log(`🔍 [DELETE FIRMWARE] Attempting to delete file: ${filePath}`);
          
          // Cek apakah file ada sebelum mencoba menghapus
          if (existsSync(filePath)) {
            unlinkSync(filePath); // Hapus file secara sinkron
            console.log(`✅ [DELETE FIRMWARE] Successfully deleted firmware file: ${filePath}`);
          } else {
            console.warn(`⚠️ [DELETE FIRMWARE] File not found: ${filePath}`);
          }
        } catch (fileError) {
          console.error(`❌ [DELETE FIRMWARE] Failed to delete firmware file:`, fileError);
        }
      } else {
        console.warn(`⚠️ [DELETE FIRMWARE] No firmware found with ID ${id} for user ${user_id}`);
      }

      // Hapus dari database
      const [result] = await this.db.query<ResultSetHeader>(
        "DELETE FROM otaa_updates WHERE id = ? AND user_id = ?",
        [id, user_id]
      );
      
      const success = result.affectedRows > 0;
      console.log(`${success ? '✅' : '❌'} [DELETE FIRMWARE] Database deletion result: ${result.affectedRows} rows affected`);
      
      return success;
    } catch (error) {
      console.error("❌ [DELETE FIRMWARE] Error deleting firmware:", error);
      throw new Error("Failed to delete firmware");
    }
  }

  async checkFirmwareUpdate(device_id: string) {
    try {
      // Get device board type and current firmware version
      const [device]: any = await this.db.query(
        "SELECT board_type, firmware_version FROM devices WHERE id = ?",
        [device_id]
      );

      if (device.length === 0) {
        throw new Error("Device not found");
      }

      const { board_type, firmware_version: currentVersion } = device[0];

      // Get latest firmware for this board type
      const latestFirmware = await this.getFirmwareByBoardType(board_type);

      if (!latestFirmware) {
        return {
          hasUpdate: false,
          message: "No firmware available for this board type"
        };
      }

      const hasUpdate = latestFirmware.firmware_version !== currentVersion;

      return {
        hasUpdate,
        currentVersion,
        latestVersion: latestFirmware.firmware_version,
        firmwareUrl: hasUpdate ? latestFirmware.firmware_url : null,
        message: hasUpdate 
          ? "Firmware update available" 
          : "Device is up to date"
      };
    } catch (error) {
      console.error("Error checking firmware update:", error);
      throw new Error("Failed to check firmware update");
    }
  }
}

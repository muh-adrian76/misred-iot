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
import { Pool, ResultSetHeader, FieldPacket } from "mysql2/promise";
import { existsSync, unlinkSync } from "fs";

export class OtaaUpdateService {
  private db: Pool;

  constructor(db: Pool) {
    this.db = db;
  }

  /**
   * Get database connection for external use
   */
  public getDatabase(): Pool {
    return this.db;
  }

  // ===== CREATE OR UPDATE FIRMWARE =====
  // Membuat atau update firmware untuk board type tertentu
  async createOrUpdateFirmware({
    board_type,
    firmware_version,
    firmware_url,
    user_id,
    file_size,
    original_filename,
    checksum,
    description,
  }: {
    board_type: string;
    firmware_version: string;
    firmware_url: string;
    user_id: number;
    file_size?: number;
    original_filename?: string;
    checksum?: string;
    description?: string;
  }) {
    try {
      // Cek apakah firmware sudah ada untuk board type dan user ini
      const [existing]: any = await (this.db as any).safeQuery(
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
        await (this.db as any).safeQuery(
          `UPDATE otaa_updates SET 
           firmware_version = ?, 
           firmware_url = ?, 
           file_size = ?, 
           original_filename = ?, 
           checksum = ?, 
           description = ?, 
           updated_at = CURRENT_TIMESTAMP 
           WHERE board_type = ? AND user_id = ?`,
          [firmware_version, firmware_url, file_size, original_filename, checksum, description, board_type, user_id]
        );
        return existing[0].id;
      } else {
        // Buat entry firmware baru
        const [result] = await (this.db as any).safeQuery(
          `INSERT INTO otaa_updates (board_type, firmware_version, firmware_url, user_id, file_size, original_filename, checksum, description) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [board_type, firmware_version, firmware_url, user_id, file_size, original_filename, checksum, description]
        ) as [ResultSetHeader, FieldPacket[]];
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

      const [rows]: any = await (this.db as any).safeQuery(query, params);
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

      const [rows] = await (this.db as any).safeQuery(query, params);
      return rows;
    } catch (error) {
      console.error("Error fetching all firmwares:", error);
      throw new Error("Failed to fetch firmwares");
    }
  }

  // ===== GET ALL FIRMWARES FOR ADMIN =====
  // Mengambil semua firmware dari semua user (khusus admin)
  async getAllFirmwaresForAdmin() {
    try {
      const query = `
        SELECT 
          o.*,
          u.name as owner_name,
          u.email as owner_email,
          CASE 
            WHEN o.user_id = 0 THEN 'Global (Admin)'
            ELSE CONCAT(u.name, ' (', u.email, ')')
          END as owner_display
        FROM otaa_updates o
        LEFT JOIN users u ON o.user_id = u.id
        ORDER BY o.user_id ASC, o.updated_at DESC
      `;

      const [rows] = await (this.db as any).safeQuery(query);
      return rows;
    } catch (error) {
      console.error("Error fetching all firmwares for admin:", error);
      throw new Error("Failed to fetch firmwares for admin");
    }
  }

  // ===== GET GLOBAL FIRMWARES GROUPED BY BOARD TYPE =====
  // Mengambil firmware global yang dikelompokkan berdasarkan board type dengan versioning
  async getGlobalFirmwaresGroupedByBoard() {
    try {
      const query = `
        SELECT 
          board_type,
          firmware_version,
          firmware_url,
          file_size,
          original_filename,
          description,
          updated_at,
          id
        FROM otaa_updates 
        WHERE user_id = 0 
        ORDER BY board_type ASC, updated_at DESC
      `;

      const [rows]: any = await (this.db as any).safeQuery(query);
      
      // Group by board type
      const groupedFirmwares = rows.reduce((groups: any, firmware: any) => {
        const boardType = firmware.board_type;
        if (!groups[boardType]) {
          groups[boardType] = [];
        }
        groups[boardType].push(firmware);
        return groups;
      }, {});

      return groupedFirmwares;
    } catch (error) {
      console.error("Error fetching global firmwares grouped by board:", error);
      throw new Error("Failed to fetch global firmwares grouped by board");
    }
  }

  // ===== CREATE GLOBAL FIRMWARE WITH VERSIONING =====
  // Admin mengupload firmware global dengan support versioning (tidak menimpa file lama)
  async createGlobalFirmwareWithVersioning({
    board_type,
    firmware_version,
    firmware_url,
    file_size,
    original_filename,
    checksum,
    description,
  }: {
    board_type: string;
    firmware_version: string;
    firmware_url: string;
    file_size?: number;
    original_filename?: string;
    checksum?: string;
    description?: string;
  }) {
    try {
      // Cek apakah sudah ada firmware dengan versi yang sama
      const [existing]: any = await (this.db as any).safeQuery(
        "SELECT id FROM otaa_updates WHERE board_type = ? AND firmware_version = ? AND user_id = 0",
        [board_type, firmware_version]
      );

      if (existing.length > 0) {
        throw new Error(`Firmware global untuk ${board_type} versi ${firmware_version} sudah ada`);
      }

      // Buat entry global firmware baru (user_id = 0 untuk global)
      const [result] = await (this.db as any).safeQuery(
        `INSERT INTO otaa_updates (board_type, firmware_version, firmware_url, user_id, file_size, original_filename, checksum, description) 
         VALUES (?, ?, ?, 0, ?, ?, ?, ?)`,
        [board_type, firmware_version, firmware_url, file_size, original_filename, checksum, description]
      ) as [ResultSetHeader, FieldPacket[]];
      return result.insertId;
    } catch (error) {
      console.error("Error creating global firmware with versioning:", error);
      throw error; // Re-throw untuk handling di API
    }
  }

  // ===== CREATE GLOBAL FIRMWARE (ADMIN ONLY) =====
  // Admin mengupload firmware global yang tersedia untuk semua user
  async createGlobalFirmware({
    board_type,
    firmware_version,
    firmware_url,
  }: {
    board_type: string;
    firmware_version: string;
    firmware_url: string;
  }) {
    try {
      // Cek apakah sudah ada global firmware untuk board type ini
      const [existing]: any = await (this.db as any).safeQuery(
        "SELECT id, firmware_url FROM otaa_updates WHERE board_type = ? AND user_id = 0",
        [board_type]
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
            console.warn("Failed to delete old global firmware file:", error);
          }
        }

        // Update global firmware yang sudah ada
        await (this.db as any).safeQuery(
          "UPDATE otaa_updates SET firmware_version = ?, firmware_url = ?, updated_at = CURRENT_TIMESTAMP WHERE board_type = ? AND user_id = 0",
          [firmware_version, firmware_url, board_type]
        );
        return existing[0].id;
      } else {
        // Buat entry global firmware baru (user_id = 0 untuk global)
        const [result] = await (this.db as any).safeQuery(
          "INSERT INTO otaa_updates (board_type, firmware_version, firmware_url, user_id) VALUES (?, ?, ?, 0)",
          [board_type, firmware_version, firmware_url]
        ) as [ResultSetHeader, FieldPacket[]];
        return result.insertId;
      }
    } catch (error) {
      console.error("Error creating global firmware:", error);
      throw new Error("Failed to save global firmware");
    }
  }

  // ===== GET LATEST FIRMWARE FOR USER =====
  // Mengambil firmware terbaru untuk user (prioritas: user firmware > global firmware)
  async getLatestFirmwareForUser(board_type: string, user_id: number) {
    try {
      // Cari firmware user terlebih dahulu
      const userFirmware = await this.getFirmwareByBoardType(board_type, user_id);
      if (userFirmware) {
        return { ...userFirmware, source: 'user' };
      }

      // Jika tidak ada, cari global firmware
      const globalFirmware = await this.getFirmwareByBoardType(board_type, 0);
      if (globalFirmware) {
        return { ...globalFirmware, source: 'global' };
      }

      return null;
    } catch (error) {
      console.error("Error getting latest firmware for user:", error);
      throw new Error("Failed to get latest firmware");
    }
  }

  // ===== GET FIRMWARE INFO BY ID =====
  // Mengambil informasi firmware berdasarkan ID
  async getFirmwareById(firmware_id: number) {
    try {
      const [rows]: any = await (this.db as any).safeQuery(
        "SELECT * FROM otaa_updates WHERE id = ?",
        [firmware_id]
      );
      return rows[0] || null;
    } catch (error) {
      console.error("Error getting firmware by ID:", error);
      throw new Error("Failed to get firmware info");
    }
  }

  // ===== GET USERS WITH DEVICES FOR BOARD TYPE =====
  // Mengambil daftar user yang memiliki device dengan board type tertentu
  async getUsersWithBoardType(board_type: string) {
    try {
      const query = `
        SELECT DISTINCT u.id, u.name, u.email, u.refresh_token
        FROM users u
        JOIN devices d ON u.id = d.user_id
        WHERE d.board_type = ? AND u.refresh_token IS NOT NULL
      `;

      const [rows] = await (this.db as any).safeQuery(query, [board_type]);
      return rows;
    } catch (error) {
      console.error("Error getting users with board type:", error);
      throw new Error("Failed to get users with board type");
    }
  }

  // ===== DELETE FIRMWARE =====
  // Menghapus firmware beserta file fisiknya
  async deleteFirmware(id: string, user_id: number) {
    try {
      console.log(`🗑️ [DELETE FIRMWARE] Starting deletion for ID: ${id}, User: ${user_id}`);
      
      // Get firmware info sebelum menghapus
      const [firmware]: any = await (this.db as any).safeQuery(
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
      const [result] = await (this.db as any).safeQuery(
        "DELETE FROM otaa_updates WHERE id = ? AND user_id = ?",
        [id, user_id]
      ) as [ResultSetHeader, FieldPacket[]];
      
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
      // Get device board type, current firmware version, and user_id
      const [device]: any = await (this.db as any).safeQuery(
        "SELECT board_type, firmware_version, user_id FROM devices WHERE id = ?",
        [device_id]
      );

      if (device.length === 0) {
        throw new Error("Device not found");
      }

      const { board_type, firmware_version: currentVersion, user_id } = device[0];

      // Get latest firmware for this user (prioritas: user firmware > global firmware)
      const latestFirmware = await this.getLatestFirmwareForUser(board_type, user_id);

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
        firmwareSource: latestFirmware.source, // 'user' atau 'global'
        message: hasUpdate 
          ? `Firmware update available from ${latestFirmware.source === 'global' ? 'Global Repository' : 'Your Upload'}` 
          : "Device is up to date"
      };
    } catch (error) {
      console.error("Error checking firmware update:", error);
      throw new Error("Failed to check firmware update");
    }
  }
}

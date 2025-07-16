import { Pool, ResultSetHeader } from "mysql2/promise";
import { existsSync, unlinkSync } from "fs";

export class OtaaUpdateService {
  private db: Pool;

  constructor(db: Pool) {
    this.db = db;
  }

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
      // Check if firmware already exists for this board type and user
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

        // Update existing firmware
        await this.db.query(
          "UPDATE otaa_updates SET firmware_version = ?, firmware_url = ?, updated_at = CURRENT_TIMESTAMP WHERE board_type = ? AND user_id = ?",
          [firmware_version, firmware_url, board_type, user_id]
        );
        return existing[0].id;
      } else {
        // Create new firmware entry
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

  async deleteFirmware(id: string, user_id: number) {
    try {
      // Get firmware info before deleting
      const [firmware]: any = await this.db.query(
        "SELECT firmware_url FROM otaa_updates WHERE id = ? AND user_id = ?",
        [id, user_id]
      );

      if (firmware.length > 0 && firmware[0].firmware_url) {
        // Delete physical file
        try {
          const filePath = firmware[0].firmware_url.replace('/public/', `${process.cwd()}/src/assets/`);
          await Bun.write(filePath, ''); // Delete file
          console.log(`🗑️ Deleted firmware file: ${filePath}`);
        } catch (error) {
          console.warn("Failed to delete firmware file:", error);
        }
      }

      // Delete from database
      const [result] = await this.db.query<ResultSetHeader>(
        "DELETE FROM otaa_updates WHERE id = ? AND user_id = ?",
        [id, user_id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error deleting firmware:", error);
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

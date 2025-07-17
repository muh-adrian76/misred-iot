import { Pool, ResultSetHeader } from "mysql2/promise";
import { randomBytes } from "crypto";
import { OtaaUpdateService } from "./OtaaUpdateService";

export class DeviceService {
  private db: Pool;
  private otaaService: OtaaUpdateService;
  private onSubscribeTopic?: (topic: string) => void;
  private onUnsubscribeTopic?: (topic: string) => void;

  constructor(
    db: Pool,
    otaaService: OtaaUpdateService,
    onSubscribeTopic?: (topic: string) => void,
    onUnsubscribeTopic?: (topic: string) => void
  ) {
    this.db = db;
    this.otaaService = otaaService;
    this.onSubscribeTopic = onSubscribeTopic;
    this.onUnsubscribeTopic = onUnsubscribeTopic;
  }

  async createDevice({
    name,
    board,
    protocol,
    topic,
    // qos,
    dev_eui,
    app_eui,
    app_key,
    new_secret,
    user_id,
  }: any) {
    try {
      const [result] = await this.db.query<ResultSetHeader>(
        `INSERT INTO devices 
      (description, board_type, protocol, mqtt_topic, dev_eui, app_eui, app_key, new_secret, user_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          name,
          board,
          protocol,
          topic ?? null,
          // qos ?? null,
          dev_eui ?? null,
          app_eui ?? null,
          app_key ?? null,
          new_secret,
          user_id,
        ]
      );
      const id = result.insertId;

      // Integrasi broker MQTT
      if (topic) {
        // const uniqueTopic = `${id}/${topic}`;
        const uniqueTopic = topic;
        await this.db.query("UPDATE devices SET mqtt_topic = ? WHERE id = ?", [
          uniqueTopic,
          id,
        ]);
        if (topic && this.onSubscribeTopic) {
          this.onSubscribeTopic(uniqueTopic);
        }
      }

      return id;
    } catch (error) {
      console.error("Error creating device:", error);
      throw new Error("Failed to create device");
    }
  }

  async getAllUserDevices(user_id: string) {
    try {
      const [rows] = await this.db.query(
        "SELECT * FROM devices WHERE user_id = ?",
        [user_id]
      );
      return rows;
    } catch (error) {
      console.error("Error fetching all devices:", error);
      throw new Error("Failed to fetch devices");
    }
  }

  async getDeviceById(id: string) {
    try {
      const [rows] = await this.db.query("SELECT * FROM devices WHERE id = ?", [
        id,
      ]);
      return rows;
    } catch (error) {
      console.error("Error fetching device by ID:", error);
      throw new Error("Failed to fetch device");
    }
  }

  async getSecretByDevice(id: string) {
    try {
      const [rows] = await this.db.query(
        "SELECT new_secret FROM devices WHERE id = ?",
        [id]
      );
      return rows;
    } catch (error) {
      console.error("Error fetching device by secret:", error);
      throw new Error("Failed to fetch device by secret");
    }
  }

  async getNewSecret(id: string, old_secret: string) {
    try {
      const [rows]: any = await this.db.query(
        "SELECT new_secret FROM devices WHERE id = ? AND old_secret = ?",
        [id, old_secret]
      );
      if (rows.length === 0) {
        throw new Error("Secret lama tidak sesuai");
      }
      return rows[0].new_secret;
    } catch (error) {
      console.error("Error verifying old secret:", error);
      throw new Error("Failed to verify old secret");
    }
  }

  async getFirmwareVersion(id: string) {
    try {
      // Get device info dengan user_id
      const [rows]: any = await this.db.query(
        "SELECT board_type, firmware_version, user_id FROM devices WHERE id = ?",
        [id]
      );
      
      if (rows.length === 0) {
        throw new Error("Device tidak valid");
      }

      const { board_type, firmware_version: currentVersion, user_id } = rows[0];

      // Get latest firmware from OTAA system berdasarkan user_id
      const latestFirmware = await this.otaaService.getFirmwareByBoardType(board_type, user_id);
      
      return {
        firmware_version: latestFirmware?.firmware_version || currentVersion || "1.0.0",
        current_version: currentVersion,
        board_type: board_type,
        user_id: user_id
      };
    } catch (error) {
      console.error("Error getting firmware version:", error);
      throw new Error("Failed to get firmware version");
    }
  }

  async updateFirmwareUrl(
    id: string,
    firmware_version: string,
    firmware_url: string
  ) {
    try {
      // Update device's current firmware version when it gets updated
      await this.db.query(
        "UPDATE devices SET firmware_version = ? WHERE id = ?",
        [firmware_version, id]
      );
      const [updatedTime]: any = await this.db.query(
        "SELECT updated_at FROM devices WHERE id = ?",
        [id]
      );
      return updatedTime[0]?.updated_at || new Date();
    } catch (error) {
      console.error("Error updating firmware version:", error);
      throw new Error("Failed to update firmware version");
    }
  }

  async getFirmwareList(id: string) {
    try {
      // Get device board type dan user_id
      const [rows]: any = await this.db.query(
        "SELECT board_type, user_id FROM devices WHERE id = ?",
        [id]
      );
      
      if (rows.length === 0) {
        throw new Error("Device tidak valid");
      }

      const { board_type, user_id } = rows[0];

      // Get firmware from OTAA system berdasarkan user_id
      const firmware = await this.otaaService.getFirmwareByBoardType(board_type, user_id);
      
      if (!firmware) {
        return [];
      }

      // Extract filename from firmware_url
      const filename = firmware.firmware_url.split('/').pop();
      
      return [{
        name: filename,
        url: `/device/firmware/${id}/${filename}`,
        version: firmware.firmware_version
      }];
    } catch (error) {
      console.error("Error getting firmware list:", error);
      throw new Error("Failed to get firmware list");
    }
  }

  async getFirmwareFile(id: string, filename: string) {
    try {
      // Get device board type dan user_id
      const [rows]: any = await this.db.query(
        "SELECT board_type, user_id FROM devices WHERE id = ?",
        [id]
      );
      
      if (rows.length === 0) {
        throw new Error("Device tidak valid");
      }

      const { board_type, user_id } = rows[0];

      // Get firmware from OTAA system berdasarkan user_id
      const firmware = await this.otaaService.getFirmwareByBoardType(board_type, user_id);
      
      if (!firmware) {
        throw new Error("Firmware tidak ditemukan");
      }

      // Convert firmware_url to actual file path
      const filePath = firmware.firmware_url.replace('/public/', `${process.cwd()}/src/assets/`);
      
      return filePath;
    } catch (error) {
      console.error("Error getting firmware file:", error);
      throw new Error("Failed to get firmware file");
    }
  }

  async getFirmwareUrl(id: string) {
    try {
      // Get device info dengan user_id
      const [rows]: any = await this.db.query(
        "SELECT board_type, user_id FROM devices WHERE id = ?",
        [id]
      );
      
      if (rows.length === 0) {
        throw new Error("Device tidak valid");
      }

      const { board_type, user_id } = rows[0];

      // Get firmware from OTAA system berdasarkan user_id
      const firmware = await this.otaaService.getFirmwareByBoardType(board_type, user_id);
      
      if (!firmware || !firmware.firmware_url) {
        throw new Error("No firmware available for this board type");
      }
      
      return firmware.firmware_url;
    } catch (error) {
      console.error("Error getting firmware URL:", error);
      throw new Error("Failed to get firmware URL");
    }
  }

  async refreshAllDeviceSecrets() {
    try {
      // 1. Ambil semua device
      const [devices]: any = await this.db.query(
        "SELECT id, new_secret FROM devices"
      );
      for (const device of devices) {
        const newSecret = randomBytes(16).toString("hex");
        // 2. Simpan secret lama ke old_secret, update new_secret
        await this.db.query(
          "UPDATE devices SET old_secret = ?, new_secret = ? WHERE id = ?",
          [device.new_secret, newSecret, device.id]
        );
        // console.log(`🔄 Secret key untuk device ${device.id} diganti otomatis`);
      }
    } catch (error) {
      console.error("Error refreshing device secrets:", error);
      throw new Error("Failed to refresh device secrets");
    }
  }

  async updateDevice(
    id: string,
    userId: string,
    {
      name,
      board,
      protocol,
      mqtt_topic,
      // mqtt_qos,
      dev_eui,
      app_eui,
      app_key,
      firmware_version,
    }: any
  ) {
    try {
      // Topik MQTT
      const [rows]: any = await this.db.query(
        "SELECT mqtt_topic FROM devices WHERE id = ?",
        [id]
      );
      const oldTopic = rows[0]?.mqtt_topic;

      let uniqueTopic: string | null = null;
      if (mqtt_topic) {
        // Pastikan hanya satu id di depan
        let topic = mqtt_topic;
        // const prefix = `${id}/`;
        // if (topic.startsWith(prefix)) {
        //   topic = topic.slice(prefix.length);
        // }
        // uniqueTopic = `${id}/${topic}`;
        uniqueTopic = topic;
      }

      const [result] = await this.db.query<ResultSetHeader>(
        `UPDATE devices SET description = ?, board_type = ?, protocol = ?, mqtt_topic = ?, dev_eui = ?, app_eui = ?, app_key = ?, firmware_version = ?
      WHERE id = ? AND user_id = ?`,
        [
          name,
          board,
          protocol,
          uniqueTopic ?? null,
          // mqtt_qos ?? null,
          dev_eui ?? null,
          app_eui ?? null,
          app_key ?? null,
          firmware_version ?? null,
          id,
          userId,
        ]
      );

      // MQTT
      if (oldTopic && oldTopic !== uniqueTopic && this.onUnsubscribeTopic) {
        this.onUnsubscribeTopic(oldTopic);
      }
      if (uniqueTopic && this.onSubscribeTopic) {
        this.onSubscribeTopic(uniqueTopic);
      }

      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error updating device:", error);
      throw new Error("Failed to update device");
    }
  }

  async deleteDevice(id: string, userId: string) {
    try {
      await this.db.query("DELETE FROM payloads WHERE device_id = ?", [id]);
      await this.db.query("DELETE FROM widgets WHERE device_id = ?", [id]);
      const [result] = await this.db.query<ResultSetHeader>(
        "DELETE FROM devices WHERE id = ? AND user_id = ?",
        [id, userId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error deleting device:", error);
      throw new Error("Failed to delete device");
    }
  }

  /**
   * Update firmware version untuk device (dipanggil oleh ESP32 setelah OTA berhasil)
   */
  async updateDeviceFirmwareVersion(deviceId: string, firmwareVersion: string): Promise<boolean> {
    try {
      const [result] = await this.db.query<ResultSetHeader>(
        "UPDATE devices SET firmware_version = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [firmwareVersion, deviceId]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error updating device firmware version:", error);
      throw new Error("Failed to update device firmware version");
    }
  }
}

import { Connection, ResultSetHeader } from "mysql2/promise";

export class DeviceService {
  private db: Connection;

  constructor(db: Connection) {
    this.db = db;
  }

  async createDevice({ name, board, protocol, topic, qos, loraProfile, aesKey }: any) {
    try {
      const [result] = await this.db.query<ResultSetHeader>(
        "INSERT INTO devices (description, board_type, protocol, mqtt_topic, mqtt_qos, lora_profile, refresh_token) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [name, board, protocol, topic ?? null, qos ?? null, loraProfile ?? null, aesKey]
      );
      return result.insertId;
    } catch (error) {
      console.error("Error creating device:", error);
      throw new Error("Failed to create device");
    }
  }

  async getAllDevices() {
    try {
      const [rows] = await this.db.query("SELECT * FROM devices");
      return rows;
    } catch (error) {
      console.error("Error fetching all devices:", error);
      throw new Error("Failed to fetch devices");
    }
  }

  async getDeviceById(id: string) {
    try {
      const [rows] = await this.db.query("SELECT * FROM devices WHERE id = ?", [id]);
      return rows;
    } catch (error) {
      console.error("Error fetching device by ID:", error);
      throw new Error("Failed to fetch device");
    }
  }

  async updateDevice(id: string, { name, board, protocol, topic, qos, lora_profile }: any) {
    try {
      const [result] = await this.db.query<ResultSetHeader>(
        "UPDATE devices SET description = ?, board_type = ?, protocol = ?, mqtt_topic = ?, mqtt_qos = ?, lora_profile = ? WHERE id = ?",
        [name, board, protocol, topic ?? null, qos ?? null, lora_profile ?? null, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error updating device:", error);
      throw new Error("Failed to update device");
    }
  }

  async deleteDevice(id: string) {
    try {
      await this.db.query("DELETE FROM payloads WHERE devices_id = ?", [id]);
      await this.db.query("DELETE FROM widgets WHERE devices_id = ?", [id]);
      await this.db.query("DELETE FROM alarms WHERE devices_id = ?", [id]);
      const [result] = await this.db.query<ResultSetHeader>(
        "DELETE FROM devices WHERE id = ?", [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error deleting device:", error);
      throw new Error("Failed to delete device");
    }
  }
}
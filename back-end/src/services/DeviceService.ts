import { Connection, ResultSetHeader } from "mysql2/promise";

export class DeviceService {
  private db: Connection;

  constructor(db: Connection) {
    this.db = db;
  }

  async createDevice({ name, board, protocol, topic, qos, loraProfile, aesKey }: any) {
    const [result] = await this.db.query<ResultSetHeader>(
      "INSERT INTO devices (description, board_type, protocol, mqtt_topic, mqtt_qos, lora_profile, refresh_token) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        name,
        board,
        protocol,
        topic ?? null,
        qos ?? null,
        loraProfile ?? null,
        aesKey,
      ]
    );
    return result.insertId;
  }

  async getAllDevices() {
    const [rows] = await this.db.query("SELECT * FROM devices");
    return rows;
  }

  async getDeviceById(id: string) {
    const [rows] = await this.db.query("SELECT * FROM devices WHERE id = ?", [id]);
    return rows;
  }

  async updateDevice(id: string, { name, board, protocol, topic, qos, lora_profile }: any) {
    const [result] = await this.db.query<ResultSetHeader>(
      "UPDATE devices SET description = ?, board_type = ?, protocol = ?, mqtt_topic = ?, mqtt_qos = ?, lora_profile = ? WHERE id = ?",
      [
        name,
        board,
        protocol,
        topic ?? null,
        qos ?? null,
        lora_profile ?? null,
        id,
      ]
    );
    return result.affectedRows > 0;
  }

  async deleteDevice(id: string) {
    await this.db.query("DELETE FROM payloads WHERE devices_id = ?", [id]);
    await this.db.query("DELETE FROM widgets WHERE devices_id = ?", [id]);
    await this.db.query("DELETE FROM alarms WHERE devices_id = ?", [id]);
    const [result] = await this.db.query<ResultSetHeader>(
      "DELETE FROM devices WHERE id = ?", [id]
    );
    return result.affectedRows > 0;
  }
}
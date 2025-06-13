import { Connection, ResultSetHeader } from "mysql2/promise";

export class PayloadService {
  private db: Connection;

  constructor(db: Connection) {
    this.db = db;
  }

  async saveHttpPayload(data: any): Promise<number> {
    try {
      const [result] = await this.db.query<ResultSetHeader>(
        `INSERT INTO payloads (device_id, ph, cod, tss, nh3n, flow, server_time)
        VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [data.device_id, data.ph, data.cod, data.tss, data.nh3n, data.flow]
      );
      return result.insertId;
    } catch (error) {
      console.error("Error saving HTTP payload:", error);
      throw new Error("Failed to save HTTP payload");
    }
  }

  async getAll() {
    try {
      const [rows] = await this.db.query("SELECT * FROM payloads");
      return rows;
    } catch (error) {
      console.error("Error fetching all payloads:", error);
      throw new Error("Failed to fetch payloads");
    }
  }

  async getByDeviceId(device_id: string) {
    try {
      const [rows] = await this.db.query(
        "SELECT * FROM payloads WHERE device_id = ?",
        [device_id]
      );
      return rows;
    } catch (error) {
      console.error("Error fetching payloads by device ID:", error);
      throw new Error("Failed to fetch payloads");
    }
  }

  async saveMqttPayload(data: any) {
    try {
      await this.db.query(
        `INSERT INTO payloads (device_id, ph, cod, tss, nh3n, flow, server_time)
        VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [data.device_id, data.ph, data.cod, data.tss, data.nh3n, data.flow]
      );
    } catch (error) {
      console.error("Error saving MQTT payload:", error);
      throw new Error("Failed to save MQTT payload");
    }
  }
}
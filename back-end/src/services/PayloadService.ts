import { Connection, ResultSetHeader } from "mysql2/promise";

export class PayloadService {
  private db: Connection;

  constructor(db: Connection) {
    this.db = db;
  }

  async saveHttpPayload(data: any): Promise<number> {
    const [result] = await this.db.query<ResultSetHeader>(
      `INSERT INTO payloads (device_id, ph, cod, tss, nh3n, flow, server_time)
      VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [data.device_id, data.ph, data.cod, data.tss, data.nh3n, data.flow]
    );
    return result.insertId;
  }

  async getAll() {
    const [rows] = await this.db.query("SELECT * FROM payloads");
    return rows;
  }

  async getByDeviceId(device_id: string) {
    const [rows] = await this.db.query(
      "SELECT * FROM payloads WHERE device_id = ?",
      [device_id]
    );
    return rows;
  }

  async saveMqttPayload(data: any) {
    await this.db.query(
      `INSERT INTO payloads (device_id, ph, cod, tss, nh3n, flow, server_time)
      VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [data.device_id, data.ph, data.cod, data.tss, data.nh3n, data.flow]
    );
  }
}
import { Connection, ResultSetHeader } from "mysql2/promise";

export class WidgetService {
  private db: Connection;

  constructor(db: Connection) {
    this.db = db;
  }

  async createWidget({ description, device_id, sensor_type }: any) {
    const [result] = await this.db.query<ResultSetHeader>(
      `INSERT INTO widgets (description, device_id, sensor_type) VALUES (?, ?, ?)`,
      [description, device_id, sensor_type]
    );
    return result.insertId;
  }

  async getAllWidgets() {
    const [rows] = await this.db.query("SELECT * FROM widgets");
    return rows;
  }

  async getWidgetsByDeviceId(device_id: string) {
    const [rows] = await this.db.query(
      "SELECT * FROM widgets WHERE device_id = ?",
      [device_id]
    );
    return rows;
  }

  async updateWidget(id: string, { description, device_id, sensor_type }: any) {
    const [result] = await this.db.query<ResultSetHeader>(
      `UPDATE widgets SET description = ?, device_id = ?, sensor_type = ? WHERE id = ?`,
      [description, device_id, sensor_type, id]
    );
    return result.affectedRows > 0;
  }

  async deleteWidget(id: string) {
    const [result] = await this.db.query<ResultSetHeader>(
      "DELETE FROM widgets WHERE id = ?",
      [id]
    );
    return result.affectedRows > 0;
  }
}
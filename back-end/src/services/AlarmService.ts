import { Connection, ResultSetHeader } from "mysql2/promise";

export class AlarmService {
  private db: Connection;

  constructor(db: Connection) {
    this.db = db;
  }

  async createAlarm({ name, device_id, operator, threshold, sensor }: any) {
    const [result] = await this.db.query<ResultSetHeader>(
      `INSERT INTO alarms (description, device_id, operator, threshold, last_sended, sensor_type)
       VALUES (?, ?, ?, ?, NOW(), ?)`,
      [name, device_id, operator, threshold, sensor]
    );
    return result.insertId;
  }

  async getAllAlarms() {
    const [rows] = await this.db.query("SELECT * FROM alarms");
    return rows;
  }

  async getAlarmsByDeviceId(device_id: string) {
    const [rows] = await this.db.query(
      "SELECT * FROM alarms WHERE device_id = ?",
      [device_id]
    );
    return rows;
  }

  async updateAlarm(id: string, { name, device_id, operator, threshold, sensor }: any) {
    const [result] = await this.db.query<ResultSetHeader>(
      `UPDATE alarms SET description = ?, device_id = ?, operator = ?, threshold = ?, sensor_type = ? WHERE id = ?`,
      [name, device_id, operator, threshold, sensor, id]
    );
    return result.affectedRows > 0;
  }

  async deleteAlarm(id: string) {
    const [result] = await this.db.query<ResultSetHeader>(
      "DELETE FROM alarms WHERE id = ?",
      [id]
    );
    return result.affectedRows > 0;
  }
}
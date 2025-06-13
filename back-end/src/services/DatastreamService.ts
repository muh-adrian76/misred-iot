import { Connection, ResultSetHeader } from "mysql2/promise";

export class DatastreamService {
  private db: Connection;

  constructor(db: Connection) {
    this.db = db;
  }

  async getDatastreamsByDeviceId(deviceId: string) {
    try {
      const [rows] = await this.db.query(
        "SELECT * FROM datastreams WHERE device_id = ?",
        [deviceId]
      );
      return rows;
    } catch (error) {
      console.error("Error fetching datastreams by device ID:", error);
      throw new Error("Failed to fetch datastreams");
    }
  }

  async createDatastream({ deviceId, pin, type, unit, description }: any) {
    try {
      const [result] = await this.db.query<ResultSetHeader>(
        "INSERT INTO datastreams (device_id, pin, type, unit, description) VALUES (?, ?, ?, ?, ?)",
        [deviceId, pin, type, unit, description]
      );
      return result.insertId;
    } catch (error) {
      console.error("Error creating datastream:", error);
      throw new Error("Failed to create datastream");
    }
  }

  async deleteDatastream(datastreamId: string) {
    try {
      const [result] = await this.db.query<ResultSetHeader>(
        "DELETE FROM datastreams WHERE id = ?",
        [datastreamId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error deleting datastream:", error);
      throw new Error("Failed to delete datastream");
    }
  }
}
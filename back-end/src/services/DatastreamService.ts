import { Pool, ResultSetHeader } from "mysql2/promise";

export class DatastreamService {
  private db: Pool;

  constructor(db: Pool) {
    this.db = db;
  }

  async getDatastreamsByUserId(userId: string) {
    try {
      const [rows] = await this.db.query(
        "SELECT * FROM datastreams WHERE user_id = ?",
        [userId]
      );
      return rows;
    } catch (error) {
      console.error("Error fetching datastreams by user ID:", error);
      throw new Error("Failed to fetch datastreams");
    }
  }

  async createDatastream({
    userId,
    pin,
    type,
    unit,
    description,
    defaultValue,
    minValue,
    maxValue,
  }: any) {
    try {
      // Cek apakah pin sudah terpakai
      const [usedPin] = await this.db.query(
        "SELECT id FROM datastreams WHERE user_id = ? AND pin = ?",
        [userId, pin]
      );
      if ((usedPin as any[]).length > 0) {
        return new Response(
          JSON.stringify({ message: "PIN sudah digunakan" }),
          { status: 400 }
        );
      }
      const [result] = await this.db.query<ResultSetHeader>(
        "INSERT INTO datastreams (description, pin, type, unit, default_value, min_value, max_value, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [description, pin, type, unit, defaultValue, minValue, maxValue, userId]
      );
      return result.insertId;
    } catch (error) {
      console.error("Error creating datastream:", error);
      throw new Error("Failed to create datastream");
    }
  }

  async updateDatastream(
    datastreamId: string,
    {
      pin,
      type,
      unit,
      description,
      defaultValue,
      minValue,
      maxValue,
    }: {
      pin: string;
      type: string;
      unit?: string;
      description?: string;
      defaultValue: string;
      minValue: string;
      maxValue: string;
    }
  ) {
    try {
      const [result] = await this.db.query<ResultSetHeader>(
        "UPDATE datastreams SET pin = ?, type = ?, unit = ?, description = ?, default_value = ?, min_value = ?, max_value = ? WHERE id = ?",
        [
          pin,
          type,
          unit ?? null,
          description ?? null,
          Number(defaultValue),
          Number(minValue),
          Number(maxValue),
          datastreamId,
        ]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error updating datastream:", error);
      throw new Error("Failed to update datastream");
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

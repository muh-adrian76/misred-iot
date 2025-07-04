import { Pool, ResultSetHeader } from "mysql2/promise";

function getDecimal(format: string): number {
  const match = format.match(/\.(0+)/);
  return match ? match[1].length : 0;
}

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
    deviceId,
    pin,
    type,
    unit,
    description,
    defaultValue,
    minValue,
    maxValue,
    decimalValue,
  }: {
    userId: string;
    deviceId: string;
    pin: string;
    type: string;
    unit?: string;
    description?: string;
    defaultValue: string;
    minValue: string;
    maxValue: string;
    decimalValue: string;
  }) {
    try {
      // Cek apakah pin sudah terpakai
      const [usedPin] = await this.db.query(
        "SELECT id FROM datastreams WHERE user_id = ? AND device_id = ? AND pin = ?",
        [userId, deviceId, pin]
      );
      if ((usedPin as any[]).length > 0) {
        return new Response(
          JSON.stringify({ message: "PIN sudah digunakan" }),
          { status: 400 }
        );
      }

      // Cek format tipe data
      let defaultVal: any = defaultValue;
      let minVal: any = minValue;
      let maxVal: any = maxValue;
      if (type === "integer") {
        defaultVal = parseInt(defaultValue);
        minVal = parseInt(minValue);
        maxVal = parseInt(maxValue);
      } else if (type === "double") {
        const decimalFormat = getDecimal(decimalValue);
        defaultVal = parseFloat(Number(defaultValue).toFixed(decimalFormat));
        minVal = parseFloat(Number(minValue).toFixed(decimalFormat));
        maxVal = parseFloat(Number(maxValue).toFixed(decimalFormat));
      }

      const [result] = await this.db.query<ResultSetHeader>(
        "INSERT INTO datastreams (description, pin, type, unit, default_value, min_value, max_value, decimal_value, device_id, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          description,
          pin,
          type,
          unit,
          defaultVal,
          minVal,
          maxVal,
          decimalValue,
          deviceId,
          userId,
        ]
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
      deviceId,
      pin,
      type,
      unit,
      description,
      defaultValue,
      minValue,
      maxValue,
      decimalValue,
    }: {
      deviceId: string;
      pin: string;
      type: string;
      unit?: string;
      description?: string;
      defaultValue: string;
      minValue: string;
      maxValue: string;
      decimalValue: string;
    }
  ) {
    try {
      // Cek format tipe data
      let defaultVal: any = defaultValue;
      let minVal: any = minValue;
      let maxVal: any = maxValue;
      if (type === "integer") {
        defaultVal = parseInt(defaultValue);
        minVal = parseInt(minValue);
        maxVal = parseInt(maxValue);
      } else if (type === "double") {
        const decimalFormat = getDecimal(decimalValue);
        defaultVal = parseFloat(Number(defaultValue).toFixed(decimalFormat));
        minVal = parseFloat(Number(minValue).toFixed(decimalFormat));
        maxVal = parseFloat(Number(maxValue).toFixed(decimalFormat));
      }

      const [result] = await this.db.query<ResultSetHeader>(
        "UPDATE datastreams SET device_id = ?, pin = ?, type = ?, unit = ?, description = ?, default_value = ?, min_value = ?, max_value = ?, decimal_value = ? WHERE id = ?",
        [
          Number(deviceId),
          pin,
          type,
          unit ?? null,
          description ?? null,
          defaultVal,
          minVal,
          maxVal,
          decimalValue,
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

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

  async getDatastreamsByDeviceId(deviceId: string, userId: string) {
    try {
      const [rows] = await this.db.query(
        "SELECT * FROM datastreams WHERE device_id = ? AND user_id = ?",
        [deviceId, userId]
      );
      return rows;
    } catch (error) {
      console.error("Error fetching datastreams by device ID:", error);
      throw new Error("Failed to fetch datastreams");
    }
  }

  async getDatastreamById(datastreamId: string, userId: string) {
    try {
      const [rows] = await this.db.query(
        "SELECT * FROM datastreams WHERE id = ? AND user_id = ?",
        [datastreamId, userId]
      );
      const datastreams = rows as any[];
      return datastreams.length > 0 ? datastreams[0] : null;
    } catch (error) {
      console.error("Error fetching datastream by ID:", error);
      throw new Error("Failed to fetch datastream");
    }
  }

  async createDatastream({
    userId,
    deviceId,
    pin,
    type,
    unit,
    description,
    minValue,
    maxValue,
    decimalValue,
    booleanValue,
  }: {
    userId: string;
    deviceId: string;
    pin: string;
    type: string;
    unit?: string;
    description?: string;
    minValue: string;
    maxValue: string;
    decimalValue: string;
    booleanValue?: string;
  }) {
    try {
      // Cek apakah pin sudah terpakai
      const virtualPin = `V${pin}`;
      const [usedPin] = await this.db.query(
        "SELECT id FROM datastreams WHERE user_id = ? AND device_id = ? AND pin = ?",
        [userId, deviceId, virtualPin]
      );
      if ((usedPin as any[]).length > 0) {
        return new Response(
          JSON.stringify({ message: "PIN sudah digunakan" }),
          { status: 400 }
        );
      }

      // Cek format tipe data
      let minVal: any = minValue;
      let maxVal: any = maxValue;
      if (type === "integer") {
        minVal = parseInt(minValue);
        maxVal = parseInt(maxValue);
      } else if (type === "double") {
        const decimalFormat = getDecimal(decimalValue);
        minVal = parseFloat(Number(minValue).toFixed(decimalFormat));
        maxVal = parseFloat(Number(maxValue).toFixed(decimalFormat));
      } else if (type === "boolean") {
        minVal = 0;
        maxVal = 1;
      }

      const [result] = await this.db.query<ResultSetHeader>(
        "INSERT INTO datastreams (description, pin, type, unit, min_value, max_value, decimal_value, device_id, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          description,
          virtualPin,
          type,
          unit,
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
      minValue,
      maxValue,
      decimalValue,
      booleanValue,
    }: {
      deviceId: string;
      pin: string;
      type: string;
      unit?: string;
      description?: string;
      minValue: string;
      maxValue: string;
      decimalValue: string;
      booleanValue?: string;
    }
  ) {
    try {
      // Cek format tipe data
      const virtualPin = `V${pin}`;
      let minVal: any = minValue;
      let maxVal: any = maxValue;
      if (type === "integer") {
        minVal = parseInt(minValue);
        maxVal = parseInt(maxValue);
      } else if (type === "double") {
        const decimalFormat = getDecimal(decimalValue);
        minVal = parseFloat(Number(minValue).toFixed(decimalFormat));
        maxVal = parseFloat(Number(maxValue).toFixed(decimalFormat));
      } else if (type === "boolean") {
        minVal = 0;
        maxVal = 1;
      }

      const [result] = await this.db.query<ResultSetHeader>(
        "UPDATE datastreams SET device_id = ?, pin = ?, type = ?, unit = ?, description = ?, min_value = ?, max_value = ?, decimal_value = ? WHERE id = ?",
        [
          Number(deviceId),
          virtualPin,
          type,
          unit ?? null,
          description ?? null,
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

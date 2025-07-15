import { Pool, ResultSetHeader } from "mysql2/promise";
import { DeviceService } from "./DeviceService";
import { decryptAES } from "../lib/utils";
import crypto from "crypto";

export class PayloadService {
  private db: Pool;
  private deviceService: DeviceService;

  constructor(db: Pool, deviceService: DeviceService) {
    this.db = db;
    this.deviceService = deviceService;
  }

  // Fungsi verifikasi JWT dan dekripsi payload
  async verifyDeviceJWTAndDecrypt({
    jwt,
    deviceId,
    token,
  }: {
    jwt: any;
    deviceId: string;
    token: string;
  }) {
    // Ambil secret dari database
    const device = await this.deviceService.getDeviceById(deviceId);
    //@ts-ignore
    const secret = device.new_secret;
    if (!secret) throw new Error("Device tidak terdaftar");

    // Verifikasi JWT
    const decoded = jwt.verify(token, secret, {
      algorithms: ["HS256"],
    });
    if (typeof decoded !== "object" || !decoded.encryptedData)
      throw new Error("Payload tidak valid");

    // Dekripsi AES
    const decrypted = decryptAES(crypto, decoded.encryptedData, secret);
    return decrypted;
  }

  async saveHttpPayload({
    deviceId,
    decrypted,
  }: {
    deviceId: string | number;
    decrypted: any;
  }): Promise<number> {
    try {
      const [result] = await this.db.query<ResultSetHeader>(
        `INSERT INTO payloads (device_id, value, server_time)
        VALUES (?, ?, ?, NOW())`,
        [deviceId, JSON.stringify(decrypted)]
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

  async getByDeviceAndDatastream(device_id: string, datastream_id: string) {
    try {
      const [rows] = await this.db.query(
        "SELECT * FROM payloads WHERE device_id = ? AND datastream_id = ?",
        [device_id, datastream_id]
      );
      return rows;
    } catch (error) {
      console.error("Error fetching payloads by device and datastream:", error);
      throw new Error("Failed to fetch payloads");
    }
  }

  async saveLoraPayload(dev_eui: string, datastream_id: number, value: any) {
    try {
      // Cari device_id dari dev_eui
      const [devices]: any = await this.db.query(
        "SELECT id FROM devices WHERE dev_eui = ?",
        [dev_eui]
      );
      if (!devices.length) throw new Error("Device not found");
      const device_id = devices[0].id;
      const [result] = await this.db.query<ResultSetHeader>(
        `INSERT INTO payloads (device_id, datastream_id, value, server_time)
      VALUES (?, ?, ?, NOW())`,
        [device_id, datastream_id, JSON.stringify(value)]
      );
      return result.insertId;
    } catch (error) {
      console.error("Error saving Lora payload:", error);
      throw error;
    }
  }
}

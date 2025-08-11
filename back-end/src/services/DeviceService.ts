/**
 * ===== DEVICE SERVICE =====
 * Service untuk mengelola IoT devices dalam sistem
 * Menyediakan CRUD operations dan integrasi dengan MQTT, OTAA, firmware management
 *
 * Fitur utama:
 * - Device CRUD operations dengan multi-protocol support
 * - MQTT topic management dan subscription
 * - OTAA (Over-The-Air) firmware update integration
 * - Device status monitoring (online/offline)
 * - Secret key management untuk keamanan device
 * - Cascade delete untuk menghapus data terkait
 */
import { Pool, ResultSetHeader } from "mysql2/promise";
import { randomBytes } from "crypto";
import { OtaaUpdateService } from "./OtaaUpdateService";
import { MQTTTopicManager } from "./MQTTTopicManager";

export class DeviceService {
  private db: Pool;
  private otaaService: OtaaUpdateService;
  private onSubscribeTopic?: (topic: string) => void; // Callback untuk subscribe MQTT
  private onUnsubscribeTopic?: (topic: string) => void; // Callback untuk unsubscribe MQTT
  private mqttTopicManager?: MQTTTopicManager;

  constructor(
    db: Pool,
    otaaService: OtaaUpdateService,
    onSubscribeTopic?: (topic: string) => void,
    onUnsubscribeTopic?: (topic: string) => void
  ) {
    this.db = db;
    this.otaaService = otaaService;
    this.onSubscribeTopic = onSubscribeTopic;
    this.onUnsubscribeTopic = onUnsubscribeTopic;
    this.mqttTopicManager = new MQTTTopicManager(db);
  }

  // ===== CREATE DEVICE =====
  // Membuat device baru dengan konfigurasi protokol dan MQTT topic
  async createDevice({
    name,
    board,
    protocol,
    topic,
    offline_timeout_minutes,
    // qos,
    // dev_eui,
    // app_eui,
    // app_key,
    new_secret,
    user_id,
  }: any) {
    try {
      const [result] = await (this.db as any).safeQuery(
        `INSERT INTO devices 
      (description, board_type, protocol, mqtt_topic, offline_timeout_minutes, new_secret, user_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          name,
          board,
          protocol,
          topic ?? null,
          offline_timeout_minutes ?? 1, // Default 1 menit
          // qos ?? null,
          // dev_eui ?? null,
          // app_eui ?? null,
          // app_key ?? null,
          new_secret,
          user_id,
        ]
      );
      const id = result.insertId;

      // Integrasi broker MQTT dengan topic manager
      if (topic && this.mqttTopicManager && this.onSubscribeTopic) {
        const uniqueTopic = topic;
        await (this.db as any).safeQuery("UPDATE devices SET mqtt_topic = ? WHERE id = ?", [
          uniqueTopic,
          id,
        ]);

        // Subscribe menggunakan topic manager untuk receive data
        await this.mqttTopicManager.subscribeIfNeeded(
          uniqueTopic,
          this.onSubscribeTopic
        );
      }

      return id;
    } catch (error) {
      console.error("Gagal membuat device:", error);
      throw new Error("Gagal membuat device");
    }
  }

  async getAllUserDevices(user_id: string) {
    try {
      const [rows] = await (this.db as any).safeQuery(
        "SELECT * FROM devices WHERE user_id = ?",
        [user_id]
      );
      return rows;
    } catch (error) {
      console.error("Gagal mengambil semua device:", error);
      throw new Error("Gagal mengambil data device");
    }
  }

  async getDeviceById(id: string) {
    try {
      const [rows] = await (this.db as any).safeQuery("SELECT * FROM devices WHERE id = ?", [
        id,
      ]);
      return rows;
    } catch (error) {
      console.error("Gagal mengambil device berdasarkan ID:", error);
      throw new Error("Gagal mengambil device");
    }
  }

  async getSecretByDevice(id: string) {
    try {
      const [rows] = await (this.db as any).safeQuery(
        "SELECT new_secret FROM devices WHERE id = ?",
        [id]
      );
      return rows;
    } catch (error) {
      console.error("Gagal mengambil secret device:", error);
      throw new Error("Gagal mengambil secret device");
    }
  }

  async getNewSecret(id: string, old_secret: string) {
    try {
      const [rows]: any = await (this.db as any).safeQuery(
        "SELECT new_secret FROM devices WHERE id = ? AND old_secret = ?",
        [id, old_secret]
      );
      if (rows.length === 0) {
        throw new Error("Secret lama tidak sesuai");
      }
      return rows[0].new_secret;
    } catch (error) {
      console.error("Gagal memverifikasi secret lama:", error);
      throw new Error("Gagal memverifikasi secret lama");
    }
  }

  async getFirmwareVersion(id: string) {
    try {
      // Get device info dengan user_id
      const [rows]: any = await (this.db as any).safeQuery(
        "SELECT board_type, firmware_version, user_id FROM devices WHERE id = ?",
        [id]
      );

      if (rows.length === 0) {
        throw new Error("Device tidak valid");
      }

      const { board_type, firmware_version: currentVersion, user_id } = rows[0];

      // Get latest firmware from OTAA system berdasarkan user_id
      const latestFirmware = await this.otaaService.getFirmwareByBoardType(
        board_type,
        user_id
      );

      return {
        firmware_version:
          latestFirmware?.firmware_version || currentVersion || "1.0.0",
        current_version: currentVersion,
        board_type: board_type,
        user_id: user_id,
      };
    } catch (error) {
      console.error("Gagal mengambil versi firmware:", error);
      throw new Error("Gagal mengambil versi firmware");
    }
  }

  async updateFirmwareUrl(
    id: string,
    firmware_version: string,
    firmware_url: string
  ) {
    try {
      // Perbarui versi firmware device saat terjadi pembaruan
      await (this.db as any).safeQuery(
        "UPDATE devices SET firmware_version = ? WHERE id = ?",
        [firmware_version, id]
      );
      const [updatedTime]: any = await (this.db as any).safeQuery(
        "SELECT updated_at FROM devices WHERE id = ?",
        [id]
      );
      return updatedTime[0]?.updated_at || new Date();
    } catch (error) {
      console.error("Gagal memperbarui versi firmware:", error);
      throw new Error("Gagal memperbarui versi firmware");
    }
  }

  async getFirmwareList(id: string) {
    try {
      // Get device board type dan user_id
      const [rows]: any = await (this.db as any).safeQuery(
        "SELECT board_type, user_id FROM devices WHERE id = ?",
        [id]
      );

      if (rows.length === 0) {
        throw new Error("Device tidak valid");
      }

      const { board_type, user_id } = rows[0];

      // Get firmware from OTAA system berdasarkan user_id
      const firmware = await this.otaaService.getFirmwareByBoardType(
        board_type,
        user_id
      );

      if (!firmware) {
        return [];
      }

      // Extract filename from firmware_url
      const filename = firmware.firmware_url.split("/").pop();

      return [
        {
          name: filename,
          url: `/device/firmware/${id}/${filename}`,
          version: firmware.firmware_version,
        },
      ];
    } catch (error) {
      console.error("Gagal mengambil daftar firmware:", error);
      throw new Error("Gagal mengambil daftar firmware");
    }
  }

  async getFirmwareFile(id: string, filename: string) {
    try {
      // Get device board type dan user_id
      const [rows]: any = await (this.db as any).safeQuery(
        "SELECT board_type, user_id FROM devices WHERE id = ?",
        [id]
      );

      if (rows.length === 0) {
        throw new Error("Device tidak valid");
      }

      const { board_type, user_id } = rows[0];

      // Get firmware from OTAA system berdasarkan user_id
      const firmware = await this.otaaService.getFirmwareByBoardType(
        board_type,
        user_id
      );

      if (!firmware) {
        throw new Error("Firmware tidak ditemukan");
      }

      // Convert firmware_url to actual file path
      const filePath = firmware.firmware_url.replace(
        "/public/",
        `${process.cwd()}/src/assets/`
      );

      return filePath;
    } catch (error) {
      console.error("Gagal mengambil file firmware:", error);
      throw new Error("Gagal mengambil file firmware");
    }
  }

  async getFirmwareUrl(id: string) {
    try {
      // Get device info dengan user_id
      const [rows]: any = await (this.db as any).safeQuery(
        "SELECT board_type, user_id FROM devices WHERE id = ?",
        [id]
      );

      if (rows.length === 0) {
        throw new Error("Device tidak valid");
      }

      const { board_type, user_id } = rows[0];

      // Get firmware from OTAA system berdasarkan user_id
      const firmware = await this.otaaService.getFirmwareByBoardType(
        board_type,
        user_id
      );

      if (!firmware || !firmware.firmware_url) {
        throw new Error("Tidak ada firmware yang tersedia untuk jenis board ini");
      }

      return firmware.firmware_url;
    } catch (error) {
      console.error("Gagal mengambil URL firmware:", error);
      throw new Error("Gagal mengambil URL firmware");
    }
  }

  async refreshAllDeviceSecrets() {
    try {
      // 1. Ambil semua device
      const [devices]: any = await (this.db as any).safeQuery(
        "SELECT id, new_secret FROM devices"
      );
      for (const device of devices) {
        const newSecret = randomBytes(16).toString("hex");
        // 2. Simpan secret lama ke old_secret, update new_secret
        await (this.db as any).safeQuery(
          "UPDATE devices SET old_secret = ?, new_secret = ? WHERE id = ?",
          [device.new_secret, newSecret, device.id]
        );
        // console.log(`🔄 Secret key untuk device ${device.id} diganti otomatis`);
      }
    } catch (error) {
      console.error("Gagal menyegarkan secret device:", error);
      throw new Error("Gagal menyegarkan secret device");
    }
  }

  async updateDevice(
    id: string,
    userId: string,
    {
      name,
      board,
      protocol,
      mqtt_topic,
      offline_timeout_minutes,
      // mqtt_qos,
      // dev_eui,
      // app_eui,
      // app_key,
      firmware_version,
    }: any
  ) {
    try {
      // Topik MQTT
      const [rows]: any = await (this.db as any).safeQuery(
        "SELECT mqtt_topic FROM devices WHERE id = ?",
        [id]
      );
      const oldTopic = rows[0]?.mqtt_topic;

      let uniqueTopic: string | null = null;
      if (mqtt_topic) {
        // Pastikan hanya satu id di depan
        let topic = mqtt_topic;
        // const prefix = `${id}/`;
        // if (topic.startsWith(prefix)) {
        //   topic = topic.slice(prefix.length);
        // }
        // uniqueTopic = `${id}/${topic}`;
        uniqueTopic = topic;
      }

      const [result] = await (this.db as any).safeQuery(
        `UPDATE devices SET description = ?, board_type = ?, protocol = ?, mqtt_topic = ?, offline_timeout_minutes = ?, firmware_version = ?
      WHERE id = ? AND user_id = ?`,
        [
          name,
          board,
          protocol,
          uniqueTopic ?? null,
          offline_timeout_minutes ?? 1, // Default 1 menit
          // mqtt_qos ?? null,
          // dev_eui ?? null,
          // app_eui ?? null,
          // app_key ?? null,
          firmware_version ?? null,
          id,
          userId,
        ]
      );

      // MQTT topic management dengan topic manager
      if (
        this.mqttTopicManager &&
        this.onSubscribeTopic &&
        this.onUnsubscribeTopic
      ) {
        await this.mqttTopicManager.handleTopicChange(
          oldTopic,
          uniqueTopic,
          this.onSubscribeTopic,
          this.onUnsubscribeTopic
        );
      }

      return result.affectedRows > 0;
    } catch (error) {
      console.error("Gagal memperbarui device:", error);
      throw new Error("Gagal memperbarui device");
    }
  }

  async deleteDevice(id: string, userId: string) {
    try {
      // Get topic sebelum delete untuk unsubscribe jika perlu
      const [deviceRows]: any = await (this.db as any).safeQuery(
        "SELECT mqtt_topic FROM devices WHERE id = ? AND user_id = ?",
        [id, userId]
      );
      const topicToCheck = deviceRows[0]?.mqtt_topic;

      // Hapus data dalam urutan yang tepat untuk menghindari error foreign key constraint
      // Semua tabel terkait device menggunakan ON DELETE CASCADE, jadi urutan sudah optimal

      // 1. Hapus notifications yang terkait dengan device (FK ke device_id - nullable)
      await (this.db as any).safeQuery("DELETE FROM notifications WHERE device_id = ?", [
        id,
      ]);

      // 2. Hapus device_commands yang terkait dengan device (FK ke device_id dan datastream_id)
      await (this.db as any).safeQuery("DELETE FROM device_commands WHERE device_id = ?", [
        id,
      ]);

      // 3. Hapus widgets yang menggunakan device ini (JSON extract dari inputs)
      await (this.db as any).safeQuery(
        "DELETE FROM widgets WHERE JSON_UNQUOTE(JSON_EXTRACT(inputs, '$.device_id')) = ?",
        [id]
      );

      // 4. Hapus alarm_conditions yang terkait dengan alarms dari device ini
      await (this.db as any).safeQuery(
        `
        DELETE ac FROM alarm_conditions ac 
        INNER JOIN alarms a ON ac.alarm_id = a.id 
        WHERE a.device_id = ?
      `,
        [id]
      );

      // 5. Hapus alarms yang terkait dengan device (akan memicu CASCADE untuk alarm_conditions)
      await (this.db as any).safeQuery("DELETE FROM alarms WHERE device_id = ?", [id]);

      // 6. Hapus payloads (FK ke device_id dan datastream_id - CASCADE)
      await (this.db as any).safeQuery("DELETE FROM payloads WHERE device_id = ?", [id]);

      // 7. Hapus raw_payloads yang terkait dengan device (FK ke device_id - CASCADE)
      await (this.db as any).safeQuery("DELETE FROM raw_payloads WHERE device_id = ?", [id]);

      // 8. Hapus datastreams yang terkait dengan device (FK ke device_id - CASCADE)
      await (this.db as any).safeQuery("DELETE FROM datastreams WHERE device_id = ?", [id]);

      // 9. Terakhir, hapus device itu sendiri
      const [result] = await (this.db as any).safeQuery(
        "DELETE FROM devices WHERE id = ? AND user_id = ?",
        [id, userId]
      );

      // Unsubscribe dari topic jika tidak digunakan lagi
      if (topicToCheck && this.mqttTopicManager && this.onUnsubscribeTopic) {
        await this.mqttTopicManager.unsubscribeIfUnused(
          topicToCheck,
          this.onUnsubscribeTopic
        );
      }

      return result.affectedRows > 0;
    } catch (error) {
      console.error("Gagal menghapus device:", error);
      throw new Error("Gagal menghapus device");
    }
  }

  /**
   * ===== RESET DEVICE DATA =====
   * Menghapus semua payload data untuk device tertentu
   * Hanya menghapus data payloads dan raw_payloads, tidak menghapus device atau konfigurasinya
   */
  async resetDeviceData(deviceId: string): Promise<{
    payloads: number;
    rawPayloads: number;
  }> {
    try {
      // Count payloads sebelum dihapus untuk return value
      const [payloadCountResult]: any = await (this.db as any).safeQuery(
        "SELECT COUNT(*) as count FROM payloads WHERE device_id = ?",
        [deviceId]
      );
      const payloadCount = payloadCountResult[0]?.count || 0;

      // Count raw_payloads sebelum dihapus untuk return value
      const [rawPayloadCountResult]: any = await (this.db as any).safeQuery(
        "SELECT COUNT(*) as count FROM raw_payloads WHERE device_id = ?",
        [deviceId]
      );
      const rawPayloadCount = rawPayloadCountResult[0]?.count || 0;

      // Hapus payloads yang terkait dengan device
      await (this.db as any).safeQuery("DELETE FROM payloads WHERE device_id = ?", [
        deviceId,
      ]);

      // Hapus raw_payloads yang terkait dengan device
      await (this.db as any).safeQuery("DELETE FROM raw_payloads WHERE device_id = ?", [
        deviceId,
      ]);

      console.log(
        `Reset data device selesai untuk device ${deviceId}: ${payloadCount} payload, ${rawPayloadCount} raw_payload dihapus`
      );

      return {
        payloads: payloadCount,
        rawPayloads: rawPayloadCount,
      };
    } catch (error) {
      console.error("Gagal mereset data device:", error);
      throw new Error("Gagal mereset data device");
    }
  }

  /**
   * Update firmware version untuk device (dipanggil oleh ESP32 setelah OTA berhasil)
   */
  async updateDeviceFirmwareVersion(
    deviceId: string,
    firmwareVersion: string
  ): Promise<boolean> {
    try {
      const [result] = await (this.db as any).safeQuery(
        "UPDATE devices SET firmware_version = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [firmwareVersion, deviceId]
      );

      return result.affectedRows > 0;
    } catch (error) {
      console.error("Gagal memperbarui versi firmware device:", error);
      throw new Error("Gagal memperbarui versi firmware device");
    }
  }

  /**
   * Ambil instance MQTT Topic Manager
   */
  getMQTTTopicManager(): MQTTTopicManager | undefined {
    return this.mqttTopicManager;
  }
}

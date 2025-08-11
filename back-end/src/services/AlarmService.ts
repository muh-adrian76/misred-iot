/**
 * ===== ALARM SERVICE =====
 * Service untuk mengelola sistem alarm IoT
 * Menyediakan fungsi CRUD alarm dan pengelolaan kondisi alarm
 * 
 * Fitur utama:
 * - Membuat alarm baru dengan kondisi threshold
 * - Update alarm dan kondisi
 * - Menghapus alarm
 * - Validasi alarm berdasarkan data sensor
 * - Statistik alarm per user/device
 * - Cooldown management untuk mencegah spam notifikasi
 */
import { Pool, ResultSetHeader } from "mysql2/promise";

// Interface untuk data pembuatan alarm baru
export interface CreateAlarmData {
  description: string;           // Deskripsi alarm
  user_id: number;              // ID user pemilik
  device_id: number;            // ID device yang dipantau
  datastream_id: number;        // ID datastream yang dipantau
  is_active: boolean;           // Status aktif/non-aktif
  conditions: Array<{           // Kondisi threshold alarm
    operator: '=' | '<' | '>' | '<=' | '>=';  // Operator perbandingan
    threshold: number;          // Nilai batas
  }>;
  cooldown_minutes?: number;    // Waktu jeda setelah alarm trigger (opsional)
}

// Interface untuk update data alarm
export interface UpdateAlarmData {
  description?: string;         // Update deskripsi (opsional)
  device_id?: number;           // Update device ID (opsional)
  datastream_id?: number;       // Update datastream ID (opsional)
  conditions?: Array<{          // Update kondisi (opsional)
    operator: '=' | '<' | '>' | '<=' | '>=';
    threshold: number;
  }>;
  is_active?: boolean;          // Update status aktif (opsional)
  cooldown_minutes?: number;    // Update waktu cooldown (opsional)
}

export class AlarmService {
  private db: Pool;

  constructor(database: Pool) {
    this.db = database;
  }

  // ===== CREATE ALARM =====
  // Membuat alarm baru dengan kondisi threshold
  async createAlarm(data: CreateAlarmData): Promise<number> {
    try {
      // Mulai transaksi untuk konsistensi data
      await (this.db as any).safeQuery('START TRANSACTION');
      
      const query = `
        INSERT INTO alarms (
          description, user_id, device_id, datastream_id,
          is_active, cooldown_minutes
        ) VALUES (?, ?, ?, ?, ?, ?)
      `;

      const [result] = await (this.db as any).safeQuery(query, [
        data.description,
        data.user_id,
        data.device_id,
        data.datastream_id,
        data.is_active,
        data.cooldown_minutes || 5  // Default 5 menit cooldown
      ]);

      const alarmId = (result as any).insertId;

      // Insert semua kondisi alarm ke tabel alarm_conditions
      for (const condition of data.conditions) {
        const conditionQuery = `
          INSERT INTO alarm_conditions (alarm_id, operator, threshold) 
          VALUES (?, ?, ?)
        `;
        await (this.db as any).safeQuery(conditionQuery, [
          alarmId,
          condition.operator,
          condition.threshold
        ]);
      }

      await (this.db as any).safeQuery('COMMIT');
      return alarmId;
    } catch (error) {
      await (this.db as any).safeQuery('ROLLBACK');
      console.error("Gagal membuat alarm baru:", error);
      throw error;
    }
  }

  // ===== GET ALARMS BY USER ID =====
  // Mengambil semua alarm milik user tertentu
  async getAlarmsByUserId(userId: number): Promise<any[]> {
    try {
      const query = `
        SELECT 
          a.*,
          d.description as device_description,
          ds.description as datastream_description,
          ds.pin as datastream_pin,
          ds.unit as datastream_unit
        FROM alarms a
        JOIN devices d ON a.device_id = d.id
        JOIN datastreams ds ON a.datastream_id = ds.id
        WHERE a.user_id = ?
        ORDER BY a.created_at DESC
      `;

      const [rows] = await (this.db as any).safeQuery(query, [userId]);
      const alarms = rows as any[];

      // Ambil kondisi untuk setiap alarm dan format data dengan benar
      for (const alarm of alarms) {
        const conditionsQuery = `
          SELECT operator, threshold 
          FROM alarm_conditions 
          WHERE alarm_id = ? 
          ORDER BY id
        `;
        const [conditions] = await (this.db as any).safeQuery(conditionsQuery, [alarm.id]);
        
        // Konversi threshold dari string ke number
        alarm.conditions = (conditions as any[]).map(condition => ({
          operator: condition.operator,
          threshold: Number(condition.threshold)
        }));

        // Konversi field boolean dari tinyint ke boolean sesungguhnya
        alarm.is_active = Boolean(alarm.is_active);
        
        // Pastikan tanggal dalam format string ISO
        if (alarm.created_at) {
          alarm.created_at = new Date(alarm.created_at).toISOString();
        }
        if (alarm.updated_at) {
          alarm.updated_at = new Date(alarm.updated_at).toISOString();
        }
        if (alarm.last_triggered) {
          alarm.last_triggered = new Date(alarm.last_triggered).toISOString();
        }
      }

      return alarms;
    } catch (error) {
      console.error("Gagal mengambil alarm berdasarkan user:", error);
      return [];
    }
  }

  /**
   * Ambil alarm berdasarkan ID
   */
  async getAlarmById(alarmId: number, userId: number): Promise<any | null> {
    try {
      const query = `
        SELECT 
          a.*,
          d.description as device_description,
          ds.description as datastream_description,
          ds.pin as datastream_pin,
          ds.unit as datastream_unit
        FROM alarms a
        JOIN devices d ON a.device_id = d.id
        JOIN datastreams ds ON a.datastream_id = ds.id
        WHERE a.id = ? AND a.user_id = ?
      `;

      const [rows] = await (this.db as any).safeQuery(query, [alarmId, userId]);
      const result = rows as any[];
      
      if (result.length === 0) {
        return null;
      }

      const alarm = result[0];

      // Ambil kondisi untuk alarm ini
      const conditionsQuery = `
        SELECT operator, threshold 
        FROM alarm_conditions 
        WHERE alarm_id = ? 
        ORDER BY id
      `;
      const [conditions] = await (this.db as any).safeQuery(conditionsQuery, [alarmId]);
      
      // Konversi threshold dari string ke number
      alarm.conditions = (conditions as any[]).map(condition => ({
        operator: condition.operator,
        threshold: Number(condition.threshold)
      }));

      // Konversi field boolean dari tinyint ke boolean sesungguhnya
      alarm.is_active = Boolean(alarm.is_active);
      
      // Pastikan tanggal dalam format string ISO
      if (alarm.created_at) {
        alarm.created_at = new Date(alarm.created_at).toISOString();
      }
      if (alarm.updated_at) {
        alarm.updated_at = new Date(alarm.updated_at).toISOString();
      }
      if (alarm.last_triggered) {
        alarm.last_triggered = new Date(alarm.last_triggered).toISOString();
      }

      return alarm;
    } catch (error) {
      console.error("Gagal mengambil alarm berdasarkan ID:", error);
      return null;
    }
  }

  /**
   * Perbarui alarm
   */
  async updateAlarm(alarmId: number, userId: number, data: UpdateAlarmData): Promise<boolean> {
    try {
      await (this.db as any).safeQuery('START TRANSACTION');

      const updates: string[] = [];
      const values: any[] = [];

      // Buat query update dinamis
      if (data.description !== undefined) {
        updates.push('description = ?');
        values.push(data.description);
      }
      if (data.device_id !== undefined) {
        updates.push('device_id = ?');
        values.push(data.device_id);
      }
      if (data.datastream_id !== undefined) {
        updates.push('datastream_id = ?');
        values.push(data.datastream_id);
      }
      if (data.is_active !== undefined) {
        updates.push('is_active = ?');
        values.push(data.is_active);
      }
      if (data.cooldown_minutes !== undefined) {
        updates.push('cooldown_minutes = ?');
        values.push(data.cooldown_minutes);
      }

      // Update tabel alarm jika ada perubahan
      if (updates.length > 0) {
        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(alarmId, userId);

        const query = `
          UPDATE alarms 
          SET ${updates.join(', ')}
          WHERE id = ? AND user_id = ?
        `;

        const [result] = await (this.db as any).safeQuery(query, values);
        
        if ((result as any).affectedRows === 0) {
          await (this.db as any).safeQuery('ROLLBACK');
          return false;
        }
      }

      // Update kondisi jika disediakan
      if (data.conditions !== undefined) {
        // Hapus kondisi yang ada
        await (this.db as any).safeQuery('DELETE FROM alarm_conditions WHERE alarm_id = ?', [alarmId]);
        
        // Masukkan kondisi baru
        for (const condition of data.conditions) {
          const conditionQuery = `
            INSERT INTO alarm_conditions (alarm_id, operator, threshold) 
            VALUES (?, ?, ?)
          `;
          await (this.db as any).safeQuery(conditionQuery, [
            alarmId,
            condition.operator,
            condition.threshold
          ]);
        }
      }

      await (this.db as any).safeQuery('COMMIT');
      return true;
    } catch (error) {
      await (this.db as any).safeQuery('ROLLBACK');
      console.error("Gagal memperbarui alarm:", error);
      throw error;
    }
  }

  /**
   * Hapus alarm
   */
  async deleteAlarm(alarmId: number, userId: number): Promise<boolean> {
    try {
      // Hapus data terkait dalam urutan yang tepat untuk menghindari foreign key constraint errors
      
      // 1. Hapus notifications yang terkait dengan alarm (FK ke alarm_id - CASCADE)
      await (this.db as any).safeQuery("DELETE FROM notifications WHERE alarm_id = ?", [alarmId]);
      
      // 2. Hapus alarm_conditions yang terkait dengan alarm (FK ke alarm_id - CASCADE)
      // Ini sebenarnya otomatis CASCADE, tapi untuk safety kita hapus manual
      await (this.db as any).safeQuery("DELETE FROM alarm_conditions WHERE alarm_id = ?", [alarmId]);
      
      // 3. Terakhir, hapus alarm itu sendiri (akan trigger CASCADE untuk yang tersisa)
      const query = "DELETE FROM alarms WHERE id = ? AND user_id = ?";
      const [result] = await (this.db as any).safeQuery(query, [alarmId, userId]);
      
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error("Gagal menghapus alarm:", error);
      throw error;
    }
  }

  /**
   * Toggle status alarm (aktif/tidak aktif)
   */
  async toggleAlarmStatus(alarmId: number, userId: number): Promise<boolean> {
    try {
      const query = `
        UPDATE alarms 
        SET is_active = NOT is_active, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_id = ?
      `;

      const [result] = await (this.db as any).safeQuery(query, [alarmId, userId]);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error("Gagal mengubah status alarm:", error);
      throw error;
    }
  }

  /**
   * Ambil alarm untuk device tertentu
   */
  async getAlarmsByDeviceId(deviceId: number, userId: number): Promise<any[]> {
    try {
      const query = `
        SELECT 
          a.*,
          d.description as device_description,
          ds.description as datastream_description,
          ds.pin as datastream_pin,
          ds.unit as datastream_unit
        FROM alarms a
        JOIN devices d ON a.device_id = d.id
        JOIN datastreams ds ON a.datastream_id = ds.id
        WHERE a.device_id = ? AND a.user_id = ?
        ORDER BY a.created_at DESC
      `;

      const [rows] = await (this.db as any).safeQuery(query, [deviceId, userId]);
      const alarms = rows as any[];

      // Ambil kondisi untuk setiap alarm
      for (const alarm of alarms) {
        const conditionsQuery = `
          SELECT operator, threshold 
          FROM alarm_conditions 
          WHERE alarm_id = ? 
          ORDER BY id
        `;
        const [conditions] = await (this.db as any).safeQuery(conditionsQuery, [alarm.id]);
        alarm.conditions = conditions;
      }

      return alarms;
    } catch (error) {
      console.error("Gagal mengambil alarm berdasarkan device:", error);
      return [];
    }
  }

  /**
   * Validasi data alarm
   */
  validateAlarmData(data: CreateAlarmData | UpdateAlarmData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if ('description' in data && (!data.description || data.description.trim().length === 0)) {
      errors.push("Deskripsi wajib diisi");
    }

    if ('device_id' in data && data.device_id !== undefined) {
      if (isNaN(data.device_id) || data.device_id < 1) {
        errors.push("ID device yang valid wajib diisi");
      }
    }

    if ('datastream_id' in data && data.datastream_id !== undefined) {
      if (isNaN(data.datastream_id) || data.datastream_id < 1) {
        errors.push("ID datastream yang valid wajib diisi");
      }
    }

    if ('conditions' in data && data.conditions) {
      if (!Array.isArray(data.conditions) || data.conditions.length === 0) {
        errors.push("Minimal satu kondisi wajib diisi");
      } else if (data.conditions.length > 5) {
        errors.push("Maksimal 5 kondisi diperbolehkan");
      } else {
        for (let i = 0; i < data.conditions.length; i++) {
          const condition = data.conditions[i];
          
          if (!condition.operator || !['=', '<', '>', '<=', '>='].includes(condition.operator)) {
            errors.push(`Operator tidak valid pada kondisi ${i + 1}`);
          }
          
          if (condition.threshold === undefined || condition.threshold === null || isNaN(condition.threshold)) {
            errors.push(`Nilai threshold tidak valid pada kondisi ${i + 1}`);
          }
        }
      }
    }

    if ('cooldown_minutes' in data && data.cooldown_minutes !== undefined) {
      if (isNaN(data.cooldown_minutes) || data.cooldown_minutes < 0) {
        errors.push("Waktu cooldown harus berupa angka non-negatif");
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Ambil alarm dengan data lengkap termasuk kondisi
  async getAllAlarms(user_id: string) {
    try {
      const [rows] = await (this.db as any).safeQuery(`
        SELECT 
          a.*,
          d.description as device_description,
          ds.description as datastream_description,
          ds.pin as datastream_pin,
          ds.unit as datastream_unit
        FROM alarms a
        LEFT JOIN devices d ON a.device_id = d.id
        LEFT JOIN datastreams ds ON a.datastream_id = ds.id
        WHERE a.user_id = ?
        ORDER BY a.created_at DESC
      `, [user_id]);

      // Ambil kondisi untuk setiap alarm dan format data dengan benar
      const alarms = rows as any[];
      for (const alarm of alarms) {
        const [conditionRows] = await (this.db as any).safeQuery(
          "SELECT operator, threshold FROM alarm_conditions WHERE alarm_id = ?",
          [alarm.id]
        );
        
        // Konversi threshold dari string ke number
        alarm.conditions = (conditionRows as any[]).map(condition => ({
          operator: condition.operator,
          threshold: Number(condition.threshold)
        }));
        
        // Konversi field boolean dari tinyint ke boolean sesungguhnya
        alarm.is_active = Boolean(alarm.is_active);
        
        // Pastikan tanggal dalam format string ISO
        if (alarm.created_at) {
          alarm.created_at = new Date(alarm.created_at).toISOString();
        }
        if (alarm.updated_at) {
          alarm.updated_at = new Date(alarm.updated_at).toISOString();
        }
        if (alarm.last_triggered) {
          alarm.last_triggered = new Date(alarm.last_triggered).toISOString();
        }
      }

      return alarms;
    } catch (error) {
      console.error("Gagal mengambil semua alarm:", error);
      throw new Error("Gagal mengambil data alarm");
    }
  }

}

/**
 * ===== USER SERVICE =====
 * Service untuk mengelola user accounts dan user-related operations
 * Menyediakan CRUD operations untuk user management
 * 
 * Fitur utama:
 * - User CRUD operations (create, read, update, delete)
 * - Admin user management dengan role permissions
 * - WhatsApp notification preferences
 * - Onboarding progress tracking system
 * - Cascade delete untuk user data cleanup
 * - User profile management
 */
import { Pool, ResultSetHeader } from "mysql2/promise";

// Type definition untuk User object
type User = {
  id: string;
  name: string;
  email: string;
  created_at: Date | string;
  last_login: Date | string | null;
  phone: string | null;
  whatsapp_notif: boolean;           // Preferensi notifikasi WhatsApp
  onboarding_completed: boolean;     // Status onboarding selesai
  onboarding_progress: any;          // Progress onboarding (JSON)
  is_admin?: boolean;                // Role admin (opsional)
};

export class UserService {
  private db: Pool;

  constructor(db: Pool) {
    this.db = db;
  }

  // ===== GET ALL USERS =====
  // Mengambil semua user untuk admin dashboard
  async getAllUsers() {
    try {
      const [rows] = await (this.db as any).safeQuery(
        "SELECT id, name, email, created_at, last_login, phone, whatsapp_notif, onboarding_completed, onboarding_progress, is_admin FROM users"
      );
      return rows;
    } catch (error) {
      console.error("Gagal mengambil semua pengguna:", error);
      throw new Error("Gagal mengambil data pengguna");
    }
  }

  // ===== GET USER BY ID =====
  // Mengambil user spesifik berdasarkan ID dengan data formatting
  async getUserById(id: string) {
    try {
      const [rows] = await (this.db as any).safeQuery(
        "SELECT id, name, email, created_at, last_login, phone, whatsapp_notif, onboarding_completed, onboarding_progress, is_admin FROM users WHERE id = ?",
        [id]
      );
      const user = Array.isArray(rows) ? (rows[0] as User) : null;
      if (user) {
        // Convert date fields ke ISO string jika berupa Date objects
        if (user.created_at instanceof Date) {
          user.created_at = user.created_at.toISOString();
        }
        if (user.last_login instanceof Date) {
          user.last_login = user.last_login.toISOString();
        }
        // Convert tinyint ke boolean untuk frontend
        user.whatsapp_notif = Boolean(user.whatsapp_notif);
        user.onboarding_completed = Boolean(user.onboarding_completed);
        user.is_admin = Boolean(user.is_admin);
        
        // Parse JSON onboarding_progress untuk frontend
        if (user.onboarding_progress && typeof user.onboarding_progress === 'string') {
          try {
            user.onboarding_progress = JSON.parse(user.onboarding_progress);
          } catch (e) {
            user.onboarding_progress = [];
          }
        }
      }
      return user;
    } catch (error) {
      console.error("Gagal mengambil pengguna berdasarkan ID:", error);
      throw new Error("Gagal mengambil data pengguna");
    }
  }

  async updateUser(id: string, name: string, phone: string | null, whatsapp_notif?: boolean) {
    try {
      let query = "UPDATE users SET name=?, phone=?";
      let params: any[] = [name, phone];
      
      if (whatsapp_notif !== undefined) {
        query += ", whatsapp_notif=?";
        params.push(whatsapp_notif);
      }
      
      query += " WHERE id=?";
      params.push(id);
      
      const [result] = await (this.db as any).safeQuery(query, params);
      if (result.affectedRows > 0) {
        const updatedUser = await this.getUserById(id);
        return updatedUser;
      }
      return null;
    } catch (error) {
      console.error("Gagal memperbarui pengguna:", error);
      throw new Error("Gagal memperbarui pengguna");
    }
  }

  async updateUserAdmin(id: string, userData: { name?: string; email?: string; is_admin?: boolean }) {
    try {
      const updates: string[] = [];
      const params: any[] = [];
      
      if (userData.name !== undefined) {
        updates.push("name=?");
        params.push(userData.name);
      }
      
      if (userData.email !== undefined) {
        updates.push("email=?");
        params.push(userData.email);
      }
      
      if (userData.is_admin !== undefined) {
        updates.push("is_admin=?");
        params.push(userData.is_admin);
      }
      
      if (updates.length === 0) {
        return null; // Tidak ada perubahan untuk dilakukan
      }
      
      const query = `UPDATE users SET ${updates.join(", ")} WHERE id=?`;
      params.push(id);
      
      const [result] = await (this.db as any).safeQuery(query, params);
      if (result.affectedRows > 0) {
        const updatedUser = await this.getUserById(id);
        return updatedUser;
      }
      return null;
    } catch (error) {
      console.error("Gagal memperbarui pengguna (admin):", error);
      throw new Error("Gagal memperbarui pengguna");
    }
  }

  async deleteUser(id: string) {
    try {
      // Start transaction untuk memastikan atomicity
      await this.db.beginTransaction();

      // Delete dalam urutan yang benar untuk menghindari foreign key constraint errors
      // Karena semua tabel menggunakan ON DELETE CASCADE dari users, kita hanya perlu menghapus
      // tabel yang tidak memiliki CASCADE atau memiliki referensi kompleks
      
      // 1. Delete notifications (memiliki FK ke alarms, devices, datastreams, users)
      await (this.db as any).safeQuery(
        "DELETE FROM notifications WHERE user_id = ?",
        [id]
      );

      // 2. Delete device_commands (memiliki FK ke devices, datastreams, users)
      await (this.db as any).safeQuery(
        "DELETE FROM device_commands WHERE user_id = ?",
        [id]
      );

      // 3. Delete alarm_conditions (terhubung ke alarms yang akan dihapus CASCADE)
      await (this.db as any).safeQuery(
        "DELETE ac FROM alarm_conditions ac INNER JOIN alarms a ON ac.alarm_id = a.id WHERE a.user_id = ?",
        [id]
      );

      // 4. Delete alarms (akan trigger CASCADE untuk alarm_conditions jika ada yang tersisa)
      await (this.db as any).safeQuery(
        "DELETE FROM alarms WHERE user_id = ?",
        [id]
      );

      // 5. Delete widgets (terhubung ke dashboards yang akan dihapus CASCADE)
      await (this.db as any).safeQuery(
        "DELETE w FROM widgets w INNER JOIN dashboards d ON w.dashboard_id = d.id WHERE d.user_id = ?",
        [id]
      );

      // 6. Delete payloads (terhubung ke devices dan datastreams yang akan dihapus CASCADE)
      await (this.db as any).safeQuery(
        "DELETE p FROM payloads p INNER JOIN devices d ON p.device_id = d.id WHERE d.user_id = ?",
        [id]
      );

      // 7. Delete raw_payloads (terhubung ke devices yang akan dihapus CASCADE)
      await (this.db as any).safeQuery(
        "DELETE rp FROM raw_payloads rp INNER JOIN devices d ON rp.device_id = d.id WHERE d.user_id = ?",
        [id]
      );

      // 8. Delete datastreams (memiliki FK ke users dan devices - CASCADE)
      await (this.db as any).safeQuery(
        "DELETE FROM datastreams WHERE user_id = ?",
        [id]
      );

      // 9. Delete devices (memiliki FK ke users - CASCADE)
      await (this.db as any).safeQuery(
        "DELETE FROM devices WHERE user_id = ?",
        [id]
      );

      // 10. Delete dashboards (memiliki FK ke users - CASCADE)
      await (this.db as any).safeQuery(
        "DELETE FROM dashboards WHERE user_id = ?",
        [id]
      );

      // 11. Delete otaa_updates (memiliki FK ke users - CASCADE)
      await (this.db as any).safeQuery(
        "DELETE FROM otaa_updates WHERE user_id = ?",
        [id]
      );

      // 12. Terakhir, hapus pengguna
      const [result] = await (this.db as any).safeQuery(
        "DELETE FROM users WHERE id = ?",
        [id]
      );

      // Commit transaction
      await (this.db as any).commitTransaction();

      return result.affectedRows > 0;
    } catch (error) {
      // Rollback transaction on error
      await (this.db as any).rollbackTransaction();
      console.error("Gagal menghapus pengguna dan data terkait:", error);
      throw new Error("Gagal menghapus pengguna dan data terkait");
    } finally {
      // Release connection
      (this.db as any).release();
    }
  }

  async updateWhatsAppNotifications(userId: string, enabled: boolean) {
    try {
      const [result] = await (this.db as any).safeQuery(
        "UPDATE users SET whatsapp_notif = ? WHERE id = ?",
        [enabled, userId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Gagal memperbarui pengaturan notifikasi WhatsApp:", error);
      throw new Error("Gagal memperbarui pengaturan notifikasi WhatsApp");
    }
  }

  async getWhatsAppNotificationStatus(userId: string): Promise<boolean> {
    try {
      const [rows] = await (this.db as any).safeQuery(
        "SELECT whatsapp_notif FROM users WHERE id = ?",
        [userId]
      );
      const result = Array.isArray(rows) ? (rows[0] as any) : null;
      return result ? Boolean(result.whatsapp_notif) : false;
    } catch (error) {
      console.error("Gagal mengambil status notifikasi WhatsApp:", error);
      return false;
    }
  }

  // Onboarding progress methods
  async updateOnboardingProgress(userId: string, taskId: number, completed: boolean = true) {
    try {
      // Get current progress
      const [rows] = await (this.db as any).safeQuery(
        "SELECT onboarding_progress FROM users WHERE id = ?",
        [userId]
      );
      
      const result = Array.isArray(rows) ? (rows[0] as any) : null;
      let progress = [];
      
      if (result && result.onboarding_progress) {
        try {
          progress = typeof result.onboarding_progress === 'string' 
            ? JSON.parse(result.onboarding_progress) 
            : result.onboarding_progress;
        } catch (e) {
          progress = [];
        }
      }
      
      // Update progress
      if (completed && !progress.includes(taskId)) {
        progress.push(taskId);
      } else if (!completed) {
        progress = progress.filter((id: number) => id !== taskId);
      }
      
      // Check if all tasks are completed (tasks 1-5)
      const allTasks = [1, 2, 3, 4, 5];
      const isAllCompleted = allTasks.every(task => progress.includes(task));
      
      // Update database
      const [updateResult] = await (this.db as any).safeQuery(
        "UPDATE users SET onboarding_progress = ?, onboarding_completed = ? WHERE id = ?",
        [JSON.stringify(progress), isAllCompleted, userId]
      );
      
      return updateResult.affectedRows > 0;
    } catch (error) {
      console.error("Gagal memperbarui progres onboarding:", error);
      throw new Error("Gagal memperbarui progres onboarding");
    }
  }

  async getOnboardingProgress(userId: string) {
    try {
      const [rows] = await (this.db as any).safeQuery(
        "SELECT onboarding_progress, onboarding_completed FROM users WHERE id = ?",
        [userId]
      );
      
      const result = Array.isArray(rows) ? (rows[0] as any) : null;
      if (!result) return { progress: [], completed: false };
      
      let progress = [];
      if (result.onboarding_progress) {
        try {
          progress = typeof result.onboarding_progress === 'string' 
            ? JSON.parse(result.onboarding_progress) 
            : result.onboarding_progress;
        } catch (e) {
          progress = [];
        }
      }
      
      return {
        progress,
        completed: Boolean(result.onboarding_completed)
      };
    } catch (error) {
      console.error("Gagal mengambil progres onboarding:", error);
      return { progress: [], completed: false };
    }
  }
}
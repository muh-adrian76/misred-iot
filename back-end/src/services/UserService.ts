import { Pool, ResultSetHeader } from "mysql2/promise";

type User = {
  id: string;
  name: string;
  email: string;
  created_at: Date | string;
  last_login: Date | string | null;
  phone: string | null;
  whatsapp_notif: boolean;
  onboarding_completed: boolean;
  onboarding_progress: any;
  is_admin?: boolean;
};

export class UserService {
  private db: Pool;

  constructor(db: Pool) {
    this.db = db;
  }

  async getAllUsers() {
    try {
      const [rows] = await this.db.query(
        "SELECT id, name, email, created_at, last_login, phone, whatsapp_notif, onboarding_completed, onboarding_progress, is_admin FROM users"
      );
      return rows;
    } catch (error) {
      console.error("Error fetching all users:", error);
      throw new Error("Failed to fetch users");
    }
  }

  async getUserById(id: string) {
    try {
      const [rows] = await this.db.query(
        "SELECT id, name, email, created_at, last_login, phone, whatsapp_notif, onboarding_completed, onboarding_progress, is_admin FROM users WHERE id = ?",
        [id]
      );
      const user = Array.isArray(rows) ? (rows[0] as User) : null;
      if (user) {
        // Convert date fields to ISO string if they are Date objects
        if (user.created_at instanceof Date) {
          user.created_at = user.created_at.toISOString();
        }
        if (user.last_login instanceof Date) {
          user.last_login = user.last_login.toISOString();
        }
        // Convert tinyint to boolean
        user.whatsapp_notif = Boolean(user.whatsapp_notif);
        user.onboarding_completed = Boolean(user.onboarding_completed);
        user.is_admin = Boolean(user.is_admin);
        
        // Parse JSON onboarding_progress
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
      console.error("Error fetching user by ID:", error);
      throw new Error("Failed to fetch user");
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
      
      const [result] = await this.db.query<ResultSetHeader>(query, params);
      if (result.affectedRows > 0) {
        const updatedUser = await this.getUserById(id);
        return updatedUser;
      }
      return null;
    } catch (error) {
      console.error("Error updating user:", error);
      throw new Error("Failed to update user");
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
        return null; // No updates to perform
      }
      
      const query = `UPDATE users SET ${updates.join(", ")} WHERE id=?`;
      params.push(id);
      
      const [result] = await this.db.query<ResultSetHeader>(query, params);
      if (result.affectedRows > 0) {
        const updatedUser = await this.getUserById(id);
        return updatedUser;
      }
      return null;
    } catch (error) {
      console.error("Error updating user (admin):", error);
      throw new Error("Failed to update user");
    }
  }

  async deleteUser(id: string) {
    const connection = await this.db.getConnection();
    
    try {
      // Start transaction untuk memastikan atomicity
      await connection.beginTransaction();

      // Delete dalam urutan yang benar untuk menghindari foreign key constraint errors
      // 1. Delete payloads (terhubung ke devices dan datastreams)
      await connection.query(
        "DELETE p FROM payloads p INNER JOIN devices d ON p.device_id = d.id WHERE d.user_id = ?",
        [id]
      );
      
      await connection.query(
        "DELETE p FROM payloads p INNER JOIN datastreams ds ON p.datastream_id = ds.id WHERE ds.user_id = ?",
        [id]
      );

      // 2. Delete raw_payloads (terhubung ke devices)
      await connection.query(
        "DELETE rp FROM raw_payloads rp INNER JOIN devices d ON rp.device_id = d.id WHERE d.user_id = ?",
        [id]
      );

      // 3. Delete device_commands
      await connection.query(
        "DELETE FROM device_commands WHERE user_id = ?",
        [id]
      );

      // 4. Delete alarm_notifications
      await connection.query(
        "DELETE FROM alarm_notifications WHERE user_id = ?",
        [id]
      );

      // 5. Delete alarm_conditions (terhubung ke alarms)
      await connection.query(
        "DELETE ac FROM alarm_conditions ac INNER JOIN alarms a ON ac.alarm_id = a.id WHERE a.user_id = ?",
        [id]
      );

      // 6. Delete alarms
      await connection.query(
        "DELETE FROM alarms WHERE user_id = ?",
        [id]
      );

      // 7. Delete widgets (terhubung ke dashboards)
      await connection.query(
        "DELETE w FROM widgets w INNER JOIN dashboards d ON w.dashboard_id = d.id WHERE d.user_id = ?",
        [id]
      );

      // 8. Delete datastreams
      await connection.query(
        "DELETE FROM datastreams WHERE user_id = ?",
        [id]
      );

      // 9. Delete devices
      await connection.query(
        "DELETE FROM devices WHERE user_id = ?",
        [id]
      );

      // 10. Delete dashboards
      await connection.query(
        "DELETE FROM dashboards WHERE user_id = ?",
        [id]
      );

      // 11. Delete otaa_updates
      await connection.query(
        "DELETE FROM otaa_updates WHERE user_id = ?",
        [id]
      );

      // 12. Finally, delete the user
      const [result] = await connection.query<ResultSetHeader>(
        "DELETE FROM users WHERE id = ?",
        [id]
      );

      // Commit transaction
      await connection.commit();
      
      return result.affectedRows > 0;
    } catch (error) {
      // Rollback transaction on error
      await connection.rollback();
      console.error("Error deleting user and related data:", error);
      throw new Error("Failed to delete user and related data");
    } finally {
      // Release connection
      connection.release();
    }
  }

  async updateWhatsAppNotifications(userId: string, enabled: boolean) {
    try {
      const [result] = await this.db.query<ResultSetHeader>(
        "UPDATE users SET whatsapp_notif = ? WHERE id = ?",
        [enabled, userId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error updating WhatsApp notifications:", error);
      throw new Error("Failed to update WhatsApp notifications");
    }
  }

  async getWhatsAppNotificationStatus(userId: string): Promise<boolean> {
    try {
      const [rows] = await this.db.query(
        "SELECT whatsapp_notif FROM users WHERE id = ?",
        [userId]
      );
      const result = Array.isArray(rows) ? (rows[0] as any) : null;
      return result ? Boolean(result.whatsapp_notif) : false;
    } catch (error) {
      console.error("Error getting WhatsApp notification status:", error);
      return false;
    }
  }

  // Onboarding progress methods
  async updateOnboardingProgress(userId: string, taskId: number, completed: boolean = true) {
    try {
      // Get current progress
      const [rows] = await this.db.query(
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
      const [updateResult] = await this.db.query<ResultSetHeader>(
        "UPDATE users SET onboarding_progress = ?, onboarding_completed = ? WHERE id = ?",
        [JSON.stringify(progress), isAllCompleted, userId]
      );
      
      return updateResult.affectedRows > 0;
    } catch (error) {
      console.error("Error updating onboarding progress:", error);
      throw new Error("Failed to update onboarding progress");
    }
  }

  async getOnboardingProgress(userId: string) {
    try {
      const [rows] = await this.db.query(
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
      console.error("Error getting onboarding progress:", error);
      return { progress: [], completed: false };
    }
  }
}
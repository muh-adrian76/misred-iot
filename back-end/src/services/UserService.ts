import { Connection, ResultSetHeader } from "mysql2/promise";

export class UserService {
  private db: Connection;

  constructor(db: Connection) {
    this.db = db;
  }

  async getAllUsers() {
    try {
      const [rows] = await this.db.query(
        "SELECT id, name, email, created_at, last_login, phone FROM users"
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
        "SELECT id, name, email, created_at, last_login, phone FROM users WHERE id = ?",
        [id]
      );
      const user = Array.isArray(rows) ? rows[0] : null;
      if (user) {
        // Convert date fields to ISO string if they are Date objects
        if (user.created_at instanceof Date) {
          user.created_at = user.created_at.toISOString();
        }
        if (user.last_login instanceof Date) {
          user.last_login = user.last_login.toISOString();
        }
      }
      return user;
    } catch (error) {
      console.error("Error fetching user by ID:", error);
      throw new Error("Failed to fetch user");
    }
  }

  async updateUser(id: string, name: string, phone: string | null) {
    try {
      const [result] = await this.db.query<ResultSetHeader>(
        "UPDATE users SET name=?, phone=? WHERE id=?",
        [name, phone, id]
      );
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

  async deleteUser(id: string) {
    try {
      const [result] = await this.db.query<ResultSetHeader>(
        "DELETE FROM users WHERE id = ?",
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error deleting user:", error);
      throw new Error("Failed to delete user");
    }
  }
}
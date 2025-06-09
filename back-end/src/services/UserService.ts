import { Connection, ResultSetHeader } from "mysql2/promise";

export class UserService {
  private db: Connection;

  constructor(db: Connection) {
    this.db = db;
  }

  async getAllUsers() {
    const [rows] = await this.db.query(
      "SELECT id, name, email, created_at, last_login, phone FROM users"
    );
    return rows;
  }

  async getUserById(id: string) {
    const [rows] = await this.db.query(
      "SELECT id, name, email, created_at, last_login, phone FROM users WHERE id = ?",
      [id]
    );
    return Array.isArray(rows) ? rows[0] : null;
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
      console.error(error);
      throw new Error("Gagal memperbarui user");
    }
  }

  async deleteUser(id: string) {
    const [result] = await this.db.query<ResultSetHeader>(
      "DELETE FROM users WHERE id = ?",
      [id]
    );
    return result.affectedRows > 0;
  }
}

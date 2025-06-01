import { Connection, ResultSetHeader } from "mysql2/promise";

export class UserService {
  private db: Connection;

  constructor(db: Connection) {
    this.db = db;
  }

  async getAllUsers() {
    const [rows] = await this.db.query("SELECT * FROM users");
    return rows;
  }

  async getUserById(id: string) {
    const [rows] = await this.db.query("SELECT * FROM users WHERE id = ?", [id]);
    return Array.isArray(rows) ? rows[0] : null;
  }

  async updateUser(id: string, name: string, password: string) {
    const [result] = await this.db.query<ResultSetHeader>(
      "UPDATE users SET password=?, name=? WHERE id=?",
      [password, name, id]
    );
    return result.affectedRows > 0;
  }

  async deleteUser(id: string) {
    const [result] = await this.db.query<ResultSetHeader>(
      "DELETE FROM users WHERE id = ?",
      [id]
    );
    return result.affectedRows > 0;
  }
}
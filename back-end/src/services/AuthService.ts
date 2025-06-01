import { Connection, ResultSetHeader } from "mysql2/promise";
import { OAuth2Client } from "google-auth-library";
import { v4 as uuidv4 } from "uuid";
import { authorizeRequest } from "../utils/helper";

export class AuthService {
  private db: Connection;
  private googleClient: OAuth2Client;

  constructor(db: Connection) {
    this.db = db;
    this.googleClient = new OAuth2Client(
      Bun.env.GOOGLE_CLIENT_ID,
      Bun.env.GOOGLE_CLIENT_SECRET,
      "postmessage"
    );
  }

  async register({
    email,
    password,
  }: {
    password: string;
    email: string;
  }) {
    if (email && !/^[\w\.-]+@[\w\.-]+\.[A-Za-z]{2,}$/.test(email)) {
      return {
        status: 400,
        message: "Email tidak valid. Gagal menambahkan user.",
      };
    }

    const userId = uuidv4().slice(0, 8);
    const hashedPassword = await Bun.password.hash(password, {
      algorithm: "bcrypt",
    });
    const name = email.split('@')[0];

    try {
      const [result] = await this.db.query<ResultSetHeader>(
        "INSERT INTO users (id, email, password, name, last_login) VALUES (?, ?, ?, ?, NOW())",
        [userId, email, hashedPassword, name]
      );
      if (result.affectedRows > 0) {
        return { status: 201, message: "User berhasil terdaftar", id: userId };
      } else {
        return { status: 400, message: "Gagal menambahkan user." };
      }
    } catch (err: any) {
      let msg = "Gagal menambahkan user.";
      if (err.code === "ER_DUP_ENTRY") {
        msg = "Email sudah terdaftar.";
      }
      return { status: 400, message: msg };
    }
  }

  async login(
    { email, password }: { email: string; password: string },
    jwt: any,
    auth: any
  ) {
    if (email && !/^[\w\.-]+@[\w\.-]+\.[A-Za-z]{2,}$/.test(email)) {
      return {
        status: 400,
        message: "Email tidak valid. Gagal menambahkan user.",
      };
    }

    const [rows] = await this.db.query<any[]>(
      "SELECT id, email, password, name, last_login FROM users WHERE email = ?",
      [email]
    );

    if (!rows || rows.length === 0) {
      return { status: 401, message: "Kredensial tidak valid" };
    }

    const user = rows[0];
    if (user.password === "GOOGLE_OAUTH_USER") {
      return {
        status: 401,
        message: "Silahkan gunakan tombol login dengan Google",
      };
    }

    const isMatch = await Bun.password.verify(password, user.password);
    if (!user || !isMatch) {
      return { status: 401, message: "Kredensial tidak valid" };
    }

    const response = await fetch(`http://localhost:7601/sign/${user.id}`);
    const refreshToken = await response.text();

    await this.db.query("UPDATE users SET refresh_token = ? WHERE id = ?", [
      refreshToken,
      user.id,
    ]);

    return {
      status: 200,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        last_login: user.last_login
          ? user.last_login.toISOString()
          : new Date().toISOString(),
      },
    };
  }

  async verifyToken(jwt: any, auth: any, authorizeRequest: any) {
    try {
      const decoded = await authorizeRequest(jwt, auth);
      if (decoded) {
        return { status: 200, message: "Token valid", decoded };
      }
    } catch (error) {
      return { status: 401, message: "Unauthorized. Token sudah tidak valid" };
    }
  }

  async renewToken(jwt: any, id: string) {
    const [rows] = await this.db.query<any[]>(
      "SELECT refresh_token FROM users WHERE id = ?",
      [id]
    );
    const refreshToken = rows?.[0]?.refresh_token;
    try {
      const decoded = await jwt.verify(refreshToken);
      const newAccessToken = await jwt.sign({
        sub: decoded.sub,
        iat: Math.floor(Date.now() / 1000),
        type: "access",
      });
      return { status: 200, accessToken: newAccessToken };
    } catch (err) {
      return { status: 401, message: "Invalid or expired refresh token" };
    }
  }

  async logout(jwt: any, auth: any, authorizeRequest: any) {
    const decoded = await authorizeRequest(jwt, auth);
    const { id } = decoded.sub;
    const [result] = await this.db.query<any[]>(
      "SELECT refresh_token FROM users WHERE id = ?",
      [id]
    );
    const refreshToken = result[0];
    if (!refreshToken)
      return { status: 400, message: "Refresh token tidak valid." };

    await this.db.query("UPDATE users SET refresh_token = ?", [""]);
    
    return { status: 200, message: "User berhasil logout" };
  }

  async googleLogin({ code }: { code: string }, jwt: any, auth: any) {
    if (!code) {
      return { status: 400, message: "Missing code" };
    }

    let tokens, payload;
    try {
      const { tokens: googleTokens } = await this.googleClient.getToken(code);
      tokens = googleTokens;
      const ticket = await this.googleClient.verifyIdToken({
        idToken: tokens.id_token!,
        audience: Bun.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (err) {
      return { status: 401, message: "Invalid Google code" };
    }

    if (!payload?.email) {
      return { status: 400, message: "Email not found in Google token" };
    }

    let userId: string;
    let userName: string;
    const oauthPassword: string = "GOOGLE_OAUTH_USER";
    const serverTime = new Date();

    try {
      const [rows] = await this.db.query<any[]>(
        "SELECT id, email, name FROM users WHERE email = ?",
        [payload.email]
      );

      if (rows && rows.length > 0) {
        userId = rows[0].id;
        userName = rows[0].name;
        await this.db.query(
          "UPDATE users SET last_login = NOW() WHERE id = ?",
          [userId]
        );
      } else {
        userId = uuidv4().slice(0, 8);
        const [result] = await this.db.query<ResultSetHeader>(
          "INSERT INTO users (id, password, email, name, last_login) VALUES (?, ?, ?, ?, ?)",
          [
            userId,
            oauthPassword,
            payload.email,
            payload.name || payload.email.split("@")[0],
            serverTime,
          ]
        );
        userName = payload.name || payload.email.split("@")[0];

        if (result.affectedRows === 0) {
          return { status: 400, message: "Gagal menambahkan user Google." };
        }
      }

      const response = await fetch(`http://localhost:7601/sign/${userId}`);
      const refreshToken = await response.text();

      await this.db.query("UPDATE users SET refresh_token = ? WHERE id = ?", [
        refreshToken,
        userId,
      ]);

      return {
        status: 200,
        user: {
          id: userId,
          name: userName,
          email: payload.email,
          last_login: serverTime.toISOString(),
        },
      };
    } catch (err: any) {
      let msg = "Gagal menambahkan user Google.";
      if (err.code === "ER_DUP_ENTRY") {
        msg = "Email sudah terdaftar.";
      }
      return { status: 400, message: msg };
    }
  }
}

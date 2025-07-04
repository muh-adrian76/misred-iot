import { Pool, ResultSetHeader } from "mysql2/promise";
import { OAuth2Client } from "google-auth-library";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";
import { authorizeRequest } from "../lib/utils";

export class AuthService {
  private db: Pool;

  constructor(db: Pool) {
    this.db = db;
  }

  async register({ email, password }: { password: string; email: string }) {
    if (email && !/^[\w\.-]+@[\w\.-]+\.[A-Za-z]{2,}$/.test(email)) {
      return {
        status: 400,
        message: "Email tidak valid. Gagal menambahkan user.",
      };
    }

    try {
      // Pengecekan apakah email sudah terdaftar
      const [existingUser] = await this.db.query<any[]>(
        "SELECT id FROM users WHERE email = ?",
        [email]
      );

      if (existingUser.length > 0) {
        return {
          status: 400,
          message: "Email sudah terdaftar. Gunakan email lain.",
        };
      }

      // Jika email belum terdaftar, lanjutkan proses insert
      const userId = uuidv4().slice(0, 8);
      const hashedPassword = await bcrypt.hash(password, 10);
      const name = email.split("@")[0];

      const [result] = await this.db.query<ResultSetHeader>(
        "INSERT INTO users (id, email, password, name, created_at) VALUES (?, ?, ?, ?, NOW())",
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

  async login({ email, password }: { email: string; password: string }) {
    if (email && !/^[\w\.-]+@[\w\.-]+\.[A-Za-z]{2,}$/.test(email)) {
      return {
        status: 400,
        message: "Email tidak valid.",
      };
    }

    const [rows] = await this.db.query<any[]>(
      "SELECT id, email, password, name, created_at, phone FROM users WHERE email = ?",
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

    const isMatch = await bcrypt.compare(password, user.password);
    if (!user || !isMatch) {
      return { status: 401, message: "Kredensial tidak valid" };
    }

    const response = await fetch(
      `${process.env.TOKENIZER_URL}/sign/${user.id}`
    );
    const refreshToken = await response.text();

    const now = new Date();
    await this.db.query(
      "UPDATE users SET last_login = ?, refresh_token = ? WHERE id = ?",
      [now, refreshToken, user.id]
    );

    return {
      status: 200,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at.toISOString(),
        last_login: now.toISOString(),
        phone: user.phone,
      },
      refreshToken: refreshToken,
    };
  }

  async verifyToken(jwt: any, cookie: any) {
    try {
      const decoded = await authorizeRequest(jwt, cookie);
      if (decoded) {
        return { status: 200, message: "Token valid", decoded };
      }
    } catch (error) {
      return { status: 401, message: "Unauthorized. Token sudah tidak valid" };
    }
  }

  async renewToken(
    jwt: any,
    id: string,
    refreshTokenFromCookie: string | undefined
  ) {
    const [rows] = await this.db.query<any[]>(
      "SELECT refresh_token FROM users WHERE id = ?",
      [id]
    );
    const refreshTokenFromDb =
      rows && rows.length > 0 ? rows[0].refresh_token : undefined;
    if (!refreshTokenFromDb || !refreshTokenFromCookie) {
      return {
        status: 401,
        message: "Refresh token tidak valid atau sudah logout.",
      };
    }
    // Bandingkan token dari cookie dan database
    if (refreshTokenFromDb !== refreshTokenFromCookie) {
      return {
        status: 401,
        message: "Refresh token tidak cocok.",
      };
    }
    try {
      const decoded = await jwt.verify(refreshTokenFromDb);
      const newAccessToken = await jwt.sign({
        sub: decoded.sub,
        iat: Math.floor(Date.now() / 1000),
        type: "access",
      });
      return { status: 200, accessToken: newAccessToken };
    } catch (err) {
      console.error("JWT verify error:", err);
      return { status: 401, message: "Invalid or expired refresh token" };
    }
  }

  async googleLogin({
    code,
    mode,
  }: {
    code: string;
    mode?: "popup" | "redirect";
  }) {
    if (!code) {
      return { status: 400, message: "Missing code" };
    }

    const redirectUri =
      mode === "popup" || !mode
        ? "postmessage"
        : process.env.GOOGLE_REDIRECT_URI;

    const googleClient = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );

    let tokens, payload;
    try {
      const { tokens: googleTokens } = await googleClient.getToken(code);
      tokens = googleTokens;
      const ticket = await googleClient.verifyIdToken({
        idToken: tokens.id_token!,
        audience: process.env.GOOGLE_CLIENT_ID,
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
    let userPassword: string;
    let userCreatedAt: string;
    let userPhone: string = "";
    const oauthPassword: string = "GOOGLE_OAUTH_USER"; // Kredensial khusus untuk Gmail
    const serverTime = new Date();

    try {
      const [rows] = await this.db.query<any[]>(
        "SELECT id, email, name, password, created_at, phone FROM users WHERE email = ?",
        [payload.email]
      );

      if (rows && rows.length > 0) {
        userId = rows[0].id;
        userName = rows[0].name;
        userPassword = rows[0].password;
        userCreatedAt = rows[0].created_at;
        userPhone = rows[0].phone;

        if (userPassword !== "GOOGLE_OAUTH_USER") {
          return {
            status: 400,
            message:
              "Email telah didaftarkan pada platform. Silahkan mengisi kredensial pada form yang tersedia.",
          };
        }

        await this.db.query("UPDATE users SET last_login = ? WHERE id = ?", [
          serverTime,
          userId,
        ]);
      } else {
        userId = uuidv4().slice(0, 8);
        const [result] = await this.db.query<ResultSetHeader>(
          "INSERT INTO users (id, password, email, name, created_at, last_login) VALUES (?, ?, ?, ?, ?, ?)",
          [
            userId,
            oauthPassword,
            payload.email,
            payload.name || payload.email.split("@")[0],
            serverTime,
            serverTime,
          ]
        );
        userName = payload.name || payload.email.split("@")[0];
        userCreatedAt = serverTime.toISOString();

        if (result.affectedRows === 0) {
          return { status: 400, message: "Gagal menambahkan user Google." };
        }
      }

      const response = await fetch(
        `${process.env.TOKENIZER_URL}/sign/${userId}`
      );
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
          created_at: userCreatedAt,
          last_login: serverTime.toISOString(),
          phone: userPhone,
        },
        refreshToken: refreshToken,
      };
    } catch (err: any) {
      let msg = "Gagal menambahkan user Google.";
      if (err.code === "ER_DUP_ENTRY") {
        msg = "Email sudah terdaftar.";
      }
      return { status: 400, message: msg };
    }
  }

  async resetPassword(
    id: string,
    { oldPassword, newPassword }: { oldPassword: string; newPassword: string }
  ) {
    if (!oldPassword || !newPassword) {
      return {
        status: 400,
        message: "Kata sandi lama dan baru harus diisi.",
      };
    }
    if (oldPassword === newPassword) {
      return {
        status: 400,
        message: "Kata sandi baru tidak boleh sama dengan kata sandi lama.",
      };
    }
    if (newPassword.length < 8) {
      return {
        status: 400,
        message: "Kata sandi baru harus memiliki minimal 8 karakter.",
      };
    }

    try {
      const [rows] = await this.db.query<any[]>(
        "SELECT password FROM users WHERE id = ?",
        [id]
      );

      if (!rows || rows.length === 0) {
        return { status: 404, message: "User tidak ditemukan." };
      }

      const user = rows[0];
      if (user.password === "GOOGLE_OAUTH_USER") {
        return {
          status: 400,
          message:
            "Akun ini terdaftar melalui Google OAuth. Silahkan ubah password akun anda pada website Google.",
        };
      }

      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return { status: 400, message: "Kata sandi lama tidak valid." };
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      await this.db.query("UPDATE users SET password = ? WHERE id = ?", [
        hashedNewPassword,
        id,
      ]);

      return { status: 200, message: "Kata sandi berhasil diperbarui." };
    } catch (error) {
      console.error(error);
      return { status: 500, message: "Terjadi kesalahan pada server." };
    }
  }

  async resetForgottenPassword({ email }: { email: string }) {
    if (!email || !/^[\w\.-]+@[\w\.-]+\.[A-Za-z]{2,}$/.test(email)) {
      return { status: 400, message: "Email tidak valid." };
    }

    try {
      const [rows] = await this.db.query<any[]>(
        "SELECT id, name, password FROM users WHERE email = ?",
        [email]
      );

      if (!rows || rows.length === 0) {
        return { status: 404, message: "Email tidak terdaftar." };
      }

      const user = rows[0];
      if (user.password === "GOOGLE_OAUTH_USER") {
        return {
          status: 400,
          message:
            "Email terdaftar pada platform Google, silahkan ubah password akun anda pada website Google.",
        };
      }

      const newPassword = Math.random().toString(36).substring(2, 10);
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await this.db.query("UPDATE users SET password = ? WHERE id = ?", [
        hashedPassword,
        user.id,
      ]);

      return {
        status: 200,
        updatedPassword: newPassword,
      };
    } catch (error) {
      console.error(error);
      return { status: 500, message: "Terjadi kesalahan pada server." };
    }
  }

  async logout(jwt: any, cookie: any) {
    const decoded = await authorizeRequest(jwt, cookie);
    const id = decoded.sub;
    const [result] = await this.db.query<any[]>(
      "SELECT refresh_token FROM users WHERE id = ?",
      [id]
    );

    const refreshToken = result[0];
    if (!refreshToken)
      return { status: 400, message: "Refresh token tidak valid." };

    await this.db.query("UPDATE users SET refresh_token = ? WHERE id = ?", [
      "",
      id,
    ]);

    return { status: 200, message: "User berhasil logout" };
  }
}

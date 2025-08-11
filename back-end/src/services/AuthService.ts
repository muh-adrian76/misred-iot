/**
 * ===== AUTH SERVICE =====
 * Service untuk mengelola autentikasi dan otorisasi user
 * Menyediakan fungsi registrasi, login, verifikasi, dan manajemen token
 * 
 * Fitur utama:
 * - Registrasi user dengan email/password dan verifikasi OTP
 * - Login dengan Google OAuth dan email/password
 * - Manajemen token JWT (access + refresh token)
 * - Reset kata sandi dan lupa kata sandi
 * - Sistem verifikasi OTP
 * - Registrasi user admin
 */
import { Pool, ResultSetHeader } from "mysql2/promise";
import { OAuth2Client } from "google-auth-library";
import bcrypt from "bcrypt";
import { authorizeRequest, subDomain } from "../lib/utils";

export class AuthService {
  private db: Pool;

  constructor(db: Pool) {
    this.db = db;
  }

  /**
   * Registrasi user baru dengan email/password.
   * Alur:
   * - Validasi format email dan cek duplikasi di database
   * - Generate OTP 6 digit dengan masa berlaku (default 10 menit)
   * - Hash password menggunakan bcrypt
   * - Simpan user dengan status belum terverifikasi (is_verified = FALSE)
   */
  async register({ email, password }: { password: string; email: string }) {
    // Validasi format email
    if (email && !/^[\w\.-]+@[\w\.-]+\.[A-Za-z]{2,}$/.test(email)) {
      return {
        status: 400,
        message: "Email tidak valid. Gagal menambahkan user.",
      };
    }

    try {
      // Pengecekan apakah email sudah terdaftar
      const [existingUser] = await (this.db as any).safeQuery(
        "SELECT id FROM users WHERE email = ?",
        [email]
      );

      if (existingUser.length > 0) {
        return {
          status: 400,
          message: "Email sudah terdaftar. Gunakan email lain.",
        };
      }

      // Generate OTP 6 digit untuk verifikasi email
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Set waktu kadaluarsa OTP (default 10 menit, bisa dikonfigurasi via env)
      const otpExpirationMinutes = parseInt(process.env.OTP_TIME || "10");
      const otpExpiresAt = new Date(Date.now() + otpExpirationMinutes * 60 * 1000);

      // Hash password dan extract nama dari email
      const hashedPassword = await bcrypt.hash(password, 10);
      const name = email.split("@")[0];

      const [result] = await (this.db as any).safeQuery(
        "INSERT INTO users (email, password, name, otp, otp_expires_at, is_verified, created_at) VALUES (?, ?, ?, ?, ?, FALSE, NOW())",
        [email, hashedPassword, name, otp, otpExpiresAt]
      );

      if (result.affectedRows > 0) {
        return { 
          status: 201, 
          message: "User berhasil terdaftar. Silakan cek email untuk verifikasi.", 
          id: result.insertId,
          otp: otp 
        };
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

  /**
   * Registrasi user admin (opsional).
   * Catatan: is_admin default false. Pastikan endpoint ini dibatasi hak akses.
   */
  async registerAdmin({ email, password, name, is_admin }: { 
    password: string; 
    email: string; 
    name?: string; 
    is_admin?: boolean 
  }) {
    if (email && !/^[\w\.-]+@[\w\.-]+\.[A-Za-z]{2,}$/.test(email)) {
      return {
        status: 400,
        message: "Email tidak valid. Gagal menambahkan user.",
      };
    }

    try {
      // Pengecekan apakah email sudah terdaftar
      const [existingUser] = await (this.db as any).safeQuery(
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
      const hashedPassword = await bcrypt.hash(password, 10);
      const userName = name || email.split("@")[0];

      const [result] = await (this.db as any).safeQuery(
        "INSERT INTO users (email, password, name, is_admin, created_at) VALUES (?, ?, ?, ?, NOW())",
        [email, hashedPassword, userName, is_admin || false]
      );

      if (result.affectedRows > 0) {
        return { status: 201, message: "User berhasil terdaftar", id: result.insertId };
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

  /**
   * Login dengan email/password.
   * - Validasi format email
   * - Cek akun Google OAuth (tidak bisa login dengan password)
   * - Verifikasi password (bcrypt)
   * - Pastikan akun sudah diverifikasi (kecuali user Google OAuth)
   * - Minta refresh token dari layanan TOKENIZER dan simpan ke DB
   */
  async login({ email, password }: { email: string; password: string }) {
    if (email && !/^[\w\.-]+@[\w\.-]+\.[A-Za-z]{2,}$/.test(email)) {
      return {
        status: 400,
        message: "Email tidak valid.",
      };
    }

    const [rows] = await (this.db as any).safeQuery(
      "SELECT id, email, password, name, created_at, phone, whatsapp_notif, is_admin, is_verified FROM users WHERE email = ?",
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

    // Periksa apakah akun sudah diverifikasi (abaikan untuk user Google OAuth)
    if (!user.is_verified && user.password !== "GOOGLE_OAUTH_USER") {
      return { 
        status: 401, 
        message: "Akun belum diverifikasi. Silakan cek email Anda untuk melakukan verifikasi." 
      };
    }

    const response = await fetch(
      `${process.env.TOKENIZER_URL}/sign/${user.id}`
    );
    const refreshToken = await response.text();

    const now = new Date();
    await (this.db as any).safeQuery(
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
        whatsapp_notif: user.whatsapp_notif,
      },
      refreshToken: refreshToken,
    };
  }

  /**
   * Verifikasi token akses menggunakan helper authorizeRequest.
   * Mengembalikan decoded payload jika valid.
   */
  async verifyToken(jwt: any, cookie: any) {
    try {
      const decoded = await authorizeRequest(jwt, cookie);
      if (decoded) {
        return { status: 200, message: "Token valid", decoded };
      }
    } catch (error) {
      return { status: 401, message: "Tidak diizinkan. Token sudah tidak valid" };
    }
  }

  /**
   * Perbarui access token menggunakan refresh token yang tersimpan di DB.
   * - Pastikan refresh token dari cookie sama dengan yang ada di DB
   * - Jika valid, buat access token baru
   * TODO: Pertimbangkan rotasi refresh token untuk keamanan tambahan
   */
  async renewToken(
    jwt: any,
    id: string,
    refreshTokenFromCookie: string | undefined
  ) {
    const [rows] = await (this.db as any).safeQuery(
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
      console.error("Error verifikasi JWT:", err);
      return { status: 401, message: "Refresh token tidak valid atau sudah kedaluwarsa" };
    }
  }

  /**
   * Login menggunakan Google OAuth.
   * - Mendukung mode popup (postmessage) dan redirect URL dari env
   * - Jika user belum ada, buat akun baru dengan password sentinel "GOOGLE_OAUTH_USER"
   * - Jika user sudah ada tetapi bukan akun Google, tolak login via Google
   */
  async googleLogin({ code, mode }: { code: string; mode: string }) {
    if (!code) {
      return { status: 400, message: "Kode tidak ditemukan" };
    }

    const redirectUris =
      mode === "popup" || !mode
        ? ["postmessage"]
        : [
            process.env.GOOGLE_REDIRECT_URI!,
            subDomain(process.env.GOOGLE_REDIRECT_URI!),
          ];

    let tokens, payload, lastError;
    for (const redirectUri of redirectUris) {
      try {
        const googleClient = new OAuth2Client(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          redirectUri
        );
        const { tokens: googleTokens } = await googleClient.getToken(code);
        tokens = googleTokens;
        const ticket = await googleClient.verifyIdToken({
          idToken: tokens.id_token!,
          audience: process.env.GOOGLE_CLIENT_ID,
        });
        payload = ticket.getPayload();
        break;
      } catch (err) {
        lastError = err;
        tokens = undefined;
        payload = undefined;
      }
    }

    if (!tokens || !payload) {
      return { status: 401, message: "Kode Google tidak valid" };
    }

    if (!payload?.email) {
      return { status: 400, message: "Email tidak ditemukan pada token Google" };
    }

    let userId: number;
    let userName: string;
    let userPassword: string;
    let userCreatedAt: string;
    let userPhone: string = "";
    let userIsAdmin: boolean = false;
    let userWhatsappNotif: boolean = false; // Tambahkan field untuk notifikasi WhatsApp
    const oauthPassword: string = "GOOGLE_OAUTH_USER"; // Kredensial khusus untuk Gmail
    const serverTime = new Date();

    try {
      const [rows] = await (this.db as any).safeQuery(
        "SELECT id, email, name, password, created_at, phone, whatsapp_notif, is_admin FROM users WHERE email = ?",
        [payload.email]
      );

      if (rows && rows.length > 0) {
        userId = rows[0].id;
        userName = rows[0].name;
        userPassword = rows[0].password;
        userCreatedAt = rows[0].created_at;
        userPhone = rows[0].phone;
        userWhatsappNotif = Boolean(rows[0].whatsapp_notif);
        userIsAdmin = Boolean(rows[0].is_admin);

        if (userPassword !== "GOOGLE_OAUTH_USER") {
          return {
            status: 400,
            message:
              "Email telah didaftarkan pada platform. Silahkan mengisi kredensial pada form yang tersedia.",
          };
        }

        await (this.db as any).safeQuery("UPDATE users SET last_login = ? WHERE id = ?", [
          serverTime,
          userId,
        ]);
      } else {
        const [result] = await (this.db as any).safeQuery(
          "INSERT INTO users (password, email, name, created_at, last_login) VALUES (?, ?, ?, ?, ?)",
          [
            oauthPassword,
            payload.email,
            payload.name || payload.email.split("@")[0],
            serverTime,
            serverTime,
          ]
        );
        userId = result.insertId;
        userName = payload.name || payload.email.split("@")[0];
        userCreatedAt = serverTime.toISOString();
        userIsAdmin = false; // Default admin status untuk Google OAuth
        userWhatsappNotif = false; // Default WhatsApp notification status

        if (result.affectedRows === 0) {
          return { status: 400, message: "Gagal menambahkan user Google." };
        }
      }

      const response = await fetch(
        `${process.env.TOKENIZER_URL}/sign/${userId}`
      );
      const refreshToken = await response.text();

      await (this.db as any).safeQuery("UPDATE users SET refresh_token = ? WHERE id = ?", [
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
          whatsapp_notif: userWhatsappNotif,
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

  /**
   * Ganti kata sandi ketika user mengetahui kata sandi lama.
   * - Validasi input dan panjang minimal password
   * - Tolak untuk akun Google OAuth (tidak punya password lokal)
   */
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
      const [rows] = await (this.db as any).safeQuery(
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
      await (this.db as any).safeQuery("UPDATE users SET password = ? WHERE id = ?", [
        hashedNewPassword,
        id,
      ]);

      return { status: 200, message: "Kata sandi berhasil diperbarui." };
    } catch (error) {
      console.error(error);
      return { status: 500, message: "Terjadi kesalahan pada server." };
    }
  }

  /**
   * Reset kata sandi untuk kasus lupa password.
   * - Generate password acak dan simpan ke DB setelah di-hash
   * Catatan keamanan: Sebaiknya kirim password/token reset via email, jangan dikembalikan sebagai response API di produksi.
   */
  async resetForgottenPassword({ email }: { email: string }) {
    if (!email || !/^[\w\.-]+@[\w\.-]+\.[A-Za-z]{2,}$/.test(email)) {
      return { status: 400, message: "Email tidak valid." };
    }

    try {
      const [rows] = await (this.db as any).safeQuery(
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

      await (this.db as any).safeQuery("UPDATE users SET password = ? WHERE id = ?", [
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

  /**
   * Verifikasi OTP untuk aktivasi akun.
   * - Validasi format OTP (6 digit)
   * - Cek kedaluwarsa OTP dan kecocokan
   * - Set is_verified = TRUE jika valid dan hapus OTP dari DB
   */
  async verifyOTP({ email, otp }: { email: string; otp: string }) {
    if (!email || !otp) {
      return {
        status: 400,
        message: "Email dan OTP harus diisi.",
      };
    }

    if (!/^\d{6}$/.test(otp)) {
      return {
        status: 400,
        message: "Format OTP tidak valid. OTP harus 6 digit angka.",
      };
    }

    try {
      const [rows] = await (this.db as any).safeQuery(
        "SELECT id, otp, otp_expires_at, is_verified FROM users WHERE email = ?",
        [email]
      );

      if (!rows || rows.length === 0) {
        return { status: 404, message: "User tidak ditemukan." };
      }

      const user = rows[0];

      if (user.is_verified) {
        return { status: 400, message: "Akun sudah diverifikasi." };
      }

      if (!user.otp) {
        return { status: 400, message: "Tidak ada OTP aktif untuk email ini." };
      }

      if (user.otp !== otp) {
        return { status: 401, message: "Kode OTP tidak valid." };
      }

      // Check if OTP is expired
      const now = new Date();
      const expiresAt = new Date(user.otp_expires_at);
      if (now > expiresAt) {
        return { status: 401, message: "Kode OTP telah kedaluwarsa." };
      }

      // Verify user and clear OTP
      await (this.db as any).safeQuery(
        "UPDATE users SET is_verified = TRUE, otp = NULL, otp_expires_at = NULL WHERE email = ?",
        [email]
      );

      return {
        status: 200,
        message: "Verifikasi berhasil! Akun Anda sekarang aktif.",
      };
    } catch (error) {
      console.error("Error pada verifyOTP:", error);
      return { status: 500, message: "Terjadi kesalahan pada server." };
    }
  }

  /**
   * Kirim ulang OTP verifikasi.
   * - Generate OTP baru dan perbarui masa berlaku
   * Catatan: Untuk keamanan produksi, jangan kirim nilai OTP di response.
   */
  async resendOTP({ email }: { email: string }) {
    if (!email) {
      return {
        status: 400,
        message: "Email harus diisi.",
      };
    }

    try {
      const [rows] = await (this.db as any).safeQuery(
        "SELECT id, is_verified FROM users WHERE email = ?",
        [email]
      );

      if (!rows || rows.length === 0) {
        return { status: 404, message: "User tidak ditemukan." };
      }

      const user = rows[0];

      if (user.is_verified) {
        return { status: 400, message: "Akun sudah diverifikasi." };
      }

      // Generate OTP baru
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Set waktu kedaluwarsa OTP (default 10 menit, bisa dikonfigurasi via env)
      const otpExpirationMinutes = parseInt(process.env.OTP_TIME || "10");
      const otpExpiresAt = new Date(Date.now() + otpExpirationMinutes * 60 * 1000);

      await (this.db as any).safeQuery(
        "UPDATE users SET otp = ?, otp_expires_at = ? WHERE email = ?",
        [otp, otpExpiresAt, email]
      );

      return {
        status: 200,
        message: "OTP baru telah dikirim ke email Anda.",
        otp: otp
      };
    } catch (error) {
      console.error("Error pada resendOTP:", error);
      return { status: 500, message: "Terjadi kesalahan pada server." };
    }
  }

  /**
   * Logout user.
   * - Mengosongkan refresh token di database untuk mencegah penyalahgunaan
   */
  async logout(jwt: any, cookie: any) {
    const decoded = await authorizeRequest(jwt, cookie);
    const id = decoded.sub;
    const [result] = await (this.db as any).safeQuery(
      "SELECT refresh_token FROM users WHERE id = ?",
      [id]
    );

    const refreshToken = result[0];
    if (!refreshToken)
      return { status: 400, message: "Refresh token tidak valid." };

    await (this.db as any).safeQuery("UPDATE users SET refresh_token = ? WHERE id = ?", [
      "",
      id,
    ]);

    return { status: 200, message: "User berhasil logout" };
  }
}

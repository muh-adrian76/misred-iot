import { Elysia, t } from "elysia";
import { ResultSetHeader } from "mysql2";
import { authorizeRequest } from "../utils/authorize";
import { Types } from "../utils/types";
import { db } from "../utils/middleware";

export const authRoutes = new Elysia({ prefix: "/auth" })

  // 📝 Register User
  .post(
    "/register",
    async ({ body }: Types) => {
      const { name, password, email } = body;

      if (email && !/^[\w\.-]+@[\w\.-]+\.[A-Za-z]{2,}$/.test(email)) {
        return new Response(
          JSON.stringify({
            message: "Email tidak valid. Gagal menambahkan user.",
          }),
          { status: 400 }
        );
      }

      const hashedPassword = await Bun.password.hash(password, {
        algorithm: "bcrypt",
      });

      const [result] = await db.query<ResultSetHeader>(
        "INSERT INTO users (email, password, name, last_login) VALUES (?, ?, ?, NOW())",
        [email, hashedPassword, name]
      );

      return new Response(
        JSON.stringify({
          message: "User berhasil terdaftar",
          id: result.insertId,
        }),
        { status: 201 }
      );
    },
    {
      type: "json",
      body: t.Object({
        email: t.String({
          example: "contoh@gmail.com",
        }),
        password: t.String({
          example: "contohpassword123",
        }),
        name: t.Optional(
          t.String({
            example: "contoh",
          })
        ),
      }),
      response: {
        201: t.Object(
          {
            message: t.String({
              description: "Pesan hasil registrasi",
              example: "User berhasil terdaftar",
            }),
            id: t.Number({
              description: "ID user yang baru terdaftar",
              example: 1,
            }),
          },
          { description: "User berhasil terdaftar" }
        ),
        400: t.Object(
          {
            message: t.String({
              description: "Pesan error jika email tidak valid",
              example: "Email tidak valid. Gagal menambahkan user.",
            }),
          },
          { description: "Email tidak valid" }
        ),
      },
      detail: {
        tags: ["Auth"],
        description: "Mendaftarkan user baru",
        summary: "Register",
      },
    }
  )

  // 🔐 Login User
  .post(
    "/login",
    // @ts-ignore
    async ({ jwt, body }: Types) => {
      const { email, password } = body;

      if (email && !/^[\w\.-]+@[\w\.-]+\.[A-Za-z]{2,}$/.test(email)) {
        return new Response(
          JSON.stringify({
            message: "Email tidak valid. Gagal menambahkan user.",
          }),
          { status: 400 }
        );
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      const [rows] = await db.query<any[]>(
        "SELECT id, email, password, name, last_login, otp FROM users WHERE email = ?",
        [email]
      );

      if (!rows || rows.length === 0) {
        return new Response(
          JSON.stringify({ message: "Kredensial tidak valid" }),
          {
            status: 401,
          }
        );
      }

      const user = rows[0];
      const isMatch = await Bun.password.verify(password, user.password);

      if (!user || !isMatch) {
        return new Response(
          JSON.stringify({ message: "Kredensial tidak valid" }),
          {
            status: 401,
          }
        );
      }

      const accessToken = await jwt.sign({
        sub: user.id,
        iat: Math.floor(Date.now() / 1000),
        type: "access",
      });

      // Tokenizer
      const response = await fetch(`http://localhost:7601/sign/${user.id}`);
      const refreshToken = await response.text();

      await db.query("UPDATE users SET refresh_token = ? WHERE id = ?", [
        refreshToken,
        user.id,
      ]);

      return new Response(JSON.stringify({ accessToken, user }), {
        status: 200,
      });
    },
    {
      type: "json",
      body: t.Object({
        email: t.String({
          example: "contoh@gmail.com",
        }),
        password: t.String({
          example: "contohpassword123",
        }),
      }),
      response: {
        200: t.Object(
          {
            accessToken: t.String({
              description: "Token akses yang digunakan untuk autentikasi",
              example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            }),
            user: t.Object(
              {
                id: t.String({ description: "ID pengguna", example: "1" }),
                name: t.String({
                  description: "Nama pengguna",
                  example: "contoh",
                }),
                email: t.String({
                  description: "Email pengguna",
                  example: "contoh@gmail.com",
                }),
                last_login: t.String({
                  description: "Waktu terakhir login",
                  example: "2023-10-01T12:00:00Z",
                }),
                otp: t.String({
                  description: "One Time Password untuk autentikasi dua faktor",
                  example: "123456",
                }),
              },
              { description: "Informasi pengguna" }
            ),
          },
          { description: "Login berhasil" }
        ),
        401: t.Object(
          {
            message: t.String({
              description: "Pesan error jika kredensial tidak valid",
              example: "Kredensial tidak valid. Gagal melakukan login.",
            }),
          },
          { description: "Kredensial tidak valid" }
        ),
      },
      detail: {
        tags: ["Auth"],
        description: "Memulai sesi user",
        summary: "Login",
      },
    }
  )

  .get(
    "/verify-token",
    // @ts-ignore
    async ({ jwt, headers: { authorization } }: Types) => {
      const decoded = await jwt.verify(authorization);
      if (!decoded) {
        return new Response(
          JSON.stringify({ message: "Unauthorized. Token sudah tidak valid" }),
          { status: 401 }
        );
      }

      return new Response(JSON.stringify({ message: "Token valid", decoded }), {
        status: 200,
      });
    },
    {
      type: "json",
      response: {
        200: t.Object(
          {
            message: t.String({
              description: "Pesan hasil verifikasi token",
              example: "Token valid",
            }),
            decoded: t.Object({
              sub: t.String({
                description: "ID subjek dari token",
                example: "1",
              }),
              iat: t.Number({
                description: "Waktu pembuatan token",
                example: 1633564800,
              }),
              type: t.String({ description: "Tipe token", example: "access" }),
            }),
          },
          { description: "Token berhasil diverifikasi" }
        ),
        401: t.Object(
          {
            message: t.String({
              description: "Pesan error jika token tidak valid",
              example: "Unauthorized. Token sudah tidak valid",
            }),
          },
          { description: "Token tidak valid" }
        ),
      },
      detail: {
        tags: ["JWT"],
        description: "Verifikasi token JWT",
        summary: "Verify token",
      },
    }
  )

  // 🔁 Refresh Token
  .get(
    "/renew/:id",
    // @ts-ignore
    async ({ jwt, params }: Types) => {
      const { id } = params;

      const [rows] = await db.query<any[]>(
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

        return new Response(JSON.stringify({ accessToken: newAccessToken }), {
          status: 200,
        });
      } catch (err) {
        return new Response(
          JSON.stringify({ message: "Invalid or expired refresh token" }),
          { status: 401 }
        );
      }
    },
    {
      type: "json",
      response: {
        200: t.Object(
          {
            accessToken: t.String({
              description: "Akses token baru setelah refresh",
              example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            }),
          },
          { description: "Berhasil mendapatkan access token baru" }
        ),
        401: t.Object(
          {
            message: t.String({
              description: "Pesan error jika refresh token tidak valid",
              example: "Refresh token tidak valid atau telah kedaluwarsa",
            }),
          },
          { description: "Refresh token tidak valid atau telah kedaluwarsa" }
        ),
      },
      detail: {
        tags: ["JWT"],
        description: "Mengganti token JWT yang sudah kadaluarsa",
        summary: "Refresh token",
      },
    }
  )

  // Logout
  .post(
    "/logout/:id",
    // @ts-ignore
    async ({ jwt, headers: { authorization }, params }: Types) => {
      const decoded = await authorizeRequest(jwt, authorization);

      const { id } = params;

      const [result] = await db.query<any[]>(
        "SELECT refresh_token FROM users WHERE id = ?",
        [id]
      );
      const refreshToken = result[0];
      if (!refreshToken)
        return new Response(
          JSON.stringify({ message: "Invalid refresh token." }),
          {
            status: 400,
          }
        );

      await db.query("UPDATE users SET refresh_token = ?", [""]);
      return new Response(JSON.stringify({ message: "User berhasil logout" }), {
        status: 200,
      });
    },
    {
      type: "json",
      response: {
        200: t.Object(
          {
            message: t.String({
              description: "Pesan setelah berhasil logout",
              example: "User berhasil logout",
            }),
          },
          { description: "Logout berhasil" }
        ),
        400: t.Object(
          {
            message: t.String({
              description: "Pesan error jika refresh token tidak ditemukan",
              example: "Invalid refresh token.",
            }),
          },
          { description: "Refresh token tidak valid" }
        ),
      },
      detail: {
        tags: ["Auth"],
        description: "Menghapus sesi user",
        summary: "Logout",
      },
    }
  );

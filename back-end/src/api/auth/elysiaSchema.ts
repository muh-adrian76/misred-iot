import { t } from "elysia";

const postRegisterSchema = {
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
    201: t.Object(
      {
        message: t.String({
          description: "Pesan hasil registrasi",
          example: "User berhasil terdaftar",
        }),
        id: t.String({
          description: "ID user UUID yang baru terdaftar",
          example: "b3b1c2d3-4e5f-6789-abcd-ef0123456789",
        }),
      },
      { description: "User berhasil terdaftar" }
    ),
    400: t.Object(
      {
        message: t.String({
          description: "Pesan error jika email tidak valid/duplicate",
          example: "Email tidak valid. Gagal menambahkan user.",
        }),
      },
      { description: "Email tidak valid" }
    ),
  },
  detail: {
    tags: ["Auth"],
    description: "Mendaftarkan user baru dengan UUID",
    summary: "Register",
  },
};

const postLoginSchema = {
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
        user: t.Object(
          {
            id: t.String({ description: "ID pengguna", example: "1" }),
            name: t.String({
              description: "Nama sementara yang diambil dari email",
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
      { description: "Login gagal" }
    ),
  },
  detail: {
    tags: ["Auth"],
    description: "Memulai sesi user",
    summary: "Login",
  },
};

const postLogoutSchema = {
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
};

const getVerifyTokenSchema = {
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
};

const getRefreshTokenSchema = {
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
};

const postGoogleLoginSchema = {
  type: "json",
  body: t.Object({
    code: t.String({ description: "Google OAuth code" }),
  }),
  response: {
    200: t.Object(
      {
        accessToken: t.String(),
        user: t.Object({
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
        }),
      },
      { description: "Berhasil login menggunakan akun Google" }
    ),
    401: t.Object(
      {
        message: t.String({
          description: "Pesan error jika kredensial tidak valid",
          example: "Kredensial tidak valid. Gagal melakukan login.",
        }),
      },
      { description: "Gagal login menggunakan akun Google" }
    ),
  },
  detail: {
    tags: ["Auth"],
    description: "Login/register menggunakan Akun Google",
    summary: "Google OAuth",
  },
};

export {
  postRegisterSchema,
  postLoginSchema,
  postLogoutSchema,
  getVerifyTokenSchema,
  getRefreshTokenSchema,
  postGoogleLoginSchema,
};

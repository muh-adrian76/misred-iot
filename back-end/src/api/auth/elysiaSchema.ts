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
    name: t.Optional(t.String({
      example: "Nama User",
    })),
    is_admin: t.Optional(t.Boolean({
      example: false,
    })),
  }),
  response: {
    201: t.Object(
      {
        message: t.String({
          description: "Pesan hasil registrasi",
          example: "Pengguna berhasil terdaftar",
        }),
        id: t.String({
          description: "ID Pengguna UUID yang baru terdaftar",
          example: "b3b1c2d3-4e5f-6789-abcd-ef0123456789",
        }),
      },
      { description: "Pengguna berhasil terdaftar" }
    ),
    400: t.Object(
      {
        message: t.String({
          description: "Pesan error jika email tidak valid/duplicate",
          example: "Email tidak valid. Gagal menambahkan Pengguna.",
        }),
      },
      { description: "Email tidak valid" }
    ),
  },
  detail: {
    tags: ["Auth"],
    description: "Mendaftarkan Pengguna baru dengan UUID",
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
            description: "Nama pengguna",
            example: "contoh",
          }),
            email: t.String({
              description: "Email pengguna",
              example: "contoh@gmail.com",
            }),
            created_at: t.String({
              description: "Waktu pembuatan akun",
              example: "2023-09-01T12:00:00Z",
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
    description: "Memulai sesi Pengguna",
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
          example: "Pengguna berhasil logout",
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
    description: "Menghapus sesi Pengguna",
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
    mode: t.String({ description: "Mode Google Login" }),
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

const postResetForgottenPasswordSchema = {
  type: "json",
  body: t.Object({
    email: t.String({
      description: "Email pengguna untuk reset password",
      example: "contoh@gmail.com",
    })
  }),
  response: {
    200: t.Object(
      {
        message: t.String({
          description: "Pesan setelah berhasil mengubah password",
          example: "Password berhasil diperbarui",
        }),

        password: t.String({
          description: "Password baru yang dihasilkan",
          example: "contohpasswordbaru123",
        }),
      },
      { description: "Berhasil mengubah password" }
    ),
    400: t.Object(
      {
        message: t.String({
          description: "Email tidak ditemukan atau tidak valid",
          example: "Email tidak ditemukan. Gagal mengubah password.",
        }),
      },
      { description: "Gagal mengubah password" }
    ),
  },
  detail: {
    tags: ["Auth"],
    description: "Mengubah password pengguna yang sudah terautentikasi",
    summary: "Forgot Password",
  },
}

const postResetPasswordSchema = {
  type: "json",
  body: t.Object({
    oldPassword: t.String({
      description: "Password lama pengguna",
      example: "contohpasswordlama123",
    }),
    newPassword: t.String({
      description: "Password baru pengguna",
      example: "contohpasswordbaru123",
    }),
  }),
  response: {
    200: t.Object(
      {
        message: t.String({
          description: "Pesan setelah berhasil mengubah password",
          example: "Password berhasil diperbarui",
        }),
      },
      { description: "Berhasil mengubah password" }
    ),
    400: t.Object(
      {
        message: t.String({
          description: "Pesan error jika password lama salah",
          example: "Password lama salah. Gagal mengubah password.",
        }),
      },
      { description: "Gagal mengubah password" }
    ),
  },
  detail: {
    tags: ["Auth"],
    description: "Mengubah password pengguna yang sudah terautentikasi",
    summary: "Reset Password",
  },
}

export {
  postRegisterSchema,
  postLoginSchema,
  postLogoutSchema,
  getVerifyTokenSchema,
  getRefreshTokenSchema,
  postGoogleLoginSchema,
  postResetForgottenPasswordSchema,
  postResetPasswordSchema,
};

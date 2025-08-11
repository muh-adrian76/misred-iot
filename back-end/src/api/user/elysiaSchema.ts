import { t } from "elysia";

const getAllUsersSchema = {
  type: "json",
  response: {
    200: t.Object(
      {
        status: t.String({
          description: "Status respons",
          example: "success",
        }),
        data: t.Array(
          t.Object({
            id: t.Number({
              description: "ID pengguna",
              example: 1,
            }),
            name: t.String({
              description: "Nama pengguna",
              example: "contoh",
            }),
            email: t.String({
              description: "Email pengguna",
              example: "contoh@gmail.com",
            }),
            is_admin: t.Boolean({
              description: "Status admin pengguna",
              example: false,
            }),
            created_at: t.String({
              description: "Waktu pendaftaran pengguna",
              example: "2023-06-30T15:00:00Z",
            }),
            last_login: t.String({
              description: "Waktu login terakhir pengguna",
              example: "2023-07-30T15:00:00Z",
            }),
            phone: t.String({
              description: "Nomor telepon pengguna",
              example: "083117228331",
            }),
          }),
          { description: "Daftar semua pengguna yang terdaftar" }
        ),
      },
      { description: "Respons yang berisi data semua pengguna" }
    ),
    404: t.Object(
      {
        message: t.String({
          description: "Pesan error jika tidak ada pengguna ditemukan",
          example: "Belum ada pengguna yang terdaftar",
        }),
      },
      { description: "Pengguna tidak ditemukan" }
    ),
  },
  detail: {
    tags: ["User"],
    description: "Mengambil semua data pengguna",
    summary: "Ambil semua pengguna",
  },
};

const getUserByIdSchema = {
  type: "json",
  response: {
    200: t.Object(
      {
        id: t.String({
          description: "ID pengguna",
          example: 1,
        }),
        name: t.String({
          description: "Nama pengguna",
          example: "contoh",
        }),
        email: t.String({
          description: "Email pengguna",
          example: "contoh@gmail.com",
        }),
        created_at: t.String({
          description: "Waktu pendaftaran pengguna",
          example: "2023-06-30T15:00:00Z",
        }),
        last_login: t.String({
          description: "Waktu login terakhir pengguna",
          example: "2023-07-30T15:00:00Z",
        }),
        phone: t.String({
          description: "Nomor telepon pengguna",
          example: "083117228331",
        }),
      },
      { description: "Respons yang berisi data pengguna berdasarkan ID" }
    ),
    404: t.Object(
      {
        message: t.String({
          description: "Pesan error jika pengguna tidak ditemukan",
          example: "Pengguna tidak ditemukan",
        }),
      },
      { description: "Pengguna tidak ditemukan" }
    ),
  },
  detail: {
    tags: ["User"],
    description: "Mengambil data pengguna berdasarkan ID",
    summary: "Ambil pengguna berdasarkan ID",
  },
};

const putUserSchema = {
  type: "json",
  body: t.Object({
    name: t.String({
      example: "contoh yang diperbarui",
    }),
    email: t.Optional(
      t.String({
        example: "contoh@gmail.com",
      })
    ),
    phone: t.Optional(
      t.String({
        example: "083117228331",
      })
    ),
    is_admin: t.Optional(
      t.Boolean({
        description: "Status admin pengguna",
        example: false,
      })
    ),
    whatsapp_notif: t.Optional(
      t.Boolean({
        description: "Status notifikasi WhatsApp",
        example: true,
      })
    ),
  }),
  response: {
    200: t.Object(
      {
        message: t.String({
          description: "Pesan sukses setelah berhasil memperbarui pengguna",
          example: "Pengguna berhasil diperbarui",
        }),
        id: t.String({
          description: "ID pengguna yang berhasil diperbarui",
          example: 1,
        }),
      },
      { description: "Data pengguna berhasil diperbarui" }
    ),
    400: t.Object(
      {
        message: t.String({
          description: "Pesan error jika input tidak valid",
          example: "Input tidak valid.",
        }),
      },
      { description: "Input tidak valid" }
    ),
    404: t.Object(
      {
        message: t.String({
          description:
            "Pesan error jika pengguna dengan ID yang diberikan tidak ditemukan",
          example: "Pengguna tidak ditemukan",
        }),
      },
      { description: "Pengguna tidak ditemukan" }
    ),
  },
  detail: {
    tags: ["User"],
    description: "Memperbarui data pengguna berdasarkan ID",
    summary: "Perbarui pengguna",
  },
};

const deleteUserSchema = {
  type: "json",
  response: {
    200: t.Object(
      {
        message: t.String({
          description: "Pesan berhasil menghapus pengguna",
          example: "Pengguna berhasil dihapus",
        }),
      },
      { description: "Pengguna berhasil dihapus" }
    ),
    404: t.Object(
      {
        message: t.String({
          description: "Pesan error jika pengguna tidak ditemukan",
          example: "Pengguna tidak ditemukan",
        }),
      },
      { description: "Pengguna tidak ditemukan" }
    ),
  },
  detail: {
    tags: ["User"],
    description: "Menghapus data pengguna berdasarkan ID",
    summary: "Hapus pengguna",
  },
};

export {
  getAllUsersSchema,
  getUserByIdSchema,
  putUserSchema,
  deleteUserSchema,
};

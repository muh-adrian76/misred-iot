import { t } from "elysia";

const getAllUsersSchema = {
  type: "json",
  response: {
    200: t.Object(
      {
        result: t.Array(
          t.Object({
            id: t.String({
              description: "ID user",
              example: 1,
            }),
            name: t.String({
              description: "Username user",
              example: "contoh",
            }),
            email: t.String({
              description: "Email user",
              example: "contoh@gmail.com",
            }),
            created_at: t.String({
              description: "Waktu pendaftaran user",
              example: "2023-06-30T15:00:00Z",
            }),
            last_login: t.String({
              description: "Waktu login terakhir user",
              example: "2023-07-30T15:00:00Z",
            }),
            phone: t.String({
              description: "Nomor telepon user",
              examples: "083117228331",
            }),
          }),
          { description: "Daftar semua user yang terdaftar" }
        ),
      },
      { description: "Response yang berisi data semua user" }
    ),
    404: t.Object(
      {
        message: t.String({
          description: "Pesan error jika tidak ada user ditemukan",
          example: "Belum ada user yang terdaftar",
        }),
      },
      { description: "User tidak ditemukan" }
    ),
  },
  detail: {
    tags: ["User"],
    description: "Mengambil semua data user",
    summary: "Get all users",
  },
};

const getUserByIdSchema = {
  type: "json",
  response: {
    200: t.Object(
      {
        id: t.String({
          description: "ID user",
          example: 1,
        }),
        name: t.String({
          description: "Username user",
          example: "contoh",
        }),
        email: t.String({
          description: "Email user",
          example: "contoh@gmail.com",
        }),
        created_at: t.String({
          description: "Waktu pendaftaran user",
          example: "2023-06-30T15:00:00Z",
        }),
        last_login: t.String({
          description: "Waktu login terakhir user",
          example: "2023-07-30T15:00:00Z",
        }),
        phone: t.String({
          description: "Nomor telepon user",
          examples: "083117228331",
        }),
      },
      { description: "Response yang berisi data user berdasarkan ID" }
    ),
    404: t.Object(
      {
        message: t.String({
          description: "Pesan error jika user tidak ditemukan",
          example: "User tidak ditemukan",
        }),
      },
      { description: "User tidak ditemukan" }
    ),
  },
  detail: {
    tags: ["User"],
    description: "Mengambil data user berdasarkan ID",
    summary: "Get user by ID",
  },
};

const putUserSchema = {
  type: "json",
  body: t.Object({
    name: t.String({
      example: "contoh yang diperbarui",
    }),
    phone: t.Optional(
      t.String({
        example: "083117228331",
      })
    ),
  }),
  response: {
    200: t.Object(
      {
        message: t.String({
          description: "Pesan sukses setelah berhasil memperbarui user",
          example: "User berhasil diperbarui",
        }),
        id: t.String({
          description: "ID user yang berhasil diperbarui",
          example: 1,
        }),
      },
      { description: "Data user berhasil diperbarui" }
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
            "Pesan error jika user dengan ID yang diberikan tidak ditemukan",
          example: "User tidak ditemukan",
        }),
      },
      { description: "User tidak ditemukan" }
    ),
  },
  detail: {
    tags: ["User"],
    description: "Memperbarui data user berdasarkan ID",
    summary: "Update user",
  },
};

const deleteUserSchema = {
  type: "json",
  response: {
    200: t.Object(
      {
        message: t.String({
          description: "Pesan berhasil menghapus user",
          example: "User berhasil dihapus",
        }),
      },
      { description: "User berhasil dihapus" }
    ),
    404: t.Object(
      {
        message: t.String({
          description: "Pesan error jika user tidak ditemukan",
          example: "User tidak ditemukan",
        }),
      },
      { description: "User tidak ditemukan" }
    ),
  },
  detail: {
    tags: ["User"],
    description: "Menghapus data user berdasarkan ID",
    summary: "Delete user",
  },
};

export {
  getAllUsersSchema,
  getUserByIdSchema,
  putUserSchema,
  deleteUserSchema,
};

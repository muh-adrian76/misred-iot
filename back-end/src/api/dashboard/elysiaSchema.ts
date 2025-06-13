import { t } from "elysia";

const getAllDashboardsSchema = {
  type: "json",
  response: {
    200: t.Object(
      {
        result: t.Array(
          t.Object({
            id: t.String({
              description: "ID dashboard",
              example: "dashboard-1",
            }),
            user_id: t.String({
              description: "ID user pemilik dashboard",
              example: "user-1",
            }),
            name: t.String({
              description: "Nama dashboard",
              example: "Dashboard Rumah",
            }),
          }),
          { description: "Daftar semua dashboard milik user" }
        ),
      },
      { description: "Response yang berisi data semua dashboard milik user" }
    ),
  },
  detail: {
    tags: ["Dashboard"],
    description: "Mengambil semua dashboard milik user",
    summary: "Get all dashboards",
  },
};

const postDashboardSchema = {
  type: "json",
  body: t.Object({
    description: t.String({
      description: "Nama dashboard",
      example: "Pabrik Tembalang",
    }),
  }),
  response: {
    201: t.Object(
      {
        message: t.String({
          description: "Pesan berhasil membuat dashboard",
          example: "Dashboard berhasil dibuat",
        }),
        id: t.String({
          description: "ID dashboard yang baru dibuat",
          example: "dashboard-1",
        }),
      },
      { description: "Dashboard berhasil dibuat" }
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
  },
  detail: {
    tags: ["Dashboard"],
    description: "Membuat dashboard baru",
    summary: "Create dashboard",
  },
};

const deleteDashboardSchema = {
  type: "json",
  response: {
    200: t.Object(
      {
        message: t.String({
          description: "Pesan setelah berhasil menghapus dashboard",
          example: "Dashboard berhasil dihapus",
        }),
      },
      { description: "Dashboard berhasil dihapus" }
    ),
    400: t.Object(
      {
        message: t.String({
          description: "Pesan error jika dashboard gagal dihapus",
          example: "Dashboard gagal dihapus.",
        }),
      },
      { description: "Dashboard gagal dihapus" }
    ),
  },
  detail: {
    tags: ["Dashboard"],
    description: "Menghapus dashboard berdasarkan ID",
    summary: "Delete dashboard",
  },
};

export { getAllDashboardsSchema, postDashboardSchema, deleteDashboardSchema };
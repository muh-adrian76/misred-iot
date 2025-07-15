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
    description: t.String(
      {
        description: "Deskripsi dashboard",
        example: "Dashboard untuk memantau kondisi rumah",
      }
    ),
    widget_count: t.Number(
      {
        description: "Deskripsi dashboard",
        example: "Dashboard untuk memantau kondisi rumah",
      }
    ),
    layout: t.Optional(t.Any(
      {
        description: "Deskripsi dashboard",
        example: "Dashboard untuk memantau kondisi rumah",
      }
    )),
  }),
  response: {
    201: t.Object({ id: t.Number(
      {
        description: "Deskripsi dashboard",
        example: "Dashboard untuk memantau kondisi rumah",
      }
    ), message: t.String(
      {
        description: "Deskripsi dashboard",
        example: "Dashboard untuk memantau kondisi rumah",
      }
    ) }),
  },
};

const putDashboardSchema = {
  type: "json",
  body: t.Object({
    description: t.String(
      {
        description: "Deskripsi dashboard",
        example: "Dashboard untuk memantau kondisi rumah",
      }
    ),
    widget_count: t.Number(
      {
        description: "Deskripsi dashboard",
        example: "Dashboard untuk memantau kondisi rumah",
      }
    ),
    layout: t.Optional(t.Any(
      {
        description: "Deskripsi dashboard",
        example: "Dashboard untuk memantau kondisi rumah",
      }
    )),
  }),
  response: {
    200: t.Object({ message: t.String(
      {
        description: "Deskripsi dashboard",
        example: "Dashboard untuk memantau kondisi rumah",
      }
    ) }),
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

export { getAllDashboardsSchema, postDashboardSchema, putDashboardSchema, deleteDashboardSchema };
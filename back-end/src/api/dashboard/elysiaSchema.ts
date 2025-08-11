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
    summary: "Ambil semua dashboard",
  },
};

const postDashboardSchema = {
  type: "json",
  body: t.Object({
    description: t.String({
      description: "Deskripsi dashboard",
      example: "Dashboard untuk memantau kondisi rumah",
    }),
    widget_count: t.Number({
      description: "Jumlah widget di dashboard",
      example: 4,
    }),
    layout: t.Optional(
      t.Any({
        description: "Konfigurasi layout dashboard (opsional)",
        example: { widgets: [{ id: "w1", x: 0, y: 0, w: 2, h: 2 }] },
      })
    ),
  }),
  response: {
    201: t.Object({
      id: t.Number({
        description: "ID dashboard yang dibuat",
        example: 101,
      }),
      message: t.String({
        description: "Pesan sukses pembuatan dashboard",
        example: "Dashboard berhasil dibuat",
      }),
    }),
  },
};

const putDashboardSchema = {
  type: "json",
  body: t.Object({
    description: t.String({
      description: "Deskripsi dashboard",
      example: "Dashboard untuk memantau kondisi rumah",
    }),
    widget_count: t.Number({
      description: "Jumlah widget di dashboard",
      example: 4,
    }),
    layout: t.Optional(
      t.Any({
        description: "Konfigurasi layout dashboard (opsional)",
        example: { widgets: [{ id: "w1", x: 0, y: 0, w: 2, h: 2 }] },
      })
    ),
  }),
  response: {
    200: t.Object({
      message: t.String({
        description: "Pesan setelah update dashboard",
        example: "Dashboard berhasil diubah",
      }),
    }),
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
    summary: "Hapus dashboard",
  },
};

export { getAllDashboardsSchema, postDashboardSchema, putDashboardSchema, deleteDashboardSchema };
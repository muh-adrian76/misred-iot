import { t } from "elysia";

const postWidgetSchema = {
  type: "json",
  body: t.Object({
    description: t.String({
      example: "Grafik kekeruhan air",
    }),
    dashboard_id: t.Union([t.String(), t.Number()], {
      description: "ID dashboard yang terkait dengan widget",
      example: 1,
    }),
    device_id: t.Union([t.String(), t.Number()], {
      description: "ID perangkat yang terkait dengan widget",
      example: 1,
    }),
    datastream_id: t.Union([t.String(), t.Number()], {
      description: "ID datastream yang terkait dengan widget",
      example: 1,
    }),
    type: t.String({ example: "line" }),
  }),
  response: {
    201: t.Object(
      {
        message: t.String({
          description: "Pesan berhasil menambah data widget",
          example: "Berhasil menambah data widget",
        }),
        id: t.Number({
          description: "ID widget yang baru ditambahkan",
          example: 1,
        }),
      },
      { description: "Data widget berhasil ditambahkan" }
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
    tags: ["Widget"],
    description: "Menambahkan data widget baru",
    summary: "Create widget",
  },
};

const getAllWidgetsSchema = {
  type: "json",
  response: {
    200: t.Object(
      {
        result: t.Array(
          t.Object({
            id: t.Number({ description: "ID widget", example: 1 }),
            description: t.String({ description: "Deskripsi widget", example: "COD Widget" }),
            dashboard_id: t.Number({ description: "ID dashboard", example: 1 }),
            device_id: t.Number({ description: "ID perangkat", example: 1 }),
            datastream_id: t.Number({ description: "ID datastream", example: 1 }),
            type: t.String({ description: "Tipe widget", example: "line" }),
            widget_key: t.String({ description: "Widget key unik", example: "unique-widget-key" }),
          }),
          { description: "Daftar semua data widget" }
        ),
      },
      { description: "Response yang berisi data semua widget" }
    ),
    404: t.Object(
      {
        message: t.String({
          description: "Pesan error jika tidak ada widget ditemukan",
          example: "Belum ada widget yang ditambahkan.",
        }),
      },
      { description: "Tidak ada widget ditemukan" }
    ),
  },
  detail: {
    tags: ["Widget"],
    description: "Mengambil semua data widget",
    summary: "Get all widgets",
  },
};

const getWidgetByDeviceIdSchema = {
  type: "json",
  response: {
    200: t.Object(
      {
        result: t.Array(
          t.Object({
            id: t.Number({ description: "ID widget", example: 1 }),
            description: t.String({ description: "Deskripsi widget", example: "COD Widget" }),
            dashboard_id: t.Number({ description: "ID dashboard", example: 1 }),
            device_id: t.Number({ description: "ID perangkat", example: 1 }),
            datastream_id: t.Number({ description: "ID datastream", example: 1 }),
            type: t.String({ description: "Tipe widget", example: "line" }),
            widget_key: t.String({ description: "Widget key unik", example: "unique-widget-key" }),
          }),
          { description: "Daftar widget berdasarkan device_id" }
        ),
      },
      {
        description: "Response yang berisi data widget berdasarkan device_id",
      }
    ),
    404: t.Object(
      {
        message: t.String({
          description:
            "Pesan error jika widget tidak ditemukan untuk device_id",
          example: "Widget tidak ditemukan untuk device_id yang diberikan",
        }),
      },
      {
        description: "Widget tidak ditemukan untuk device_id yang diberikan",
      }
    ),
  },
  detail: {
    tags: ["Widget"],
    description: "Mengambil data widget berdasarkan device_id",
    summary: "Get widget by device_id",
  },
};

const putWidgetSchema = {
  type: "json",
  body: t.Object({
    description: t.String({
      description: "Deskripsi widget yang akan diperbarui",
      example: "Flow Meter Widget",
    }),
    dashboard_id: t.Number({
      description: "ID dashboard yang terkait dengan widget",
      example: 1,
    }),
    device_id: t.Number({
      description: "ID perangkat yang terkait dengan widget",
      example: 1,
    }),
    datastream_id: t.Number({
      description: "ID datastream yang terkait dengan widget",
      example: 1,
    }),
    type: t.String({ example: "line" }),
  }),
  response: {
    200: t.Object(
      {
        message: t.String({
          description: "Pesan sukses setelah berhasil mengupdate widget",
          example: "Berhasil mengupdate data widget.",
        }),
      },
      { description: "Data widget berhasil diperbarui" }
    ),
    404: t.Object(
      {
        message: t.String({
          description: "Pesan error jika widget tidak ditemukan",
          example: "Widget tidak ditemukan",
        }),
      },
      { description: "Widget tidak ditemukan" }
    ),
  },
  detail: {
    tags: ["Widget"],
    description: "Mengupdate data widget berdasarkan ID",
    summary: "Update widget",
  },
};

const deleteWidgetSchema = {
  type: "json",
  response: {
    200: t.Object(
      {
        message: t.String({
          description: "Pesan berhasil menghapus widget",
          example: "Berhasil menghapus data widget.",
        }),
      },
      { description: "Widget berhasil dihapus" }
    ),
    404: t.Object(
      {
        message: t.String({
          description: "Pesan error jika widget tidak ditemukan",
          example: "Widget tidak ditemukan",
        }),
      },
      { description: "Widget tidak ditemukan" }
    ),
  },
  detail: {
    tags: ["Widget"],
    description: "Menghapus data widget berdasarkan ID",
    summary: "Delete widget",
  },
};

export {
  postWidgetSchema,
  getAllWidgetsSchema,
  getWidgetByDeviceIdSchema,
  putWidgetSchema,
  deleteWidgetSchema,
};
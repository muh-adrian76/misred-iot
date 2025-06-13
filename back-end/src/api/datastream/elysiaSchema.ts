import { t } from "elysia";

const getAllDatastreamsSchema = {
  type: "json",
  response: {
    200: t.Object(
      {
        result: t.Array(
          t.Object({
            id: t.String({
              description: "ID datastream",
              example: "datastream-1",
            }),
            device_id: t.String({
              description: "ID perangkat terkait",
              example: "device-1",
            }),
            pin: t.String({
              description: "Pin datastream",
              example: "V1",
            }),
            type: t.String({
              description: "Jenis datastream",
              example: "temperature",
            }),
            unit: t.String({
              description: "Satuan pengukuran",
              example: "°C",
            }),
            description: t.String({
              description: "Deskripsi datastream",
              example: "Sensor suhu ruangan",
            }),
          }),
          { description: "Daftar semua datastream milik perangkat" }
        ),
      },
      { description: "Response yang berisi data semua datastream milik perangkat" }
    ),
  },
  detail: {
    tags: ["Datastream"],
    description: "Mengambil semua datastream milik perangkat",
    summary: "Get all datastreams",
  },
};

const postDatastreamSchema = {
  type: "json",
  body: t.Object({
    deviceId: t.String({
      description: "ID perangkat terkait",
      example: "device-1",
    }),
    pin: t.String({
      description: "Pin datastream",
      example: "V1",
    }),
    type: t.String({
      description: "Jenis datastream",
      example: "temperature",
    }),
    unit: t.Optional(
      t.String({
        description: "Satuan pengukuran",
        example: "°C",
      })
    ),
    description: t.Optional(
      t.String({
        description: "Deskripsi datastream",
        example: "Sensor suhu ruangan",
      })
    ),
  }),
  response: {
    201: t.Object(
      {
        message: t.String({
          description: "Pesan berhasil membuat datastream",
          example: "Datastream berhasil dibuat",
        }),
        id: t.String({
          description: "ID datastream yang baru dibuat",
          example: "datastream-1",
        }),
      },
      { description: "Datastream berhasil dibuat" }
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
    tags: ["Datastream"],
    description: "Membuat datastream baru",
    summary: "Create datastream",
  },
};

const deleteDatastreamSchema = {
  type: "json",
  response: {
    200: t.Object(
      {
        message: t.String({
          description: "Pesan setelah berhasil menghapus datastream",
          example: "Datastream berhasil dihapus",
        }),
      },
      { description: "Datastream berhasil dihapus" }
    ),
    400: t.Object(
      {
        message: t.String({
          description: "Pesan error jika datastream gagal dihapus",
          example: "Datastream gagal dihapus.",
        }),
      },
      { description: "Datastream gagal dihapus" }
    ),
  },
  detail: {
    tags: ["Datastream"],
    description: "Menghapus datastream berdasarkan ID",
    summary: "Delete datastream",
  },
};

export { getAllDatastreamsSchema, postDatastreamSchema, deleteDatastreamSchema };
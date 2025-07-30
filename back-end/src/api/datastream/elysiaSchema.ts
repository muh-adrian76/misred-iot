import { t } from "elysia";

// GET all datastreams milik user
const getAllDatastreamsSchema = {
  type: "json",
  response: {
    200: t.Object(
      {
        result: t.Array(
          t.Object({
            id: t.String({ description: "ID datastream", example: "1" }),
            user_id: t.String({ description: "ID user pemilik", example: "user-1" }),
            pin: t.String({ description: "Pin datastream", example: "V1" }),
            type: t.String({ description: "Jenis datastream", example: "temperature" }),
            unit: t.Optional(t.String({ description: "Satuan pengukuran", example: "°C" })),
            description: t.Optional(t.String({ description: "Deskripsi datastream", example: "Sensor suhu ruangan" })),
            minValue: t.Number({ description: "Nilai minimal", example: 0 }),
            maxValue: t.Number({ description: "Nilai maksimal", example: 1 }),
          }),
          { description: "Daftar semua datastream milik user" }
        ),
      },
      { description: "Response yang berisi data semua datastream milik user" }
    ),
  },
  detail: {
    tags: ["Datastream"],
    description: "Mengambil semua datastream milik user",
    summary: "Get all datastreams",
  },
};

// POST datastream (user_id dari JWT, bukan dari body)
const postDatastreamSchema = {
  type: "json",
  body: t.Object({
    deviceId: t.String({ description: "ID perangkat yang memiliki datastream", example: "device-1" }),
    pin: t.String({ description: "Pin datastream", example: "V1" }),
    type: t.String({ description: "Jenis datastream", example: "temperature" }),
    unit: t.Optional(t.String({ description: "Satuan pengukuran", example: "°C" })),
    description: t.Optional(t.String({ description: "Deskripsi datastream", example: "Sensor suhu ruangan" })),
    minValue: t.String({ description: "Nilai minimal", example: 0 }),
    maxValue: t.String({ description: "Nilai maksimal", example: 1 }),
    decimalValue: t.String({description: "Format nilai desimal", examples: "0.00"}),
    booleanValue: t.String({description: "Nilai boolean", examples: "0"})
  }),
  response: {
    201: t.Object(
      {
        message: t.String({ description: "Pesan berhasil membuat datastream", example: "Datastream berhasil dibuat" }),
        id: t.String({ description: "ID datastream yang baru dibuat", example: "1" }),
      },
      { description: "Datastream berhasil dibuat" }
    ),
    400: t.Object(
      {
        message: t.String({ description: "Pesan error jika input tidak valid", example: "Input tidak valid." }),
      },
      { description: "Input tidak valid" }
    ),
  },
  detail: {
    tags: ["Datastream"],
    description: "Membuat datastream baru (user_id diambil dari JWT)",
    summary: "Create datastream",
  },
};

const putDatastreamSchema = {
  type: "json",
  body: t.Object({
    deviceId: t.String({ description: "ID perangkat yang memiliki datastream", example: "device-2" }),
    pin: t.String({ description: "Pin datastream", example: "V1" }),
    type: t.String({ description: "Jenis datastream", example: "temperature" }),
    unit: t.Optional(t.String({ description: "Satuan pengukuran", example: "°C" })),
    description: t.Optional(t.String({ description: "Deskripsi datastream", example: "Sensor suhu ruangan" })),
    minValue: t.String({ description: "Nilai minimal", example: 0 }),
    maxValue: t.String({ description: "Nilai maksimal", example: 1 }),
    decimalValue: t.String({description: "Format nilai desimal", examples: "0.00"}),
    booleanValue: t.String({description: "Nilai boolean", examples: "0"})
  }),
  response: {
    200: t.Object(
      {
        message: t.String({ description: "Pesan berhasil update datastream", example: "Datastream berhasil diupdate" }),
      },
      { description: "Datastream berhasil diupdate" }
    ),
    400: t.Object(
      {
        message: t.String({ description: "Pesan error jika update gagal", example: "Datastream gagal diupdate." }),
      },
      { description: "Datastream gagal diupdate" }
    ),
  },
  detail: {
    tags: ["Datastream"],
    description: "Mengupdate datastream berdasarkan ID",
    summary: "Update datastream",
  },
};

const deleteDatastreamSchema = {
  type: "json",
  response: {
    200: t.Object(
      {
        message: t.String({ description: "Pesan setelah berhasil menghapus datastream", example: "Datastream berhasil dihapus" }),
      },
      { description: "Datastream berhasil dihapus" }
    ),
    400: t.Object(
      {
        message: t.String({ description: "Pesan error jika datastream gagal dihapus", example: "Datastream gagal dihapus." }),
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

export { getAllDatastreamsSchema, postDatastreamSchema, putDatastreamSchema, deleteDatastreamSchema };
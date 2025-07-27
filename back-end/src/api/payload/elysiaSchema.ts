import { t } from "elysia";

const postPayloadHttpSchema = {
  type: "json",
  // Tidak ada body validation karena data ada di JWT token
  headers: t.Object({
    "x-device-id": t.Optional(t.String({ description: "Device ID in header" })),
    "authorization": t.String({ description: "Bearer JWT token with sensor data" })
  }),
  response: {
    201: t.Object({
      message: t.String({ example: "Berhasil menambah data sensor" }),
      id: t.Number({ example: 1 }),
      device_id: t.String({ example: "1" }),
    }),
    400: t.Object({
      error: t.String({ example: "Header tidak lengkap" }),
      message: t.String({ example: "Tidak ada header Authorization" }),
    }),
    401: t.Object({
      error: t.String({ example: "Format token tidak valid" }),
      message: t.String({ example: "Bearer token format required" }),
    }),
    500: t.Object({
      error: t.String({ example: "Failed to process payload" }),
      message: t.String({ example: "Internal server error" }),
    }),
  },
  detail: {
    tags: ["Payload"],
    description: "Menambah data sensor baru via HTTP dengan JWT token - data sensor ada di dalam JWT token, bukan di body",
    summary: "Create sensor data via JWT",
  },
};

const postPayloadLoraSchema = {
  type: "json",
  body: t.Object({
    dev_eui: t.String({
      description: "Device EUI LoRa",
      example: "A84041B2C1A2B3C4",
    }),
    datastream_id: t.Number({
      description: "ID datastream",
      example: 1,
    }),
    value: t.Any({
      description: "Nilai data sensor",
      example: { suhu: 27.5 },
    }),
  }),
  response: {
    201: t.Object({
      message: t.String({
        description: "Pesan sukses tambah data sensor LoRa",
        example: "Berhasil menambah data sensor dari LoRa",
      }),
      id: t.Number({
        description: "ID data payload",
        example: 123,
      }),
    }),
    404: t.Object({
      error: t.String({
        description: "Pesan error jika gagal",
        example: "internal_error",
      }),
    }),
  },
  detail: {
    tags: ["Payload"],
    summary: "Create LoRaWAN sensor data",
    description: "Menambah data sensor baru dari perangkat LoRaWAN",
  },
};

const getAllPayloadsSchema = {
  type: "json",
  response: {
    200: t.Object({
      result: t.Array(
        t.Object({
          id: t.Number(),
          device_id: t.Number(),
          datastream_id: t.Number(),
          value: t.Any(),
          server_time: t.String(),
        })
      ),
    }),
  },
  detail: {
    tags: ["Payload"],
    description: "Mengambil semua data payload",
    summary: "Get all payloads",
  },
};

const getPayloadByDeviceIdSchema = {
  type: "json",
  response: {
    200: t.Object({
      result: t.Array(
        t.Object({
          id: t.Number(),
          device_id: t.Number(),
          datastream_id: t.Number(),
          value: t.Any(),
          server_time: t.String(),
        })
      ),
    }),
    404: t.Object({
      message: t.String({ example: "No payload found for this device." }),
    }),
  },
  detail: {
    tags: ["Payload"],
    description: "Mengambil data payload berdasarkan device_id",
    summary: "Get payload by device_id",
  },
};

const getPayloadByDeviceAndDatastreamSchema = {
  type: "json",
  response: {
    200: t.Object({
      result: t.Array(
        t.Object({
          id: t.Number(),
          device_id: t.Number(),
          datastream_id: t.Number(),
          value: t.Any(),
          server_time: t.String(),
        })
      ),
    }),
    404: t.Object({
      message: t.String({ example: "No payload found for this device and datastream." }),
    }),
  },
  detail: {
    tags: ["Payload"],
    description: "Mengambil data payload berdasarkan device_id dan datastream_id",
    summary: "Get payload by device_id and datastream_id",
  },
};

export {
  postPayloadHttpSchema,
  postPayloadLoraSchema,
  getAllPayloadsSchema,
  getPayloadByDeviceIdSchema,
  getPayloadByDeviceAndDatastreamSchema,
};
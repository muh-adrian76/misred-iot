import { t } from "elysia";

const uploadFirmwareSchema = {
  body: t.Object({
    board_type: t.String({ minLength: 1 }),
    firmware_version: t.String({ minLength: 1 }),
    filename: t.String({ minLength: 1 }),
    file_base64: t.String({ minLength: 1 }),
  }),
  response: {
    200: t.Object({
      success: t.Boolean(),
      message: t.String(),
      data: t.Object({
        id: t.Number(),
        board_type: t.String(),
        firmware_version: t.String(),
        firmware_url: t.String(),
      }),
    }),
    400: t.Object({
      error: t.String(),
    }),
    500: t.Object({
      error: t.String(),
    }),
  },
  detail: {
    tags: ["OTAA"],
    summary: "Upload firmware",
    description: "Unggah file firmware untuk pembaruan perangkat (OTAA)",
  },
};

const getFirmwaresSchema = {
  response: {
    200: t.Object({
      success: t.Boolean(),
      data: t.Array(t.Any()),
    }),
    500: t.Object({
      error: t.String(),
    }),
  },
  detail: {
    tags: ["OTAA"],
    summary: "Daftar firmware",
    description: "Mengambil semua firmware milik pengguna",
  },
};

const getFirmwareByBoardSchema = {
  params: t.Object({
    board_type: t.String(),
  }),
  response: {
    200: t.Object({
      success: t.Boolean(),
      data: t.Any(),
    }),
    404: t.Object({
      error: t.String(),
    }),
    500: t.Object({
      error: t.String(),
    }),
  },
  detail: {
    tags: ["OTAA"],
    summary: "Firmware berdasarkan tipe board",
    description: "Mengambil firmware berdasarkan tipe board untuk pengguna",
  },
};

const getBoardTypesSchema = {
  response: {
    200: t.Object({
      data: t.Array(t.String()),
    }),
    500: t.Object({
      error: t.String(),
    }),
  },
  detail: {
    tags: ["OTAA"],
    summary: "Daftar tipe board",
    description: "Mengambil daftar tipe board yang tersedia",
  },
};

const checkUpdateSchema = {
  params: t.Object({
    device_id: t.String(),
  }),
  response: {
    200: t.Object({
      success: t.Boolean(),
      data: t.Object({
        hasUpdate: t.Boolean(),
        currentVersion: t.Optional(t.String()),
        latestVersion: t.Optional(t.String()),
        firmwareUrl: t.Optional(t.String()),
        message: t.String(),
      }),
    }),
    500: t.Object({
      error: t.String(),
    }),
  },
  detail: {
    tags: ["OTAA"],
    summary: "Cek pembaruan firmware",
    description: "Memeriksa apakah ada pembaruan firmware untuk perangkat",
  },
};

const deleteFirmwareSchema = {
  params: t.Object({
    id: t.String(),
  }),
  response: {
    200: t.Object({
      success: t.Boolean(),
      message: t.String(),
    }),
    404: t.Object({
      error: t.String(),
    }),
    500: t.Object({
      error: t.String(),
    }),
  },
  detail: {
    tags: ["OTAA"],
    summary: "Hapus firmware",
    description: "Menghapus firmware berdasarkan ID untuk pengguna",
  },
};

export {
  uploadFirmwareSchema,
  getFirmwaresSchema,
  getFirmwareByBoardSchema,
  getBoardTypesSchema,
  checkUpdateSchema,
  deleteFirmwareSchema,
};
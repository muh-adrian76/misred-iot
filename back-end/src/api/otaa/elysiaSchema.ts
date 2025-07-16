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
};

export {
  uploadFirmwareSchema,
  getFirmwaresSchema,
  getFirmwareByBoardSchema,
  getBoardTypesSchema,
  checkUpdateSchema,
  deleteFirmwareSchema,
};
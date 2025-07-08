import { t } from "elysia";

const postAlarmSchema = {
  type: "json",
  body: t.Object({
    description: t.String({ example: "Alarm pH tinggi" }),
    widget_id: t.Number({ example: 1 }),
    operator: t.String({ example: ">", description: "Operator (=, <, >)" }),
    threshold: t.Number({ example: 7.5 }),
  }),
  response: {
    201: t.Object({
      message: t.String({ example: "Berhasil menambah data alarm" }),
      id: t.Number({ example: 1 }),
    }),
    400: t.Object({
      message: t.String({ example: "Input tidak valid" }),
    }),
  },
  detail: {
    tags: ["Alarm"],
    description: "Menambah data alarm baru",
    summary: "Create alarm",
  },
};

const getAllAlarmsSchema = {
  type: "json",
  response: {
    200: t.Object({
      result: t.Array(
        t.Object({
          id: t.Number(),
          description: t.String(),
          user_id: t.String(),
          widget_id: t.Number(),
          operator: t.String(),
          threshold: t.Number(),
          last_sended: t.String(),
        })
      ),
    }),
  },
  detail: {
    tags: ["Alarm"],
    description: "Mengambil semua data alarm",
    summary: "Get all alarms",
  },
};

const getAlarmByWidgetIdSchema = {
  type: "json",
  response: {
    200: t.Object({
      result: t.Array(
        t.Object({
          id: t.Number(),
          description: t.String(),
          user_id: t.String(),
          widget_id: t.Number(),
          operator: t.String(),
          threshold: t.Number(),
          last_sended: t.String(),
        })
      ),
    }),
    404: t.Object({
      message: t.String({ example: "Alarm tidak ditemukan" }),
    }),
  },
  detail: {
    tags: ["Alarm"],
    description: "Mengambil data alarm berdasarkan widget_id",
    summary: "Get alarm by widget_id",
  },
};

const putAlarmSchema = {
  type: "json",
  body: t.Object({
    description: t.String({ example: "Alarm pH tinggi" }),
    widget_id: t.Number({ example: 1 }),
    operator: t.String({ example: ">", description: "Operator (=, <, >)" }),
    threshold: t.Number({ example: 7.5 }),
  }),
  response: {
    200: t.Object({
      message: t.String({ example: "Berhasil mengupdate data alarm." }),
      id: t.Number({ example: 1 }),
    }),
    400: t.Object({
      message: t.String({ example: "Input tidak valid." }),
    }),
    404: t.Object({
      message: t.String({ example: "Alarm tidak ditemukan." }),
    }),
  },
  detail: {
    tags: ["Alarm"],
    description: "Memperbarui data alarm berdasarkan ID",
    summary: "Update alarm",
  },
};

const deleteAlarmSchema = {
  type: "json",
  response: {
    200: t.Object({
      message: t.String({ example: "Berhasil menghapus data alarm." }),
    }),
    404: t.Object({
      message: t.String({ example: "Alarm tidak ditemukan." }),
    }),
  },
  detail: {
    tags: ["Alarm"],
    description: "Menghapus data alarm berdasarkan ID",
    summary: "Delete alarm",
  },
};

export {
  postAlarmSchema,
  getAllAlarmsSchema,
  getAlarmByWidgetIdSchema,
  putAlarmSchema,
  deleteAlarmSchema,
};
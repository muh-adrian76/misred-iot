import { t } from "elysia";

const postAlarmSchema = {
      type: "json",
      body: t.Object({
        name: t.String({
          example: "pH Abnormal",
        }),
        device_id: t.String({
          example: "device-1",
        }),
        operator: t.String({
          description: "Operator untuk melakukan perhitungan (>, <, =)",
          example: ">",
        }),
        threshold: t.Number({
          description: "Batas nilai untuk alarm",
          example: 9,
        }),
        sensor: t.String({
          description: "Jenis sensor yang digunakan",
          example: "pH",
        }),
      }),
      response: {
        201: t.Object(
          {
            message: t.String({
              description: "Pesan berhasil menambah alarm",
              example: "Berhasil menambah data alarm",
            }),
            id: t.Number({
              description: "ID alarm yang baru dibuat",
              example: 1,
            }),
          },
          { description: "Alarm berhasil dibuat" }
        ),
        400: t.Object(
          {
            message: t.String({
              description: "Pesan error jika ada input yang tidak valid",
              example: "Input tidak valid",
            }),
          },
          { description: "Error pada input" }
        ),
      },
      detail: {
        tags: ["Alarm"],
        description: "Menambah data alarm baru",
        summary: "Create alarm",
      },
    }

const getAllAlarmsSchema = {
      type: "json",
      response: {
        200: t.Object(
          {
            result: t.Array(
              t.Object({
                id: t.Number({
                  description: "ID dari alarm",
                  example: 1,
                }),
                description: t.String({
                  description: "Deskripsi atau nama alarm",
                  example: "Alarm 1",
                }),
                device_id: t.String({
                  description: "ID perangkat yang terkait dengan alarm",
                  example: "device-1",
                }),
                operator: t.String({
                  description: "Operator untuk perhitungan",
                  example: ">",
                }),
                threshold: t.Number({
                  description: "Batas nilai untuk alarm",
                  example: 50,
                }),
                sensor_type: t.String({
                  description: "Jenis sensor yang digunakan",
                  example: "COD",
                }),
              }),
              { description: "Daftar semua alarms" }
            ),
          },
          { description: "Response yang berisi data semua alarm" }
        ),
      },
      detail: {
        tags: ["Alarm"],
        description: "Mengambil semua data alarm",
        summary: "Get all alarms",
      },
    }

const getAlarmByDeviceIdSchema = {
      type: "json",
      response: {
        200: t.Object(
          {
            result: t.Array(
              t.Object({
                id: t.Number({
                  description: "ID alarm",
                  example: 1,
                }),
                description: t.String({
                  description: "Deskripsi atau nama alarm",
                  example: "Alarm 1",
                }),
                device_id: t.String({
                  description: "ID perangkat yang terkait dengan alarm",
                  example: "device-1",
                }),
                operator: t.String({
                  description: "Operator untuk alarm (misalnya: >, <, =)",
                  example: ">",
                }),
                threshold: t.Number({
                  description: "Batas nilai untuk alarm",
                  example: 50,
                }),
                sensor_type: t.String({
                  description: "Jenis sensor yang digunakan",
                  example: "TSS",
                }),
              }),
              { description: "Array dari data alarm pada device tertentu" }
            ),
          },
          {
            description:
              "Response yang berisi data alarm berdasarkan device_id",
          }
        ),
        404: t.Object(
          {
            message: t.String({
              description: "Pesan error jika tidak ada data alarm ditemukan",
              example: "Alarm tidak ditemukan",
            }),
          },
          { description: "Data alarm tidak ditemukan" }
        ),
      },
      detail: {
        tags: ["Alarm"],
        description: "Mengambil data alarm berdasarkan device_id",
        summary: "Get alarm by device_id",
      },
    }

const putAlarmSchema = {
      type: "json",
      body: t.Object({
        name: t.String({
          example: "Alarm 1",
        }),
        device_id: t.String({
          example: "device-1",
        }),
        operator: t.String({
          description: "Operator untuk alarm (misalnya: >, <, =)",
          example: ">",
        }),
        threshold: t.Number({
          description: "Batas nilai untuk alarm",
          example: 50,
        }),
        sensor: t.String({
          description: "Jenis sensor yang digunakan",
          example: "NH3N",
        }),
      }),
      response: {
        200: t.Object(
          {
            message: t.String({
              description: "Pesan berhasil memperbarui alarm",
              example: "Berhasil mengupdate data alarm.",
            }),
            id: t.Number({
              description: "ID alarm yang diperbarui",
              example: 1,
            }),
          },
          { description: "Alarm berhasil diperbarui" }
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
        404: t.Object(
          {
            message: t.String({
              description: "Pesan error jika alarm tidak ditemukan",
              example: "Alarm tidak ditemukan.",
            }),
          },
          { description: "Alarm tidak ditemukan" }
        ),
      },
      detail: {
        tags: ["Alarm"],
        description: "Memperbarui data alarm berdasarkan ID",
        summary: "Update alarm",
      },
    }

const deleteAlarmSchema = {
      type: "json",
      response: {
        200: t.Object(
          {
            message: t.String({
              description: "Pesan setelah berhasil menghapus data alarm",
              example: "Berhasil menghapus data alarm.",
            }),
          },
          { description: "Data alarm berhasil dihapus" }
        ),
        404: t.Object(
          {
            message: t.String({
              description: "Pesan error jika alarm tidak ditemukan",
              example: "Alarm tidak ditemukan.",
            }),
          },
          { description: "Alarm tidak ditemukan untuk dihapus" }
        ),
      },
      detail: {
        tags: ["Alarm"],
        description: "Menghapus data alarm berdasarkan ID",
        summary: "Delete alarm",
      },
    }

export { postAlarmSchema, getAllAlarmsSchema, getAlarmByDeviceIdSchema, putAlarmSchema, deleteAlarmSchema };
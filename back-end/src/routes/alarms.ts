// routes/alarm.ts
import { Elysia, t } from "elysia";
import { ResultSetHeader } from "mysql2";
import { authorizeRequest } from "../utils/authorize";
import { Types } from "../utils/types";
import { db } from "../utils/middleware";

export const alarmRoutes = new Elysia({ prefix: "/alarm" })

  // ➕ CREATE Alarm
  .post(
    "/",
    async ({ jwt, headers: { authorization }, body }: Types) => {
      const decoded = await authorizeRequest(jwt, authorization);

      const { name, device_id, operator, threshold, sensor } = body;
      const [result] = await db.query<ResultSetHeader>(
        `INSERT INTO alarms (description, device_id, operator, threshold, last_sended, sensor_type)
       VALUES (?, ?, ?, ?, NOW(), ?)`,
        [name, device_id, operator, threshold, sensor]
      );

      return new Response(
        JSON.stringify({
          message: "Berhasil menambah data alarm",
          id: result.insertId,
        }),
        { status: 201 }
      );
    },
    {
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
  )

  // 📄 READ Semua Alarm
  .get(
    "/all",
    //@ts-ignore
    async ({ jwt, headers: { authorization } }: Types) => {
      const decoded = await authorizeRequest(jwt, authorization);
      const [data] = await db.query("SELECT * FROM alarms");
      return new Response(JSON.stringify({ result: data }), { status: 200 });
    },
    {
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
  )

  // 📄 READ Alarm by Device ID
  .get(
    "/:device_id",
    //@ts-ignore
    async ({ jwt, headers: { authorization }, params }: Types) => {
      const decoded = await authorizeRequest(jwt, authorization);
      const { device_id } = params;
      const [data] = await db.query(
        "SELECT * FROM alarms WHERE device_id = ?",
        [device_id]
      );
      return new Response(JSON.stringify({ result: data }), { status: 200 });
    },
    {
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
  )

  // ✏️ UPDATE Alarm
  .put(
    "/:id",
    //@ts-ignore
    async ({ jwt, headers: { authorization }, params, body }: Types) => {
      const decoded = await authorizeRequest(jwt, authorization);

      const { name, device_id, operator, threshold, sensor } = body;
      await db.query(
        `UPDATE alarms SET description = ?, device_id = ?, operator = ?, threshold = ?, sensor_type = ? WHERE id = ?`,
        [name, device_id, operator, threshold, sensor, params.id]
      );

      return new Response(
        JSON.stringify({
          message: "Berhasil mengupdate data alarm.",
          id: params.id,
        }),
        { status: 200 }
      );
    },
    {
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
  )

  // ❌ DELETE Alarm
  .delete(
    "/:id",
    //@ts-ignore
    async ({ jwt, headers: { authorization }, params }: Types) => {
      const decoded = await authorizeRequest(jwt, authorization);
      await db.query("DELETE FROM alarms WHERE id = ?", [params.id]);
      return new Response(
        JSON.stringify({ message: "Berhasil menghapus data alarm." }),
        { status: 200 }
      );
    },
    {
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
  );

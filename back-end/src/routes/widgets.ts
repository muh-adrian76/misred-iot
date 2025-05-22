// routes/widget.ts
import { Elysia, t } from "elysia";
import { ResultSetHeader } from "mysql2";
import { authorizeRequest } from "../utils/authorize";
import { Types } from "../utils/types";
import { db } from "../utils/middleware";

export const widgetRoutes = new Elysia({ prefix: "/widget" })

  // ➕ CREATE Widget
  .post(
    "/",
    async ({ jwt, headers: { authorization }, body }: Types) => {
      const decoded = await authorizeRequest(jwt, authorization);

      const { description, device_id, sensor_type } = body;
      const [result] = await db.query<ResultSetHeader>(
        `INSERT INTO widgets (description, device_id, sensor_type)
       VALUES (?, ?, ?)`,
        [description, device_id, sensor_type]
      );

      return new Response(
        JSON.stringify({
          message: "Berhasil menambah data widget",
          id: result.insertId,
        }),
        { status: 201 }
      );
    },
    {
      type: "json",
      body: t.Object({
        description: t.String({
          example: "Grafik kekeruhan air",
        }),
        device_id: t.Number({
          description: "ID perangkat yang terkait dengan widget",
          example: "1",
        }),
        sensor_type: t.String({
          description: "Tipe sensor yang digunakan oleh widget",
          example: "TSS",
        }),
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
    }
  )

  // 📄 READ Semua Widget
  .get(
    "/all",
    //@ts-ignore
    async ({ jwt, headers: { authorization } }: Types) => {
      const decoded = await authorizeRequest(jwt, authorization);
      const [data] = await db.query("SELECT * FROM widgets");
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
                  description: "ID widget",
                  example: 1,
                }),
                description: t.String({
                  description: "Deskripsi widget",
                  example: "Temperature Widget",
                }),
                device_id: t.String({
                  description: "ID perangkat terkait dengan widget",
                  example: "device123",
                }),
                sensor_type: t.String({
                  description: "Tipe sensor yang digunakan oleh widget",
                  example: "Temperature Sensor",
                }),
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
    }
  )

  // 📄 READ Widget by Device ID
  .get(
    "/:device_id",
    //@ts-ignore
    async ({ jwt, headers: { authorization }, params }: Types) => {
      const decoded = await authorizeRequest(jwt, authorization);
      const { device_id } = params;
      const [data] = await db.query(
        "SELECT * FROM widgets WHERE device_id = ?",
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
                  description: "ID widget",
                  example: 1,
                }),
                description: t.String({
                  description: "Deskripsi widget",
                  example: "Temperature Widget",
                }),
                device_id: t.String({
                  description: "ID perangkat terkait dengan widget",
                  example: "device123",
                }),
                sensor_type: t.String({
                  description: "Tipe sensor yang digunakan oleh widget",
                  example: "Temperature Sensor",
                }),
              }),
              { description: "Daftar widget berdasarkan device_id" }
            ),
          },
          {
            description:
              "Response yang berisi data widget berdasarkan device_id",
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
            description:
              "Widget tidak ditemukan untuk device_id yang diberikan",
          }
        ),
      },
      detail: {
        tags: ["Widget"],
        description: "Mengambil data widget berdasarkan device_id",
        summary: "Get widget by device_id",
      },
    }
  )

  // ✏️ UPDATE Widget
  .put(
    "/:id",
    //@ts-ignore
    async ({ jwt, headers: { authorization }, params, body }: Types) => {
      const decoded = await authorizeRequest(jwt, authorization);

      const { description, device_id, sensor_type } = body;
      await db.query(
        `UPDATE widgets SET description = ?, device_id = ?, sensor_type = ? WHERE id = ?`,
        [description, device_id, sensor_type, params.id]
      );

      return new Response(
        JSON.stringify({ message: "Berhasil mengupdate data widget." }),
        { status: 200 }
      );
    },
    {
      type: "json",
      body: t.Object({
        description: t.String({
          description: "Deskripsi widget yang akan diperbarui",
          example: "Updated Temperature Widget",
        }),
        device_id: t.String({
          description: "ID perangkat yang terkait dengan widget",
          example: "device123",
        }),
        sensor_type: t.String({
          description: "Tipe sensor yang digunakan oleh widget",
          example: "Updated Temperature Sensor",
        }),
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
    }
  )

  // ❌ DELETE Widget
  .delete(
    "/:id",
    //@ts-ignore
    async ({ jwt, headers: { authorization }, params }: Types) => {
      const decoded = await authorizeRequest(jwt, authorization);
      await db.query("DELETE FROM widgets WHERE id = ?", [params.id]);
      return new Response(
        JSON.stringify({ message: "Berhasil menghapus data widget." }),
        { status: 200 }
      );
    },
    {
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
    }
  );

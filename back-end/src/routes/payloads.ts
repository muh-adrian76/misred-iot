// routes/sensor.ts
import { Elysia, t } from "elysia";
import { ResultSetHeader } from "mysql2";
import { authorizeRequest } from "../utils/authorize";
import { Types } from "../utils/types";
import { db } from "../utils/middleware";

export const sensorRoutes = new Elysia({ prefix: "/payload" })

  // 🆕 CREATE Data Sensor
  .post(
    "/",
    async ({ jwt, headers: { authorization }, body }: Types) => {
      const decoded = await authorizeRequest(jwt, authorization);

      const { device_id, ph, cod, tss, nh3n, flow } = body;
      const [result] = await db.query<ResultSetHeader>(
        `INSERT INTO payloads (device_id, ph, cod, tss, nh3n, flow, server_time)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [device_id, ph, cod, tss, nh3n, flow]
      );

      return new Response(
        JSON.stringify({
          message: "Berhasil menambah data sensor",
          id: result.insertId,
          device_id: device_id,
        }),
        { status: 201 }
      );
    },
    {
      type: "json",
      body: t.Object({
        device_id: t.String({
          example: "Device 1",
        }),
        ph: t.Number({
          example: 7.2,
        }),
        cod: t.Number({
          example: 15.3,
        }),
        tss: t.Number({
          example: 0.5,
        }),
        nh3n: t.Number({
          example: 1.8,
        }),
        flow: t.Number({
          example: 120.5,
        }),
      }),
      response: {
        201: t.Object(
          {
            message: t.String({
              description: "Pesan berhasil menambah data sensor",
              example: "Berhasil menambah data sensor",
            }),
            id: t.Number({
              description: "ID data sensor yang baru ditambahkan",
              example: 1,
            }),
            deviceRoutes: t.String({
              description: "ID perangkat yang terkait dengan data sensor",
              example: "Device 1",
            }),
          },
          { description: "Data sensor berhasil ditambahkan" }
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
        tags: ["Payload"],
        description: "Menambah data sensor baru",
        summary: "Create sensor data",
      },
    }
  )

  // 🔍 READ Semua Payload
  .get(
    "/all",
    //@ts-ignore
    async ({ jwt, headers: { authorization } }: Types) => {
      const decoded = await authorizeRequest(jwt, authorization);
      const [data] = await db.query("SELECT * FROM payloads");
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
                  description: "ID payload",
                  example: 1,
                }),
                device_id: t.String({
                  description: "ID perangkat terkait dengan payload",
                  example: "device123",
                }),
                ph: t.Number({
                  description: "Nilai pH dari payload",
                  example: 7.2,
                }),
                cod: t.Number({
                  description: "Chemical Oxygen Demand (COD) dari payload",
                  example: 15.3,
                }),
                tss: t.Number({
                  description: "Total Suspended Solids (TSS) dari payload",
                  example: 0.5,
                }),
                nh3n: t.Number({
                  description: "Ammonia Nitrogen (NH3-N) dari payload",
                  example: 1.8,
                }),
                flow: t.Number({
                  description: "Aliran air yang terdeteksi oleh sensor",
                  example: 120.5,
                }),
                server_time: t.String({
                  description: "Waktu server saat data diterima",
                  example: "2023-07-30T15:00:00Z",
                }),
              }),
              { description: "Daftar semua data payload" }
            ),
          },
          { description: "Response yang berisi data semua payload" }
        ),
      },
      detail: {
        tags: ["Payload"],
        description: "Mengambil semua data payload",
        summary: "Get all payloads",
      },
    }
  )

  // 🔍 READ Payload by Device ID
  .get(
    "/:device_id",
    //@ts-ignore
    async ({ jwt, headers: { authorization }, params }: Types) => {
      const decoded = await authorizeRequest(jwt, authorization);
      const { device_id } = params;
      const [data] = await db.query(
        "SELECT * FROM payloads WHERE device_id = ?",
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
                  description: "ID payload",
                  example: 1,
                }),
                device_id: t.String({
                  description: "ID perangkat terkait dengan payload",
                  example: "device01",
                }),
                ph: t.Number({
                  description: "Nilai pH dari payload",
                  example: 7.2,
                }),
                cod: t.Number({
                  description: "Chemical Oxygen Demand (COD) dari payload",
                  example: 15.3,
                }),
                tss: t.Number({
                  description: "Total Suspended Solids (TSS) dari payload",
                  example: 0.5,
                }),
                nh3n: t.Number({
                  description: "Ammonia Nitrogen (NH3-N) dari payload",
                  example: 1.8,
                }),
                flow: t.Number({
                  description: "Aliran air yang terdeteksi oleh sensor",
                  example: 120.5,
                }),
                server_time: t.String({
                  description: "Waktu server saat data diterima",
                  example: "2023-07-30T15:00:00Z",
                }),
              }),
              { description: "Daftar data payload berdasarkan device_id" }
            ),
          },
          {
            description:
              "Response yang berisi data payload berdasarkan device_id",
          }
        ),
        404: t.Object(
          {
            message: t.String({
              description:
                "Pesan error jika data payload tidak ditemukan untuk device_id",
              example: "No payload found for this device.",
            }),
          },
          {
            description:
              "Payload tidak ditemukan untuk device_id yang diberikan",
          }
        ),
      },
      detail: {
        tags: ["Payload"],
        description: "Mengambil data payload berdasarkan device_id",
        summary: "Get payload by device_id",
      },
    }
  );

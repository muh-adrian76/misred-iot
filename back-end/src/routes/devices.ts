import { randomBytes } from "crypto";
import { Elysia, t } from "elysia";
import { ResultSetHeader } from "mysql2";
import { authorizeRequest } from "../utils/authorize";
import { Types } from "../utils/types";
import { Chirpstack, db, mqttClient } from "../utils/middleware";

export const deviceRoutes = new Elysia({ prefix: "/device" })
  // 🔘 Create device
  .post(
    "/",
    async ({ jwt, headers: { authorization }, body }: Types) => {
      const decoded = await authorizeRequest(jwt, authorization);

      const { name, board, protocol } = body;
      let topic: string | undefined;
      let qos: string | undefined;
      let loraProfile: string | undefined;
      const aesKey = randomBytes(32).toString("hex");

      if (protocol === "mqtt") {
        (topic = "device/data"), (qos = "0");
      }

      if (protocol === "lora") {
        loraProfile = await Chirpstack(authorization);
      }

      const [result] = await db.query<ResultSetHeader>(
        "INSERT INTO devices (description, board_type, protocol, mqtt_topic, mqtt_qos, lora_profile, refresh_token) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          name,
          board,
          protocol,
          topic ?? null,
          qos ?? null,
          loraProfile ?? null,
          aesKey,
        ]
      );

      return new Response(
        JSON.stringify({
          message: "Perangkat berhasil terdaftar",
          id: result.insertId,
          key: aesKey,
        }),
        { status: 201 }
      );
    },
    {
      type: "json",
      body: t.Object({
        name: t.String({
          example: "Perangkat 1",
        }),
        board: t.String({
          description: "Jenis board perangkat",
          example: "ESP32",
        }),
        protocol: t.String({
          description: "Protokol komunikasi perangkat (http/mqtt/lora)",
          example: "http",
        }),
        mqtt_topic: t.Optional(
          t.String({
            description: "Topic untuk MQTT",
            example: "device/data",
          })
        ),
        mqtt_qos: t.Optional(
          t.String({
            description: "Quality of Service untuk MQTT",
            example: "0",
          })
        ),
        lora_profile: t.Optional(
          t.String({
            description: "Profil LoRa jika menggunakan LoRa",
            example: "LoRaProfile1",
          })
        ),
      }),
      response: {
        201: t.Object(
          {
            message: t.String({
              description: "Pesan berhasil pendaftaran perangkat",
              example: "Perangkat berhasil terdaftar",
            }),
            id: t.String({
              description: "ID perangkat yang baru terdaftar",
              example: "device-1",
            }),
            key: t.String({
              description: "AES key untuk perangkat",
              example: "1234567890abcdef1234567890abcdef",
            }),
          },
          { description: "Perangkat berhasil ditambahkan" }
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
        tags: ["Device"],
        description: "Menambahkan perangkat baru",
        summary: "Create device",
      },
    }
  )

  // 📥 Get all devices
  .get(
    "/all",
    //@ts-ignore
    async ({ jwt, headers: { authorization } }: Types) => {
      const decoded = await authorizeRequest(jwt, authorization);
      const [data] = await db.query<any[]>("SELECT * FROM devices");
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
                  description: "ID perangkat",
                  example: 1,
                }),
                description: t.String({
                  description: "Deskripsi perangkat",
                  example: "Sensor COD",
                }),
                board_type: t.String({
                  description: "Jenis board perangkat",
                  example: "ESP32",
                }),
                protocol: t.String({
                  description: "Protokol komunikasi perangkat",
                  example: "mqtt",
                }),
                mqtt_topic: t.String({
                  description: "Topic untuk MQTT",
                  example: "device/data",
                }),
                mqtt_qos: t.String({
                  description: "Quality of Service untuk MQTT",
                  example: "0",
                }),
                lora_profile: t.String({
                  description: "Profil LoRa jika menggunakan LoRa",
                  example: "Profil LoRa 1",
                }),
                refresh_token: t.String({
                  description: "Token refresh perangkat",
                  example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                }),
              }),
              { description: "Daftar semua perangkat yang terdaftar" }
            ),
          },
          { description: "Response yang berisi data semua perangkat" }
        ),
      },
      detail: {
        tags: ["Device"],
        description: "Mengambil semua data perangkat yang terdaftar",
        summary: "Get all devices",
      },
    }
  )

  // 📥 Get device by ID
  //@ts-ignore
  .get(
    "/:id",
    //@ts-ignore
    async ({ jwt, headers: { authorization }, params }: Types) => {
      const decoded = await authorizeRequest(jwt, authorization);

      const { id } = params;
      const [data] = await db.query<any[]>(
        "SELECT * FROM devices WHERE id = ?",
        [id]
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
                  description: "ID perangkat",
                  example: 1,
                }),
                description: t.String({
                  description: "Deskripsi perangkat",
                  example: "Perangkat 1",
                }),
                board_type: t.String({
                  description: "Jenis board perangkat",
                  example: "ESP32",
                }),
                protocol: t.String({
                  description: "Protokol komunikasi perangkat",
                  example: "mqtt",
                }),
                mqtt_topic: t.String({
                  description: "Topic untuk MQTT",
                  example: "device/data",
                }),
                mqtt_qos: t.String({
                  description: "Quality of Service untuk MQTT",
                  example: "0",
                }),
                lora_profile: t.String({
                  description: "Profil LoRa jika menggunakan LoRa",
                  example: "LoRaProfile1",
                }),
                refresh_token: t.String({
                  description: "Token refresh perangkat",
                  example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                }),
              }),
              { description: "Data perangkat yang ditemukan berdasarkan ID" }
            ),
          },
          { description: "Response yang berisi data perangkat berdasarkan ID" }
        ),
        404: t.Object(
          {
            message: t.String({
              description: "Pesan error jika perangkat tidak ditemukan",
              example: "Perangkat tidak ditemukan.",
            }),
          },
          { description: "Perangkat tidak ditemukan" }
        ),
      },
      detail: {
        tags: ["Device"],
        description: "Mengambil data perangkat berdasarkan ID",
        summary: "Get device by ID",
      },
    }
  )

  // ✏️ Update device
  .put(
    "/:id",
    //@ts-ignore
    async ({ jwt, headers: { authorization }, params, body }: Types) => {
      const decoded = await authorizeRequest(jwt, authorization);

      const { id } = params;
      const { name, board, protocol, topic, qos, lora_profile } = body;
      await db.query(
        "UPDATE devices SET description = ?, board_type = ?, protocol = ?, mqtt_topic = ?, mqtt_qos = ?, lora_profile = ? WHERE id = ?",
        [
          name,
          board,
          protocol,
          topic ?? null,
          qos ?? null,
          lora_profile ?? null,
          id,
        ]
      );

      return new Response(
        JSON.stringify({ message: "Perangkat berhasil diupdate", id: id }),
        { status: 200 }
      );
    },
    {
      type: "json",
      body: t.Object({
        name: t.String({
          example: "Perangkat Baru",
        }),
        board: t.String({
          description: "Jenis board perangkat",
          example: "Arduino Uno",
        }),
        protocol: t.String({
          description: "Protokol komunikasi perangkat (http/mqtt/lora)",
          example: "mqtt",
        }),
        mqtt_topic: t.Optional(
          t.String({
            description: "Topic untuk MQTT",
            example: "device/data",
          })
        ),
        mqtt_qos: t.Optional(
          t.String({
            description: "Quality of Service untuk MQTT",
            example: "0",
          })
        ),
        lora_profile: t.Optional(
          t.String({
            description: "Profil LoRa jika menggunakan LoRa",
            example: "Profil LoRa 2",
          })
        ),
      }),
      response: {
        200: t.Object(
          {
            message: t.String({
              description: "Pesan berhasil mengupdate perangkat",
              example: "Perangkat berhasil diupdate",
            }),
            id: t.String({
              description: "ID perangkat yang diperbarui",
              example: "device-1",
            }),
          },
          { description: "Perangkat berhasil diperbarui" }
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
              description: "Pesan error jika perangkat tidak ditemukan",
              example: "Perangkat tidak ditemukan.",
            }),
          },
          { description: "Perangkat tidak ditemukan" }
        ),
      },
      detail: {
        tags: ["Device"],
        description: "Memperbarui data perangkat berdasarkan ID",
        summary: "Update device",
      },
    }
  )

  // ❌ Delete device
  .delete(
    "/:id",
    //@ts-ignore
    async ({ jwt, headers: { authorization }, params }: Types) => {
      const decoded = await authorizeRequest(jwt, authorization);

      const { id } = params;
      await db.query("DELETE FROM payloads WHERE devices_id = ?", [id]);
      await db.query("DELETE FROM widgets WHERE devices_id = ?", [id]);
      await db.query("DELETE FROM alarms WHERE devices_id = ?", [id]);
      await db.query("DELETE FROM devices WHERE id = ?", [id]);

      return new Response(
        JSON.stringify({ message: "Perangkat berhasil dihapus" }),
        { status: 200 }
      );
    },
    {
      type: "json",
      response: {
        200: t.Object(
          {
            message: t.String({
              description: "Pesan setelah berhasil menghapus perangkat",
              example: "Perangkat berhasil dihapus",
            }),
          },
          { description: "Perangkat berhasil dihapus beserta data terkait" }
        ),
        404: t.Object(
          {
            message: t.String({
              description: "Pesan error jika perangkat tidak ditemukan",
              example: "Perangkat tidak ditemukan",
            }),
          },
          { description: "Perangkat tidak ditemukan" }
        ),
      },
      detail: {
        tags: ["Device"],
        description: "Menghapus perangkat berdasarkan ID",
        summary: "Delete device",
      },
    }
  );

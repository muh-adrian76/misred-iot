import { t } from "elysia";

const postDeviceSchema = {
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

const getAllDevicesSchema = {
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
                aes_key: t.String({
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

const getDeviceByIdSchema = {
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
                aes_key: t.String({
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

const putDeviceSchema = {
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

const deleteDeviceSchema = {
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

export { postDeviceSchema, getAllDevicesSchema, getDeviceByIdSchema,putDeviceSchema, deleteDeviceSchema };
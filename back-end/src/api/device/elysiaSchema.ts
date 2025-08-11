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
    offline_timeout_minutes: t.Optional(
      t.Number({
        description: "Timeout dalam menit sebelum device dianggap offline",
        example: 1,
        minimum: 1,
        maximum: 60,
      })
    ),
    // mqtt_qos: t.Optional(
    //   t.String({
    //     description: "Quality of Service untuk MQTT",
    //     example: "0",
    //   })
    // ),
    // dev_eui: t.Optional(
    //   t.String({
    //     description: "ID unik untuk perangkat LoRa",
    //     example: "LoRaProfile1",
    //   })
    // ),
    // app_eui: t.Optional(
    //   t.String({
    //     description: "ID untuk Profil aplikasi chirpstack",
    //     example: "LoRaProfile1",
    //   })
    // ),
    // app_key: t.Optional(
    //   t.String({
    //     description: "Key untuk Profil aplikasi chirpstack",
    //     example: "LoRaProfile1",
    //   })
    // ),
    firmware_version: t.Optional(
      t.String({
        description: "Versi firmware perangkat",
        example: "1.0.0",
      })
    ),
    firmware_url: t.Optional(
      t.String({
        description: "URL firmware perangkat",
        example: "https://example.com/firmware.bin",
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
    summary: "Tambah perangkat",
  },
};

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
            // mqtt_qos: t.String({
            //   description: "Quality of Service untuk MQTT",
            //   example: "0",
            // }),
            dev_eui: t.Optional(
              t.String({
                description: "ID unik untuk perangkat LoRa",
                example: "LoRaProfile1",
              })
            ),
            app_eui: t.Optional(
              t.String({
                description: "ID untuk Profil aplikasi chirpstack",
                example: "LoRaProfile1",
              })
            ),
            app_key: t.Optional(
              t.String({
                description: "Key untuk Profil aplikasi chirpstack",
                example: "LoRaProfile1",
              })
            ),
            old_secret: t.Optional(
              t.String({
                description: "Secret/Key lama perangkat",
                example: "old-secret-key",
              })
            ),
            new_secret: t.Optional(
              t.String({
                description: "Secret/Key baru perangkat",
                example: "new-secret-key",
              })
            ),
            firmware_version: t.Optional(
              t.String({
                description: "Versi firmware perangkat",
                example: "1.0.0",
              })
            ),
            firmware_url: t.Optional(
              t.String({
                description: "URL firmware perangkat",
                example: "https://example.com/firmware.bin",
              })
            ),
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
    summary: "Ambil semua perangkat",
  },
};

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
            // mqtt_qos: t.String({
            //   description: "Quality of Service untuk MQTT",
            //   example: "0",
            // }),
            // dev_eui: t.Optional(
            //   t.String({
            //     description: "ID unik untuk perangkat LoRa",
            //     example: "LoRaProfile1",
            //   })
            // ),
            // app_eui: t.Optional(
            //   t.String({
            //     description: "ID untuk Profil aplikasi chirpstack",
            //     example: "LoRaProfile1",
            //   })
            // ),
            // app_key: t.Optional(
            //   t.String({
            //     description: "Key untuk Profil aplikasi chirpstack",
            //     example: "LoRaProfile1",
            //   })
            // ),
            old_secret: t.Optional(
              t.String({
                description: "Secret/Key lama perangkat",
                example: "old-secret-key",
              })
            ),
            new_secret: t.Optional(
              t.String({
                description: "Secret/Key baru perangkat",
                example: "new-secret-key",
              })
            ),
            firmware_version: t.Optional(
              t.String({
                description: "Versi firmware perangkat",
                example: "1.0.0",
              })
            ),
            firmware_url: t.Optional(
              t.String({
                description: "URL firmware perangkat",
                example: "https://example.com/firmware.bin",
              })
            ),
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
    summary: "Ambil perangkat berdasarkan ID",
  },
};

const getSecretByDeviceSchema = {
  type: "json",
  params: t.Object({
    id: t.String({ description: "Device id", example: "1" }),
  }),
  response: {
    200: t.Object({
      result: t.Any({
        description: "Secret/Key perangkat",
        example: "u8jwdw2114",
      }),
    }),
    404: t.Object({
      message: t.String({
        description: "Pesan error jika perangkat tidak ditemukan",
        example: "Device tidak ditemukan",
      }),
    }),
  },
  detail: {
    tags: ["Device"],
    description: "Ambil perangkat berdasarkan secret/key",
    summary: "Ambil perangkat via secret",
  },
};

const uploadFirmwareSchema = {
  type: "json",
  body: t.Object({
    firmware_version: t.String({
      description: "Versi firmware yang diupload",
      example: "1.0.0",
    }),
    filename: t.String({
      description: "Nama file firmware yang diupload",
      example: "firmware_v1.0.0.bin",
    }),
    file_base64: t.String({
      description: "File firmware dalam format base64",
      example: "base64encodedstring...",
    }),
  }),
  params: t.Object({
    deviceId: t.String({
      description: "ID perangkat",
      example: "1",
    }),
  }),
  response: {
    200: t.Object({
      message: t.String({
        description: "Pesan sukses upload firmware",
        example: "Firmware berhasil diupload",
      }),
      device_id: t.String({
        description: "ID perangkat yang diupload firmware",
        example: "device-1",
      }),
      firmware_version: t.String({
        description: "Versi firmware yang diupload",
        example: "1.0.0",
      }),
      filename: t.String({
        description: "Nama file firmware yang diupload",
        example: "firmware_v1.0.0.bin",
      }),
      updated_at: t.String({
        description: "Tanggal dan waktu pembaruan firmware",
        example: "2023-10-01T12:00:00Z",
      }),
      firmware_url: t.String({
        description: "URL untuk mengakses firmware yang diupload",
        example: "/device/firmware/device-1/firmware_v1.0.0.bin",
      }),
    }),
    400: t.Object({
      message: t.String({
        description: "Pesan error jika file tidak valid",
        example: "Hanya file .bin atau .hex yang diperbolehkan",
      }),
    }),
  },
  detail: {
    tags: ["Device"],
    summary: "Unggah file firmware",
    description: "Unggah file firmware untuk device tertentu",
  },
};

const getFirmwareVersionSchema = {
  type: "json",
  params: t.Object({
    deviceId: t.String(),
  }),
  response: {
    200: t.Object({
      version: t.String({
        description: "Versi firmware perangkat",
        example: "1.0.0",
      }),
    }),
    404: t.Object({
      message: t.String({
        description: "Pesan error jika perangkat tidak ditemukan",
        example: "Perangkat tidak ditemukan.",
      }),
    }),
  },
  detail: {
    tags: ["Device"],
    summary: "Ambil versi firmware",
    description: "Mengambil versi firmware perangkat berdasarkan ID",
  },
};

const pingSchema = {
  response: {
    200: t.Object({
      status: t.String({ example: "ok" }),
      timestamp: t.String({ example: "2025-07-13T21:05:55.000Z" }),
      server: t.String({ example: "IoT Device Verification Server" }),
    }),
  },
  detail: {
    tags: ["Device"],
    summary: "Cek konektivitas server",
    description: "Cek konektivitas server IoT Device Verification",
  },
};

const getFirmwareListSchema = {
  params: t.Object({
    deviceId: t.String({
      description: "ID perangkat",
      example: "1",
    }),
  }),
  response: {
    200: t.Array(
      t.Object({
        name: t.String({
          description: "Nama file firmware",
          example: "firmware_v1.0.0.bin",
        }),
        url: t.String({
          description: "URL untuk download firmware",
          example: "/device/firmware/1/firmware_v1.0.0.bin",
        }),
      }),
      { description: "Daftar file firmware untuk device tertentu" }
    ),
    404: t.String({
      description: "Pesan error jika firmware tidak ditemukan",
      example: "Firmware tidak ditemukan",
    }),
  },
  detail: {
    tags: ["Device"],
    summary: "Daftar file firmware",
    description: "Mengambil daftar file firmware untuk device tertentu",
  },
};

const downloadFirmwareFileSchema = {
  params: t.Object({
    deviceId: t.String({
      description: "ID perangkat",
      example: "1",
    }),
    filename: t.String({
      description: "Nama file firmware",
      example: "firmware_v1.0.0.bin",
    }),
  }),
  response: {
    200: t.Any({
      description: "File firmware dalam bentuk binary/octet-stream",
      example: "<binary data>",
    }),
    404: t.String({
      description: "Pesan error jika firmware tidak ditemukan",
      example: "Firmware tidak ditemukan",
    }),
  },
  detail: {
    tags: ["Device"],
    summary: "Unduh file firmware",
    description: "Unduh file firmware tertentu untuk device",
  },
};

const renewSecretSchema = {
  type: "json",
  params: t.Object({
    device_id: t.String({
      description: "ID perangkat",
      example: "device-1",
    }),
  }),
  body: t.Object({
    old_secret: t.String({
      description: "Secret lama perangkat",
      example: "oldsecretkey123",
    }),
  }),
  response: {
    200: t.Object({
      message: t.String({
        description: "Pesan sukses memperbarui secret",
        example: "Berhasil memperbarui secret perangkat",
      }),
      device_id: t.String({
        description: "ID perangkat",
        example: "device-1",
      }),
      secret_key: t.String({
        description: "Secret baru perangkat",
        example: "newsecretkey456",
      }),
    }),
    400: t.Object({
      message: t.String({
        description: "Pesan error jika gagal memperbarui secret",
        example: "Secret lama tidak valid",
      }),
    }),
  },
  detail: {
    tags: ["Device"],
    summary: "Perbarui secret perangkat",
    description: "Memperbarui secret perangkat berdasarkan ID dan secret lama",
  },
};

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
    // mqtt_qos: t.Optional(
    //   t.String({
    //     description: "Quality of Service untuk MQTT",
    //     example: "0",
    //   })
    // ),
    // dev_eui: t.Optional(
    //   t.String({
    //     description: "ID unik untuk perangkat LoRa",
    //     example: "LoRaProfile1",
    //   })
    // ),
    // app_eui: t.Optional(
    //   t.String({
    //     description: "ID untuk Profil aplikasi chirpstack",
    //     example: "LoRaProfile1",
    //   })
    // ),
    // app_key: t.Optional(
    //   t.String({
    //     description: "Key untuk Profil aplikasi chirpstack",
    //     example: "LoRaProfile1",
    //   })
    // ),
    firmware_version: t.Optional(
      t.String({
        description: "Versi firmware perangkat",
        example: "1.0.0",
      })
    ),
    firmware_url: t.Optional(
      t.String({
        description: "URL firmware perangkat",
        example: "https://example.com/firmware.bin",
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
    summary: "Perbarui perangkat",
  },
};

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
    summary: "Hapus perangkat",
  },
};

const updateDeviceStatusSchema = {
  type: "json",
  body: t.Object({
    status: t.Union([t.Literal("online"), t.Literal("offline")], {
      description: "Status device (online atau offline)",
      example: "offline",
    }),
  }),
  response: {
    200: t.Object(
      {
        success: t.Boolean({
          description: "Status berhasil",
          example: true,
        }),
        message: t.String({
          description: "Pesan berhasil update status",
          example: "Status perangkat diperbarui menjadi offline",
        }),
        device_id: t.String({
          description: "ID device yang diupdate",
          example: "1",
        }),
        status: t.String({
          description: "Status baru device",
          example: "offline",
        }),
      },
      { description: "Status device berhasil diupdate" }
    ),
    400: t.Object(
      {
        success: t.Boolean({
          example: false,
        }),
        message: t.String({
          description: "Pesan error jika input tidak valid",
          example: "Status tidak valid. Harus 'online' atau 'offline'",
        }),
      },
      { description: "Input tidak valid" }
    ),
    404: t.Object(
      {
        success: t.Boolean({
          example: false,
        }),
        message: t.String({
          description: "Pesan error jika device tidak ditemukan",
          example: "Perangkat tidak ditemukan atau akses ditolak",
        }),
      },
      { description: "Device tidak ditemukan" }
    ),
    401: t.Object(
      {
        success: t.Boolean({
          example: false,
        }),
        message: t.String({
          description: "Pesan error jika tidak authorized",
          example: "Autentikasi gagal",
        }),
      },
      { description: "Tidak authorized" }
    ),
  },
  detail: {
    tags: ["Device"],
    description: "Perbarui status device (online/offline)",
    summary: "Perbarui status perangkat",
  },
};

const resetDeviceDataSchema = {
  type: "json",
  params: t.Object({
    id: t.String({
      description: "Device ID",
      example: "1",
    }),
  }),
  response: {
    200: t.Object(
      {
        success: t.Boolean({
          description: "Status berhasil",
          example: true,
        }),
        message: t.String({
          description: "Pesan berhasil reset data device",
          example: "Berhasil mereset semua data untuk perangkat Test Device",
        }),
        device_id: t.String({
          description: "ID device yang direset",
          example: "1",
        }),
        deleted_payload_count: t.Number({
          description: "Jumlah payload yang dihapus",
          example: 150,
        }),
        deleted_raw_payload_count: t.Number({
          description: "Jumlah raw payload yang dihapus",
          example: 150,
        }),
      },
      { description: "Data device berhasil direset" }
    ),
    403: t.Object(
      {
        success: t.Boolean({
          example: false,
        }),
        message: t.String({
          description: "Pesan error jika tidak memiliki akses",
          example: "Akses ditolak",
        }),
      },
      { description: "Akses ditolak" }
    ),
    404: t.Object(
      {
        success: t.Boolean({
          example: false,
        }),
        message: t.String({
          description: "Pesan error jika device tidak ditemukan",
          example: "Perangkat tidak ditemukan",
        }),
      },
      { description: "Device tidak ditemukan" }
    ),
    401: t.Object(
      {
        success: t.Boolean({
          example: false,
        }),
        message: t.String({
          description: "Pesan error jika tidak authorized",
          example: "Autentikasi gagal",
        }),
      },
      { description: "Tidak authorized" }
    ),
  },
  detail: {
    tags: ["Device"],
    description: "Reset semua data payload untuk device tertentu",
    summary: "Reset data perangkat",
  },
};

export {
  postDeviceSchema,
  getAllDevicesSchema,
  getDeviceByIdSchema,
  getSecretByDeviceSchema,
  postDeviceSchema as putDeviceSchema, // Alias: PUT menggunakan schema yang sama dengan POST
  deleteDeviceSchema,
  uploadFirmwareSchema,
  getFirmwareVersionSchema,
  pingSchema,
  getFirmwareListSchema,
  downloadFirmwareFileSchema,
  renewSecretSchema,
  updateDeviceStatusSchema,
  resetDeviceDataSchema,
};

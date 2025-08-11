import { t } from "elysia";

const sendCommandSchema = {
  type: "json",
  body: t.Object({
    device_id: t.Number({
      description: "ID perangkat yang akan dikendalikan",
      example: 1,
    }),
    datastream_id: t.Number({
      description: "ID datastream yang akan dikendalikan (pin/aktuator)",
      example: 5,
    }),
    command_type: t.Union([
      t.Literal("set_value"),
      t.Literal("toggle"),
      t.Literal("reset")
    ], {
      description: "Jenis command yang akan dikirim",
      example: "set_value",
    }),
    value: t.Number({
      description: "Nilai yang akan dikirim ke aktuator",
      example: 255,
    }),
  }),
  response: {
    200: t.Object({
      success: t.Boolean({
        description: "Status berhasil/gagal",
        example: true,
      }),
      message: t.String({
        description: "Pesan respons",
        example: "Command berhasil dibuat",
      }),
      data: t.Object({
        command_id: t.Number({
          description: "ID command yang dibuat",
          example: 123,
        }),
      }),
    }),
    400: t.Object({
      success: t.Boolean({ example: false }),
      message: t.String({
        description: "Pesan error",
        example: "Gagal membuat command",
      }),
      error: t.Optional(t.String()),
    }),
    401: t.Object({
      success: t.Boolean({ example: false }),
      message: t.String({ example: "Tidak terotorisasi" }),
    }),
  },
  detail: {
    tags: ["Device Command"],
    description: "Mengirim command ke perangkat IoT via datastream",
    summary: "Kirim command ke perangkat",
  },
};

const getCommandHistorySchema = {
  type: "json",
  params: t.Object({
    device_id: t.String({
      description: "ID perangkat",
      example: "1",
    }),
  }),
  query: t.Object({
    limit: t.Optional(t.String({
      description: "Jumlah maksimal command yang ditampilkan",
      example: "50",
    })),
    offset: t.Optional(t.String({
      description: "Offset untuk pagination",
      example: "0",
    })),
  }),
  response: {
    200: t.Object({
      success: t.Boolean({ example: true }),
      data: t.Array(t.Object({
        id: t.Number({
          description: "ID command",
          example: 123,
        }),
        device_id: t.Number({
          description: "ID perangkat",
          example: 1,
        }),
        datastream_id: t.Number({
          description: "ID datastream",
          example: 5,
        }),
        command_type: t.String({
          description: "Jenis command",
          example: "set_value",
        }),
        value: t.Number({
          description: "Nilai command",
          example: 255,
        }),
        status: t.String({
          description: "Status command",
          example: "acknowledged",
        }),
        sent_at: t.String({
          description: "Waktu command dikirim",
          example: "2025-07-18T10:30:00Z",
        }),
        acknowledged_at: t.Optional(t.String({
          description: "Waktu command diakui device",
          example: "2025-07-18T10:30:02Z",
        })),
      })),
    }),
    401: t.Object({
      success: t.Boolean({ example: false }),
      message: t.String({ example: "Tidak terotorisasi" }),
    }),
  },
  detail: {
    tags: ["Device Command"],
    description: "Mengambil riwayat command perangkat",
    summary: "Ambil riwayat command",
  },
};

const getPendingCommandsSchema = {
  type: "json",
  params: t.Object({
    device_id: t.String({
      description: "ID perangkat",
      example: "1",
    }),
  }),
  response: {
    200: t.Object({
      success: t.Boolean({ example: true }),
      data: t.Array(t.Object({
        id: t.Number({
          description: "ID command",
          example: 123,
        }),
        device_id: t.Number({
          description: "ID perangkat",
          example: 1,
        }),
        datastream_id: t.Number({
          description: "ID datastream",
          example: 5,
        }),
        command_type: t.String({
          description: "Jenis command",
          example: "set_value",
        }),
        value: t.Number({
          description: "Nilai command",
          example: 255,
        }),
        status: t.String({
          description: "Status command",
          example: "pending",
        }),
        sent_at: t.String({
          description: "Waktu command dikirim",
          example: "2025-07-18T10:30:00Z",
        }),
      })),
    }),
    401: t.Object({
      success: t.Boolean({ example: false }),
      message: t.String({ example: "Tidak terotorisasi" }),
    }),
  },
  detail: {
    tags: ["Device Command"],
    description: "Mengambil command yang masih pending untuk perangkat",
    summary: "Ambil command pending",
  },
};

const updateCommandStatusSchema = {
  type: "json",
  params: t.Object({
    command_id: t.String({
      description: "ID command",
      example: "123",
    }),
  }),
  body: t.Object({
    status: t.Union([
      t.Literal("pending"),
      t.Literal("sent"),
      t.Literal("acknowledged"),
      t.Literal("failed")
    ], {
      description: "Status baru command",
      example: "acknowledged",
    }),
  }),
  response: {
    200: t.Object({
      success: t.Boolean({ example: true }),
      message: t.String({
        description: "Pesan berhasil",
        example: "Status command berhasil diperbarui",
      }),
    }),
    400: t.Object({
      success: t.Boolean({ example: false }),
      message: t.String({
        description: "Pesan error",
        example: "Command tidak ditemukan atau sudah diperbarui",
      }),
    }),
    401: t.Object({
      success: t.Boolean({ example: false }),
      message: t.String({ example: "Tidak terotorisasi" }),
    }),
  },
  detail: {
    tags: ["Device Command"],
    description: "Update status command (biasanya dipanggil oleh device atau WebSocket handler)",
    summary: "Perbarui status command",
  },
};

const getCommandStatsSchema = {
  type: "json",
  params: t.Object({
    device_id: t.String({
      description: "ID perangkat",
      example: "1",
    }),
  }),
  query: t.Object({
    days: t.Optional(t.String({
      description: "Jumlah hari untuk statistik",
      example: "7",
    })),
  }),
  response: {
    200: t.Object({
      success: t.Boolean({ example: true }),
      data: t.Object({
        total_commands: t.Number({
          description: "Total command dalam periode",
          example: 150,
        }),
        successful_commands: t.Number({
          description: "Command yang berhasil",
          example: 140,
        }),
        failed_commands: t.Number({
          description: "Command yang gagal",
          example: 5,
        }),
        pending_commands: t.Number({
          description: "Command yang masih pending",
          example: 5,
        }),
        success_rate: t.Number({
          description: "Persentase keberhasilan",
          example: 93.33,
        }),
      }),
    }),
    401: t.Object({
      success: t.Boolean({ example: false }),
      message: t.String({ example: "Tidak terotorisasi" }),
    }),
  },
  detail: {
    tags: ["Device Command"],
    description: "Mengambil statistik command perangkat",
    summary: "Ambil statistik command",
  },
};

const cleanupCommandsSchema = {
  type: "json",
  body: t.Object({
    older_than_minutes: t.Optional(t.Number({
      description: "Command yang lebih lama dari X menit akan ditandai failed",
      example: 5,
    })),
  }),
  response: {
    200: t.Object({
      success: t.Boolean({ example: true }),
      message: t.String({
        description: "Pesan hasil cleanup",
        example: "Menandai 3 command lama sebagai gagal",
      }),
      data: t.Object({
        affected_commands: t.Number({
          description: "Jumlah command yang diupdate",
          example: 3,
        }),
      }),
    }),
    401: t.Object({
      success: t.Boolean({ example: false }),
      message: t.String({ example: "Tidak terotorisasi" }),
    }),
  },
  detail: {
    tags: ["Device Command"],
    description: "Cleanup command lama yang masih pending (maintenance endpoint)",
    summary: "Bersihkan command lama",
  },
};

export {
  sendCommandSchema,
  getCommandHistorySchema,
  getPendingCommandsSchema,
  updateCommandStatusSchema,
  getCommandStatsSchema,
  cleanupCommandsSchema,
};
import { t } from "elysia";

// Create Alarm Schema
export const createAlarmSchema = {
  body: t.Object({
    description: t.String({ minLength: 1, maxLength: 255 }),
    device_id: t.Number({ minimum: 1 }),
    datastream_id: t.Number({ minimum: 1 }),
    operator: t.Union([
      t.Literal('='),
      t.Literal('<'),
      t.Literal('>'),
      t.Literal('<='),
      t.Literal('>='),
      t.Literal('!=')
    ]),
    threshold: t.Number(),
    cooldown_minutes: t.Optional(t.Number({ minimum: 0, maximum: 1440 })), // max 24 hours
    notification_whatsapp: t.Optional(t.Boolean()),
    notification_browser: t.Optional(t.Boolean())
  }),
  response: {
    200: t.Object({
      success: t.Boolean(),
      message: t.String(),
      alarm_id: t.Number()
    }),
    400: t.Object({
      success: t.Boolean(),
      message: t.String(),
      errors: t.Optional(t.Array(t.String()))
    }),
    401: t.Object({
      success: t.Boolean(),
      message: t.String()
    })
  },
  detail: {
    tags: ["Alarm"],
    description: "Menambah alarm baru",
    summary: "Create alarm"
  }
};

// Get Alarms Schema
export const getAlarmsSchema = {
  query: t.Optional(t.Object({
    device_id: t.Optional(t.Number({ minimum: 1 }))
  })),
  response: {
    200: t.Object({
      success: t.Boolean(),
      alarms: t.Array(t.Object({
        id: t.Number(),
        description: t.String(),
        device_id: t.Number(),
        datastream_id: t.Number(),
        operator: t.String(),
        threshold: t.Number(),
        is_active: t.Boolean(),
        cooldown_minutes: t.Number(),
        notification_whatsapp: t.Boolean(),
        notification_browser: t.Boolean(),
        last_triggered: t.Union([t.String(), t.Null()]),
        created_at: t.String(),
        updated_at: t.String(),
        device_description: t.String(),
        datastream_description: t.String(),
        datastream_pin: t.String(),
        datastream_unit: t.String()
      }))
    }),
    401: t.Object({
      success: t.Boolean(),
      message: t.String()
    })
  },
  detail: {
    tags: ["Alarm"],
    description: "Mengambil semua alarm user",
    summary: "Get alarms"
  }
};

// Get Alarm by ID Schema
export const getAlarmByIdSchema = {
  params: t.Object({
    alarmId: t.String({ minimum: 1 })
  }),
  response: {
    200: t.Object({
      success: t.Boolean(),
      alarm: t.Object({
        id: t.Number(),
        description: t.String(),
        device_id: t.Number(),
        datastream_id: t.Number(),
        operator: t.String(),
        threshold: t.Number(),
        is_active: t.Boolean(),
        cooldown_minutes: t.Number(),
        notification_whatsapp: t.Boolean(),
        notification_browser: t.Boolean(),
        last_triggered: t.Union([t.String(), t.Null()]),
        created_at: t.String(),
        updated_at: t.String(),
        device_description: t.String(),
        datastream_description: t.String(),
        datastream_pin: t.String(),
        datastream_unit: t.String()
      })
    }),
    404: t.Object({
      success: t.Boolean(),
      message: t.String()
    }),
    401: t.Object({
      success: t.Boolean(),
      message: t.String()
    })
  },
  detail: {
    tags: ["Alarm"],
    description: "Mengambil alarm berdasarkan ID",
    summary: "Get alarm by ID"
  }
};

// Update Alarm Schema
export const updateAlarmSchema = {
  params: t.Object({
    alarmId: t.String({ minimum: 1 })
  }),
  body: t.Object({
    description: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
    operator: t.Optional(t.Union([
      t.Literal('='),
      t.Literal('<'),
      t.Literal('>'),
      t.Literal('<='),
      t.Literal('>='),
      t.Literal('!=')
    ])),
    threshold: t.Optional(t.Number()),
    is_active: t.Optional(t.Boolean()),
    cooldown_minutes: t.Optional(t.Number({ minimum: 0, maximum: 1440 })),
    notification_whatsapp: t.Optional(t.Boolean()),
    notification_browser: t.Optional(t.Boolean())
  }),
  response: {
    200: t.Object({
      success: t.Boolean(),
      message: t.String()
    }),
    404: t.Object({
      success: t.Boolean(),
      message: t.String()
    }),
    400: t.Object({
      success: t.Boolean(),
      message: t.String(),
      errors: t.Optional(t.Array(t.String()))
    }),
    401: t.Object({
      success: t.Boolean(),
      message: t.String()
    })
  },
  detail: {
    tags: ["Alarm"],
    description: "Update alarm",
    summary: "Update alarm"
  }
};

// Delete Alarm Schema
export const deleteAlarmSchema = {
  params: t.Object({
    alarmId: t.String({ minimum: 1 })
  }),
  response: {
    200: t.Object({
      success: t.Boolean(),
      message: t.String()
    }),
    404: t.Object({
      success: t.Boolean(),
      message: t.String()
    }),
    401: t.Object({
      success: t.Boolean(),
      message: t.String()
    })
  },
  detail: {
    tags: ["Alarm"],
    description: "Hapus alarm",
    summary: "Delete alarm"
  }
};

// Toggle Alarm Status Schema
export const toggleAlarmStatusSchema = {
  params: t.Object({
    alarmId: t.String({ minimum: 1 })
  }),
  response: {
    200: t.Object({
      success: t.Boolean(),
      message: t.String()
    }),
    404: t.Object({
      success: t.Boolean(),
      message: t.String()
    }),
    401: t.Object({
      success: t.Boolean(),
      message: t.String()
    })
  },
  detail: {
    tags: ["Alarm"],
    description: "Toggle status alarm (aktif/nonaktif)",
    summary: "Toggle alarm status"
  }
};

// Get Notification History Schema
export const getNotificationHistorySchema = {
  query: t.Optional(t.Object({
    limit: t.Optional(t.Number({ minimum: 1, maximum: 100 }))
  })),
  response: {
    200: t.Object({
      success: t.Boolean(),
      notifications: t.Array(t.Object({
        id: t.Number(),
        alarm_id: t.Number(),
        sensor_value: t.Number(),
        threshold: t.Number(),
        operator: t.String(),
        notification_type: t.String(),
        whatsapp_status: t.String(),
        browser_status: t.String(),
        whatsapp_message_id: t.Union([t.String(), t.Null()]),
        error_message: t.Union([t.String(), t.Null()]),
        triggered_at: t.String(),
        sent_at: t.Union([t.String(), t.Null()]),
        alarm_name: t.String(),
        device_description: t.String(),
        datastream_description: t.String()
      }))
    }),
    401: t.Object({
      success: t.Boolean(),
      message: t.String()
    })
  },
  detail: {
    tags: ["Alarm"],
    description: "Mengambil history notifikasi",
    summary: "Get notification history"
  }
};

// Test WAHA Connection Schema
export const testWahaConnectionSchema = {
  response: {
    200: t.Object({
      success: t.Boolean(),
      message: t.String(),
      waha_status: t.Object({
        success: t.Boolean(),
        message: t.String()
      })
    }),
    401: t.Object({
      success: t.Boolean(),
      message: t.String()
    })
  },
  detail: {
    tags: ["Alarm"],
    description: "Test koneksi ke WAHA service",
    summary: "Test WAHA connection"
  }
};

// Send Test Notification Schema
export const sendTestNotificationSchema = {
  body: t.Object({
    phone: t.String({ minLength: 10, maxLength: 15 }),
    message: t.String({ minLength: 1, maxLength: 1000 })
  }),
  response: {
    200: t.Object({
      success: t.Boolean(),
      message: t.String(),
      whatsapp_message_id: t.Union([t.String(), t.Null()])
    }),
    400: t.Object({
      success: t.Boolean(),
      message: t.String()
    }),
    401: t.Object({
      success: t.Boolean(),
      message: t.String()
    })
  },
  detail: {
    tags: ["Alarm"],
    description: "Kirim test notifikasi WhatsApp",
    summary: "Send test notification"
  }
};

// Legacy schemas untuk backward compatibility
export const postAlarmSchema = {
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

export {
  getAllAlarmsSchema,
  getAlarmByWidgetIdSchema,
  putAlarmSchema,
};
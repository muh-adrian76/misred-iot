import { t } from "elysia";

// Test API Connection Schema
export const testApiConnectionSchema = {
  response: {
    200: t.Object({
      success: t.Boolean(),
      message: t.String(),
      api_status: t.Object({
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
    description: "Test koneksi ke API service",
    summary: "Test API connection"
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

// Get Recent Notifications Schema
export const getRecentNotificationsSchema = {
  response: {
    200: t.Object({
      success: t.Boolean(),
      message: t.String(),
      notifications: t.Array(t.Object({
        id: t.String(),
        type: t.Union([t.Literal('alarm'), t.Literal('device_status'), t.Literal('firmware_update')]),
        title: t.String(),
        message: t.String(),
        priority: t.Union([t.Literal('low'), t.Literal('medium'), t.Literal('high')]),
        isRead: t.Boolean(),
        createdAt: t.String(),
        alarm_id: t.Union([t.Number(), t.Null()]),
        device_id: t.Union([t.Number(), t.Null()]),
        device_description: t.Union([t.String(), t.Null()]),
        datastream_description: t.Union([t.String(), t.Null()]),
        sensor_value: t.Union([t.Number(), t.Null()]),
        condition_text: t.Union([t.String(), t.Null()]),
      })),
      total: t.Number(),
      last_seen: t.String()
    }),
    401: t.Object({
      success: t.Boolean(),
      message: t.String()
    }),
    500: t.Object({
      success: t.Boolean(),
      message: t.String()
    })
  },
  detail: {
    tags: ["Notifications"],
    description: "Mengambil notifikasi alarm sejak last login atau 24 jam terakhir",
    summary: "Get notifications for login"
  }
};

// Get Notification History Schema
export const getNotificationHistorySchema = {
  query: t.Object({
    page: t.Optional(t.String()),
    limit: t.Optional(t.String()),
    timeRange: t.Optional(t.Union([
      t.Literal('1m'),
      t.Literal('1h'),
      t.Literal('12h'),
      t.Literal('1d'),
      t.Literal('today'),
      t.Literal('1w'),
      t.Literal('week'),
      t.Literal('1M'),
      t.Literal('month'),
      t.Literal('1y'),
      t.Literal('all')
    ])),
    type: t.Optional(t.Union([
      t.Literal('alarm'),
      t.Literal('device_status'),
      t.Literal('')
    ]))
  }),
  response: {
    200: t.Object({
      success: t.Boolean(),
      message: t.String(),
      notifications: t.Array(t.Object({
        id: t.Number(),
        type: t.Union([t.Literal('alarm'), t.Literal('device_status'), t.Literal('firmware_update')]),
        title: t.String(),
        message: t.String(),
        priority: t.Union([t.Literal('low'), t.Literal('medium'), t.Literal('high')]),
        alarm_id: t.Union([t.Number(), t.Null()]),
        device_id: t.Union([t.Number(), t.Null()]),
        datastream_id: t.Union([t.Number(), t.Null()]),
        alarm_description: t.Union([t.String(), t.Null()]),
        datastream_description: t.Union([t.String(), t.Null()]),
        device_description: t.Union([t.String(), t.Null()]),
        sensor_value: t.Union([t.Number(), t.Null()]),
        conditions_text: t.Union([t.String(), t.Null()]),
        triggered_at: t.String(),
        whatsapp_sent: t.Boolean(),
        is_read: t.Boolean(),
        read_at: t.String()
      })),
      pagination: t.Object({
        page: t.Number(),
        limit: t.Number(),
        total: t.Number(),
        pages: t.Number()
      })
    }),
    400: t.Object({
      success: t.Boolean(),
      message: t.String()
    }),
    401: t.Object({
      success: t.Boolean(),
      message: t.String()
    }),
    500: t.Object({
      success: t.Boolean(),
      message: t.String()
    })
  },
  detail: {
    tags: ["Notifications"],
    description: "Mengambil riwayat notifikasi dengan pagination dan filter waktu",
    summary: "Get notification history"
  }
};

// Send Device Offline Notification Schema
export const sendDeviceOfflineNotificationSchema = {
  body: t.Object({
    device_id: t.String({ minLength: 1 }),
    device_name: t.String({ minLength: 1, maxLength: 255 })
  }),
  response: {
    200: t.Object({
      success: t.Boolean(),
      message: t.String()
    }),
    400: t.Object({
      success: t.Boolean(),
      message: t.String()
    }),
    401: t.Object({
      success: t.Boolean(),
      message: t.String()
    }),
    403: t.Object({
      success: t.Boolean(),
      message: t.String()
    }),
    500: t.Object({
      success: t.Boolean(),
      message: t.String()
    })
  },
  detail: {
    tags: ["Notifications"],
    description: "Kirim notifikasi ketika device offline terdeteksi dari frontend",
    summary: "Send device offline notification"
  }
};
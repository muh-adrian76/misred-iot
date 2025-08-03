import { t } from "elysia";

// Condition Schema for multiple conditions
const conditionSchema = t.Object({
  operator: t.Union([
    t.Literal('='),
    t.Literal('<'),
    t.Literal('>'),
    t.Literal('<='),
    t.Literal('>=')
  ]),
  threshold: t.Number()
});

// Create Alarm Schema
export const createAlarmSchema = {
  body: t.Object({
    description: t.String({ minLength: 1, maxLength: 255 }),
    device_id: t.Number({ minimum: 1 }),
    datastream_id: t.Number({ minimum: 1 }),
    is_active: t.Boolean(),
    conditions: t.Array(conditionSchema, { minItems: 1, maxItems: 10 }),
    cooldown_minutes: t.Number({ minimum: 0, maximum: 1440 })
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
        conditions: t.Array(conditionSchema),
        is_active: t.Boolean(),
        cooldown_minutes: t.Number(),
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
        conditions: t.Array(conditionSchema),
        is_active: t.Boolean(),
        cooldown_minutes: t.Number(),
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
    conditions: t.Optional(t.Array(conditionSchema, { minItems: 1, maxItems: 5 })),
    is_active: t.Optional(t.Boolean()),
    cooldown_minutes: t.Optional(t.Number({ minimum: 0, maximum: 1440 }))
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
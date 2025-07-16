import { Elysia } from "elysia";
import { authorizeRequest } from "../../lib/utils";
import { AlarmService } from "../../services/AlarmService";
import { AlarmNotificationService } from "../../services/AlarmNotificationService";
import {
  createAlarmSchema,
  getAlarmsSchema,
  getAlarmByIdSchema,
  updateAlarmSchema,
  deleteAlarmSchema,
  toggleAlarmStatusSchema,
  getNotificationHistorySchema,
  testWahaConnectionSchema,
  sendTestNotificationSchema
} from "./elysiaSchema";

export function alarmNotificationRoutes(
  alarmService: AlarmService, 
  notificationService: AlarmNotificationService
) {
  return new Elysia({ prefix: "/notifications" })

    // ➕ CREATE Alarm
    .post(
      "/alarms",
      //@ts-ignore
      async ({ jwt, cookie, body, set }) => {
        try {
          const decoded = await authorizeRequest(jwt, cookie);
          const userId = parseInt(decoded.sub);

          // Validate input data
          const validation = alarmService.validateAlarmData(body);
          if (!validation.valid) {
            set.status = 400;
            return {
              success: false,
              message: "Invalid input data",
              errors: validation.errors
            };
          }

          const alarmData = {
            ...body,
            user_id: userId
          };

          const alarmId = await alarmService.createAlarm(alarmData);

          return {
            success: true,
            message: "Alarm berhasil dibuat",
            alarm_id: alarmId
          };
        } catch (error) {
          console.error("Error creating alarm:", error);
          set.status = 400;
          return {
            success: false,
            message: "Gagal membuat alarm"
          };
        }
      },
      createAlarmSchema
    )

    // 📄 GET All Alarms
    .get(
      "/alarms",
      //@ts-ignore
      async ({ jwt, cookie, query, set }) => {
        try {
          const decoded = await authorizeRequest(jwt, cookie);
          const userId = parseInt(decoded.sub);

          let alarms;
          if (query?.device_id) {
            alarms = await alarmService.getAlarmsByDeviceId(query.device_id, userId);
          } else {
            alarms = await alarmService.getAlarmsByUserId(userId);
          }

          return {
            success: true,
            alarms
          };
        } catch (error) {
          console.error("Error getting alarms:", error);
          set.status = 401;
          return {
            success: false,
            message: "Unauthorized"
          };
        }
      },
      getAlarmsSchema
    )

    // 📄 GET Alarm by ID
    .get(
      "/alarms/:alarmId",
      //@ts-ignore
      async ({ jwt, cookie, params, set }) => {
        try {
          const decoded = await authorizeRequest(jwt, cookie);
          const userId = parseInt(decoded.sub);
          const alarmId = parseInt(params.alarmId);

          const alarm = await alarmService.getAlarmById(alarmId, userId);
          
          if (!alarm) {
            set.status = 404;
            return {
              success: false,
              message: "Alarm tidak ditemukan"
            };
          }

          return {
            success: true,
            alarm
          };
        } catch (error) {
          console.error("Error getting alarm:", error);
          set.status = 401;
          return {
            success: false,
            message: "Unauthorized"
          };
        }
      },
      getAlarmByIdSchema
    )

    // ✏️ UPDATE Alarm
    .put(
      "/alarms/:alarmId",
      //@ts-ignore
      async ({ jwt, cookie, params, body, set }) => {
        try {
          const decoded = await authorizeRequest(jwt, cookie);
          const userId = parseInt(decoded.sub);
          const alarmId = parseInt(params.alarmId);

          // Validate input data
          const validation = alarmService.validateAlarmData(body);
          if (!validation.valid) {
            set.status = 400;
            return {
              success: false,
              message: "Invalid input data",
              errors: validation.errors
            };
          }

          const success = await alarmService.updateAlarm(alarmId, userId, body);
          
          if (!success) {
            set.status = 404;
            return {
              success: false,
              message: "Alarm tidak ditemukan"
            };
          }

          return {
            success: true,
            message: "Alarm berhasil diperbarui"
          };
        } catch (error) {
          console.error("Error updating alarm:", error);
          set.status = 400;
          return {
            success: false,
            message: "Gagal memperbarui alarm"
          };
        }
      },
      updateAlarmSchema
    )

    // 🗑️ DELETE Alarm
    .delete(
      "/alarms/:alarmId",
      //@ts-ignore
      async ({ jwt, cookie, params, set }) => {
        try {
          const decoded = await authorizeRequest(jwt, cookie);
          const userId = parseInt(decoded.sub);
          const alarmId = parseInt(params.alarmId);

          const success = await alarmService.deleteAlarm(alarmId, userId);
          
          if (!success) {
            set.status = 404;
            return {
              success: false,
              message: "Alarm tidak ditemukan"
            };
          }

          return {
            success: true,
            message: "Alarm berhasil dihapus"
          };
        } catch (error) {
          console.error("Error deleting alarm:", error);
          set.status = 400;
          return {
            success: false,
            message: "Gagal menghapus alarm"
          };
        }
      },
      deleteAlarmSchema
    )

    // 🔄 TOGGLE Alarm Status
    .patch(
      "/alarms/:alarmId/toggle",
      //@ts-ignore
      async ({ jwt, cookie, params, set }) => {
        try {
          const decoded = await authorizeRequest(jwt, cookie);
          const userId = parseInt(decoded.sub);
          const alarmId = parseInt(params.alarmId);

          const success = await alarmService.toggleAlarmStatus(alarmId, userId);
          
          if (!success) {
            set.status = 404;
            return {
              success: false,
              message: "Alarm tidak ditemukan"
            };
          }

          return {
            success: true,
            message: "Status alarm berhasil diubah"
          };
        } catch (error) {
          console.error("Error toggling alarm status:", error);
          set.status = 400;
          return {
            success: false,
            message: "Gagal mengubah status alarm"
          };
        }
      },
      toggleAlarmStatusSchema
    )

    // 📈 GET Notification History
    .get(
      "/history",
      //@ts-ignore
      async ({ jwt, cookie, query, set }) => {
        try {
          const decoded = await authorizeRequest(jwt, cookie);
          const userId = parseInt(decoded.sub);
          const limit = query?.limit || 50;

          const notifications = await notificationService.getNotificationHistory(userId, limit);

          return {
            success: true,
            notifications
          };
        } catch (error) {
          console.error("Error getting notification history:", error);
          set.status = 401;
          return {
            success: false,
            message: "Unauthorized"
          };
        }
      },
      getNotificationHistorySchema
    )

    // 🧪 TEST WAHA Connection
    .get(
      "/test/waha",
      //@ts-ignore
      async ({ jwt, cookie, set }) => {
        try {
          const decoded = await authorizeRequest(jwt, cookie);
          
          const wahaStatus = await notificationService.testWahaConnection();

          return {
            success: true,
            message: "Test WAHA connection completed",
            waha_status: wahaStatus
          };
        } catch (error) {
          console.error("Error testing WAHA connection:", error);
          set.status = 401;
          return {
            success: false,
            message: "Unauthorized"
          };
        }
      },
      testWahaConnectionSchema
    )

    // 🧪 SEND Test Notification
    .post(
      "/test/send",
      //@ts-ignore
      async ({ jwt, cookie, body, set }) => {
        try {
          const decoded = await authorizeRequest(jwt, cookie);
          const { phone, message } = body;

          const result = await notificationService.sendWhatsAppNotification(phone, message);

          if (result.success) {
            return {
              success: true,
              message: "Test notification berhasil dikirim",
              whatsapp_message_id: result.whatsapp_message_id
            };
          } else {
            set.status = 400;
            return {
              success: false,
              message: `Gagal mengirim test notification: ${result.error_message}`
            };
          }
        } catch (error) {
          console.error("Error sending test notification:", error);
          set.status = 400;
          return {
            success: false,
            message: "Gagal mengirim test notification"
          };
        }
      },
      sendTestNotificationSchema
    );
}

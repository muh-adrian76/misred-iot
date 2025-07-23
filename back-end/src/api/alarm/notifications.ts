import { Elysia } from "elysia";
import { authorizeRequest } from "../../lib/utils";
import { AlarmNotificationService } from "../../services/AlarmNotificationService";
import {
  createAlarmSchema,
  getAlarmsSchema,
  getAlarmByIdSchema,
  updateAlarmSchema,
  deleteAlarmSchema,
  testApiConnectionSchema,
  sendTestNotificationSchema,
  getRecentNotificationsSchema,
  getNotificationHistorySchema
} from "./elysiaSchema";

export function alarmNotificationRoutes(
  notificationService: AlarmNotificationService
) {
  return new Elysia({ prefix: "/notifications" })
    // 📋 GET Notifications saat user login (pengganti /recent)
    .get(
      "/",
      //@ts-ignore
      async ({ query, jwt, cookie, set }) => {
        try {
          const user = await authorizeRequest(jwt, cookie);
          
          if (!user || !user.sub) {
            console.error("❌ User ID not found in user object:", user);
            set.status = 401;
            return {
              success: false,
              message: "User ID not found",
              notifications: [],
              total: 0
            };
          }
          
          const userId = parseInt(user.sub);

          // Validate userId
          if (isNaN(userId) || userId <= 0) {
            console.error("❌ Invalid user ID:", user.sub);
            set.status = 400;
            return {
              success: false,
              message: "Invalid user ID",
              notifications: [],
              total: 0
            };
          }

          // Get saved notifications for the user
          const notifications = await notificationService.getRecentNotifications(userId);

          // Format notifications untuk frontend
          const formattedNotifications = notifications.map((row: any) => ({
            id: String(row.id), // Convert to string to match schema
            title: "🚨 Peringatan Sensor Alarm",
            message: `${row.alarm_description} - ${row.datastream_description}(${row.field_name}): ${row.sensor_value} (${row.conditions_text}) pada ${row.device_description}`,
            createdAt: String(row.triggered_at),
            isRead: Boolean(row.is_saved), // Use is_saved as isRead indicator
            priority: "high",
            alarm_id: row.alarm_id,
            device_description: row.device_description,
            datastream_description: row.datastream_description,
            sensor_value: Number(row.sensor_value),
            condition_text: row.conditions_text,
            user_email: row.user_email,
            is_saved: Boolean(row.is_saved),
            saved_at: row.saved_at
          }));

          return {
            success: true,
            message: formattedNotifications.length === 0 ? "Belum ada notifikasi tersimpan" : "Berhasil mengambil notifikasi",
            notifications: formattedNotifications,
            total: formattedNotifications.length,
            last_seen: new Date().toISOString()
          };
        } catch (error: any) {
          console.error("Error fetching recent notifications:", error);
          
          // Check if it's a database connection error
          if (error.code === 'ER_WRONG_ARGUMENTS' || error.errno === 1210) {
            set.status = 400;
            return {
              success: false,
              message: "Parameter query tidak valid",
              notifications: [],
              total: 0
            };
          }
          
          // General database error
          if (error.errno) {
            set.status = 500;
            return {
              success: false,
              message: "Gagal mengambil data dari database",
              notifications: [],
              total: 0
            };
          }
          
          set.status = 500;
          return {
            success: false,
            message: "Internal server error",
            notifications: [],
            total: 0
          };
        }
      },
      getRecentNotificationsSchema
    )

    // 📋 GET History Notifications dengan pagination dan time range filter
    .get(
      "/history",
      //@ts-ignore
      async ({ query, jwt, cookie, set }) => {
        try {
          const user = await authorizeRequest(jwt, cookie);
          
          if (!user || !user.sub) {
            console.error("❌ User ID not found in user object:", user);
            set.status = 401;
            return {
              success: false,
              message: "User ID not found"
            };
          }

          const userId = parseInt(user.sub);
          const page = Math.max(1, parseInt(query.page as string) || 1);
          const limit = Math.min(100, Math.max(1, parseInt(query.limit as string) || 20));
          const offset = (page - 1) * limit;
          const timeRange = query.timeRange as string || "all";

          console.log("📊 API Debug - Parsed parameters:", {
            userId: userId,
            userIdType: typeof userId,
            page: page,
            pageType: typeof page,
            limit: limit,
            limitType: typeof limit,
            offset: offset,
            offsetType: typeof offset,
            timeRange: timeRange
          });

          // Validate userId
          if (isNaN(userId) || userId <= 0) {
            console.error("❌ Invalid user ID:", user.sub);
            set.status = 400;
            return {
              success: false,
              message: "Invalid user ID"
            };
          }
          
          // Validate pagination parameters
          if (isNaN(page) || page < 1) {
            set.status = 400;
            return {
              success: false,
              message: "Invalid page parameter"
            };
          }

          if (isNaN(limit) || limit < 1 || limit > 100) {
            set.status = 400;
            return {
              success: false,
              message: "Invalid limit parameter (must be between 1-100)"
            };
          }
          
          // Get notification history from service
          const historyResult = await notificationService.getNotificationHistory(
            userId, page, limit, timeRange
          );

          const formattedNotifications = historyResult.notifications.map((row: any) => ({
            id: row.id,
            alarm_id: row.alarm_id,
            alarm_description: row.alarm_description,
            datastream_description: row.datastream_description,
            device_description: row.device_description,
            sensor_value: Number(row.sensor_value),
            conditions_text: row.conditions_text,
            triggered_at: row.triggered_at,
            notification_type: row.notification_type,
            whatsapp_message_id: row.whatsapp_message_id,
            whatsapp_sent: !!row.whatsapp_message_id,
            is_saved: Boolean(row.is_saved),
            saved_at: row.saved_at
          }));

          return {
            success: true,
            message: historyResult.total === 0 ? "Belum ada riwayat notifikasi tersimpan" : "Berhasil mengambil riwayat notifikasi",
            notifications: formattedNotifications,
            pagination: {
              page: page,
              limit: limit,
              total: historyResult.total,
              pages: Math.ceil(historyResult.total / limit) || 1
            }
          };

        } catch (error: any) {
          console.error("Error fetching notification history:", error);
          console.error("Error details:", {
            message: error.message,
            code: error.code,
            errno: error.errno,
            sqlMessage: error.sqlMessage,
            sql: error.sql
          });
          
          // Check if it's a database connection error
          if (error.code === 'ER_WRONG_ARGUMENTS' || error.errno === 1210) {
            console.error("❌ SQL Parameter mismatch detected!");
            
            set.status = 400;
            return {
              success: false,
              message: "Database query error. Please contact administrator.",
              notifications: [],
              pagination: {
                page: 1,
                limit: 20,
                total: 0,
                pages: 1
              }
            };
          }
          
          // General database error
          if (error.errno) {
            set.status = 500;
            return {
              success: false,
              message: `Database error: ${error.message}`,
              notifications: [],
              pagination: {
                page: 1,
                limit: 20,
                total: 0,
                pages: 1
              }
            };
          }
          
          set.status = 500;
          return {
            success: false,
            message: "Internal server error",
            notifications: [],
            pagination: {
              page: 1,
              limit: 20,
              total: 0,
              pages: 1
            }
          };
        }
      },
      getNotificationHistorySchema
    )

    // 💾 SAVE All WebSocket Notifications to Database
    .post(
      "/save-all",
      //@ts-ignore
      async ({ jwt, cookie, set }) => {
        try {
          const user = await authorizeRequest(jwt, cookie);
          const userId = parseInt(user.sub);

          // Validate userId
          if (isNaN(userId) || userId <= 0) {
            console.error("❌ Invalid user ID:", user.sub);
            set.status = 400;
            return {
              success: false,
              message: "Invalid user ID"
            };
          }

          // Mark all unsaved notifications for this user as saved
          const affectedRows = await notificationService.saveAllNotifications(userId);

          return {
            success: true,
            message: "Semua notifikasi berhasil disimpan",
            affected_rows: affectedRows
          };
        } catch (error) {
          console.error("Error saving all notifications:", error);
          set.status = 500;
          return {
            success: false,
            message: "Internal server error"
          };
        }
      }
    )

    // 🗑️ DELETE Single Notification
    .delete(
      "/:id",
      //@ts-ignore
      async ({ params, jwt, cookie, set }) => {
        try {
          const user = await authorizeRequest(jwt, cookie);
          const userId = parseInt(user.sub);
          const notificationId = parseInt(params.id);

          // Validate inputs
          if (isNaN(userId) || userId <= 0) {
            console.error("❌ Invalid user ID:", user.sub);
            set.status = 400;
            return {
              success: false,
              message: "Invalid user ID"
            };
          }

          if (isNaN(notificationId) || notificationId <= 0) {
            set.status = 400;
            return {
              success: false,
              message: "Invalid notification ID"
            };
          }

          const deleted = await notificationService.deleteNotification(notificationId, userId);

          if (!deleted) {
            set.status = 404;
            return {
              success: false,
              message: "Notifikasi tidak ditemukan"
            };
          }

          return {
            success: true,
            message: "Notifikasi berhasil dihapus"
          };
        } catch (error) {
          console.error("Error deleting notification:", error);
          set.status = 500;
          return {
            success: false,
            message: "Internal server error"
          };
        }
      }
    )

    // 🗑️ DELETE All Notifications
    .delete(
      "/",
      //@ts-ignore
      async ({ jwt, cookie, set }) => {
        try {
          const user = await authorizeRequest(jwt, cookie);
          const userId = parseInt(user.sub);

          // Validate userId
          if (isNaN(userId) || userId <= 0) {
            console.error("❌ Invalid user ID:", user.sub);
            set.status = 400;
            return {
              success: false,
              message: "Invalid user ID"
            };
          }

          const deletedCount = await notificationService.deleteAllNotifications(userId);

          return {
            success: true,
            message: "Semua notifikasi berhasil dihapus",
            deleted_count: deletedCount
          };
        } catch (error) {
          console.error("Error deleting all notifications:", error);
          set.status = 500;
          return {
            success: false,
            message: "Internal server error"
          };
        }
      }
    )
    
    // 🧪 TEST Green API Connection
    .get(
      "/test/api",
      //@ts-ignore
      async ({ set }) => {
        try {
          const apiStatus = await notificationService.testConnection();

          return {
            success: true,
            message: "Test api connection completed",
            api_status: apiStatus
          };
        } catch (error) {
          console.error("Error testing API connection:", error);
          set.status = 401;
          return {
            success: false,
            message: "Unauthorized"
          };
        }
      },
      testApiConnectionSchema
    )

    // 🧪 SEND Test Notification
    .post(
      "/test/send",
      //@ts-ignore
      async ({ body, set }) => {
        try {
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
    )

    // 🔄 RESET WhatsApp Connection
    .post(
      "/whatsapp/reset",
      //@ts-ignore
      async ({ set }) => {
        try {
          await notificationService.resetWhatsApp();
          return {
            success: true,
            message: "WhatsApp connection reset successfully. New QR code will be generated."
          };
        } catch (error) {
          console.error("Error resetting WhatsApp:", error);
          set.status = 500;
          return {
            success: false,
            message: "Failed to reset WhatsApp connection"
          };
        }
      }
    )

    // 📱 FORCE New QR Code
    .post(
      "/whatsapp/qr",
      //@ts-ignore
      async ({ set }) => {
        try {
          await notificationService.forceNewQRCode();
          return {
            success: true,
            message: "New QR code generation forced. Check server console for QR code."
          };
        } catch (error) {
          console.error("Error forcing QR code:", error);
          set.status = 500;
          return {
            success: false,
            message: "Failed to force new QR code"
          };
        }
      }
    )

    // 📊 WhatsApp Status
    .get(
      "/whatsapp/status",
      //@ts-ignore
      async ({ set }) => {
        try {
          const status = notificationService.getWhatsAppStatus();
          const sessionExists = await notificationService.checkSessionExists();
          
          return {
            success: true,
            data: {
              ready: status.ready,
              initializing: status.initializing,
              session_exists: sessionExists,
              message: status.ready 
                ? "WhatsApp Web is ready" 
                : status.initializing 
                  ? "WhatsApp Web is initializing..." 
                  : "WhatsApp Web is not ready"
            }
          };
        } catch (error) {
          console.error("Error getting WhatsApp status:", error);
          set.status = 500;
          return {
            success: false,
            message: "Failed to get WhatsApp status"
          };
        }
      }
    );
}

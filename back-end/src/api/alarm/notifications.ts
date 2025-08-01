import { Elysia } from "elysia";
import { authorizeRequest } from "../../lib/utils";
import { AlarmNotificationService } from "../../services/AlarmNotificationService";
import {
  getRecentNotificationsSchema,
  getNotificationHistorySchema,
  testApiConnectionSchema,
  sendTestNotificationSchema,
} from "./elysiaSchema";

export function alarmNotificationRoutes(
  notificationService: AlarmNotificationService
) {
  return new Elysia({ prefix: "/notifications" })
    // 📋 GET Notifications saat user login (semua notifikasi dengan status read/unread)
    .get(
      "/",
      //@ts-ignore
      async ({ query, jwt, cookie, set }) => {
        try {
          const user = await authorizeRequest(jwt, cookie);
          
          if (!user || !user.sub) {
            console.error("❌ User not authenticated");
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

          // Get all notifications for the user
          const notifications = await notificationService.getRecentNotifications(userId);

          // Format notifications untuk frontend
          const formattedNotifications = notifications.map((row: any) => ({
            id: String(row.id),
            title: row.alarm_description,
            message: `Device: ${row.device_description}\nDatastream: ${row.datastream_description}(${row.field_name})\nNilai: ${row.sensor_value} (${row.conditions_text})`,
            createdAt: String(row.triggered_at),
            isRead: Boolean(row.is_read),
            priority: "high",
            alarm_id: row.alarm_id,
            device_description: row.device_description,
            datastream_description: row.datastream_description,
            sensor_value: Number(row.sensor_value),
            condition_text: row.conditions_text,
            user_email: row.user_email,
            is_read: Boolean(row.is_read),
            read_at: String(row.read_at)
          }));

          return {
            success: true,
            message: formattedNotifications.length === 0 ? "Belum ada notifikasi" : "Berhasil mengambil notifikasi",
            notifications: formattedNotifications,
            total: formattedNotifications.length,
            last_seen: new Date().toISOString()
          };
        } catch (error: any) {
          console.error("Error fetching notifications:", error);
          
          // Check if it's a database connection error
          if (error.code === 'ER_WRONG_ARGUMENTS' || error.errno === 1210) {
            set.status = 503;
            return {
              success: false,
              message: "Database connection issue",
              notifications: [],
              total: 0
            };
          }
          
          // General database error
          if (error.errno) {
            set.status = 503;
            return {
              success: false,
              message: "Database error occurred",
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
            set.status = 401;
            return {
              success: false,
              message: "User not authenticated",
              notifications: [],
              pagination: {
                page: 1,
                limit: 20,
                total: 0,
                pages: 1
              }
            };
          }

          const userId = parseInt(user.sub);
          const page = Math.max(1, parseInt(query.page as string) || 1);
          const limit = Math.min(100, Math.max(1, parseInt(query.limit as string) || 20));
          const offset = (page - 1) * limit;
          const timeRange = query.timeRange as string || "all";

          // console.log("📊 API Debug - Parsed parameters:", {
          //   userId: userId,
          //   userIdType: typeof userId,
          //   page: page,
          //   pageType: typeof page,
          //   limit: limit,
          //   limitType: typeof limit,
          //   offset: offset,
          //   offsetType: typeof offset,
          //   timeRange: timeRange
          // });

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
            device_id: row.device_id,
            datastream_id: row.datastream_id,
            alarm_description: row.alarm_description,
            datastream_description: row.datastream_description,
            device_description: row.device_description,
            sensor_value: Number(row.sensor_value),
            conditions_text: row.conditions_text,
            triggered_at: String(row.triggered_at),
            notification_type: row.notification_type,
            whatsapp_message_id: row.whatsapp_message_id,
            whatsapp_sent: !!row.whatsapp_message_id,
            is_read: Boolean(row.is_read),
            read_at: String(row.read_at)
          }));

          return {
            success: true,
            message: historyResult.total === 0 ? "Belum ada riwayat notifikasi" : "Berhasil mengambil riwayat notifikasi",
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
          
          // Check if it's an authentication error from authorizeRequest
          if (error.message && error.message.includes('Unauthorized')) {
            console.error("❌ Authentication error in notification history:", error.message);
            set.status = 401;
            return {
              success: false,
              message: "Authentication failed",
              notifications: [],
              pagination: {
                page: 1,
                limit: 20,
                total: 0,
                pages: 1
              }
            };
          }
          
          // Check if it's a database connection error
          if (error.code === 'ER_WRONG_ARGUMENTS' || error.errno === 1210) {
            set.status = 503;
            return {
              success: false,
              message: "Database connection issue",
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
            set.status = 503;
            return {
              success: false,
              message: "Database error occurred",
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

    // ✅ MARK All Notifications as Read
    .put(
      "/read",
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
          const affectedRows = await notificationService.markAllAsRead(userId);
          
          return {
            success: true,
            message: "Semua notifikasi berhasil ditandai dibaca",
            affected_rows: affectedRows
          };
        } catch (error: any) {
          console.error("Error in mark all notifications as read:", error);
          
          // Check if it's an authentication error from authorizeRequest
          if (error.message && error.message.includes('Unauthorized')) {
            console.error("❌ Authentication error:", error.message);
            set.status = 401;
            return {
              success: false,
              message: "Authentication failed"
            };
          }
          
          // Handle other errors
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

          // Delete all notifications for this user
          const affectedRows = await notificationService.deleteAllNotifications(userId);

          return {
            success: true,
            message: "Semua notifikasi berhasil dihapus",
            affected_rows: affectedRows
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

    // 🧪 SEND Test Notification
    .post(
      "/test/send",
      //@ts-ignore
      async ({ body, set }) => {
        try {
          const { phone, message } = body as { phone: string; message: string };

          if (!phone || !message) {
            set.status = 400;
            return {
              success: false,
              message: "Phone number and message are required",
            };
          }

          const result = await notificationService.sendWhatsAppNotification(phone, message);

          return {
            success: result.success,
            message: result.success ? "Test notification sent successfully" : "Failed to send test notification",
            whatsapp_message_id: result.whatsapp_message_id,
            error_message: result.error_message,
          };
        } catch (error) {
          console.error("Error sending test notification:", error);
          set.status = 500;
          return {
            success: false,
            message: "Internal server error during test notification",
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
            message: "WhatsApp connection reset successfully",
          };
        } catch (error) {
          console.error("Error resetting WhatsApp connection:", error);
          set.status = 500;
          return {
            success: false,
            message: "Failed to reset WhatsApp connection",
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
            message: "New QR code generated successfully",
          };
        } catch (error) {
          console.error("Error generating new QR code:", error);
          set.status = 500;
          return {
            success: false,
            message: "Failed to generate new QR code",
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
          const systemHealth = notificationService.getSystemHealth();

          return {
            success: true,
            whatsapp_status: status,
            system_health: systemHealth,
            message: "WhatsApp status retrieved successfully",
          };
        } catch (error) {
          console.error("Error getting WhatsApp status:", error);
          set.status = 500;
          return {
            success: false,
            message: "Failed to get WhatsApp status",
          };
        }
      }
    )

    // 🔄 WhatsApp Toggle (Admin only)
    .post(
      "/whatsapp/toggle",
      //@ts-ignore
      async ({ jwt, cookie, body, set }) => {
        try {
          const user = await authorizeRequest(jwt, cookie);
          
          // Check if user is admin (simplified check)
          if (!user || !user.sub) {
            set.status = 401;
            return {
              success: false,
              message: "Unauthorized",
            };
          }

          const { enabled } = body as { enabled: boolean };
          await notificationService.toggleWhatsAppService(enabled);

          return {
            success: true,
            message: `WhatsApp service ${enabled ? 'enabled' : 'disabled'} successfully`,
          };
        } catch (error) {
          console.error("Error toggling WhatsApp service:", error);
          set.status = 500;
          return {
            success: false,
            message: "Failed to toggle WhatsApp service",
          };
        }
      }
    )

    // 🔄 WhatsApp Restart (Admin only)
    .post(
      "/whatsapp/restart",
      //@ts-ignore
      async ({ jwt, cookie, set }) => {
        try {
          const user = await authorizeRequest(jwt, cookie);
          
          // Check if user is admin (simplified check)
          if (!user || !user.sub) {
            set.status = 401;
            return {
              success: false,
              message: "Unauthorized",
            };
          }

          await notificationService.restartWhatsApp();

          return {
            success: true,
            message: "WhatsApp service restarted successfully",
          };
        } catch (error) {
          console.error("Error restarting WhatsApp service:", error);
          set.status = 500;
          return {
            success: false,
            message: "Failed to restart WhatsApp service",
          };
        }
      }
    );
}

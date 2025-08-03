import { Elysia } from "elysia";
import { authorizeRequest } from "../../lib/utils";
import { NotificationService } from "../../services/NotificationService";
import {
  getRecentNotificationsSchema,
  getNotificationHistorySchema,
  testApiConnectionSchema,
  sendTestNotificationSchema,
  sendDeviceOfflineNotificationSchema,
} from "./elysiaSchema";

export function notificationRoutes(
  notificationService: NotificationService
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

          // Get all notifications for the user (not just unread)
          console.log(`🔍 Fetching recent notifications for user ${userId}`);
          const historyResult = await notificationService.getNotificationHistory(
            userId, 1, 50, "all" // page 1, limit 50, all time range
          );
          console.log(`📊 Found ${historyResult.total} total notifications, showing ${historyResult.notifications.length} recent`);

          // Format notifications untuk frontend dengan schema baru
          const formattedNotifications = historyResult.notifications.map((row: any) => ({
            id: String(row.id),
            type: row.type || 'alarm',
            title: row.title || row.alarm_description || 'Notification',
            message: row.message || `Perangkat: ${row.device_description}\nDatastream: ${row.datastream_description}(${row.field_name})\nNilai: ${row.sensor_value} (${row.conditions_text})`,
            priority: row.priority || 'medium',
            isRead: Boolean(row.is_read),
            createdAt: String(row.triggered_at),
            alarm_id: row.alarm_id || null,
            device_id: row.device_id || null,
            device_description: row.device_description || null,
            datastream_description: row.datastream_description || null,
            sensor_value: row.sensor_value ? Number(row.sensor_value) : null,
            condition_text: row.conditions_text || null,
            user_email: row.user_email
          }));

          return {
            success: true,
            message: formattedNotifications.length === 0 ? "Belum ada notifikasi" : "Berhasil mengambil notifikasi",
            notifications: formattedNotifications,
            total: historyResult.total,
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
          const type = query.type as string || ""; // Add type filter parameter

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
          console.log(`🔍 Fetching notification history for user ${userId}, page ${page}, limit ${limit}, timeRange ${timeRange}, type ${type}`);
          const historyResult = await notificationService.getNotificationHistory(
            userId, page, limit, timeRange, type
          );
          console.log(`📊 Found ${historyResult.total} total notifications, returning ${historyResult.notifications.length} for this page`);

          const formattedNotifications = historyResult.notifications.map((row: any) => ({
            id: row.id,
            type: row.type || 'alarm',
            title: row.title || row.alarm_description || 'Notification',
            message: row.message || `Perangkat: ${row.device_description}\nDatastream: ${row.datastream_description}\nNilai: ${row.sensor_value}`,
            priority: row.priority || 'medium',
            alarm_id: row.alarm_id || null,
            device_id: row.device_id || null,
            datastream_id: row.datastream_id || null,
            alarm_description: row.alarm_description || null,
            datastream_description: row.datastream_description || null,
            device_description: row.device_description || null,
            sensor_value: row.sensor_value ? Number(row.sensor_value) : null,
            conditions_text: row.conditions_text || null,
            triggered_at: String(row.triggered_at),
            whatsapp_sent: false, // Field tidak ada lagi di schema baru
            is_read: Boolean(row.is_read),
            read_at: String(row.triggered_at) // Gunakan triggered_at sebagai fallback
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
    )

    // 📱 DEVICE OFFLINE NOTIFICATION
    // Endpoint untuk mengirim notifikasi ketika device offline
    .post(
      "/device-offline",
      //@ts-ignore
      async ({ body, jwt, cookie, set }) => {
        try {
          const user = await authorizeRequest(jwt, cookie);
          
          if (!user || !user.sub) {
            set.status = 401;
            return {
              success: false,
              message: "Unauthorized access"
            };
          }

          const userId = parseInt(user.sub);
          const { device_id, device_name } = body as { device_id: string; device_name: string };

          if (!device_id || !device_name) {
            set.status = 400;
            return {
              success: false,
              message: "Missing device_id or device_name"
            };
          }

          // Verify device ownership
          const db = notificationService.db;
          const [deviceRows]: any = await db.query(
            "SELECT id, user_id FROM devices WHERE id = ?",
            [device_id]
          );

          if (!deviceRows.length || deviceRows[0].user_id !== userId) {
            set.status = 403;
            return {
              success: false,
              message: "Device not found or access denied"
            };
          }

          // Create device offline notification
          console.log(`🔄 Creating device offline notification via API for device ${device_id}, user ${userId}`);
          
          await db.query(
            "INSERT INTO notifications (user_id, type, title, message, priority, device_id, triggered_at, is_read) VALUES (?, ?, ?, ?, ?, ?, NOW(), FALSE)",
            [
              userId,
              "device_status",
              "Device Offline",
              `Device "${device_name}" telah offline dan tidak merespons`,
              "high",
              device_id
            ]
          );
          
          console.log(`✅ Device offline notification created via API for device ${device_id}`);

          // Send real-time browser notification via WebSocket
          try {
            const { broadcastToSpecificUser } = await import('../ws/user-ws');
            const notificationData = {
              type: 'notification',
              data: {
                id: Date.now(), // Temporary ID for real-time notification
                type: 'device_status',
                title: 'Perubahan Status Perangkat',
                message: `Perangkat "${device_name}" telah offline dan tidak merespons`,
                priority: 'high',
                device_id: device_id,
                device_name: device_name,
                triggered_at: new Date().toISOString(),
                is_read: false
              }
            };
            
            console.log(`📡 Broadcasting device offline notification to user ${userId} via WebSocket`);
            broadcastToSpecificUser(userId.toString(), notificationData);
          } catch (wsError) {
            console.error('Error broadcasting WebSocket notification:', wsError);
          }

          // Get user data for WhatsApp notification
          const [userRows]: any = await db.query(
            "SELECT name, phone, whatsapp_notif FROM users WHERE id = ?",
            [userId]
          );

          const userData = userRows[0];

          // Send WhatsApp notification if enabled
          if (userData && userData.whatsapp_notif && userData.phone) {
            try {
              await notificationService.sendWhatsAppNotification(
                userData.phone,
                `🔴 *Perubahan Status Perangkat*\n\nPerangkat "${device_name}" telah offline dan tidak merespons.\n\nSilakan periksa koneksi perangkat Anda.`
              );
            } catch (whatsappError) {
              console.error('Error sending WhatsApp notification for device offline:', whatsappError);
            }
          }

          console.log(`✅ Device offline notification sent for device ${device_id} (${device_name}) to user ${userId}`);

          return {
            success: true,
            message: "Device offline notification sent successfully"
          };

        } catch (error) {
          console.error("Error sending device offline notification:", error);
          set.status = 500;
          return {
            success: false,
            message: "Internal server error"
          };
        }
      },
      sendDeviceOfflineNotificationSchema
    );
}

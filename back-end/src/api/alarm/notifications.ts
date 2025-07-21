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
  getRecentNotificationsSchema
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
          
          const userId = user.sub;

          // Get saved notifications for the user
          const [rows] = await notificationService.db.execute(`
            SELECT 
              an.id,
              an.alarm_id,
              an.sensor_value,
              an.conditions_text,
              an.triggered_at,
              COALESCE(an.is_saved, 0) as is_saved,
              an.saved_at,
              a.description as alarm_description,
              ds.description as datastream_description,
              ds.pin as field_name,
              dev.description as device_description,
              u.email as user_email
            FROM alarm_notifications an
            JOIN alarms a ON an.alarm_id = a.id
            JOIN datastreams ds ON an.datastream_id = ds.id
            JOIN devices dev ON an.device_id = dev.id
            JOIN users u ON an.user_id = u.id
            WHERE an.user_id = ? 
              AND COALESCE(an.is_saved, 0) = 1
            ORDER BY an.triggered_at DESC
            LIMIT 50
          `, [userId]);

          // Format notifications untuk frontend
          const notifications = (rows as any[]).map((row: any) => ({
            id: row.id, // Use actual database ID instead of concatenated string
            title: "🚨 Peringatan Sensor Alarm",
            message: `${row.alarm_description} - ${row.datastream_description}(${row.field_name}): ${row.sensor_value} (${row.conditions_text}) pada ${row.device_description}`,
            createdAt: row.triggered_at,
            isRead: Boolean(row.is_saved), // Use is_saved as isRead indicator
            priority: "high",
            alarm_id: row.alarm_id,
            device_description: row.device_description,
            datastream_description: row.datastream_description,
            sensor_value: row.sensor_value,
            condition_text: row.conditions_text,
            user_email: row.user_email,
            is_saved: Boolean(row.is_saved),
            saved_at: row.saved_at
          }));

          return {
            success: true,
            message: notifications.length === 0 ? "Belum ada notifikasi tersimpan" : "Berhasil mengambil notifikasi",
            notifications: notifications,
            total: notifications.length,
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

          const userId = user.sub;
          const page = parseInt(query.page as string) || 1;
          const limit = parseInt(query.limit as string) || 20;
          const offset = (page - 1) * limit;
          const timeRange = query.timeRange as string || "all";
          
          // Build time range condition
          let timeCondition = "";
          switch(timeRange) {
            case "1m":
              timeCondition = "AND an.triggered_at >= DATE_SUB(NOW(), INTERVAL 1 MINUTE)";
              break;
            case "1h":
              timeCondition = "AND an.triggered_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)";
              break;
            case "12h":
              timeCondition = "AND an.triggered_at >= DATE_SUB(NOW(), INTERVAL 12 HOUR)";
              break;
            case "1d":
            case "today":
              timeCondition = "AND an.triggered_at >= CURDATE()";
              break;
            case "1w":
            case "week":
              timeCondition = "AND an.triggered_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
              break;
            case "1M":
            case "month":
              timeCondition = "AND an.triggered_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
              break;
            case "1y":
              timeCondition = "AND an.triggered_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)";
              break;
            case "all":
            default:
              timeCondition = "";
          }
          
          // Simplified queries - only show saved notifications in history
          const countQuery = `
            SELECT COUNT(*) as total
            FROM alarm_notifications an
            WHERE an.user_id = ? 
              AND COALESCE(an.is_saved, 0) = 1 
              ${timeCondition}
          `;
          
          const dataQuery = `
            SELECT 
              an.id,
              an.alarm_id,
              an.sensor_value,
              an.conditions_text,
              an.triggered_at,
              COALESCE(an.notification_type, 'browser') as notification_type,
              an.whatsapp_message_id,
              an.is_saved,
              an.saved_at,
              a.description as alarm_description,
              ds.description as datastream_description,
              ds.pin as field_name,
              dev.description as device_description
            FROM alarm_notifications an
            LEFT JOIN alarms a ON an.alarm_id = a.id
            LEFT JOIN datastreams ds ON an.datastream_id = ds.id
            LEFT JOIN devices dev ON an.device_id = dev.id
            WHERE an.user_id = ? 
              AND COALESCE(an.is_saved, 0) = 1 
              ${timeCondition}
            ORDER BY an.triggered_at DESC 
            LIMIT ? OFFSET ?
          `;

          // Execute count query first
          const [countResult] = await notificationService.db.execute(countQuery, [userId]);
          const total = (countResult as any[])[0]?.total || 0;

          // Execute data query with pagination
          const [rows] = await notificationService.db.execute(dataQuery, [userId, limit, offset]);

          const notifications = (rows as any[]).map((row: any) => ({
            id: row.id,
            alarm_id: row.alarm_id,
            alarm_description: row.alarm_description,
            datastream_description: row.datastream_description,
            device_description: row.device_description,
            sensor_value: row.sensor_value,
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
            message: total === 0 ? "Belum ada riwayat notifikasi tersimpan" : "Berhasil mengambil riwayat notifikasi",
            notifications: notifications,
            pagination: {
              page: page,
              limit: limit,
              total: total,
              pages: Math.ceil(total / limit) || 1
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
      }
    )

    // 💾 SAVE All WebSocket Notifications to Database
    .post(
      "/save-all",
      //@ts-ignore
      async ({ jwt, cookie, set }) => {
        try {
          const user = await authorizeRequest(jwt, cookie);
          const userId = user.sub;

          // Mark all unsaved notifications for this user as saved
          const [result] = await notificationService.db.execute(`
            UPDATE alarm_notifications 
            SET is_saved = TRUE, saved_at = NOW() 
            WHERE user_id = ? AND COALESCE(is_saved, 0) = 0
          `, [userId]);

          return {
            success: true,
            message: "Semua notifikasi berhasil disimpan",
            affected_rows: (result as any).affectedRows
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
          const userId = user.sub;
          const notificationId = params.id;

          const [result] = await notificationService.db.execute(`
            DELETE FROM alarm_notifications 
            WHERE id = ? AND user_id = ?
          `, [notificationId, userId]);

          if ((result as any).affectedRows === 0) {
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
          const userId = user.sub;

          const [result] = await notificationService.db.execute(`
            DELETE FROM alarm_notifications 
            WHERE user_id = ?
          `, [userId]);

          return {
            success: true,
            message: "Semua notifikasi berhasil dihapus",
            deleted_count: (result as any).affectedRows
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
    );
}

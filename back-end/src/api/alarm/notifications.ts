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
          const userId = user.sub;

          // Get notifications sejak last_login user atau 24 jam terakhir jika last_login null
          const [rows] = await notificationService.db.execute(`
            SELECT 
              an.id,
              an.alarm_id,
              an.sensor_value,
              an.conditions_text,
              an.triggered_at,
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
              AND an.triggered_at >= COALESCE(
                (SELECT last_login FROM users WHERE id = ?), 
                NOW() - INTERVAL 24 HOUR
              )
              AND an.notification_type IN ('all', 'sent')
            ORDER BY an.triggered_at DESC
            LIMIT 50
          `, [userId, userId]);

          // Format notifications untuk frontend
          const notifications = (rows as any[]).map((row: any) => ({
            id: `alarm_${row.alarm_id}_${row.id}`,
            title: "🚨 Peringatan Sensor Alarm",
            message: `${row.alarm_description} - ${row.datastream_description}(${row.field_name}): ${row.sensor_value} (${row.conditions_text}) pada ${row.device_description}`,
            isRead: false,
            createdAt: row.triggered_at,
            priority: "high",
            alarm_id: row.alarm_id,
            device_description: row.device_description,
            datastream_description: row.datastream_description,
            sensor_value: row.sensor_value,
            condition_text: row.conditions_text,
            user_email: row.user_email
          }));

          return {
            success: true,
            message: "Berhasil mengirim notifikasi",
            notifications: notifications,
            total: notifications.length,
            last_seen: new Date().toISOString()
          };
        } catch (error) {
          console.error("Error fetching recent notifications:", error);
          set.status = 500;
          return {
            success: false,
            message: "Internal server error"
          };
        }
      },
      getRecentNotificationsSchema
    )

    // 📋 GET History Notifications dengan pagination
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
          
          // Get total count
          const [countResult] = await notificationService.db.execute(`
            SELECT COUNT(*) as total
            FROM alarm_notifications an
            JOIN alarms a ON an.alarm_id = a.id
            WHERE an.user_id = ?
          `, [userId]);

          const total = (countResult as any[])[0].total;

          // Get paginated results
          const [rows] = await notificationService.db.execute(`
            SELECT 
              an.id,
              an.alarm_id,
              an.sensor_value,
              an.conditions_text,
              an.triggered_at,
              an.notification_type,
              an.whatsapp_message_id,
              a.description as alarm_description,
              ds.description as datastream_description,
              ds.pin as field_name,
              dev.description as device_description
            FROM alarm_notifications an
            JOIN alarms a ON an.alarm_id = a.id
            JOIN datastreams ds ON an.datastream_id = ds.id
            JOIN devices dev ON an.device_id = dev.id
            WHERE an.user_id = ?
            ORDER BY an.triggered_at DESC
            LIMIT ? OFFSET ?
          `, [userId, limit, offset]);

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
            whatsapp_message_id: row.whatsapp_message_id
          }));

          return {
            success: true,
            notifications: notifications,
            pagination: {
              page: page,
              limit: limit,
              total: total,
              pages: Math.ceil(total / limit)
            }
          };

        } catch (error) {
          console.error("Error fetching notification history:", error);
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

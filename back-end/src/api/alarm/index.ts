import { Elysia } from "elysia";
import { authorizeRequest } from "../../lib/utils";
import { AlarmService } from "../../services/AlarmService";
import {
  createAlarmSchema,
  getAlarmsSchema,
  getAlarmByIdSchema,
  updateAlarmSchema,
  deleteAlarmSchema,
} from "./elysiaSchema";

export function alarmRoutes(alarmService: AlarmService) {
  return new Elysia({ prefix: "/alarm" })

    // ➕ CREATE Alarm
    .post(
      "/",
      //@ts-ignore
      async ({ jwt, cookie, body, set }) => {
        try {
          const decoded = await authorizeRequest(jwt, cookie);
          const { description, device_id, datastream_id, is_active, conditions, cooldown_minutes } = body;
          const user_id = decoded.sub;
          
          const insertId = await alarmService.createAlarm({
            description,
            user_id: Number(user_id),
            device_id,
            datastream_id,
            is_active,
            conditions,
            cooldown_minutes,
          });
          return new Response(
            JSON.stringify({
              success: true,
              message: "Berhasil menambah data alarm",
              alarm_id: insertId,
            }),
            { status: 200 }
          );
        } catch (error: any) {
          console.error("Error creating alarm:", error);
          
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
      },
      createAlarmSchema
    )

    // 📄 READ Semua Alarm milik user
    .get(
      "/",
      //@ts-ignore
      async ({ jwt, cookie, set }) => {
        try {
          const decoded = await authorizeRequest(jwt, cookie);
          const data = await alarmService.getAllAlarms(decoded.sub);
          return new Response(
            JSON.stringify({ 
              success: true,
              alarms: data 
            }), 
            { status: 200 }
          );
        } catch (error: any) {
          console.error("Error fetching alarms:", error);
          
          // Check if it's an authentication error from authorizeRequest
          if (error.message && error.message.includes('Unauthorized')) {
            console.error("❌ Authentication error:", error.message);
            set.status = 401;
            return {
              success: false,
              message: "Authentication failed",
              alarms: []
            };
          }
          
          // Handle other errors
          set.status = 500;
          return {
            success: false,
            message: "Internal server error",
            alarms: []
          };
        }
      },
      getAlarmsSchema
    )

    // 📄 READ Alarm by ID
    .get(
      "/:alarmId",
      //@ts-ignore
      async ({ jwt, cookie, params, set }) => {
        try {
          const decoded = await authorizeRequest(jwt, cookie);
          const data = await alarmService.getAlarmById(Number(params.alarmId), Number(decoded.sub));
          
          if (!data) {
            return new Response(
              JSON.stringify({
                success: false,
                message: "Alarm tidak ditemukan",
              }),
              { status: 404 }
            );
          }
          
          return new Response(
            JSON.stringify({ 
              success: true,
              alarm: data 
            }), 
            { status: 200 }
          );
        } catch (error: any) {
          console.error("Error fetching alarm:", error);
          
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
      },
      getAlarmByIdSchema
    )

    // ✏️ UPDATE Alarm
    .put(
      "/:alarmId",
      //@ts-ignore
      async ({ jwt, cookie, params, body, set }) => {
        try {
          const decoded = await authorizeRequest(jwt, cookie);
          const updated = await alarmService.updateAlarm(Number(params.alarmId), Number(decoded.sub), body);
          
          if (!updated) {
            return new Response(
              JSON.stringify({
                success: false,
                message: "Alarm tidak ditemukan atau gagal mengupdate",
              }),
              { status: 404 }
            );
          }
          
          return new Response(
            JSON.stringify({
              success: true,
              message: "Berhasil mengupdate data alarm.",
            }),
            { status: 200 }
          );
        } catch (error: any) {
          console.error("Error updating alarm:", error);
          
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
      },
      updateAlarmSchema
    )

    // ❌ DELETE Alarm
    .delete(
      "/:alarmId",
      //@ts-ignore
      async ({ jwt, cookie, params, set }) => {
        try {
          const decoded = await authorizeRequest(jwt, cookie);
          const deleted = await alarmService.deleteAlarm(Number(params.alarmId), Number(decoded.sub));
          
          if (!deleted) {
            return new Response(
              JSON.stringify({
                success: false,
                message: "Alarm tidak ditemukan atau gagal menghapus",
              }),
              { status: 404 }
            );
          }
          
          return new Response(
            JSON.stringify({ 
              success: true,
              message: "Berhasil menghapus data alarm." 
            }),
            { status: 200 }
          );
        } catch (error: any) {
          console.error("Error deleting alarm:", error);
          
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
      },
      deleteAlarmSchema
    );
}
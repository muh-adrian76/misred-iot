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
      async ({ jwt, cookie, body }) => {
        const decoded = await authorizeRequest(jwt, cookie);
        const { description, device_id, datastream_id, conditions, cooldown_minutes } = body;
        const user_id = decoded.sub;
        
        try {
          const insertId = await alarmService.createAlarm({
            description,
            user_id: Number(user_id),
            device_id,
            datastream_id,
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
        } catch (error) {
          console.error("Error creating alarm:", error);
          return new Response(
            JSON.stringify({
              success: false,
              message: "Gagal menambah data alarm",
            }),
            { status: 400 }
          );
        }
      },
      createAlarmSchema
    )

    // 📄 READ Semua Alarm milik user
    .get(
      "/",
      //@ts-ignore
      async ({ jwt, cookie }) => {
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
        } catch (error) {
          console.error("Error fetching alarms:", error);
          return new Response(
            JSON.stringify({
              success: false,
              message: "Gagal mengambil data alarm",
            }),
            { status: 400 }
          );
        }
      },
      getAlarmsSchema
    )

    // 📄 READ Alarm by ID
    .get(
      "/:alarmId",
      //@ts-ignore
      async ({ jwt, cookie, params }) => {
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
        } catch (error) {
          console.error("Error fetching alarm:", error);
          return new Response(
            JSON.stringify({
              success: false,
              message: "Gagal mengambil data alarm",
            }),
            { status: 400 }
          );
        }
      },
      getAlarmByIdSchema
    )

    // ✏️ UPDATE Alarm
    .put(
      "/:alarmId",
      //@ts-ignore
      async ({ jwt, cookie, params, body }) => {
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
        } catch (error) {
          console.error("Error updating alarm:", error);
          return new Response(
            JSON.stringify({
              success: false,
              message: "Gagal mengupdate data alarm",
            }),
            { status: 400 }
          );
        }
      },
      updateAlarmSchema
    )

    // ❌ DELETE Alarm
    .delete(
      "/:alarmId",
      //@ts-ignore
      async ({ jwt, cookie, params }) => {
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
        } catch (error) {
          console.error("Error deleting alarm:", error);
          return new Response(
            JSON.stringify({
              success: false,
              message: "Gagal menghapus data alarm",
            }),
            { status: 400 }
          );
        }
      },
      deleteAlarmSchema
    )
}
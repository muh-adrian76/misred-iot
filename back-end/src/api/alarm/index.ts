import { Elysia } from "elysia";
import { authorizeRequest } from "../../lib/utils";
import { AlarmService } from "../../services/AlarmService";
import {
  deleteAlarmSchema,
  getAlarmByWidgetIdSchema,
  getAllAlarmsSchema,
  postAlarmSchema,
  putAlarmSchema,
} from "./elysiaSchema";

export function alarmRoutes(alarmService: AlarmService) {
  return new Elysia({ prefix: "/alarm" })

    // ➕ CREATE Alarm
    .post(
      "/",
      //@ts-ignore
      async ({ jwt, cookie, body }) => {
        const decoded = await authorizeRequest(jwt, cookie);
        const { description, widget_id, operator, threshold } = body;
        const user_id = decoded.sub;
        const insertId = await alarmService.createAlarm({
          description,
          user_id,
          widget_id,
          operator,
          threshold,
        });
        return new Response(
          JSON.stringify({
            message: "Berhasil menambah data alarm",
            id: insertId,
          }),
          { status: 201 }
        );
      },
      postAlarmSchema
    )

    // 📄 READ Semua Alarm milik user
    .get(
      "/",
      //@ts-ignore
      async ({ jwt, cookie }) => {
        const decoded = await authorizeRequest(jwt, cookie);
        const data = await alarmService.getAllAlarms(decoded.sub);
        return new Response(JSON.stringify({ result: data }), { status: 200 });
      },
      getAllAlarmsSchema
    )

    // 📄 READ Alarm by Widget ID
    .get(
      "/widget/:widget_id",
      //@ts-ignore
      async ({ jwt, cookie, params }) => {
        const decoded = await authorizeRequest(jwt, cookie);
        const data = await alarmService.getAlarmsByWidgetId(Number(params.widget_id), decoded.sub);
        return new Response(JSON.stringify({ result: data }), { status: 200 });
      },
      getAlarmByWidgetIdSchema
    )

    // ✏️ UPDATE Alarm
    .put(
      "/:id",
      //@ts-ignore
      async ({ jwt, cookie, params, body }) => {
        const decoded = await authorizeRequest(jwt, cookie);
        const updated = await alarmService.updateAlarm(params.id, decoded.sub, body);
        if (!updated) {
          return new Response("Gagal mengupdate data alarm.", { status: 400 });
        }
        return new Response(
          JSON.stringify({
            message: "Berhasil mengupdate data alarm.",
            id: params.id,
          }),
          { status: 200 }
        );
      },
      putAlarmSchema
    )

    // ❌ DELETE Alarm
    .delete(
      "/:id",
      //@ts-ignore
      async ({ jwt, cookie, params }) => {
        const decoded = await authorizeRequest(jwt, cookie);
        const deleted = await alarmService.deleteAlarm(params.id, decoded.sub);
        if (!deleted) {
          return new Response("Gagal menghapus data alarm.", { status: 400 });
        }
        return new Response(
          JSON.stringify({ message: "Berhasil menghapus data alarm." }),
          { status: 200 }
        );
      },
      deleteAlarmSchema
    );
}
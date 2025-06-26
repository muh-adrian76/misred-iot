// routes/alarm.ts
import { Elysia } from "elysia";
import { authorizeRequest } from "../../lib/utils";
import { AlarmService } from "../../services/AlarmService";
import {
  deleteAlarmSchema,
  getAlarmByDeviceIdSchema,
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
        const { name, device_id, operator, threshold, sensor } = body;
        const insertId = await alarmService.createAlarm({ name, device_id, operator, threshold, sensor });
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

    // 📄 READ Semua Alarm
    .get(
      "/all",
      //@ts-ignore
      async ({ jwt, cookie }) => {
        await authorizeRequest(jwt, cookie);
        const data = await alarmService.getAllAlarms();
        return new Response(JSON.stringify({ result: data }), { status: 200 });
      },
      getAllAlarmsSchema
    )

    // 📄 READ Alarm by Device ID
    .get(
      "/:device_id",
      //@ts-ignore
      async ({ jwt, cookie, params }) => {
        await authorizeRequest(jwt, cookie);
        const data = await alarmService.getAlarmsByDeviceId(params.device_id);
        return new Response(JSON.stringify({ result: data }), { status: 200 });
      },
      getAlarmByDeviceIdSchema
    )

    // ✏️ UPDATE Alarm
    .put(
      "/:id",
      //@ts-ignore
      async ({ jwt, cookie, params, body }) => {
        await authorizeRequest(jwt, cookie);
        const updated = await alarmService.updateAlarm(params.id, body);
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
        await authorizeRequest(jwt, cookie);
        const deleted = await alarmService.deleteAlarm(params.id);
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

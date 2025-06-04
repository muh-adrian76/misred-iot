// routes/widget.ts
import { Elysia } from "elysia";
import { authorizeRequest } from "../../lib/utils";
import { WidgetService } from "../../services/WidgetService";
import {
  deleteWidgetSchema,
  getAllWidgetsSchema,
  getWidgetByDeviceIdSchema,
  postWidgetSchema,
  putWidgetSchema,
} from "./elysiaSchema";

export function widgetRoutes(widgetService: WidgetService) {
  return new Elysia({ prefix: "/widget" })

    // CREATE Widget
    .post(
      "/",
      //@ts-ignore
      async ({ jwt, cookie, body }) => {
        await authorizeRequest(jwt, cookie.auth);
        const { description, device_id, sensor_type } = body;
        const insertId = await widgetService.createWidget({ description, device_id, sensor_type });
        return new Response(
          JSON.stringify({
            message: "Berhasil menambah data widget",
            id: insertId,
          }),
          { status: 201 }
        );
      },
      postWidgetSchema
    )

    // READ Semua Widget
    .get(
      "/all",
      //@ts-ignore
      async ({ jwt, cookie }) => {
        await authorizeRequest(jwt, cookie.auth);
        const data = await widgetService.getAllWidgets();
        return new Response(JSON.stringify({ result: data }), { status: 200 });
      },
      getAllWidgetsSchema
    )

    // READ Widget by Device ID
    .get(
      "/:device_id",
      //@ts-ignore
      async ({ jwt, cookie, params }) => {
        await authorizeRequest(jwt, cookie.auth);
        const data = await widgetService.getWidgetsByDeviceId(params.device_id);
        return new Response(JSON.stringify({ result: data }), { status: 200 });
      },
      getWidgetByDeviceIdSchema
    )

    // UPDATE Widget
    .put(
      "/:id",
      //@ts-ignore
      async ({ jwt, cookie, params, body }) => {
        await authorizeRequest(jwt, cookie.auth);
        const updated = await widgetService.updateWidget(params.id, body);
        if (!updated) {
          return new Response("Gagal mengupdate data widget.", { status: 400 });
        }
        return new Response(
          JSON.stringify({ message: "Berhasil mengupdate data widget." }),
          { status: 200 }
        );
      },
      putWidgetSchema
    )

    // DELETE Widget
    .delete(
      "/:id",
      //@ts-ignore
      async ({ jwt, cookie, params }) => {
        await authorizeRequest(jwt, cookie.auth);
        const deleted = await widgetService.deleteWidget(params.id);
        if (!deleted) {
          return new Response("Gagal menghapus data widget.", { status: 400 });
        }
        return new Response(
          JSON.stringify({ message: "Berhasil menghapus data widget." }),
          { status: 200 }
        );
      },
      deleteWidgetSchema
    );
}

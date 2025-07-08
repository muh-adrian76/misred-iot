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
  return (
    new Elysia({ prefix: "/widget" })

      // CREATE Widget
      .post(
        "/",
        //@ts-ignore
        async ({ jwt, cookie, body }) => {
          await authorizeRequest(jwt, cookie);
          const {
            description,
            dashboard_id,
            device_id,
            datastream_id,
            type,
            layout,
          } = body;
          const insertId = await widgetService.createWidget({
            description,
            dashboard_id,
            device_id,
            datastream_id,
            type,
            layout,
          });
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

      // READ Semua Widget by Dashboard ID
      .get(
        "/dashboard/:dashboardId",
        //@ts-ignore
        async ({ jwt, cookie, params }) => {
          await authorizeRequest(jwt, cookie);
          const widgets = await widgetService.getWidgetsByDashboardId(
            params.dashboardId
          );
          return new Response(JSON.stringify({ result: widgets }), {
            status: 200,
          });
        },
        getAllWidgetsSchema
      )

      // READ Widget by Device ID
      .get(
        "/:device_id",
        //@ts-ignore
        async ({ jwt, cookie, params }) => {
          await authorizeRequest(jwt, cookie);
          const data = await widgetService.getWidgetsByDeviceId(
            params.device_id
          );
          return new Response(JSON.stringify({ result: data }), {
            status: 200,
          });
        },
        getWidgetByDeviceIdSchema
      )

      // UPDATE Widget
      .put(
        "/:id",
        //@ts-ignore
        async ({ jwt, cookie, params, body }) => {
          await authorizeRequest(jwt, cookie);
          const updated = await widgetService.updateWidget(params.id, body);
          if (!updated) {
            return new Response("Gagal mengupdate data widget.", {
              status: 400,
            });
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
          await authorizeRequest(jwt, cookie);
          const deleted = await widgetService.deleteWidget(params.id);
          if (!deleted) {
            return new Response("Gagal menghapus data widget.", {
              status: 400,
            });
          }
          return new Response(
            JSON.stringify({ message: "Berhasil menghapus data widget." }),
            { status: 200 }
          );
        },
        deleteWidgetSchema
      )
  );
}

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
            dashboard_id,
            type,
            description,
            device_id,
            datastream_id,
            datastream_ids,
            inputs
          } = body;
          if (!dashboard_id || !type || !description) {
            return new Response(JSON.stringify({ message: "Input tidak valid" }), { status: 400 });
          }
          
          // Validate that either inputs, datastream_ids, or old format is provided
          if (!inputs && !datastream_ids && (!device_id || !datastream_id)) {
            return new Response(JSON.stringify({ message: "Device dan datastream harus dipilih" }), { status: 400 });
          }
          
          const insertId = await widgetService.createWidget({
            dashboard_id,
            type,
            description,
            device_id,
            datastream_id,
            datastream_ids,
            inputs,
          });
          return new Response(
            JSON.stringify({ result: { id: insertId } }),
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
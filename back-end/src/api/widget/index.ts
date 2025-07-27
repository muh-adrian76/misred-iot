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
        async ({ jwt, cookie, body, set }) => {
          try {
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
              { status: 200 }
            );
          } catch (error: any) {
            console.error("Error in create widget:", error);
            
            // Check if it's an authentication error from authorizeRequest
            if (error.message && error.message.includes('Unauthorized')) {
              console.error("❌ Authentication error:", error.message);
              return new Response(JSON.stringify({
                success: false,
                message: "Authentication failed"
              }), { status: 401 });
            }
            
            // Handle other errors
            return new Response(JSON.stringify({
              success: false,
              message: "Internal server error"
            }), { status: 500 });
          }
        },
        postWidgetSchema
      )

      // READ Semua Widget by Dashboard ID
      .get(
        "/dashboard/:dashboardId",
        //@ts-ignore
        async ({ jwt, cookie, params, set }) => {
          try {
            await authorizeRequest(jwt, cookie);
            const widgets = await widgetService.getWidgetsByDashboardId(
              params.dashboardId
            );
            return new Response(JSON.stringify({ result: widgets }), {
              status: 200,
            });
          } catch (error: any) {
            console.error("Error in get widgets by dashboard:", error);
            
            // Check if it's an authentication error from authorizeRequest
            if (error.message && error.message.includes('Unauthorized')) {
              console.error("❌ Authentication error:", error.message);
              set.status = 401;
              return {
                success: false,
                message: "Authentication failed",
                result: []
              };
            }
            
            // Handle other errors
            set.status = 500;
            return {
              success: false,
              message: "Internal server error",
              result: []
            };
          }
        },
        getAllWidgetsSchema
      )

      // READ Widget by Device ID
      .get(
        "/:device_id",
        //@ts-ignore
        async ({ jwt, cookie, params, set }) => {
          try {
            await authorizeRequest(jwt, cookie);
            const data = await widgetService.getWidgetsByDeviceId(
              params.device_id
            );
            return new Response(JSON.stringify({ result: data }), {
              status: 200,
            });
          } catch (error: any) {
            console.error("Error in get widgets by device ID:", error);
            
            // Check if it's an authentication error from authorizeRequest
            if (error.message && error.message.includes('Unauthorized')) {
              console.error("❌ Authentication error:", error.message);
              set.status = 401;
              return {
                success: false,
                message: "Authentication failed",
                result: []
              };
            }
            
            // Handle other errors
            set.status = 500;
            return {
              success: false,
              message: "Internal server error",
              result: []
            };
          }
        },
        getWidgetByDeviceIdSchema
      )

      // UPDATE Widget
      .put(
        "/:id",
        //@ts-ignore
        async ({ jwt, cookie, params, body, set }) => {
          try {
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
          } catch (error: any) {
            console.error("Error in update widget:", error);
            
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
        putWidgetSchema
      )

      // DELETE Widget
      .delete(
        "/:id",
        //@ts-ignore
        async ({ jwt, cookie, params, set }) => {
          try {
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
          } catch (error: any) {
            console.error("Error in delete widget:", error);
            
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
        deleteWidgetSchema
      )
  );
}
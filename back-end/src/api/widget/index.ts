/**
 * ===== WIDGET API ROUTES - ENDPOINT MANAJEMEN WIDGET DASHBOARD =====
 * File ini mengatur CRUD operations untuk widget di dashboard IoT
 * Meliputi: create widget, get by dashboard/device, update, delete widget
 */

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

      // ===== CREATE WIDGET ENDPOINT =====
      // POST /widget - Buat widget baru untuk dashboard
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
            
            // Validasi bahwa inputs, datastream_ids, atau format lama tersedia
            if (!inputs && !datastream_ids && (!device_id || !datastream_id)) {
              return new Response(JSON.stringify({ message: "Device dan datastream harus dipilih" }), { status: 400 });
            }
            
            // Buat widget baru dengan konfigurasi yang diberikan
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
            
            // Handle authentication error dari authorizeRequest
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
              message: error.message || "Internal server error"
            }), { status: 500 });
          }
        },
        postWidgetSchema
      )

      // ===== GET WIDGETS BY DASHBOARD ENDPOINT =====
      // GET /widget/dashboard/:dashboardId - Ambil semua widget dalam dashboard
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
            
            // Handle authentication error dari authorizeRequest
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

      // ===== GET WIDGETS BY DEVICE ENDPOINT =====
      // GET /widget/:device_id - Ambil widget berdasarkan device ID
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
            
            // Handle authentication error dari authorizeRequest
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

      // ===== UPDATE WIDGET ENDPOINT =====
      // PUT /widget/:id - Update konfigurasi widget yang ada
      .put(
        "/:id",
        //@ts-ignore
        async ({ jwt, cookie, params, body, set }) => {
          try {
            await authorizeRequest(jwt, cookie);
            
            // Update widget dengan data baru
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
            
            // Handle authentication error dari authorizeRequest
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

      // ===== DELETE WIDGET ENDPOINT =====
      // DELETE /widget/:id - Hapus widget berdasarkan ID
      .delete(
        "/:id",
        //@ts-ignore
        async ({ jwt, cookie, params, set }) => {
          try {
            await authorizeRequest(jwt, cookie);
            
            // Hapus widget dari database
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
            
            // Handle authentication error dari authorizeRequest
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
import { Elysia } from "elysia";
import { authorizeRequest } from "../../lib/utils";
import { DashboardService } from "../../services/DashboardService";
import {
  getAllDashboardsSchema,
  postDashboardSchema,
  deleteDashboardSchema,
  putDashboardSchema,
} from "./elysiaSchema";

export function dashboardRoutes(dashboardService: DashboardService) {
  return (
    new Elysia({ prefix: "/dashboard" })
      // Get user dashboards
      .get(
        "/",
        //@ts-ignore
        async ({ jwt, cookie, set }) => {
          try {
            const decoded = await authorizeRequest(jwt, cookie);
            const dashboards = await dashboardService.getDashboardsByUserId(
              decoded.sub
            );
            return new Response(JSON.stringify({ result: dashboards }), {
              status: 200,
            });
          } catch (error: any) {
            console.error("Error in get dashboards:", error);
            
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
        getAllDashboardsSchema
      )

      // Create dashboard
      .post(
        "/",
        //@ts-ignore
        async ({ jwt, cookie, body, set }) => {
          try {
            const decoded = await authorizeRequest(jwt, cookie);
            //@ts-ignore
            const { description, widget_count, layout } = body;

            if (!description || description.trim() === "") {
              return new Response(
                JSON.stringify({ message: "Nama dashboard tidak boleh kosong" }),
                { status: 400 }
              );
            }

            const dashboardId = await dashboardService.createDashboard(
              decoded.sub,
              description,
              widget_count,
              layout
            );

            if (!dashboardId) {
              return new Response("Dashboard gagal dibuat", { status: 400 });
            }

            return new Response(
              JSON.stringify({
                message: "Dashboard berhasil dibuat",
                id: dashboardId,
              }),
              { status: 200 }
            );
          } catch (error: any) {
            console.error("Error in create dashboard:", error);
            
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
        postDashboardSchema
      )

      // Update dashboard description/layout
      .put(
        "/:id",
        //@ts-ignore
        async ({ jwt, cookie, params, body, set }) => {
          try {
            const decoded = await authorizeRequest(jwt, cookie);
            //@ts-ignore
            const { description, widget_count, layout } = body;
            if (!description || description.trim() === "") {
              return new Response(
                JSON.stringify({ message: "Nama dashboard tidak boleh kosong" }),
                { status: 400 }
              );
            }
            const updated = await dashboardService.updateDashboard(
              decoded.sub,
              params.id,
              description,
              widget_count,
              layout
            );
            if (!updated) {
              return new Response("Dashboard gagal diubah", { status: 400 });
            }
            return new Response(
              JSON.stringify({ message: "Dashboard berhasil diubah" }),
              { status: 200 }
            );
          } catch (error: any) {
            console.error("Error in update dashboard:", error);
            
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
        putDashboardSchema
      )
      // Delete dashboard
      .delete(
        "/:id",
        //@ts-ignore
        async ({ jwt, cookie, params, set }) => {
          try {
            const decoded = await authorizeRequest(jwt, cookie);
            const deleted = await dashboardService.deleteDashboard(
              decoded.sub,
              params.id
            );
            if (!deleted) {
              return new Response("Dashboard gagal dihapus", { status: 400 });
            }
            return new Response(
              JSON.stringify({ message: "Dashboard berhasil dihapus" }),
              { status: 200 }
            );
          } catch (error: any) {
            console.error("Error in delete dashboard:", error);
            
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
        deleteDashboardSchema
      )
  );
}
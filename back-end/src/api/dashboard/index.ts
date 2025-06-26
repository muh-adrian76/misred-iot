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
        async ({ jwt, cookie }) => {
          const decoded = await authorizeRequest(jwt, cookie);
          const dashboards = await dashboardService.getDashboardsByUserId(
            decoded.sub
          );
          return new Response(JSON.stringify({ result: dashboards }), {
            status: 200,
          });
        },
        getAllDashboardsSchema
      )

      // Create dashboard
      .post(
        "/",
        //@ts-ignore
        async ({ jwt, cookie, body }) => {
          const decoded = await authorizeRequest(jwt, cookie);
          const { description } = body;

          if (!description || description.trim() === "") {
            return new Response(
              JSON.stringify({ message: "Nama dashboard tidak boleh kosong" }),
              { status: 400 }
            );
          }

          const dashboardId = await dashboardService.createDashboard(
            decoded.sub,
            description
          );

          if (!dashboardId) {
            return new Response("Dashboard gagal dibuat", { status: 400 });
          }

          return new Response(
            JSON.stringify({
              message: "Dashboard berhasil dibuat",
              id: dashboardId,
            }),
            { status: 201 }
          );
        },
        postDashboardSchema
      )

      // Update dashboard description
      .put(
        "/:id",
        //@ts-ignore
        async ({ jwt, cookie, params, body }) => {
          const decoded = await authorizeRequest(jwt, cookie);
          const { description } = body;
          if (!description || description.trim() === "") {
            return new Response(
              JSON.stringify({ message: "Nama dashboard tidak boleh kosong" }),
              { status: 400 }
            );
          }
          const updated = await dashboardService.updateDashboard(
            decoded.sub,
            params.id,
            description
          );
          if (!updated) {
            return new Response("Dashboard gagal diubah", { status: 400 });
          }
          return new Response(
            JSON.stringify({ message: "Dashboard berhasil diubah" }),
            { status: 200 }
          );
        },
        putDashboardSchema
      )
      // Delete dashboard
      .delete(
        "/:id",
        //@ts-ignore
        async ({ jwt, cookie, params }) => {
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
        },
        deleteDashboardSchema
      )
  );
}

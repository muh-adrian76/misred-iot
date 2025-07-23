import { Elysia } from "elysia";
import { authorizeRequest } from "../../lib/utils";
import { AdminService } from "../../services/AdminService";
import { UserService } from "../../services/UserService";
import {
  getOverviewStatsSchema,
  getRecentUsersSchema,
  getDeviceLocationsSchema,
  putDeviceLocationSchema,
  getSystemHealthSchema,
  getAllUsersWithStatsSchema,
  getAllDevicesWithStatsSchema
} from "./elysiaSchema";

export function adminRoutes(adminService: AdminService, userService: UserService) {
  return new Elysia({ prefix: "/admin" })

    // Get overview statistics
    .get(
      "/stats/overview",
      // @ts-ignore
      async ({ jwt, cookie }) => {
        try {
          const decoded = await authorizeRequest(jwt, cookie);
          const adminUser = await userService.getUserById(decoded.sub);
          
          if (!adminUser?.is_admin) {
            return new Response(JSON.stringify({
              status: "error",
              message: "Unauthorized: Admin access required"
            }), { status: 403 });
          }

          const stats = await adminService.getOverviewStats();
          return {
            status: "success",
            data: stats
          };
        } catch (error) {
          console.error("Error getting overview stats:", error);
          return new Response(JSON.stringify({
            status: "error",
            message: "Gagal memuat statistik overview"
          }), { status: 500 });
        }
      },
      getOverviewStatsSchema
    )

    // Get recent users
    .get(
      "/stats/recent-users",
      // @ts-ignore
      async ({ jwt, cookie, query }) => {
        try {
          const decoded = await authorizeRequest(jwt, cookie);
          const adminUser = await userService.getUserById(decoded.sub);
          
          if (!adminUser?.is_admin) {
            return new Response(JSON.stringify({
              status: "error",
              message: "Unauthorized: Admin access required"
            }), { status: 403 });
          }

          const limit = query.limit ? parseInt(String(query.limit)) : 10;
          const users = await adminService.getRecentUsers(limit);
          return {
            status: "success",
            data: users
          };
        } catch (error) {
          console.error("Error getting recent users:", error);
          return new Response(JSON.stringify({
            status: "error",
            message: "Gagal memuat data users terbaru"
          }), { status: 500 });
        }
      },
      getRecentUsersSchema
    )

    // Get device locations for maps
    .get(
      "/devices/locations",
      // @ts-ignore
      async ({ jwt, cookie }) => {
        try {
          const decoded = await authorizeRequest(jwt, cookie);
          const adminUser = await userService.getUserById(decoded.sub);
          
          if (!adminUser?.is_admin) {
            return new Response(JSON.stringify({
              status: "error",
              message: "Unauthorized: Admin access required"
            }), { status: 403 });
          }

          const devices = await adminService.getDeviceLocations();
          return {
            status: "success",
            data: devices
          };
        } catch (error) {
          console.error("Error getting device locations:", error);
          return new Response(JSON.stringify({
            status: "error",
            message: "Gagal memuat lokasi devices"
          }), { status: 500 });
        }
      },
      getDeviceLocationsSchema
    )

    // Update device location
    .put(
      "/devices/:id/location",
      // @ts-ignore
      async ({ jwt, cookie, params, body }) => {
        try {
          const decoded = await authorizeRequest(jwt, cookie);
          const adminUser = await userService.getUserById(decoded.sub);
          
          if (!adminUser?.is_admin) {
            return new Response(JSON.stringify({
              status: "error",
              message: "Unauthorized: Admin access required"
            }), { status: 403 });
          }

          const deviceId = parseInt(String(params.id));
          const { latitude, longitude, address } = body as any;
          
          const updated = await adminService.updateDeviceLocation(deviceId, latitude, longitude, address);
          
          if (!updated) {
            return new Response(JSON.stringify({
              status: "error",
              message: "Device tidak ditemukan atau gagal diperbarui"
            }), { status: 400 });
          }
          
          return {
            status: "success",
            message: "Lokasi device berhasil diperbarui"
          };
        } catch (error) {
          console.error("Error updating device location:", error);
          return new Response(JSON.stringify({
            status: "error",
            message: "Gagal memperbarui lokasi device"
          }), { status: 500 });
        }
      },
      putDeviceLocationSchema
    )

    // Get system health
    .get(
      "/system/health",
      // @ts-ignore
      async ({ jwt, cookie }) => {
        try {
          const decoded = await authorizeRequest(jwt, cookie);
          const adminUser = await userService.getUserById(decoded.sub);
          
          if (!adminUser?.is_admin) {
            return new Response(JSON.stringify({
              status: "error",
              message: "Unauthorized: Admin access required"
            }), { status: 403 });
          }

          const health = await adminService.getSystemHealth();
          return {
            status: "success",
            data: health
          };
        } catch (error) {
          console.error("Error getting system health:", error);
          return new Response(JSON.stringify({
            status: "error",
            message: "Gagal memuat status sistem"
          }), { status: 500 });
        }
      },
      getSystemHealthSchema
    )

    // Get all users with statistics
    .get(
      "/users",
      // @ts-ignore
      async ({ jwt, cookie }) => {
        try {
          const decoded = await authorizeRequest(jwt, cookie);
          const adminUser = await userService.getUserById(decoded.sub);
          
          if (!adminUser?.is_admin) {
            return new Response(JSON.stringify({
              status: "error",
              message: "Unauthorized: Admin access required"
            }), { status: 403 });
          }

          const users = await adminService.getAllUsersWithStats();
          return {
            status: "success",
            data: users
          };
        } catch (error) {
          console.error("Error getting users with stats:", error);
          return new Response(JSON.stringify({
            status: "error",
            message: "Gagal memuat data users"
          }), { status: 500 });
        }
      },
      getAllUsersWithStatsSchema
    )

    // Get all devices with statistics
    .get(
      "/devices",
      // @ts-ignore
      async ({ jwt, cookie }) => {
        try {
          const decoded = await authorizeRequest(jwt, cookie);
          const adminUser = await userService.getUserById(decoded.sub);
          
          if (!adminUser?.is_admin) {
            return new Response(JSON.stringify({
              status: "error",
              message: "Unauthorized: Admin access required"
            }), { status: 403 });
          }

          const devices = await adminService.getAllDevicesWithStats();
          return {
            status: "success",
            data: devices
          };
        } catch (error) {
          console.error("Error getting devices with stats:", error);
          return new Response(JSON.stringify({
            status: "error",
            message: "Gagal memuat data devices"
          }), { status: 500 });
        }
      },
      getAllDevicesWithStatsSchema
    );
}

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
          // Jika stats ada recentUsers, format juga
          if (stats.recentUsers) {
            stats.recentUsers = stats.recentUsers.map((row) => ({
              ...row,
              is_admin: !!row.is_admin,
              created_at: typeof row.created_at === "string" ? row.created_at : new Date(row.created_at).toISOString()
            }));
          }
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
          // Format agar is_admin boolean dan created_at string ISO
          const formattedUsers = users.map((row) => ({
            ...row,
            is_admin: !!row.is_admin,
            created_at: typeof row.created_at === "string" ? row.created_at : new Date(row.created_at).toISOString()
          }));
          return {
            status: "success",
            data: formattedUsers
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
          
          // Format agar is_admin boolean dan created_at string ISO
          const formattedUsers = users.map((row) => ({
            ...row,
            is_admin: !!row.is_admin,
            whatsapp_notif: !!row.whatsapp_notif,
            onboarding_completed: !!row.onboarding_completed,
            created_at: typeof row.created_at === "string" ? row.created_at : new Date(row.created_at).toISOString(),
            last_login: row.last_login ? (typeof row.last_login === "string" ? row.last_login : new Date(row.last_login).toISOString()) : null
          }));
          
          return {
            status: "success",
            data: formattedUsers
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
          // Format agar created_at dan last_data_time string ISO
          const formattedDevices = devices.map((row) => ({
            ...row,
            created_at: typeof row.created_at === "string" ? row.created_at : new Date(row.created_at).toISOString(),
            last_data_time: row.last_data_time ? (typeof row.last_data_time === "string" ? row.last_data_time : new Date(row.last_data_time).toISOString()) : null
          }));
          return {
            status: "success",
            data: formattedDevices
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
          // Format agar latitude/longitude number dan last_seen string
          const formattedDevices = devices.map((row) => ({
            ...row,
            latitude: row.latitude !== undefined ? Number(row.latitude) : undefined,
            longitude: row.longitude !== undefined ? Number(row.longitude) : undefined,
            last_seen: row.last_seen ? String(row.last_seen) : undefined
          }));
          return {
            status: "success",
            data: formattedDevices
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
          console.log("Received location update request:", { params, body });
          
          const decoded = await authorizeRequest(jwt, cookie);
          const adminUser = await userService.getUserById(decoded.sub);
          
          console.log("User authentication:", { userId: decoded.sub, isAdmin: adminUser?.is_admin });
          
          if (!adminUser?.is_admin) {
            console.log("Authorization failed: User is not admin");
            return new Response(JSON.stringify({
              status: "error",
              message: "Unauthorized: Admin access required"
            }), { status: 403 });
          }

          const deviceId = parseInt(String(params.id));
          const { latitude, longitude, address } = body as any;
          
          console.log("Parsed data:", { deviceId, latitude, longitude, address });
          
          // Validate input
          if (!deviceId || isNaN(deviceId)) {
            return new Response(JSON.stringify({
              status: "error",
              message: "ID device tidak valid"
            }), { status: 400 });
          }
          
          if (typeof latitude !== 'number' || typeof longitude !== 'number') {
            return new Response(JSON.stringify({
              status: "error",
              message: "Koordinat latitude dan longitude harus berupa angka"
            }), { status: 400 });
          }
          
          const updated = await adminService.updateDeviceLocation(deviceId, latitude, longitude, address);
          
          console.log("Update result:", { updated });
          
          if (!updated) {
            return new Response(JSON.stringify({
              status: "error",
              message: "Device tidak ditemukan atau gagal diperbarui"
            }), { status: 400 });
          }
          
          console.log("Location update successful for device:", deviceId);
          
          return {
            status: "success",
            message: "Lokasi device berhasil diperbarui"
          };
        } catch (error: any) {
          console.error("Error updating device location:", error);
          console.error("Error stack:", error.stack);
          return new Response(JSON.stringify({
            status: "error",
            message: "Gagal memperbarui lokasi device",
            error: error.message
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
    );
}

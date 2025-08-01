/**
 * ===== ADMIN MANAGEMENT API ROUTES - ENDPOINT ADMINISTRASI SISTEM IoT =====
 * File ini mengatur semua endpoint API untuk administrasi dan monitoring sistem
 * Meliputi: statistik overview, manajemen user/device, lokasi, sistem health
 */

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

    // ===== GET OVERVIEW STATISTICS ENDPOINT =====
    // GET /admin/stats/overview - Ambil statistik overview sistem (hanya admin)
    .get(
      "/stats/overview",
      // @ts-ignore
      async ({ jwt, cookie }) => {
        try {
          const decoded = await authorizeRequest(jwt, cookie);
          const adminUser = await userService.getUserById(decoded.sub);
          
          // Validasi akses admin
          if (!adminUser?.is_admin) {
            return new Response(JSON.stringify({
              status: "error",
              message: "Unauthorized: Admin access required"
            }), { status: 403 });
          }

          const stats = await adminService.getOverviewStats();
          // Format data recentUsers jika ada untuk konsistensi frontend
          if (stats.recentUsers) {
            stats.recentUsers = stats.recentUsers.map((row) => ({
              ...row,
              is_admin: !!row.is_admin, // Convert ke boolean
              created_at: typeof row.created_at === "string" ? row.created_at : new Date(row.created_at).toISOString()
            }));
          }
          return {
            status: "success",
            data: stats // Total users, devices, alarms, payload count, dsb
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

    // ===== GET RECENT USERS ENDPOINT =====
    // GET /admin/stats/recent-users - Ambil daftar user terbaru dengan limit (hanya admin)
    .get(
      "/stats/recent-users",
      // @ts-ignore
      async ({ jwt, cookie, query }) => {
        try {
          const decoded = await authorizeRequest(jwt, cookie);
          const adminUser = await userService.getUserById(decoded.sub);
          
          // Validasi akses admin
          if (!adminUser?.is_admin) {
            return new Response(JSON.stringify({
              status: "error",
              message: "Unauthorized: Admin access required"
            }), { status: 403 });
          }

          const limit = query.limit ? parseInt(String(query.limit)) : 10; // Default 10 user terbaru
          const users = await adminService.getRecentUsers(limit);
          // Format data untuk konsistensi frontend (boolean dan ISO timestamp)
          const formattedUsers = users.map((row) => ({
            ...row,
            is_admin: !!row.is_admin, // Convert ke boolean
            created_at: typeof row.created_at === "string" ? row.created_at : new Date(row.created_at).toISOString()
          }));
          return {
            status: "success",
            data: formattedUsers // Array user terbaru dengan metadata
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

    // ===== GET ALL USERS WITH STATISTICS ENDPOINT =====
    // GET /admin/users - Ambil semua user dengan statistik lengkap (hanya admin)
    .get(
      "/users",
      // @ts-ignore
      async ({ jwt, cookie }) => {
        try {
          const decoded = await authorizeRequest(jwt, cookie);
          const adminUser = await userService.getUserById(decoded.sub);
          
          // Validasi akses admin
          if (!adminUser?.is_admin) {
            return new Response(JSON.stringify({
              status: "error",
              message: "Unauthorized: Admin access required"
            }), { status: 403 });
          }

          const users = await adminService.getAllUsersWithStats();
          
          // Format data untuk konsistensi frontend (boolean types dan ISO timestamps)
          const formattedUsers = users.map((row) => ({
            ...row,
            is_admin: !!row.is_admin, // Convert ke boolean
            whatsapp_notif: !!row.whatsapp_notif, // Convert ke boolean
            onboarding_completed: !!row.onboarding_completed, // Convert ke boolean
            created_at: typeof row.created_at === "string" ? row.created_at : new Date(row.created_at).toISOString(),
            last_login: row.last_login ? (typeof row.last_login === "string" ? row.last_login : new Date(row.last_login).toISOString()) : null
          }));
          
          return {
            status: "success",
            data: formattedUsers // Array lengkap user dengan device count, alarm count, dsb
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

    // ===== GET ALL DEVICES WITH STATISTICS ENDPOINT =====
    // GET /admin/devices - Ambil semua device dengan statistik lengkap (hanya admin)
    .get(
      "/devices",
      // @ts-ignore
      async ({ jwt, cookie }) => {
        try {
          const decoded = await authorizeRequest(jwt, cookie);
          const adminUser = await userService.getUserById(decoded.sub);
          
          // Validasi akses admin
          if (!adminUser?.is_admin) {
            return new Response(JSON.stringify({
              status: "error",
              message: "Unauthorized: Admin access required"
            }), { status: 403 });
          }

          const devices = await adminService.getAllDevicesWithStats();
          // Format timestamps untuk konsistensi frontend (ISO string format)
          const formattedDevices = devices.map((row) => ({
            ...row,
            created_at: typeof row.created_at === "string" ? row.created_at : new Date(row.created_at).toISOString(),
            last_data_time: row.last_data_time ? (typeof row.last_data_time === "string" ? row.last_data_time : new Date(row.last_data_time).toISOString()) : null
          }));
          return {
            status: "success",
            data: formattedDevices // Array device dengan payload count, alarm count, owner info
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

    // ===== GET DEVICE LOCATIONS FOR MAPS ENDPOINT =====
    // GET /admin/devices/locations - Ambil lokasi semua device untuk maps (hanya admin)
    .get(
      "/devices/locations",
      // @ts-ignore
      async ({ jwt, cookie }) => {
        try {
          const decoded = await authorizeRequest(jwt, cookie);
          const adminUser = await userService.getUserById(decoded.sub);
          
          // Validasi akses admin
          if (!adminUser?.is_admin) {
            return new Response(JSON.stringify({
              status: "error",
              message: "Unauthorized: Admin access required"
            }), { status: 403 });
          }

          const devices = await adminService.getDeviceLocations();
          // Format koordinat dan timestamp untuk mapping/GIS
          const formattedDevices = devices.map((row) => ({
            ...row,
            latitude: row.latitude !== undefined ? Number(row.latitude) : undefined, // Ensure number type
            longitude: row.longitude !== undefined ? Number(row.longitude) : undefined, // Ensure number type
            last_seen: row.last_seen ? String(row.last_seen) : undefined // String timestamp
          }));
          return {
            status: "success",
            data: formattedDevices // Array device dengan koordinat untuk maps
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

    // ===== UPDATE DEVICE LOCATION ENDPOINT =====
    // PUT /admin/devices/:id/location - Update lokasi device untuk admin GIS management
    .put(
      "/devices/:id/location",
      // @ts-ignore
      async ({ jwt, cookie, params, body }) => {
        try {
          console.log("Received location update request:", { params, body });
          
          const decoded = await authorizeRequest(jwt, cookie);
          const adminUser = await userService.getUserById(decoded.sub);
          
          console.log("User authentication:", { userId: decoded.sub, isAdmin: adminUser?.is_admin });
          
          // Validasi akses admin
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
          
          // Validasi input data
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

    // ===== GET SYSTEM HEALTH ENDPOINT =====
    // GET /admin/system/health - Monitoring kesehatan sistem IoT (hanya admin)
    .get(
      "/system/health",
      // @ts-ignore
      async ({ jwt, cookie }) => {
        try {
          const decoded = await authorizeRequest(jwt, cookie);
          const adminUser = await userService.getUserById(decoded.sub);
          
          // Validasi akses admin
          if (!adminUser?.is_admin) {
            return new Response(JSON.stringify({
              status: "error",
              message: "Unauthorized: Admin access required"
            }), { status: 403 });
          }

          const health = await adminService.getSystemHealth();
          return {
            status: "success",
            data: health // Database status, server uptime, service status, dsb
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

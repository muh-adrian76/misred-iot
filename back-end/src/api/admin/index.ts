/**
 * ===== ADMIN MANAGEMENT API ROUTES - ENDPOINT ADMINISTRASI SISTEM IoT =====
 * File ini mengatur semua endpoint API untuk administrasi dan monitoring sistem
 * Meliputi: statistik overview, manajemen user/device, lokasi, sistem health
 */

import { Elysia } from "elysia";
import { authorizeRequest } from "../../lib/utils";
import { AdminService } from "../../services/AdminService";
import { UserService } from "../../services/UserService";
import { OtaaUpdateService } from "../../services/OtaaUpdateService";
import {
  getOverviewStatsSchema,
  getRecentUsersSchema,
  getDeviceLocationsSchema,
  putDeviceLocationSchema,
  getSystemHealthSchema,
  getAllUsersWithStatsSchema,
  getAllDevicesWithStatsSchema
} from "./elysiaSchema";

export function adminRoutes(adminService: AdminService, userService: UserService, otaaService: OtaaUpdateService) {
  
  /**
   * Kirim notifikasi firmware baru ke semua user yang memiliki device dengan board type tertentu
   */
  async function sendFirmwareUpdateNotifications(affectedUsers: any[], boardType: string, firmwareVersion: string, service: OtaaUpdateService) {
    try {
      const title = `🔄 Firmware Terbaru Tersedia`;
      const message = `Admin telah mengunggah firmware baru untuk board ${boardType} versi ${firmwareVersion}.\nSilakan cek halaman OTAA Update untuk mengunduh firmware terbaru.\nWaktu: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB`;

      // Akses database melalui method publik service
      const db = service.getDatabase();

      for (const user of affectedUsers) {
        await db.execute(
          `INSERT INTO notifications (type, title, message, priority, user_id, triggered_at, is_read) 
           VALUES (?, ?, ?, ?, ?, NOW(), FALSE)`,
          [
            'firmware_update',
            title,
            message,
            'low', // Prioritas rendah untuk firmware update
            user.user_id
          ]
        );

        // Broadcast notifikasi real-time via WebSocket (opsional)
        try {
          const { broadcastToSpecificUser } = await import('../ws/user-ws');
          broadcastToSpecificUser(user.user_id.toString(), {
            type: 'notification',
            notification_type: 'firmware_update',
            title,
            message,
            priority: 'low',
            board_type: boardType,
            firmware_version: firmwareVersion,
            timestamp: new Date().toISOString()
          });
        } catch (wsError: any) {
          // WebSocket broadcast bersifat opsional
          console.log(`WebSocket broadcast dilewati untuk user ${user.user_id}:`, wsError?.message || "Unknown error");
        }
      }

      console.log(`📦 Notifikasi firmware update dikirim ke ${affectedUsers.length} user untuk board type ${boardType}`);
    } catch (error) {
      console.error("Terjadi kesalahan saat mengirim notifikasi firmware:", error);
    }
  }

  return new Elysia({ prefix: "/admin" })

    // ===== ENDPOINT STATISTIK OVERVIEW =====
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
              message: "Tidak terotorisasi: Akses admin diperlukan"
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
          console.error("Terjadi kesalahan saat mengambil statistik overview:", error);
          return new Response(JSON.stringify({
            status: "error",
            message: "Gagal memuat statistik overview"
          }), { status: 500 });
        }
      },
      getOverviewStatsSchema
    )

    // ===== ENDPOINT PENGGUNA TERBARU =====
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
              message: "Tidak terotorisasi: Akses admin diperlukan"
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
          console.error("Terjadi kesalahan saat mengambil pengguna terbaru:", error);
          return new Response(JSON.stringify({
            status: "error",
            message: "Gagal memuat data users terbaru"
          }), { status: 500 });
        }
      },
      getRecentUsersSchema
    )

    // ===== ENDPOINT SEMUA PENGGUNA DENGAN STATISTIK =====
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
              message: "Tidak terotorisasi: Akses admin diperlukan"
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
          console.error("Terjadi kesalahan saat mengambil pengguna beserta statistik:", error);
          return new Response(JSON.stringify({
            status: "error",
            message: "Gagal memuat data users"
          }), { status: 500 });
        }
      },
      getAllUsersWithStatsSchema
    )

    // ===== ENDPOINT SEMUA DEVICE DENGAN STATISTIK =====
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
              message: "Tidak terotorisasi: Akses admin diperlukan"
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
          console.error("Terjadi kesalahan saat mengambil device beserta statistik:", error);
          return new Response(JSON.stringify({
            status: "error",
            message: "Gagal memuat data devices"
          }), { status: 500 });
        }
      },
      getAllDevicesWithStatsSchema
    )

    // ===== ENDPOINT LOKASI DEVICE UNTUK PETA =====
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
              message: "Tidak terotorisasi: Akses admin diperlukan"
            }), { status: 403 });
          }

          const devices = await adminService.getDeviceLocations();
          // Format koordinat dan timestamp untuk mapping/GIS
          const formattedDevices = devices.map((row) => ({
            ...row,
            latitude: row.latitude !== undefined ? Number(row.latitude) : undefined, // Pastikan tipe number
            longitude: row.longitude !== undefined ? Number(row.longitude) : undefined, // Pastikan tipe number
            last_seen: row.last_seen ? String(row.last_seen) : undefined // String timestamp
          }));
          return {
            status: "success",
            data: formattedDevices // Array device dengan koordinat untuk maps
          };
        } catch (error) {
          console.error("Terjadi kesalahan saat mengambil lokasi device:", error);
          return new Response(JSON.stringify({
            status: "error",
            message: "Gagal memuat lokasi devices"
          }), { status: 500 });
        }
      },
      getDeviceLocationsSchema
    )

    // ===== ENDPOINT PERBARUI LOKASI DEVICE =====
    // PUT /admin/devices/:id/location - Update lokasi device untuk admin GIS management
    .put(
      "/devices/:id/location",
      // @ts-ignore
      async ({ jwt, cookie, params, body }) => {
        try {
          console.log("Menerima permintaan pembaruan lokasi:", { params, body });
          
          const decoded = await authorizeRequest(jwt, cookie);
          const adminUser = await userService.getUserById(decoded.sub);
          
          console.log("Autentikasi pengguna:", { userId: decoded.sub, isAdmin: adminUser?.is_admin });
          
          // Validasi akses admin
          if (!adminUser?.is_admin) {
            console.log("Otorisasi gagal: Bukan admin");
            return new Response(JSON.stringify({
              status: "error",
              message: "Tidak terotorisasi: Akses admin diperlukan"
            }), { status: 403 });
          }

          const deviceId = parseInt(String(params.id));
          const { latitude, longitude, address } = body as any;
          
          console.log("Data terurai:", { deviceId, latitude, longitude, address });
          
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
          
          console.log("Hasil pembaruan:", { updated });
          
          if (!updated) {
            return new Response(JSON.stringify({
              status: "error",
              message: "Device tidak ditemukan atau gagal diperbarui"
            }), { status: 400 });
          }
          
          console.log("Pembaruan lokasi berhasil untuk device:", deviceId);
          
          return {
            status: "success",
            message: "Lokasi device berhasil diperbarui"
          };
        } catch (error: any) {
          console.error("Terjadi kesalahan saat memperbarui lokasi device:", error);
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

    // ===== ENDPOINT SISTEM HEALTH =====
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
              message: "Tidak terotorisasi: Akses admin diperlukan"
            }), { status: 403 });
          }

          const health = await adminService.getSystemHealth();
          return {
            status: "success",
            data: health // Database status, server uptime, service status, dsb
          };
        } catch (error) {
          console.error("Terjadi kesalahan saat mengambil status sistem:", error);
          return new Response(JSON.stringify({
            status: "error",
            message: "Gagal memuat status sistem"
          }), { status: 500 });
        }
      },
      getSystemHealthSchema
    )

    // ===== ADMIN OTAA MANAGEMENT ENDPOINTS =====
    
    // GET /admin/otaa - Admin melihat semua firmware dari semua user
    .get(
      "/otaa",
      // @ts-ignore
      async ({ jwt, cookie }) => {
        try {
          const decoded = await authorizeRequest(jwt, cookie);
          const adminUser = await userService.getUserById(decoded.sub);
          
          // Validasi akses admin
          if (!adminUser?.is_admin) {
            return new Response(JSON.stringify({
              status: "error",
              message: "Tidak terotorisasi: Akses admin diperlukan"
            }), { status: 403 });
          }

          const firmwares = await otaaService.getAllFirmwaresForAdmin();
          return { success: true, data: firmwares };
        } catch (error: any) {
          console.error("Terjadi kesalahan saat mengambil semua firmware untuk admin:", error);
          return new Response(JSON.stringify({
            status: "error", 
            message: "Gagal mengambil data firmware",
            error: error.message
          }), { status: 500 });
        }
      }
    )

    // GET /admin/otaa/global - Admin melihat firmware global yang dikelompokkan berdasarkan board type
    .get(
      "/otaa/global",
      // @ts-ignore
      async ({ jwt, cookie }) => {
        try {
          const decoded = await authorizeRequest(jwt, cookie);
          const adminUser = await userService.getUserById(decoded.sub);
          
          // Validasi akses admin
          if (!adminUser?.is_admin) {
            return new Response(JSON.stringify({
              status: "error",
              message: "Tidak terotorisasi: Akses admin diperlukan"
            }), { status: 403 });
          }

          const globalFirmwares = await otaaService.getGlobalFirmwaresGroupedByBoard();
          return { success: true, data: globalFirmwares };
        } catch (error: any) {
          console.error("Terjadi kesalahan saat mengambil firmware global:", error);
          return new Response(JSON.stringify({
            status: "error", 
            message: "Gagal mengambil data firmware global",
            error: error.message
          }), { status: 500 });
        }
      }
    )

    // POST /admin/otaa - Admin upload firmware global untuk semua user
    .post(
      "/otaa",
      // @ts-ignore
      async ({ jwt, cookie, body }) => {
        try {
          const decoded = await authorizeRequest(jwt, cookie);
          const adminUser = await userService.getUserById(decoded.sub);
          
          // Validasi akses admin
          if (!adminUser?.is_admin) {
            return new Response(JSON.stringify({
              status: "error",
              message: "Tidak terotorisasi: Akses admin diperlukan"
            }), { status: 403 });
          }

          const { board_type, firmware_version, file } = body as any;

          if (!file) {
            return new Response(JSON.stringify({
              status: "error",
              message: "File firmware diperlukan"
            }), { status: 400 });
          }

          if (!board_type || !firmware_version) {
            return new Response(JSON.stringify({
              status: "error",
              message: "Board type dan versi firmware diperlukan"
            }), { status: 400 });
          }

          // Validasi file format
          const allowedExtensions = ['bin', 'hex'];
          const fileExtension = file.name?.split('.').pop()?.toLowerCase();
          if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
            return new Response(JSON.stringify({
              status: "error",
              message: "Format file tidak valid. Hanya file .bin dan .hex yang diizinkan"
            }), { status: 400 });
          }

          // Validasi ukuran file (10MB)
          if (file.size > 10 * 1024 * 1024) {
             return new Response(JSON.stringify({
              status: "error",
              message: "Ukuran file terlalu besar. Maksimal 10MB"
            }), { status: 400 });
          }

          // Generate unique filename untuk global firmware 
          const timestamp = Date.now();
          const filename = `global_${board_type}_${firmware_version}_${timestamp}.${fileExtension}`;
          const firmwarePath = `${process.cwd()}/src/assets/firmware/${filename}`;
          const firmwareUrl = `/public/firmware/${filename}`;

          // Pastikan direktori firmware ada
          const { existsSync, mkdirSync } = await import('fs');
          const path = await import('path');
          const firmwareDir = path.dirname(firmwarePath);
          if (!existsSync(firmwareDir)) {
            mkdirSync(firmwareDir, { recursive: true });
          }

          // Simpan file firmware
          await Bun.write(firmwarePath, file);

          // Hitung ukuran file dan checksum
          const fileStats = await import('fs').then(fs => fs.statSync(firmwarePath));
          const fileSize = fileStats.size;
          
          const crypto = await import('crypto');
          const fileBuffer = await Bun.file(firmwarePath).arrayBuffer();
          const checksum = crypto.createHash('sha256').update(Buffer.from(fileBuffer)).digest('hex');

          // Simpan ke database sebagai global firmware (user_id = 0)  
          const firmwareId = await otaaService.createGlobalFirmwareWithVersioning({
            board_type,
            firmware_version,  
            firmware_url: firmwareUrl,
            file_size: fileSize,
            original_filename: file.name,
            checksum: checksum,
            description: `Global firmware untuk ${board_type} v${firmware_version}`,
          });

          // Dapatkan user yang memiliki device dengan board type ini
          const affectedUsers = await otaaService.getUsersWithBoardType(board_type);

          // Kirim notifikasi firmware baru ke user yang terdampak
          if (Array.isArray(affectedUsers) && affectedUsers.length > 0) {
            await sendFirmwareUpdateNotifications(
              affectedUsers, 
              board_type, 
              firmware_version,
              otaaService
            );
          }

          return {
            success: true,
            message: "Firmware global berhasil diupload",
            data: {
              firmware_id: firmwareId,
              affected_users: Array.isArray(affectedUsers) ? affectedUsers.length : 0,
              board_type,
              firmware_version,
              filename
            }
          };

        } catch (error: any) {
          console.error("Terjadi kesalahan saat mengunggah firmware global:", error);
          return new Response(JSON.stringify({
            status: "error",
            message: "Gagal mengupload firmware global",
            error: error.message
          }), { status: 500 });
        }
      }
    )

    // DELETE /admin/otaa/:id - Admin menghapus firmware user mana pun
    .delete(
      "/otaa/:id",
      // @ts-ignore
      async ({ jwt, cookie, params }) => {
        try {
          const decoded = await authorizeRequest(jwt, cookie);
          const adminUser = await userService.getUserById(decoded.sub);
          
          // Validasi akses admin
          if (!adminUser?.is_admin) {
            return new Response(JSON.stringify({
              status: "error",
              message: "Tidak terotorisasi: Akses admin diperlukan"
            }), { status: 403 });
          }

          // Untuk admin, tidak perlu validasi user_id saat delete
          // Ambil firmware info dulu untuk mendapatkan user_id
          const firmwareInfo = await otaaService.getFirmwareById(parseInt(params.id));

          if (!firmwareInfo) {
            return new Response(JSON.stringify({
              status: "error",
              message: "Firmware tidak ditemukan"
            }), { status: 404 });
          }

          const success = await otaaService.deleteFirmware(params.id, firmwareInfo.user_id);
          
          if (success) {
            return { success: true, message: "Firmware berhasil dihapus" };
          } else {
            return new Response(JSON.stringify({
              status: "error",
              message: "Gagal menghapus firmware"
            }), { status: 500 });
          }
        } catch (error: any) {
          console.error("Terjadi kesalahan saat menghapus firmware (admin):", error);
          return new Response(JSON.stringify({
            status: "error",
            message: "Gagal menghapus firmware",
            error: error.message
          }), { status: 500 });
        }
      }
    );
}

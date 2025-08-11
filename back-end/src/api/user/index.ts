/**
 * ===== USER MANAGEMENT API ROUTES - ENDPOINT MANAJEMEN USER IoT =====
 * File ini mengatur semua endpoint API untuk manajemen user dan profile
 * Meliputi: CRUD operations user, profile update, WhatsApp notifications, onboarding progress
 */

import { Elysia } from "elysia";
import { authorizeRequest } from "../../lib/utils";
import { UserService } from "../../services/UserService";
import {
  getAllUsersSchema,
  getUserByIdSchema,
  putUserSchema,
  deleteUserSchema,
} from "./elysiaSchema";

export function userRoutes(userService: UserService) {
  return (
    new Elysia({ prefix: "/user" })

      // ===== GET ALL USERS ENDPOINT =====
      // GET /user - Ambil semua user (untuk admin atau referensi sistem)
      .get(
        "",
        // @ts-ignore
        async ({ jwt, cookie, set }) => {
          try {
            await authorizeRequest(jwt, cookie.auth); // Verifikasi autentikasi
            const users = await userService.getAllUsers();
            return { status: "success", data: users };
          } catch (error: any) {
            console.error("Kesalahan saat mengambil semua pengguna:", error);

            // Tangani error autentikasi dari authorizeRequest
            if (error.message && error.message.includes("Unauthorized")) {
              console.error("❌ Kesalahan autentikasi:", error.message);
              set.status = 401;
              return {
                success: false,
                message: "Autentikasi gagal",
                data: [],
              };
            }

            // Tangani error lain
            set.status = 500;
            return {
              success: false,
              message: "Terjadi kesalahan pada server",
              data: [],
            };
          }
        },
        getAllUsersSchema
      )

      // ===== GET USER BY ID ENDPOINT =====
      // GET /user/:id - Ambil detail user berdasarkan ID
      .get(
        "/:id",
        // @ts-ignore
        async ({ jwt, cookie, params, set }) => {
          try {
            await authorizeRequest(jwt, cookie); // Verifikasi autentikasi
            const user = await userService.getUserById(params.id);
            if (!user) {
              return new Response("User tidak ditemukan", { status: 404 });
            }
            return user; // Kembalikan detail user tanpa data sensitif
          } catch (error: any) {
            console.error("Kesalahan saat mengambil pengguna berdasarkan ID:", error);

            // Tangani error autentikasi dari authorizeRequest
            if (error.message && error.message.includes("Unauthorized")) {
              console.error("❌ Kesalahan autentikasi:", error.message);
              set.status = 401;
              return {
                success: false,
                message: "Autentikasi gagal",
              };
            }

            // Tangani error lain
            set.status = 500;
            return {
              success: false,
              message: "Terjadi kesalahan pada server",
            };
          }
        },
        getUserByIdSchema
      )

      // ===== ADMIN: PERBARUI USER BERDASARKAN ID =====
      .put(
        "/:id",
        // @ts-ignore
        async ({ jwt, cookie, params, body, set }) => {
          try {
            const decoded = await authorizeRequest(jwt, cookie);

            // Cek apakah user adalah admin
            const adminUser = await userService.getUserById(decoded.sub);
            if (!adminUser?.is_admin) {
              return new Response(
                JSON.stringify({
                  status: "error",
                  message: "Tidak diizinkan: Akses admin diperlukan",
                }),
                { status: 403 }
              );
            }

            const { name, email, is_admin } = body as any;
            const updated = await userService.updateUserAdmin(params.id, {
              name,
              email,
              is_admin,
            });
            if (!updated) {
              return {
                status: "error",
                message: "User gagal diperbarui",
              };
            }
            return {
              message: "User berhasil diperbarui",
              id: params.id.toString(),
            };
          } catch (error: any) {
            console.error("Kesalahan saat memperbarui pengguna (admin):", error);

            // Periksa apakah error autentikasi dari authorizeRequest
            if (error.message && error.message.includes("Unauthorized")) {
              console.error("❌ Kesalahan autentikasi:", error.message);
              set.status = 401;
              return {
                success: false,
                message: "Autentikasi gagal",
              };
            }

            // Tangani error lain
            return new Response(
              JSON.stringify({
                success: false,
                message: error.message || "Terjadi kesalahan pada server",
              }),
              { status: 500 }
            );
          }
        },
        putUserSchema
      )

      // ===== ADMIN: HAPUS USER BERDASARKAN ID =====
      .delete(
        "/:id",
        // @ts-ignore
        async ({ jwt, cookie, params, set }) => {
          try {
            const decoded = await authorizeRequest(jwt, cookie);

            // Cek apakah user adalah admin
            const adminUser = await userService.getUserById(decoded.sub);
            if (!adminUser?.is_admin) {
              return new Response(
                JSON.stringify({
                  status: "error",
                  message: "Tidak diizinkan: Akses admin diperlukan",
                }),
                { status: 403 }
              );
            }

            const deleted = await userService.deleteUser(params.id);
            if (!deleted) {
              return {
                status: "error",
                message: "User gagal dihapus",
              };
            }
            return {
              message: "User berhasil dihapus",
            };
          } catch (error: any) {
            console.error("Kesalahan saat menghapus pengguna (admin):", error);

            // Periksa apakah error autentikasi dari authorizeRequest
            if (error.message && error.message.includes("Unauthorized")) {
              console.error("❌ Kesalahan autentikasi:", error.message);
              set.status = 401;
              return {
                success: false,
                message: "Autentikasi gagal",
              };
            }

            // Tangani error lain
            return new Response(
              JSON.stringify({
                success: false,
                message: error.message || "Terjadi kesalahan pada server",
              }),
              { status: 500 }
            );
          }
        },
        deleteUserSchema
      )

      // ===== USER: PERBARUI PROFIL SENDIRI =====
      .put(
        "/",
        // @ts-ignore
        async ({ jwt, cookie, body, set }) => {
          try {
            const decoded = await authorizeRequest(jwt, cookie);
            const { name, phone, whatsapp_notif } = body;
            const phoneNumber = phone ?? "";

            const updatedUser = await userService.updateUser(
              decoded.sub,
              name,
              phoneNumber,
              whatsapp_notif
            );
            if (!updatedUser) {
              return new Response("User gagal diperbarui", { status: 400 });
            }
            return new Response(JSON.stringify(updatedUser), { status: 200 });
          } catch (error: any) {
            console.error("Kesalahan saat memperbarui profil sendiri:", error);

            // Periksa apakah error autentikasi dari authorizeRequest
            if (error.message && error.message.includes("Unauthorized")) {
              console.error("❌ Kesalahan autentikasi:", error.message);
              set.status = 401;
              return {
                success: false,
                message: "Autentikasi gagal",
              };
            }

            // Tangani error lain
            return new Response(
              JSON.stringify({
                success: false,
                message: error.message || "Terjadi kesalahan pada server",
              }),
              { status: 500 }
            );
          }
        },
        putUserSchema
      )

      // ===== USER: HAPUS AKUN SENDIRI =====
      .delete(
        "/",
        // @ts-ignore
        async ({ jwt, cookie, set }) => {
          try {
            const decoded = await authorizeRequest(jwt, cookie);
            const deleted = await userService.deleteUser(decoded.sub);
            if (!deleted) {
              return new Response("User gagal dihapus", { status: 400 });
            }
            return {
              message: "User berhasil dihapus",
            };
          } catch (error: any) {
            console.error("Kesalahan saat menghapus akun sendiri:", error);

            // Periksa apakah error autentikasi dari authorizeRequest
            if (error.message && error.message.includes("Unauthorized")) {
              console.error("❌ Kesalahan autentikasi:", error.message);
              set.status = 401;
              return {
                success: false,
                message: "Autentikasi gagal",
              };
            }

            // Tangani error lain
            return new Response(
              JSON.stringify({
                success: false,
                message: error.message || "Terjadi kesalahan pada server",
              }),
              { status: 500 }
            );
          }
        },
        deleteUserSchema
      )

      // ===== GET: STATUS NOTIFIKASI WHATSAPP =====
      .get(
        "/whatsapp-notifications",
        // @ts-ignore
        async ({ jwt, cookie, set }) => {
          try {
            const decoded = await authorizeRequest(jwt, cookie);
            const enabled = await userService.getWhatsAppNotificationStatus(
              decoded.sub
            );
            return {
              success: true,
              whatsapp_notifications_enabled: enabled,
            };
          } catch (error: any) {
            console.error("Kesalahan saat mengambil status notifikasi WhatsApp:", error);

            // Periksa apakah error autentikasi dari authorizeRequest
            if (error.message && error.message.includes("Unauthorized")) {
              console.error("❌ Kesalahan autentikasi:", error.message);
              set.status = 401;
              return {
                success: false,
                message: "Autentikasi gagal",
              };
            }

            // Tangani error lain
            return new Response(
              JSON.stringify({
                success: false,
                message: error.message || "Terjadi kesalahan pada server",
              }),
              { status: 500 }
            );
          }
        }
      )

      // ===== PUT: PERBARUI STATUS NOTIFIKASI WHATSAPP =====
      .put(
        "/whatsapp-notifications",
        // @ts-ignore
        async ({ jwt, cookie, body, set }) => {
          try {
            const decoded = await authorizeRequest(jwt, cookie);
            const { enabled } = body as any;
            const success = await userService.updateWhatsAppNotifications(
              decoded.sub,
              enabled
            );

            if (!success) {
              return new Response(
                JSON.stringify({
                  success: false,
                  message: "Gagal memperbarui pengaturan notifikasi WhatsApp",
                }),
                { status: 400 }
              );
            }

            return {
              success: true,
              message: "Pengaturan notifikasi WhatsApp berhasil diperbarui",
            };
          } catch (error: any) {
            console.error(
              "Kesalahan saat memperbarui status notifikasi WhatsApp:",
              error
            );

            // Periksa apakah error autentikasi dari authorizeRequest
            if (error.message && error.message.includes("Unauthorized")) {
              console.error("❌ Kesalahan autentikasi:", error.message);
              set.status = 401;
              return {
                success: false,
                message: "Autentikasi gagal",
              };
            }

            // Tangani error lain
            set.status = 500;
            return {
              success: false,
              message: "Terjadi kesalahan pada server",
            };
          }
        }
      )

      // ===== GET: ONBOARDING PROGRESS PENGGUNA SENDIRI =====
      .get(
        "/onboarding-progress",
        // @ts-ignore
        async ({ jwt, cookie, set }) => {
          try {
            const decoded = await authorizeRequest(jwt, cookie);
            const progress = await userService.getOnboardingProgress(
              decoded.sub
            );
            return {
              success: true,
              ...progress,
            };
          } catch (error: any) {
            console.error("Kesalahan saat mengambil progres onboarding:", error);

            // Periksa apakah error autentikasi dari authorizeRequest
            if (error.message && error.message.includes("Unauthorized")) {
              console.error("❌ Kesalahan autentikasi:", error.message);
              set.status = 401;
              return {
                success: false,
                message: "Autentikasi gagal",
              };
            }

            // Tangani error lain
            set.status = 500;
            return {
              success: false,
              message: "Terjadi kesalahan pada server",
            };
          }
        }
      )

      // ===== GET: ONBOARDING PROGRESS BERDASARKAN USER ID =====
      .get(
        "/onboarding-progress/:userId",
        // @ts-ignore
        async ({ jwt, cookie, params, set }) => {
          try {
            await authorizeRequest(jwt, cookie);
            const progress = await userService.getOnboardingProgress(
              params.userId
            );
            return {
              success: true,
              data: {
                completedTasks: progress.progress,
                isCompleted: progress.completed,
              },
            };
          } catch (error: any) {
            console.error(
              "Kesalahan saat mengambil progres onboarding berdasarkan user ID:",
              error
            );

            // Periksa apakah error autentikasi dari authorizeRequest
            if (error.message && error.message.includes("Unauthorized")) {
              console.error("❌ Kesalahan autentikasi:", error.message);
              set.status = 401;
              return {
                success: false,
                message: "Autentikasi gagal",
              };
            }

            // Tangani error lain
            set.status = 500;
            return {
              success: false,
              message: "Terjadi kesalahan pada server",
            };
          }
        }
      )

      // ===== POST: PERBARUI ONBOARDING PROGRESS =====
      .post(
        "/onboarding-progress",
        // @ts-ignore
        async ({ jwt, cookie, body, set }) => {
          try {
            const decoded = await authorizeRequest(jwt, cookie);
            const { taskId, completed } = body as {
              taskId: number;
              completed: boolean;
            };

            const success = await userService.updateOnboardingProgress(
              decoded.sub,
              taskId,
              completed
            );

            if (!success) {
              return new Response(
                JSON.stringify({
                  success: false,
                  message: "Gagal memperbarui progres onboarding",
                }),
                { status: 400 }
              );
            }

            return {
              success: true,
              message: "Progres onboarding berhasil diperbarui",
            };
          } catch (error: any) {
            console.error("Kesalahan saat memperbarui progres onboarding:", error);

            // Periksa apakah error autentikasi dari authorizeRequest
            if (error.message && error.message.includes("Unauthorized")) {
              console.error("❌ Kesalahan autentikasi:", error.message);
              set.status = 401;
              return {
                success: false,
                message: "Autentikasi gagal",
              };
            }

            // Tangani error lain
            set.status = 500;
            return {
              success: false,
              message: "Terjadi kesalahan pada server",
            };
          }
        }
      )
  );
}

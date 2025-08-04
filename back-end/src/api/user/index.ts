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
            await authorizeRequest(jwt, cookie.auth); // Verifikasi authentication
            const users = await userService.getAllUsers();
            return { status: "success", data: users };
          } catch (error: any) {
            console.error("Error in get all users:", error);

            // Handle authentication error dari authorizeRequest
            if (error.message && error.message.includes("Unauthorized")) {
              console.error("❌ Authentication error:", error.message);
              set.status = 401;
              return {
                success: false,
                message: "Authentication failed",
                data: [],
              };
            }

            // Handle other errors
            set.status = 500;
            return {
              success: false,
              message: "Internal server error",
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
            await authorizeRequest(jwt, cookie); // Verifikasi authentication
            const user = await userService.getUserById(params.id);
            if (!user) {
              return new Response("User tidak ditemukan", { status: 404 });
            }
            return user; // Return detail user tanpa sensitive data
          } catch (error: any) {
            console.error("Error in get user by ID:", error);

            // Handle authentication error dari authorizeRequest
            if (error.message && error.message.includes("Unauthorized")) {
              console.error("❌ Authentication error:", error.message);
              set.status = 401;
              return {
                success: false,
                message: "Authentication failed",
              };
            }

            // Handle other errors
            set.status = 500;
            return {
              success: false,
              message: "Internal server error",
            };
          }
        },
        getUserByIdSchema
      )

      // Admin: Update user by ID
      .put(
        "/:id",
        // @ts-ignore
        async ({ jwt, cookie, params, body, set }) => {
          try {
            const decoded = await authorizeRequest(jwt, cookie);

            // Check if user is admin
            const adminUser = await userService.getUserById(decoded.sub);
            if (!adminUser?.is_admin) {
              return new Response(
                JSON.stringify({
                  status: "error",
                  message: "Unauthorized: Admin access required",
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
            console.error("Error in admin update user:", error);

            // Check if it's an authentication error from authorizeRequest
            if (error.message && error.message.includes("Unauthorized")) {
              console.error("❌ Authentication error:", error.message);
              set.status = 401;
              return {
                success: false,
                message: "Authentication failed",
              };
            }

            // Handle other errors
            return new Response(
              JSON.stringify({
                success: false,
                message: error.message || "Internal server error",
              }),
              { status: 500 }
            );
          }
        },
        putUserSchema
      )

      // Admin: Delete user by ID
      .delete(
        "/:id",
        // @ts-ignore
        async ({ jwt, cookie, params, set }) => {
          try {
            const decoded = await authorizeRequest(jwt, cookie);

            // Check if user is admin
            const adminUser = await userService.getUserById(decoded.sub);
            if (!adminUser?.is_admin) {
              return new Response(
                JSON.stringify({
                  status: "error",
                  message: "Unauthorized: Admin access required",
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
            console.error("Error in admin delete user:", error);

            // Check if it's an authentication error from authorizeRequest
            if (error.message && error.message.includes("Unauthorized")) {
              console.error("❌ Authentication error:", error.message);
              set.status = 401;
              return {
                success: false,
                message: "Authentication failed",
              };
            }

            // Handle other errors
            return new Response(
              JSON.stringify({
                success: false,
                message: error.message || "Internal server error",
              }),
              { status: 500 }
            );
          }
        },
        deleteUserSchema
      )

      // User: Update own profile
      .put(
        "/",
        // @ts-ignore
        async ({ jwt, cookie, body, set }) => {
          try {
            const decoded = await authorizeRequest(jwt, cookie);
            if (decoded.sub === "1") {
              throw new Error(
                "Akun ini tidak dapat dihapus saat kuisioner berlangsung"
              );
            }
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
            console.error("Error in update own profile:", error);

            // Check if it's an authentication error from authorizeRequest
            if (error.message && error.message.includes("Unauthorized")) {
              console.error("❌ Authentication error:", error.message);
              set.status = 401;
              return {
                success: false,
                message: "Authentication failed",
              };
            }

            // Handle other errors
            return new Response(
              JSON.stringify({
                success: false,
                message: error.message || "Internal server error",
              }),
              { status: 500 }
            );
          }
        },
        putUserSchema
      )

      // Delete user
      .delete(
        "/",
        // @ts-ignore
        async ({ jwt, cookie, set }) => {
          try {
            const decoded = await authorizeRequest(jwt, cookie);
            if (decoded.sub === "1") {
              throw new Error(
                "Akun ini tidak dapat dihapus saat kuisioner berlangsung"
              );
            }
            const deleted = await userService.deleteUser(decoded.sub);
            if (!deleted) {
              return new Response("User gagal dihapus", { status: 400 });
            }
            return {
              message: "User berhasil dihapus",
            };
          } catch (error: any) {
            console.error("Error in delete own account:", error);

            // Check if it's an authentication error from authorizeRequest
            if (error.message && error.message.includes("Unauthorized")) {
              console.error("❌ Authentication error:", error.message);
              set.status = 401;
              return {
                success: false,
                message: "Authentication failed",
              };
            }

            // Handle other errors
            set.status = 500;
            return {
              success: false,
              message: "Internal server error",
            };
          }
        },
        deleteUserSchema
      )

      // Get WhatsApp notification status
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
            console.error("Error in get WhatsApp notification status:", error);

            // Check if it's an authentication error from authorizeRequest
            if (error.message && error.message.includes("Unauthorized")) {
              console.error("❌ Authentication error:", error.message);
              set.status = 401;
              return {
                success: false,
                message: "Authentication failed",
              };
            }

            // Handle other errors
            return new Response(
              JSON.stringify({
                success: false,
                message: error.message || "Internal server error",
              }),
              { status: 500 }
            );
          }
        }
      )

      // Update WhatsApp notification status
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
                  message: "Failed to update WhatsApp notification settings",
                }),
                { status: 400 }
              );
            }

            return {
              success: true,
              message: "WhatsApp notification settings updated successfully",
            };
          } catch (error: any) {
            console.error(
              "Error in update WhatsApp notification status:",
              error
            );

            // Check if it's an authentication error from authorizeRequest
            if (error.message && error.message.includes("Unauthorized")) {
              console.error("❌ Authentication error:", error.message);
              set.status = 401;
              return {
                success: false,
                message: "Authentication failed",
              };
            }

            // Handle other errors
            set.status = 500;
            return {
              success: false,
              message: "Internal server error",
            };
          }
        }
      )

      // Get onboarding progress
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
            console.error("Error in get onboarding progress:", error);

            // Check if it's an authentication error from authorizeRequest
            if (error.message && error.message.includes("Unauthorized")) {
              console.error("❌ Authentication error:", error.message);
              set.status = 401;
              return {
                success: false,
                message: "Authentication failed",
              };
            }

            // Handle other errors
            set.status = 500;
            return {
              success: false,
              message: "Internal server error",
            };
          }
        }
      )

      // Get onboarding progress by user ID
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
              "Error in get onboarding progress by user ID:",
              error
            );

            // Check if it's an authentication error from authorizeRequest
            if (error.message && error.message.includes("Unauthorized")) {
              console.error("❌ Authentication error:", error.message);
              set.status = 401;
              return {
                success: false,
                message: "Authentication failed",
              };
            }

            // Handle other errors
            set.status = 500;
            return {
              success: false,
              message: "Internal server error",
            };
          }
        }
      )

      // Update onboarding progress
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
                  message: "Failed to update onboarding progress",
                }),
                { status: 400 }
              );
            }

            return {
              success: true,
              message: "Onboarding progress updated successfully",
            };
          } catch (error: any) {
            console.error("Error in update onboarding progress:", error);

            // Check if it's an authentication error from authorizeRequest
            if (error.message && error.message.includes("Unauthorized")) {
              console.error("❌ Authentication error:", error.message);
              set.status = 401;
              return {
                success: false,
                message: "Authentication failed",
              };
            }

            // Handle other errors
            set.status = 500;
            return {
              success: false,
              message: "Internal server error",
            };
          }
        }
      )
  );
}

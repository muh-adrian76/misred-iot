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
  return new Elysia({ prefix: "/user" })

    // Get all users
    .get(
      "",
      // @ts-ignore
      async ({ jwt, cookie }) => {
        await authorizeRequest(jwt, cookie.auth);
        const users = await userService.getAllUsers();
        return { status: "success", data: users };
      },
      getAllUsersSchema
    )

    // Get user by ID
    .get(
      "/:id",
      // @ts-ignore
      async ({ jwt, cookie, params }) => {
        await authorizeRequest(jwt, cookie);
        const user = await userService.getUserById(params.id);
        if (!user) {
          return new Response("User tidak ditemukan", { status: 404 });
        }
        return user;
      },
      getUserByIdSchema
    )

    // Admin: Update user by ID
    .put(
      "/:id",
      // @ts-ignore
      async ({ jwt, cookie, params, body }) => {
        const decoded = await authorizeRequest(jwt, cookie);
        
        // Check if user is admin
        const adminUser = await userService.getUserById(decoded.sub);
        if (!adminUser?.is_admin) {
          return new Response(JSON.stringify({
            status: "error",
            message: "Unauthorized: Admin access required"
          }), { status: 403 });
        }

        const { name, email, is_admin } = body as any;
        const updated = await userService.updateUserAdmin(params.id, { name, email, is_admin });
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
      },
      putUserSchema
    )

    // Admin: Delete user by ID  
    .delete(
      "/:id",
      // @ts-ignore
      async ({ jwt, cookie, params }) => {
        const decoded = await authorizeRequest(jwt, cookie);
        
        // Check if user is admin
        const adminUser = await userService.getUserById(decoded.sub);
        if (!adminUser?.is_admin) {
          return new Response(JSON.stringify({
            status: "error",
            message: "Unauthorized: Admin access required"
          }), { status: 403 });
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
      },
      deleteUserSchema
    )

    // User: Update own profile
    .put(
      "/",
      // @ts-ignore
      async ({ jwt, cookie, body }) => {
        const decoded = await authorizeRequest(jwt, cookie);
        const { name, phone, whatsapp_notif } = body;
        const phoneNumber = phone ?? "";

        const updatedUser = await userService.updateUser(decoded.sub, name, phoneNumber, whatsapp_notif);
        if (!updatedUser) {
          return new Response("User gagal diperbarui", { status: 400 });
        }
        return new Response(JSON.stringify(updatedUser), { status: 200 });
      },
      putUserSchema
    )

    // Delete user
    .delete(
      "/",
      // @ts-ignore
      async ({ jwt, cookie }) => {
        const decoded = await authorizeRequest(jwt, cookie);
        const deleted = await userService.deleteUser(decoded.sub);
        if (!deleted) {
          return new Response("User gagal dihapus", { status: 400 });
        }
        return {
          message: "User berhasil dihapus",
        };
      },
      deleteUserSchema
    )

    // Get WhatsApp notification status
    .get(
      "/whatsapp-notifications",
      // @ts-ignore
      async ({ jwt, cookie }) => {
        const decoded = await authorizeRequest(jwt, cookie);
        const enabled = await userService.getWhatsAppNotificationStatus(decoded.sub);
        return {
          success: true,
          whatsapp_notifications_enabled: enabled
        };
      }
    )

    // Update WhatsApp notification status
    .put(
      "/whatsapp-notifications",
      // @ts-ignore
      async ({ jwt, cookie, body }) => {
        const decoded = await authorizeRequest(jwt, cookie);
        const { enabled } = body as any;
        const success = await userService.updateWhatsAppNotifications(decoded.sub, enabled);
        
        if (!success) {
          return new Response(JSON.stringify({
            success: false,
            message: "Failed to update WhatsApp notification settings"
          }), { status: 400 });
        }

        return {
          success: true,
          message: "WhatsApp notification settings updated successfully"
        };
      }
    )

    // Get onboarding progress
    .get(
      "/onboarding-progress",
      // @ts-ignore
      async ({ jwt, cookie }) => {
        const decoded = await authorizeRequest(jwt, cookie);
        const progress = await userService.getOnboardingProgress(decoded.sub);
        return {
          success: true,
          ...progress
        };
      }
    )

    // Get onboarding progress by user ID
    .get(
      "/onboarding-progress/:userId",
      // @ts-ignore
      async ({ jwt, cookie, params }) => {
        await authorizeRequest(jwt, cookie);
        const progress = await userService.getOnboardingProgress(params.userId);
        return {
          success: true,
          data: {
            completedTasks: progress.progress,
            isCompleted: progress.completed
          }
        };
      }
    )

    // Update onboarding progress
    .post(
      "/onboarding-progress",
      // @ts-ignore
      async ({ jwt, cookie, body }) => {
        const decoded = await authorizeRequest(jwt, cookie);
        const { taskId, completed } = body as { taskId: number; completed: boolean };
        
        const success = await userService.updateOnboardingProgress(decoded.sub, taskId, completed);
        
        if (!success) {
          return new Response(JSON.stringify({
            success: false,
            message: "Failed to update onboarding progress"
          }), { status: 400 });
        }

        return {
          success: true,
          message: "Onboarding progress updated successfully"
        };
      }
    );
}

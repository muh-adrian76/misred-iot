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
      "/all",
      // @ts-ignore
      async ({ jwt, cookie }) => {
        await authorizeRequest(jwt, cookie.auth);
        const users = await userService.getAllUsers();
        return users;
      },
      getAllUsersSchema
    )

    // Get user by ID
    .get(
      "/:id",
      // @ts-ignore
      async ({ jwt, cookie, params }) => {
        await authorizeRequest(jwt, cookie.auth);
        const user = await userService.getUserById(params.id);
        if (!user) {
          return new Response("User tidak ditemukan", { status: 404 });
        }
        return user;
      },
      getUserByIdSchema
    )

    // Update user by ID
    .put(
      "/:id",
      // @ts-ignore
      async ({ jwt, cookie, params, body }) => {
        await authorizeRequest(jwt, cookie.auth);
        const { name, password } = body;
        const updated = await userService.updateUser(params.id, name, password);
        if (!updated) {
          return new Response("User gagal diperbarui", { status: 400 });
        }
        return {
          message: "User berhasil diperbarui",
          id: params.id,
        };
      },
      putUserSchema
    )

    // Delete user
    .delete(
      "/:id",
      // @ts-ignore
      async ({ jwt, cookie, params }) => {
        await authorizeRequest(jwt, cookie.auth);
        const deleted = await userService.deleteUser(params.id);
        if (!deleted) {
          return new Response("User gagal dihapus", { status: 400 });
        }
        return {
          message: "User berhasil dihapus",
        };
      },
      deleteUserSchema
    );
}

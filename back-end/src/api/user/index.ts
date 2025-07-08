import { Elysia } from "elysia";
import { authorizeRequest } from "../../lib/utils";
import { UserService } from "../../services/UserService";
import {
  // getAllUsersSchema,
  getUserByIdSchema,
  putUserSchema,
  deleteUserSchema,
} from "./elysiaSchema";

export function userRoutes(userService: UserService) {
  return new Elysia({ prefix: "/user" })

    // Get all users
    // .get(
    //   "/all",
    //   // @ts-ignore
    //   async ({ jwt, cookie }) => {
    //     await authorizeRequest(jwt, cookie.auth);
    //     const users = await userService.getAllUsers();
    //     return users;
    //   },
    //   getAllUsersSchema
    // )

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

    // Update user by ID
    .put(
      "/",
      // @ts-ignore
      async ({ jwt, cookie, body }) => {
        const decoded = await authorizeRequest(jwt, cookie);
        const { name, phone } = body;
        const phoneNumber = phone ?? "";

        const updatedUser = await userService.updateUser(decoded.sub, name, phoneNumber);
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
    );
}

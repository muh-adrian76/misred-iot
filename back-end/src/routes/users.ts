import { Elysia, t } from "elysia";
import { ResultSetHeader } from "mysql2";
import { authorizeRequest } from "../utils/authorize";
import { Types } from "../utils/types";
import { db } from "../utils/middleware";

export const userRoutes = new Elysia({ prefix: "/user" })
  // 🔍 Get all users
  .get(
    "/all",
    //@ts-ignore
    async ({ jwt, headers: { authorization } }: Types) => {
      const decoded = await authorizeRequest(jwt, authorization);
      const [rows] = await db.query<any[]>("SELECT * FROM users");
      return rows;
    },
    {
      type: "json",
      response: {
        200: t.Object(
          {
            result: t.Array(
              t.Object({
                id: t.Number({
                  description: "ID user",
                  example: 1,
                }),
                name: t.String({
                  description: "Username user",
                  example: "contoh",
                }),
                email: t.String({
                  description: "Email user",
                  example: "contoh@gmail.com",
                }),
                last_login: t.String({
                  description: "Waktu login terakhir user",
                  example: "2023-07-30T15:00:00Z",
                }),
              }),
              { description: "Daftar semua pengguna yang terdaftar" }
            ),
          },
          { description: "Response yang berisi data semua pengguna" }
        ),
        404: t.Object(
          {
            message: t.String({
              description: "Pesan error jika tidak ada user ditemukan",
              example: "Belum ada user yang terdaftar",
            }),
          },
          { description: "User tidak ditemukan" }
        ),
      },
      detail: {
        tags: ["User"],
        description: "Mengambil semua data user",
        summary: "Get all users",
      },
    }
  )

  // 🔍 Get user by ID
  .get(
    "/:id",
    //@ts-ignore
    async ({ jwt, headers: { authorization }, params }: Types) => {
      const decoded = await authorizeRequest(jwt, authorization);
      const [rows] = await db.query<any[]>("SELECT * FROM users WHERE id = ?", [
        params.id,
      ]);
      return rows[0] || new Response("User tidak ditemukan", { status: 404 });
    },
    {
      type: "json",
      response: {
        200: t.Object(
          {
            id: t.Number({
              description: "ID pengguna",
              example: 1,
            }),
            name: t.String({
              description: "Username pengguna",
              example: "contoh",
            }),
            email: t.String({
              description: "Email pengguna",
              example: "contoh@gmail.com",
            }),
            last_login: t.String({
              description: "Waktu login terakhir pengguna",
              example: "2023-07-30T15:00:00Z",
            }),
          },
          { description: "Response yang berisi data pengguna berdasarkan ID" }
        ),
        404: t.Object(
          {
            message: t.String({
              description: "Pesan error jika user tidak ditemukan",
              example: "User tidak ditemukan",
            }),
          },
          { description: "User tidak ditemukan" }
        ),
      },
      detail: {
        tags: ["User"],
        description: "Mengambil data user berdasarkan ID",
        summary: "Get user by ID",
      },
    }
  )

  // ✏️ Update user by ID
  .put(
    "/:id",
    //@ts-ignore
    async ({ jwt, headers: { authorization }, params, body }: Types) => {
      const decoded = await authorizeRequest(jwt, authorization);
      const { name, password } = body;

      const [result] = await db.query<ResultSetHeader>(
        `UPDATE users SET password=?, name=?, WHERE id=?`,
        [password, name, params.id]
      );

      return {
        message: "User berhasil diperbarui",
        id: params.id,
      };
    },
    {
      type: "json",
      body: t.Object({
        name: t.String({
          example: "contoh yang diperbarui",
        }),
        password: t.String({
          example: "password baru",
        }),
      }),
      response: {
        200: t.Object(
          {
            message: t.String({
              description: "Pesan sukses setelah berhasil memperbarui user",
              example: "User berhasil diperbarui",
            }),
            id: t.Number({
              description:
                "ID user yang berhasil diperbarui",
              example: 1,
            }),
          },
          { description: "Data user berhasil diperbarui" }
        ),
        400: t.Object(
          {
            message: t.String({
              description: "Pesan error jika input tidak valid",
              example: "Input tidak valid.",
            }),
          },
          { description: "Input tidak valid" }
        ),
        404: t.Object(
          {
            message: t.String({
              description:
                "Pesan error jika user dengan ID yang diberikan tidak ditemukan",
              example: "User tidak ditemukan",
            }),
          },
          { description: "User tidak ditemukan" }
        ),
      },
      detail: {
        tags: ["User"],
        description: "Memperbarui data user berdasarkan ID",
        summary: "Update user",
      },
    }
  )

  // ❌ Delete user
  .delete(
    "/:id",
    //@ts-ignore
    async ({ jwt, headers: { authorization }, params }: Types) => {
      const decoded = await authorizeRequest(jwt, authorization);
      const [result] = await db.query<ResultSetHeader>(
        "DELETE FROM users WHERE id = ?",
        [params.id]
      );

      return {
        message: "User berhasil dihapus",
      };
    },
    {
      type: "json",
      response: {
        200: t.Object(
          {
            message: t.String({
              description: "Pesan berhasil menghapus user",
              example: "User berhasil dihapus",
            }),
          },
          { description: "User berhasil dihapus" }
        ),
        404: t.Object(
          {
            message: t.String({
              description: "Pesan error jika user tidak ditemukan",
              example: "User tidak ditemukan",
            }),
          },
          { description: "User tidak ditemukan" }
        ),
      },
      detail: {
        tags: ["User"],
        description: "Menghapus data user berdasarkan ID",
        summary: "Delete user",
      },
    }
  );

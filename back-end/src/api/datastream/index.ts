/**
 * ===== DATASTREAM API ROUTES - ENDPOINT MANAJEMEN SENSOR DATASTREAM IoT =====
 * File ini mengatur CRUD operations untuk konfigurasi sensor pada device IoT
 * Meliputi: pin mapping, sensor types, validation ranges, unit measurements
 */

import { Elysia } from "elysia";
import { authorizeRequest } from "../../lib/utils";
import { DatastreamService } from "../../services/DatastreamService";
import {
  getAllDatastreamsSchema,
  postDatastreamSchema,
  deleteDatastreamSchema,
  putDatastreamSchema,
} from "./elysiaSchema";

export function datastreamRoutes(datastreamService: DatastreamService) {
  return (
    new Elysia({ prefix: "/datastream" })
      // ===== ENDPOINT AMBIL SEMUA DATASTREAM =====
      // GET /datastream - Ambil semua datastream milik user
      .get(
        "/",
        //@ts-ignore
        async ({ jwt, cookie, set }) => {
          try {
            const user = await authorizeRequest(jwt, cookie);
            const datastreams = await datastreamService.getDatastreamsByUserId(
              user.sub
            );
            return new Response(JSON.stringify({ result: datastreams }), {
              status: 200,
            });
          } catch (error: any) {
            console.error("Kesalahan saat mengambil semua datastream:", error);

            // Tangani kesalahan autentikasi dari authorizeRequest
            if (error.message && error.message.includes("Unauthorized")) {
              console.error("❌ Kesalahan autentikasi:", error.message);
              set.status = 401;
              return {
                success: false,
                message: "Autentikasi gagal",
                result: [],
              };
            }

            // Tangani kesalahan lainnya
            set.status = 500;
            return {
              success: false,
              message: "Kesalahan server internal",
              result: [],
            };
          }
        },
        getAllDatastreamsSchema
      )

      // ===== ENDPOINT AMBIL DATASTREAM PER PERANGKAT =====
      // GET /datastream/device/:deviceId - Ambil datastream berdasarkan device ID
      .get(
        "/device/:deviceId",
        //@ts-ignore
        async ({ jwt, cookie, params, set }) => {
          try {
            const user = await authorizeRequest(jwt, cookie);
            const datastreams =
              await datastreamService.getDatastreamsByDeviceId(
                params.deviceId,
                user.sub
              );
            return new Response(JSON.stringify({ result: datastreams }), {
              status: 200,
            });
          } catch (error: any) {
            console.error("Kesalahan saat mengambil datastream berdasarkan device ID:", error);

            // Tangani kesalahan autentikasi dari authorizeRequest
            if (error.message && error.message.includes("Unauthorized")) {
              console.error("❌ Kesalahan autentikasi:", error.message);
              set.status = 401;
              return {
                success: false,
                message: "Autentikasi gagal",
                result: [],
              };
            }

            // Tangani kesalahan lainnya
            set.status = 500;
            return {
              success: false,
              message: "Kesalahan server internal",
              result: [],
            };
          }
        }
      )

      // ===== ENDPOINT AMBIL SATU DATASTREAM =====
      // GET /datastream/:id - Ambil datastream tertentu berdasarkan ID
      .get(
        "/:id",
        //@ts-ignore
        async ({ jwt, cookie, params, set }) => {
          try {
            const user = await authorizeRequest(jwt, cookie);
            const datastream = await datastreamService.getDatastreamById(
              params.id,
              user.sub
            );
            if (!datastream) {
              return new Response(
                JSON.stringify({ message: "Datastream tidak ditemukan" }),
                { status: 404 }
              );
            }
            return new Response(JSON.stringify({ result: datastream }), {
              status: 200,
            });
          } catch (error: any) {
            console.error("Kesalahan saat mengambil datastream berdasarkan ID:", error);

            // Tangani kesalahan autentikasi dari authorizeRequest
            if (error.message && error.message.includes("Unauthorized")) {
              console.error("❌ Kesalahan autentikasi:", error.message);
              set.status = 401;
              return {
                success: false,
                message: "Autentikasi gagal",
              };
            }

            // Tangani kesalahan lainnya
            set.status = 500;
            return {
              success: false,
              message: "Kesalahan server internal",
            };
          }
        }
      )

      // ===== ENDPOINT BUAT DATASTREAM =====
      // POST /datastream - Buat datastream baru untuk sensor device
      .post(
        "/",
        //@ts-ignore
        async ({ jwt, cookie, body, set }) => {
          try {
            const user = await authorizeRequest(jwt, cookie);
            // Ekstrak data yang dibutuhkan dari request body
            const {
              deviceId,
              pin,
              type,
              unit,
              description,
              minValue,
              maxValue,
              decimalValue,
              booleanValue,
            } = body;

            // Buat datastream baru dengan validasi kepemilikan pengguna
            const datastreamId = await datastreamService.createDatastream({
              userId: user.sub,
              deviceId,
              pin,
              type,
              unit,
              description,
              minValue,
              maxValue,
              decimalValue,
              booleanValue,
            });

            // Response sukses dengan ID datastream baru
            return new Response(
              JSON.stringify({
                message: "Datastream berhasil dibuat",
                id: datastreamId,
              }),
              { status: 201 }
            );
          } catch (error: any) {
            console.error("Kesalahan saat membuat datastream:", error);

            // Tangani kesalahan autentikasi dari authorizeRequest
            if (error.message && error.message.includes("Unauthorized")) {
              console.error("❌ Kesalahan autentikasi:", error.message);
              set.status = 401;
              return {
                success: false,
                message: "Autentikasi gagal",
              };
            }

            // Tangani kesalahan lain (validasi, pin duplikat, dll)
            set.status = 500;
            return {
              success: false,
              message: "Kesalahan server internal",
            };
          }
        },
        postDatastreamSchema
      )

      // ===== ENDPOINT PERBARUI DATASTREAM =====
      // PUT /datastream/:id - Perbarui konfigurasi datastream sensor yang ada
      .put(
        "/:id",
        //@ts-ignore
        async ({ jwt, cookie, params, body, set }) => {
          try {
            await authorizeRequest(jwt, cookie);

            // Data yang akan diperbarui dari request body
            const {
              deviceId,
              pin,
              type,
              unit,
              description,
              minValue,
              maxValue,
              decimalValue,
              booleanValue,
            } = body;

            // Perbarui datastream dengan validasi kepemilikan
            const updated = await datastreamService.updateDatastream(
              params.id,
              {
                deviceId,
                pin,
                type,
                unit,
                description,
                minValue,
                maxValue,
                decimalValue,
                booleanValue,
              }
            );

            // Cek jika update gagal
            if (!updated) {
              return new Response("Datastream gagal diupdate", { status: 400 });
            }

            // Response sukses
            return new Response(
              JSON.stringify({ message: "Datastream berhasil diupdate" }),
              { status: 200 }
            );
          } catch (error: any) {
            console.error("Kesalahan saat memperbarui datastream:", error);

            // Tangani kesalahan autentikasi dari authorizeRequest
            if (error.message && error.message.includes("Unauthorized")) {
              console.error("❌ Kesalahan autentikasi:", error.message);
              set.status = 401;
              return {
                success: false,
                message: "Autentikasi gagal",
              };
            }

            // Tangani kesalahan lainnya (validasi, tidak ditemukan, dll)
            return new Response(
              JSON.stringify({
                success: false,
                message: error.message || "Kesalahan server internal",
              }),
              { status: 500 }
            );
          }
        },
        putDatastreamSchema
      )

      // ===== ENDPOINT HAPUS DATASTREAM =====
      // DELETE /datastream/:id - Hapus datastream sensor berdasarkan ID
      .delete(
        "/:id",
        //@ts-ignore
        async ({ jwt, cookie, params, set }) => {
          try {
            await authorizeRequest(jwt, cookie);

            // Hapus datastream dengan validasi kepemilikan
            const deleted = await datastreamService.deleteDatastream(params.id);

            // Cek jika proses hapus gagal
            if (!deleted) {
              return new Response("Datastream gagal dihapus", { status: 400 });
            }

            // Response sukses
            return new Response(
              JSON.stringify({ message: "Datastream berhasil dihapus" }),
              { status: 200 }
            );
          } catch (error: any) {
            console.error("Kesalahan saat menghapus datastream:", error);

            // Tangani kesalahan autentikasi dari authorizeRequest
            if (error.message && error.message.includes("Unauthorized")) {
              console.error("❌ Kesalahan autentikasi:", error.message);
              set.status = 401;
              return {
                success: false,
                message: "Autentikasi gagal",
              };
            }

            // Tangani kesalahan lainnya (tidak ditemukan, validasi, dll)
            return new Response(
              JSON.stringify({
                success: false,
                message: error.message || "Kesalahan server internal",
              }),
              { status: 500 }
            );
          }
        },
        deleteDatastreamSchema
      )
  );
}

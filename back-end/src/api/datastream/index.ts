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
      // ===== GET ALL DATASTREAMS ENDPOINT =====
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
            console.error("Error in get all datastreams:", error);

            // Handle authentication error dari authorizeRequest
            if (error.message && error.message.includes("Unauthorized")) {
              console.error("❌ Authentication error:", error.message);
              set.status = 401;
              return {
                success: false,
                message: "Authentication failed",
                result: [],
              };
            }

            // Handle other errors
            set.status = 500;
            return {
              success: false,
              message: "Internal server error",
              result: [],
            };
          }
        },
        getAllDatastreamsSchema
      )

      // ===== GET DATASTREAMS BY DEVICE ENDPOINT =====
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
            console.error("Error in get datastreams by device ID:", error);

            // Handle authentication error dari authorizeRequest
            if (error.message && error.message.includes("Unauthorized")) {
              console.error("❌ Authentication error:", error.message);
              set.status = 401;
              return {
                success: false,
                message: "Authentication failed",
                result: [],
              };
            }

            // Handle other errors
            set.status = 500;
            return {
              success: false,
              message: "Internal server error",
              result: [],
            };
          }
        }
      )

      // ===== GET SINGLE DATASTREAM ENDPOINT =====
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
            console.error("Error in get datastream by ID:", error);

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
        }
      )

      // ===== CREATE DATASTREAM ENDPOINT =====
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

            // Buat datastream baru dengan validasi user ownership
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

            // Return response sukses dengan ID datastream baru
            return new Response(
              JSON.stringify({
                message: "Datastream berhasil dibuat",
                id: datastreamId,
              }),
              { status: 201 }
            );
          } catch (error: any) {
            console.error("Error in create datastream:", error);

            // Handle authentication error dari authorizeRequest
            if (error.message && error.message.includes("Unauthorized")) {
              console.error("❌ Authentication error:", error.message);
              set.status = 401;
              return {
                success: false,
                message: "Authentication failed",
              };
            }

            // Handle other errors (validation, duplicate pin, etc)
            set.status = 500;
            return {
              success: false,
              message: "Internal server error",
            };
          }
        },
        postDatastreamSchema
      )

      // ===== UPDATE DATASTREAM ENDPOINT =====
      // PUT /datastream/:id - Update konfigurasi datastream sensor yang ada
      .put(
        "/:id",
        //@ts-ignore
        async ({ jwt, cookie, params, body, set }) => {
          try {
            if (
              params.id === "1" ||
              params.id === "2" ||
              params.id === "3" ||
              params.id === "4" ||
              params.id === "5" ||
              params.id === "6" ||
              params.id === "25" ||
              params.id === "26" ||
              params.id === "27" ||
              params.id === "28" ||
              params.id === "29" ||
              params.id === "30"
            ) {
              throw new Error(
                "Datastream ini tidak dapat diubah saat kuisioner berlangsung"
              );
            }
            await authorizeRequest(jwt, cookie);

            // Ekstrak data yang akan diupdate dari request body
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

            // Update datastream dengan validasi user ownership
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

            // Check jika update gagal
            if (!updated) {
              return new Response("Datastream gagal diupdate", { status: 400 });
            }

            // Return response sukses
            return new Response(
              JSON.stringify({ message: "Datastream berhasil diupdate" }),
              { status: 200 }
            );
          } catch (error: any) {
            console.error("Error in update datastream:", error);

            // Handle authentication error dari authorizeRequest
            if (error.message && error.message.includes("Unauthorized")) {
              console.error("❌ Authentication error:", error.message);
              set.status = 401;
              return {
                success: false,
                message: "Authentication failed",
              };
            }

            // Handle other errors (validation, not found, etc)
            return new Response(
              JSON.stringify({
                success: false,
                message: error.message || "Internal server error",
              }),
              { status: 500 }
            );
          }
        },
        putDatastreamSchema
      )

      // ===== DELETE DATASTREAM ENDPOINT =====
      // DELETE /datastream/:id - Hapus datastream sensor berdasarkan ID
      .delete(
        "/:id",
        //@ts-ignore
        async ({ jwt, cookie, params, set }) => {
          try {
            if (
              params.id === "1" ||
              params.id === "2" ||
              params.id === "3" ||
              params.id === "4" ||
              params.id === "5" ||
              params.id === "6" ||
              params.id === "25" ||
              params.id === "26" ||
              params.id === "27" ||
              params.id === "28" ||
              params.id === "29" ||
              params.id === "30"
            ) {
              throw new Error(
                "Datastream ini tidak dapat dihapus saat kuisioner berlangsung"
              );
            }
            await authorizeRequest(jwt, cookie);

            // Hapus datastream dengan validasi user ownership
            const deleted = await datastreamService.deleteDatastream(params.id);

            // Check jika delete gagal
            if (!deleted) {
              return new Response("Datastream gagal dihapus", { status: 400 });
            }

            // Return response sukses
            return new Response(
              JSON.stringify({ message: "Datastream berhasil dihapus" }),
              { status: 200 }
            );
          } catch (error: any) {
            console.error("Error in delete datastream:", error);

            // Handle authentication error dari authorizeRequest
            if (error.message && error.message.includes("Unauthorized")) {
              console.error("❌ Authentication error:", error.message);
              set.status = 401;
              return {
                success: false,
                message: "Authentication failed",
              };
            }

            // Handle other errors (not found, validation, etc)
            return new Response(
              JSON.stringify({
                success: false,
                message: error.message || "Internal server error",
              }),
              { status: 500 }
            );
          }
        },
        deleteDatastreamSchema
      )
  );
}

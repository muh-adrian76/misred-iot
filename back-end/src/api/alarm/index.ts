/**
 * ===== ALARM MANAGEMENT API ROUTES - ENDPOINT MANAJEMEN ALARM IoT =====
 * File ini mengatur semua endpoint API untuk manajemen alarm dan notifikasi
 * Meliputi: CRUD operations untuk alarm, kondisi threshold, dan monitoring
 */

import { Elysia } from "elysia";
import { authorizeRequest } from "../../lib/utils";
import { AlarmService } from "../../services/AlarmService";
import {
  createAlarmSchema,
  getAlarmsSchema,
  getAlarmByIdSchema,
  updateAlarmSchema,
  deleteAlarmSchema,
} from "./elysiaSchema";

export function alarmRoutes(alarmService: AlarmService) {
  return (
    new Elysia({ prefix: "/alarm" })

      // ===== CREATE ALARM ENDPOINT =====
      // POST /alarm - Membuat alarm baru dengan kondisi threshold
      .post(
        "/",
        //@ts-ignore
        async ({ jwt, cookie, body, set }) => {
          try {
            const decoded = await authorizeRequest(jwt, cookie);
            const {
              description,
              device_id,
              datastream_id,
              is_active,
              conditions,
              cooldown_minutes,
            } = body;
            const user_id = decoded.sub; // Ambil user ID dari JWT

            const insertId = await alarmService.createAlarm({
              description,
              user_id: Number(user_id),
              device_id,
              datastream_id,
              is_active,
              conditions, // Array kondisi threshold (operator + nilai)
              cooldown_minutes, // Cooldown untuk mencegah spam notifikasi
            });
            return new Response(
              JSON.stringify({
                success: true,
                message: "Berhasil menambah data alarm",
                alarm_id: insertId,
              }),
              { status: 200 }
            );
          } catch (error: any) {
            console.error("Error creating alarm:", error);

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
        createAlarmSchema
      )

      // ===== GET ALL ALARMS ENDPOINT =====
      // GET /alarm - Ambil semua alarm milik user yang sedang login
      .get(
        "/",
        //@ts-ignore
        async ({ jwt, cookie, set }) => {
          try {
            const decoded = await authorizeRequest(jwt, cookie);
            const data = await alarmService.getAllAlarms(decoded.sub); // Filter berdasarkan user ID
            return new Response(
              JSON.stringify({
                success: true,
                alarms: data, // Array alarm dengan detail device dan datastream
              }),
              { status: 200 }
            );
          } catch (error: any) {
            console.error("Error fetching alarms:", error);

            // Handle authentication error dari authorizeRequest
            if (error.message && error.message.includes("Unauthorized")) {
              console.error("❌ Authentication error:", error.message);
              set.status = 401;
              return {
                success: false,
                message: "Authentication failed",
                alarms: [],
              };
            }

            // Handle other errors
            set.status = 500;
            return {
              success: false,
              message: "Internal server error",
              alarms: [],
            };
          }
        },
        getAlarmsSchema
      )

      // ===== GET ALARM BY ID ENDPOINT =====
      // GET /alarm/:alarmId - Ambil detail alarm berdasarkan ID dengan validasi ownership
      .get(
        "/:alarmId",
        //@ts-ignore
        async ({ jwt, cookie, params, set }) => {
          try {
            const decoded = await authorizeRequest(jwt, cookie);
            const data = await alarmService.getAlarmById(
              Number(params.alarmId),
              Number(decoded.sub)
            );

            if (!data) {
              return new Response(
                JSON.stringify({
                  success: false,
                  message: "Alarm tidak ditemukan atau tidak memiliki akses",
                }),
                { status: 404 }
              );
            }

            return new Response(
              JSON.stringify({
                success: true,
                alarm: data, // Detail alarm dengan kondisi threshold
              }),
              { status: 200 }
            );
          } catch (error: any) {
            console.error("Error fetching alarm:", error);

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
        getAlarmByIdSchema
      )

      // ===== UPDATE ALARM ENDPOINT =====
      // PUT /alarm/:alarmId - Update konfigurasi alarm dengan validasi ownership
      .put(
        "/:alarmId",
        //@ts-ignore
        async ({ jwt, cookie, params, body, set }) => {
          try {
            if (
              params.alarmId === "1" ||
              params.alarmId === "2" ||
              params.alarmId === "4"
            ) {
              throw new Error(
                "Alarm ini tidak dapat diubah saat kuisioner berlangsung"
              );
            }
            const decoded = await authorizeRequest(jwt, cookie);
            const updated = await alarmService.updateAlarm(
              Number(params.alarmId),
              Number(decoded.sub),
              body
            );

            if (!updated) {
              return new Response(
                JSON.stringify({
                  success: false,
                  message: "Alarm tidak ditemukan atau gagal mengupdate",
                }),
                { status: 404 }
              );
            }

            return new Response(
              JSON.stringify({
                success: true,
                message: "Berhasil mengupdate data alarm.",
              }),
              { status: 200 }
            );
          } catch (error: any) {
            console.error("Error updating alarm:", error);

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
            return new Response(
              JSON.stringify({
                success: false,
                message: error.message || "Internal server error",
              }),
              { status: 500 }
            );
          }
        },
        updateAlarmSchema
      )

      // ===== DELETE ALARM ENDPOINT =====
      // DELETE /alarm/:alarmId - Hapus alarm dengan validasi ownership
      .delete(
        "/:alarmId",
        //@ts-ignore
        async ({ jwt, cookie, params, set }) => {
          try {
            if (
              params.alarmId === "1" ||
              params.alarmId === "2" ||
              params.alarmId === "4"
            ) {
              throw new Error(
                "Alarm ini tidak dapat dihapus saat kuisioner berlangsung"
              );
            }
            const decoded = await authorizeRequest(jwt, cookie);
            const deleted = await alarmService.deleteAlarm(
              Number(params.alarmId),
              Number(decoded.sub)
            );

            if (!deleted) {
              return new Response(
                JSON.stringify({
                  success: false,
                  message: "Alarm tidak ditemukan atau gagal menghapus",
                }),
                { status: 404 }
              );
            }

            return new Response(
              JSON.stringify({
                success: true,
                message: "Berhasil menghapus data alarm.",
              }),
              { status: 200 }
            );
          } catch (error: any) {
            console.error("Error deleting alarm:", error);

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
            return new Response(
              JSON.stringify({
                success: false,
                message: error.message || "Internal server error",
              }),
              { status: 500 }
            );
          }
        },
        deleteAlarmSchema
      )
  );
}

/**
 * ===== DEVICE COMMAND API ROUTES - ENDPOINT KONTROL COMMAND DEVICE IoT =====
 * File ini mengatur pengiriman command ke device IoT melalui datastream
 * Meliputi: send command, command history, pending commands, status update, statistics
 */

import { Elysia, t } from "elysia";
import mysql, { Pool } from "mysql2/promise";
import { DeviceCommandService } from "../../services/DeviceCommandService";
import { authorizeRequest } from "../../lib/utils";
import { 
  sendCommandSchema,
  getCommandHistorySchema,
  getPendingCommandsSchema,
  updateCommandStatusSchema,
  getCommandStatsSchema,
  cleanupCommandsSchema 
} from "./elysiaSchema";


export const deviceCommandRoutes = (db: Pool) =>
  new Elysia({ prefix: "/device-command" })
    
    // ===== SEND COMMAND TO DEVICE ENDPOINT =====
    // POST /device-command/send - Kirim command ke device IoT via datastream
    .post(
      "/send",
      async ({ body, headers }: any) => {
        //@ts-ignore
        const user = await authorizeRequest(headers.authorization);
        if (!user) {
          return {
            success: false,
            message: "Unauthorized - Authentication required"
          };
        }

        const commandService = new DeviceCommandService(db);
        
        try {
          // Buat command baru dengan validasi user ownership
          const commandId = await commandService.createCommand(
            body.device_id,
            body.datastream_id,
            body.command_type,
            body.value,
            user.id
          );

          return {
            success: true,
            message: "Command berhasil dibuat dan dikirim ke device",
            data: { command_id: commandId }
          };
        } catch (error: any) {
          console.error("Error creating command:", error);
          return {
            success: false,
            message: "Gagal mengirim command ke device",
            error: error.message
          };
        }
      },
      {
        body: t.Object({
          device_id: t.Number(),
          datastream_id: t.Number(),
          command_type: t.Union([
            t.Literal("set_value"),
            t.Literal("toggle"),
            t.Literal("reset")
          ]),
          value: t.Number()
        })
      }
    )

    // ===== GET COMMAND HISTORY ENDPOINT =====
    // GET /device-command/history/:device_id - Ambil riwayat command device
    .get(
      "/history/:device_id",
      async ({ params, query, headers }: any) => {
        // const user = await authorizeRequest(headers.authorization);
        // if (!user) {
        //   return {
        //     success: false,
        //     message: "Unauthorized"
        //   };
        // }

        const commandService = new DeviceCommandService(db);
        
        try {
          const limit = parseInt(query.limit || "50");
          const offset = parseInt(query.offset || "0");
          
          // Ambil riwayat command dengan pagination
          const commands = await commandService.getCommandHistory(
            parseInt(params.device_id),
            limit,
            offset
          );

          return {
            success: true,
            data: commands
          };
        } catch (error: any) {
          console.error("Error getting command history:", error);
          return {
            success: false,
            message: "Gagal mengambil riwayat command",
            error: error.message
          };
        }
      },
      {
        params: t.Object({
          device_id: t.String()
        }),
        query: t.Object({
          limit: t.Optional(t.String()),
          offset: t.Optional(t.String())
        })
      }
    )

    // ===== GET PENDING COMMANDS ENDPOINT =====
    // GET /device-command/pending/:device_id - Ambil command yang belum dieksekusi
    .get(
      "/pending/:device_id",
      async ({ params, headers }: any) => {
        // const user = await authorizeRequest(headers.authorization);
        // if (!user) {
        //   return {
        //     success: false,
        //     message: "Unauthorized"
        //   };
        // }

        const commandService = new DeviceCommandService(db);
        
        try {
          // Ambil semua command yang statusnya pending
          const commands = await commandService.getPendingCommands(
            parseInt(params.device_id)
          );

          return {
            success: true,
            data: commands
          };
        } catch (error: any) {
          console.error("Error getting pending commands:", error);
          return {
            success: false,
            message: "Gagal mengambil pending commands",
            error: error.message
          };
        }
      },
      {
        params: t.Object({
          device_id: t.String()
        })
      }
    )

    // ===== UPDATE COMMAND STATUS ENDPOINT =====
    // PATCH /device-command/status/:command_id - Update status command (biasanya dari device)
    .patch(
      "/status/:command_id",
      async ({ params, body, headers }: any) => {
        // const user = await authorizeRequest(headers.authorization);
        // if (!user) {
        //   return {
        //     success: false,
        //     message: "Unauthorized"
        //   };
        // }

        const commandService = new DeviceCommandService(db);
        
        try {
          const acknowledgedAt = body.status === "acknowledged" ? new Date() : undefined;
          
          // Update status command dengan timestamp jika acknowledged
          const updated = await commandService.updateCommandStatus(
            parseInt(params.command_id),
            body.status,
            acknowledgedAt
          );

          if (updated) {
            return {
              success: true,
              message: "Status command berhasil diupdate"
            };
          } else {
            return {
              success: false,
              message: "Command tidak ditemukan atau sudah diupdate"
            };
          }
        } catch (error: any) {
          console.error("Error updating command status:", error);
          return {
            success: false,
            message: "Gagal update status command",
            error: error.message
          };
        }
      },
      {
        params: t.Object({
          command_id: t.String()
        }),
        body: t.Object({
          status: t.Union([
            t.Literal("pending"),
            t.Literal("sent"),
            t.Literal("acknowledged"),
            t.Literal("failed")
          ])
        })
      }
    )

    // ===== GET COMMAND STATISTICS ENDPOINT =====
    // GET /device-command/stats/:device_id - Ambil statistik command device
    .get(
      "/stats/:device_id",
      async ({ params, query, headers }: any) => {
        // const user = await authorizeRequest(headers.authorization);
        // if (!user) {
        //   return {
        //     success: false,
        //     message: "Unauthorized"
        //   };
        // }

        const commandService = new DeviceCommandService(db);
        
        try {
          const days = parseInt(query.days || "7");
          
          // Ambil statistik command dalam periode tertentu
          const stats = await commandService.getCommandStats(
            parseInt(params.device_id),
            days
          );

          return {
            success: true,
            data: stats
          };
        } catch (error: any) {
          console.error("Error getting command stats:", error);
          return {
            success: false,
            message: "Gagal mengambil statistik command",
            error: error.message
          };
        }
      },
      {
        params: t.Object({
          device_id: t.String()
        }),
        query: t.Object({
          days: t.Optional(t.String())
        })
      }
    )

    // ===== CLEANUP OLD COMMANDS ENDPOINT =====
    // POST /device-command/cleanup - Bersihkan command lama (maintenance endpoint)
    .post(
      "/cleanup",
      async ({ body, headers }: any) => {
        // const user = await authorizeRequest(headers.authorization);
        // if (!user) {
        //   return {
        //     success: false,
        //     message: "Unauthorized"
        //   };
        // }

        const commandService = new DeviceCommandService(db);
        
        try {
          const olderThanMinutes = body.older_than_minutes || 5;
          
          // Tandai command lama sebagai failed untuk maintenance
          const affected = await commandService.markOldCommandsAsFailed(olderThanMinutes);

          return {
            success: true,
            message: `Berhasil menandai ${affected} command lama sebagai failed`,
            data: { affected_commands: affected }
          };
        } catch (error: any) {
          console.error("Error cleaning up commands:", error);
          return {
            success: false,
            message: "Gagal membersihkan command lama",
            error: error.message
          };
        }
      },
      {
        body: t.Object({
          older_than_minutes: t.Optional(t.Number())
        })
      }
    );

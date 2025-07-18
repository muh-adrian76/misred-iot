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
    
    // Send command to device via datastream
    .post(
      "/send",
      async ({ body, headers }: any) => {
        //@ts-ignore
        const user = await authorizeRequest(headers.authorization);
        if (!user) {
          return {
            success: false,
            message: "Unauthorized"
          };
        }

        const commandService = new DeviceCommandService(db);
        
        try {
          const commandId = await commandService.createCommand(
            body.device_id,
            body.datastream_id,
            body.command_type,
            body.value,
            user.id
          );

          return {
            success: true,
            message: "Command created successfully",
            data: { command_id: commandId }
          };
        } catch (error: any) {
          console.error("Error creating command:", error);
          return {
            success: false,
            message: "Failed to create command",
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

    // Get command history for a device
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
            message: "Failed to get command history",
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

    // Get pending commands for a device
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
            message: "Failed to get pending commands",
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

    // Update command status (usually called by device or WebSocket handler)
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
          
          const updated = await commandService.updateCommandStatus(
            parseInt(params.command_id),
            body.status,
            acknowledgedAt
          );

          if (updated) {
            return {
              success: true,
              message: "Command status updated successfully"
            };
          } else {
            return {
              success: false,
              message: "Command not found or already updated"
            };
          }
        } catch (error: any) {
          console.error("Error updating command status:", error);
          return {
            success: false,
            message: "Failed to update command status",
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

    // Get command statistics for a device
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
            message: "Failed to get command statistics",
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

    // Cleanup old pending commands (maintenance endpoint)
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
          
          const affected = await commandService.markOldCommandsAsFailed(olderThanMinutes);

          return {
            success: true,
            message: `Marked ${affected} old commands as failed`,
            data: { affected_commands: affected }
          };
        } catch (error: any) {
          console.error("Error cleaning up commands:", error);
          return {
            success: false,
            message: "Failed to cleanup commands",
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

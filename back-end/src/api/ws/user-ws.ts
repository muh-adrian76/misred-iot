import { Elysia, t } from "elysia";
import { sendToDevice } from "./device-ws"; // pastikan path benar

const userClients = new Set<any>();

export const userWsRoutes = new Elysia({ prefix: "/ws" })
  .ws("/user", {
    body: t.Object({
      type: t.String(),
      message: t.Optional(t.String()),
      device_id: t.Optional(t.String()),
      control_id: t.Optional(t.String()),
      command: t.Optional(t.String()),
      command_type: t.Optional(t.String()),
      command_id: t.Optional(t.String()),
      value: t.Optional(t.Any()),
      timestamp: t.Optional(t.String()),
    }),
    open(ws) {
      userClients.add(ws);
    },
    message(ws, data) {
      // 1. Send device command (NEW - improved command structure)
      if (data.type === "device_command" && data.device_id && data.control_id) {
        const commandPayload = {
          type: "device_command",
          command_id: data.command_id || Date.now().toString(),
          device_id: data.device_id,
          control_id: data.control_id,
          command_type: data.command_type || "set_value",
          value: data.value || 0,
          timestamp: new Date().toISOString()
        };
        
        sendToDevice(data.device_id, commandPayload);
        ws.send({ 
          type: "command_sent", 
          device_id: data.device_id,
          command_id: commandPayload.command_id,
          message: `Command sent to device ${data.device_id}`
        });
      }
      
      // 2. Legacy command support (backward compatibility)
      if (data.type === "command" && data.device_id && data.command) {
        sendToDevice(data.device_id, {
          type: "command",
          command: data.command,
          value: data.value,
        });
        ws.send({ type: "command_sent", device_id: data.device_id });
      }
      
      // 3. Echo handler for testing
      if (data.type === "echo") {
        ws.send({ type: "echo", message: data.message });
      }
    },
    close(ws) {
      userClients.delete(ws);
    }
  });

// Broadcast data sensor atau status ke semua user
export function broadcastToUsers(data: any) {
  for (const ws of userClients) {
    ws.send(data);
  }
}
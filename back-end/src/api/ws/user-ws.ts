import { Elysia, t } from "elysia";
import { sendToDevice } from "./device-ws"; // pastikan path benar

const userClients = new Set<any>();

export const userWsRoutes = new Elysia({ prefix: "/ws" })
  .ws("/user", {
    body: t.Object({
      type: t.String(),
      message: t.Optional(t.String()),
      device_id: t.Optional(t.String()),
      command: t.Optional(t.String()),
      value: t.Optional(t.Any()),
    }),
    open(ws) {
      userClients.add(ws);
    },
    message(ws, data) {
      // 1. Kirim perintah ke device
      if (data.type === "command" && data.device_id && data.command) {
        sendToDevice(data.device_id, {
          type: "command",
          command: data.command,
          value: data.value,
        });
        ws.send({ type: "command_sent", device_id: data.device_id });
      }
      // 2. Handler lain (echo, dsb)
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
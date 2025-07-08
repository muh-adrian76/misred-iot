import { Elysia, t } from "elysia";
import { broadcastToUsers } from "./user-ws"; // pastikan path benar

const deviceClients = new Map<string, any>();

export const deviceWsApi = new Elysia({ prefix: "/ws" })
  .ws("/connect", {
    open(ws) {
      console.log("Device connected via WebSocket");
      ws.send({ type: "hello", message: "Device WebSocket connected!" });
    },
    message(ws, data) {
      // Tampilkan pesan dari device ke console
      console.log("Received from device:", data);
    },
    close(ws) {
      console.log("Device disconnected");
    }
  })

.ws("/device", {
    body: t.Object({
      type: t.String(),
      device_id: t.Optional(t.String()),
      status: t.Optional(t.String()),
      sensor: t.Optional(t.Any()),
      message: t.Optional(t.String()),
    }),
    open(ws) {
      ws.send({ type: "hello", message: "Send your device_id" });
    },
    message(ws, data) {
      // Register device
      if (data.type === "register" && data.device_id) {
        deviceClients.set(data.device_id, ws);
        ws.send({ type: "registered", device_id: data.device_id });
      }
      // 1. Device kirim data sensor
      if (data.type === "sensor_update" && data.device_id && data.sensor) {
        broadcastToUsers({
          type: "sensor_update",
          device_id: data.device_id,
          sensor: data.sensor,
        });
      }
      // 2. Device kirim status online/offline
      if (data.type === "status_update" && data.device_id && data.status) {
        broadcastToUsers({
          type: "status_update",
          device_id: data.device_id,
          status: data.status,
        });
      }
      // 3. Device menerima perintah dari user (lihat sendToDevice)
    },
    close(ws) {
      for (const [id, client] of deviceClients.entries()) {
        if (client === ws) deviceClients.delete(id);
      }
    }
  });

export function sendToDevice(device_id: string, data: any) {
  const ws = deviceClients.get(device_id);
  if (ws) ws.send(data);
}
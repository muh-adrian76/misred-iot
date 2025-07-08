import { Elysia, t } from "elysia";
import { broadcastToUsers } from "./user-ws";
import { DeviceService } from '../../services/DeviceService';

const deviceClients = new Map<string, any>();

function updateDeviceActivity(device_id: string, ws: any) {
  deviceClients.set(device_id, { ws, lastSeen: Date.now() });
}

export function deviceWsApi(deviceService: DeviceService) {
  return new Elysia({ prefix: "/ws" }).ws("/connect", {
    body: t.Object({
      type: t.String(),
      device_id: t.Optional(t.String()),
      secret: t.Optional(t.String()),
      status: t.Optional(t.String()),
      sensor: t.Optional(t.Any()),
      message: t.Optional(t.String()),
    }),
    open(ws) {
      ws.send({ type: "hello", message: "Send your device_id" });
    },
    async message(ws, data) {
      // Register device by secret
      if (data.type === "register" && data.secret) {
        const deviceArr = await deviceService.getDeviceBySecret(data.secret);
        const device = Array.isArray(deviceArr) ? deviceArr[0] : deviceArr;
        if (device && device.id) {
          ws.send({
            type: "registered",
            message: "device berhasil didaftarkan",
            device_id: device.id, // return device_id dari database
          });
        } else {
          ws.send({
            type: "register_failed",
            message: "Device tidak ditemukan di database",
          });
        }
        return;
      }
      // 1. Device kirim data sensor
      if (data.type === "sensor_update" && data.device_id && data.sensor) {
        updateDeviceActivity(data.device_id, ws);
        broadcastToUsers({
          type: "sensor_update",
          device_id: data.device_id,
          sensor: data.sensor,
        });
        ws.send({ type: "sensor_update", message: "nilai sensor berhasil tersimpan" });
      }
      // 2. Device kirim status online/offline
      if (data.type === "status_update" && data.device_id && data.status) {
        updateDeviceActivity(data.device_id, ws);
        broadcastToUsers({
          type: "status_update",
          device_id: data.device_id,
          status: data.status,
        });
        ws.send({ type: "status_update", message: "status device berhasil diperbarui" });
      }
      // 3. Device menerima perintah dari user (lihat sendToDevice)
    },
    close(ws) {
      for (const [id, client] of deviceClients.entries()) {
        if (client.ws === ws) deviceClients.delete(id);
      }
    },
  });
}

setInterval(() => {
  const now = Date.now();
  for (const [device_id, { ws, lastSeen }] of deviceClients.entries()) {
    if (now - lastSeen > 5000) {
      deviceClients.delete(device_id);
      broadcastToUsers({
        type: "status_update",
        device_id,
        status: "offline",
      });
    }
  }
}, 1000);

export function sendToDevice(device_id: string, data: any) {
  const client = deviceClients.get(device_id);
  if (client && client.ws) client.ws.send(data);
}
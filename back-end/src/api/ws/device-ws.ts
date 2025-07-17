import { Elysia, t } from "elysia";
import { broadcastToUsers } from "./user-ws";
import { DeviceService } from '../../services/DeviceService';
import { DeviceCommandService } from '../../services/DeviceCommandService';
import { Pool } from "mysql2/promise";

const deviceClients = new Map<string, any>();

function updateDeviceActivity(device_id: string, ws: any) {
  deviceClients.set(device_id, { ws, lastSeen: Date.now() });
}

export function deviceWsRoutes(deviceService: DeviceService, db: Pool) {
  const deviceCommandService = new DeviceCommandService(db);
  
  return new Elysia({ prefix: "/ws" }).ws("/connect", {
    body: t.Object({
      type: t.String(),
      device_id: t.Optional(t.String()),
      secret: t.Optional(t.String()),
      status: t.Optional(t.String()),
      sensor: t.Optional(t.Any()),
      message: t.Optional(t.String()),
      // Tambahan untuk command acknowledgment
      command_id: t.Optional(t.Number()),
      success: t.Optional(t.Boolean()),
      // Tambahan untuk control status
      controls: t.Optional(t.Any()),
      // Tambahan untuk datastream payload
      datastream_id: t.Optional(t.Number()),
      value: t.Optional(t.Any()),
    }),
    open(ws) {
      ws.send({ type: "hello", message: "Send your device_id" });
    },
    async message(ws, data) {
      // Register device by secret
      if (data.type === "register" && data.secret) {
        try {
          // @ts-ignore
          const deviceArr = await deviceService.getDeviceBySecret(data.secret);
          const device = Array.isArray(deviceArr) ? deviceArr[0] : deviceArr;
          // @ts-ignore
          if (device && device.id) {
            updateDeviceActivity(device.id.toString(), ws);
            ws.send({
              type: "registered",
              message: "Device berhasil didaftarkan",
              // @ts-ignore
              device_id: device.id.toString(),
            });
          } else {
            ws.send({
              type: "register_failed",
              message: "Device tidak ditemukan di database",
            });
          }
        } catch (error) {
          console.error("Error registering device:", error);
          ws.send({
            type: "register_failed",
            message: "Error saat registrasi device",
          });
        }
        return;
      }

      // 1. Device kirim data sensor via datastream
      if (data.type === "sensor_update" && data.device_id && data.datastream_id && data.value !== undefined) {
        updateDeviceActivity(data.device_id, ws);
        
        // Broadcast ke users dengan format yang sesuai dashboard
        broadcastToUsers({
          type: "sensor_update",
          device_id: parseInt(data.device_id),
          datastream_id: data.datastream_id,
          value: data.value,
          timestamp: new Date().toISOString(),
        });
        
        ws.send({ 
          type: "sensor_received", 
          message: "Data sensor berhasil diterima",
          datastream_id: data.datastream_id 
        });
      }
      
      // 2. Device kirim status online/offline
      if (data.type === "heartbeat" && data.device_id) {
        updateDeviceActivity(data.device_id, ws);
        
        // Update device status ke online di database
        try {
          await deviceService.updateDeviceStatus(data.device_id, "online");
        } catch (error) {
          console.error("Error updating device status:", error);
        }
        
        broadcastToUsers({
          type: "status_update",
          device_id: parseInt(data.device_id),
          status: "online",
          last_seen: new Date().toISOString(),
        });
        
        ws.send({ type: "heartbeat_received", message: "Heartbeat received" });
      }

      // 3. Device acknowledge command execution
      if (data.type === "command_ack" && data.device_id && data.command_id !== undefined) {
        updateDeviceActivity(data.device_id, ws);
        
        try {
          // Update command status in database
          const status = data.success ? "acknowledged" : "failed";
          await deviceCommandService.updateCommandStatus(
            data.command_id,
            status,
            new Date()
          );
          
          console.log(`✅ Command ${data.command_id} acknowledged by device ${data.device_id}: ${data.success ? 'SUCCESS' : 'FAILED'}`);
          
          // Broadcast to users that command was executed
          broadcastToUsers({
            type: "command_executed",
            device_id: parseInt(data.device_id),
            command_id: data.command_id,
            success: data.success,
            timestamp: new Date().toISOString(),
          });
          
          ws.send({ 
            type: "command_ack_received", 
            message: "Command acknowledgment processed",
            command_id: data.command_id 
          });
        } catch (error) {
          console.error("Error processing command ack:", error);
          ws.send({ 
            type: "error", 
            message: "Failed to process command acknowledgment" 
          });
        }
      }

      // 4. Device report control values (current actuator states via datastream)
      if (data.type === "control_status" && data.device_id && data.datastream_id !== undefined && data.value !== undefined) {
        updateDeviceActivity(data.device_id, ws);
        
        // Broadcast current control state to users
        broadcastToUsers({
          type: "control_status_update",
          device_id: parseInt(data.device_id),
          datastream_id: data.datastream_id,
          value: data.value,
          timestamp: new Date().toISOString(),
        });
        
        ws.send({ 
          type: "control_status_received", 
          message: "Control status updated",
          datastream_id: data.datastream_id 
        });
      }
    },
    close(ws) {
      // Update device status to offline when connection closes
      for (const [device_id, client] of deviceClients.entries()) {
        if (client.ws === ws) {
          deviceClients.delete(device_id);
          
          // Update database status
          deviceService.updateDeviceStatus(device_id, "offline").catch(console.error);
          
          // Broadcast offline status
          broadcastToUsers({
            type: "status_update",
            device_id: parseInt(device_id),
            status: "offline",
            last_seen: new Date().toISOString(),
          });
        }
      }
    },
  });
}


// Heartbeat checker untuk auto-offline detection
// setInterval(async () => {
//   const now = Date.now();
//   for (const [device_id, { ws, lastSeen }] of deviceClients.entries()) {
//     // Jika tidak ada heartbeat selama 30 detik, set offline
//     if (now - lastSeen > 30000) {
//       deviceClients.delete(device_id);
      
//       try {
//         // Update database status
//         const deviceService = new DeviceService(/* db instance */);
//         await deviceService.updateDeviceStatus(device_id, "offline");
        
//         // Broadcast offline status
//         broadcastToUsers({
//           type: "status_update",
//           device_id: parseInt(device_id),
//           status: "offline",
//           last_seen: new Date(lastSeen).toISOString(),
//         });
//       } catch (error) {
//         console.error("Error updating offline status:", error);
//       }
//     }
//   }
// }, 10000); // Cek setiap 10 detik

export function sendToDevice(device_id: string, data: any) {
  const client = deviceClients.get(device_id);
  if (client && client.ws) {
    client.ws.send(data);
    return true;
  }
  return false;
}
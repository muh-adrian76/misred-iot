/**
 * ===== DEVICE WEBSOCKET ROUTES - KOMUNIKASI REAL-TIME DENGAN DEVICE IoT =====
 * File ini mengatur koneksi WebSocket untuk komunikasi langsung dengan device IoT
 * Meliputi: device registration, sensor updates, heartbeat, command acknowledgment, control status
 */

import { Elysia, t } from "elysia";
import { broadcastToDeviceOwner } from "./user-ws";
import { DeviceService } from '../../services/DeviceService';
import { DeviceStatusService } from '../../services/DeviceStatusService';
import { DeviceCommandService } from '../../services/DeviceCommandService';
import { Pool } from "mysql2/promise";

// Map untuk menyimpan koneksi WebSocket dari device yang aktif
const deviceClients = new Map<string, any>();

// Variabel global untuk database dan services
let globalDb: Pool;
let globalDeviceService: DeviceService;
let globalDeviceStatusService: DeviceStatusService;

// Update aktivitas device dan simpan koneksi WebSocket
function updateDeviceActivity(device_id: string, ws: any) {
  deviceClients.set(device_id, { ws, lastSeen: Date.now() });
}

export function deviceWsRoutes(deviceService: DeviceService, deviceStatusService: DeviceStatusService, db: Pool) {
  // Simpan reference untuk digunakan di fungsi lain
  globalDb = db;
  globalDeviceService = deviceService;
  globalDeviceStatusService = deviceStatusService;
  
  const deviceCommandService = new DeviceCommandService(db);
  
  // Mulai heartbeat checker untuk deteksi device offline otomatis
  startHeartbeatChecker(deviceStatusService, db);
  
  return new Elysia({ prefix: "/ws" }).ws("/connect", {
    body: t.Object({
      type: t.String(),
      device_id: t.Optional(t.String()),
      secret: t.Optional(t.String()),
      status: t.Optional(t.String()),
      sensor: t.Optional(t.Any()),
      message: t.Optional(t.String()),
      // Parameter untuk command acknowledgment
      command_id: t.Optional(t.Number()),
      success: t.Optional(t.Boolean()),
      // Parameter untuk control status
      controls: t.Optional(t.Any()),
      // Parameter untuk datastream payload
      datastream_id: t.Optional(t.Number()),
      value: t.Optional(t.Any()),
    }),
    // Handler ketika koneksi WebSocket terbuka
    open(ws) {
      ws.send(JSON.stringify({ type: "hello", message: "Send your device_id" })); // Kirim greeting message
    },
    async message(ws, data) {
      // ===== DEVICE REGISTRATION HANDLER =====
      // Registrasi device menggunakan secret key
      if (data.type === "register" && data.secret) {
        try {
          // Cari device berdasarkan secret key menggunakan raw query
          const [rows] = await db.query(
            "SELECT id, description FROM devices WHERE new_secret = ? OR old_secret = ?",
            [data.secret, data.secret]
          );
          const devices = rows as any[];
          const device = devices.length > 0 ? devices[0] : null;
          
          if (device && device.id) {
            // Update aktivitas device dan simpan koneksi
            updateDeviceActivity(device.id.toString(), ws);
            ws.send(JSON.stringify({
              type: "registered",
              message: "Device berhasil didaftarkan",
              device_id: device.id.toString(),
            }));
          } else {
            ws.send(JSON.stringify({
              type: "register_failed",
              message: "Device tidak ditemukan di database",
            }));
          }
        } catch (error) {
          console.error("Error registering device:", error);
          ws.send(JSON.stringify({
            type: "register_failed",
            message: "Error saat registrasi device",
          }));
        }
        return;
      }

      // ===== SENSOR DATA UPDATE HANDLER =====
      // Device kirim data sensor via datastream
      if (data.type === "sensor_update" && data.device_id && data.datastream_id && data.value !== undefined) {
        updateDeviceActivity(data.device_id, ws);
        
        // Broadcast data sensor ke user pemilik device
        await broadcastToDeviceOwner(db, parseInt(data.device_id), {
          type: "sensor_update",
          device_id: parseInt(data.device_id),
          datastream_id: data.datastream_id,
          value: data.value,
          timestamp: new Date().toISOString(),
        });
        
        ws.send(JSON.stringify({ 
          type: "sensor_received", 
          message: "Data sensor berhasil diterima",
          datastream_id: data.datastream_id 
        }));
      }
      
      // ===== DEVICE HEARTBEAT HANDLER =====
      // Device kirim status online/offline secara berkala
      if (data.type === "heartbeat" && data.device_id) {
        updateDeviceActivity(data.device_id, ws);
        
        // Update status device ke online di database menggunakan DeviceStatusService
        try {
          await deviceStatusService.updateDeviceStatusOnly(data.device_id, "online");
        } catch (error) {
          console.error("Error updating device status:", error);
        }
        
        // Broadcast status online ke user pemilik device
        await broadcastToDeviceOwner(db, parseInt(data.device_id), {
          type: "status_update",
          device_id: parseInt(data.device_id),
          status: "online",
          last_seen: new Date().toISOString(),
        });
        
        ws.send(JSON.stringify({ type: "heartbeat_received", message: "Heartbeat received" }));
      }

      // ===== COMMAND ACKNOWLEDGMENT HANDLER =====
      // Device konfirmasi eksekusi command yang diterima
      if (data.type === "command_ack" && data.device_id && data.command_id !== undefined) {
        updateDeviceActivity(data.device_id, ws);
        
        try {
          // Update status command di database
          const status = data.success ? "acknowledged" : "failed";
          await deviceCommandService.updateCommandStatus(
            data.command_id,
            status,
            new Date()
          );
          
          console.log(`✅ Command ${data.command_id} acknowledged by device ${data.device_id}: ${data.success ? 'SUCCESS' : 'FAILED'}`);
          
          // Broadcast ke user pemilik device bahwa command telah dieksekusi
          await broadcastToDeviceOwner(db, parseInt(data.device_id), {
            type: "command_executed",
            device_id: parseInt(data.device_id),
            command_id: data.command_id,
            success: data.success,
            timestamp: new Date().toISOString(),
          });
          
          ws.send(JSON.stringify({ 
            type: "command_ack_received", 
            message: "Command acknowledgment processed",
            command_id: data.command_id 
          }));
        } catch (error) {
          console.error("Error processing command ack:", error);
          ws.send(JSON.stringify({ 
            type: "error", 
            message: "Failed to process command acknowledgment" 
          }));
        }
      }

      // ===== CONTROL STATUS UPDATE HANDLER =====
      // Device melaporkan status current actuator via datastream
      if (data.type === "control_status" && data.device_id && data.datastream_id !== undefined && data.value !== undefined) {
        updateDeviceActivity(data.device_id, ws);
        
        // Broadcast status control saat ini ke user pemilik device
        await broadcastToDeviceOwner(db, parseInt(data.device_id), {
          type: "control_status_update",
          device_id: parseInt(data.device_id),
          datastream_id: data.datastream_id,
          value: data.value,
          timestamp: new Date().toISOString(),
        });
        
        ws.send(JSON.stringify({ 
          type: "control_status_received", 
          message: "Control status updated",
          datastream_id: data.datastream_id 
        }));
      }
    },
    // Handler ketika koneksi WebSocket ditutup
    close(ws) {
      // Update status device ke offline ketika koneksi putus
      for (const [device_id, client] of deviceClients.entries()) {
        if (client.ws === ws) {
          deviceClients.delete(device_id);
          
          // Update status di database menggunakan DeviceStatusService
          globalDeviceStatusService.updateDeviceStatusOnly(device_id, "offline")
            .then(async () => {
              // BROADCAST STATUS UPDATE ke frontend untuk real-time update
              await broadcastToDeviceOwner(globalDb, parseInt(device_id), {
                type: "status_update",
                device_id: parseInt(device_id),
                status: "offline",
                last_seen: new Date().toISOString(),
              });
              
              // SEND DEVICE OFFLINE NOTIFICATION (WhatsApp + Browser + Database log)
              await globalDeviceStatusService.sendDeviceOfflineNotification(parseInt(device_id));
              
              console.log(`🔴 Device ${device_id} marked as offline due to connection close`);
            })
            .catch(console.error);
        }
      }
    },
  });
}


// ===== HEARTBEAT CHECKER - AUTO OFFLINE DETECTION =====
// Fungsi untuk mengecek SEMUA device yang tidak mengirim data selama 60 detik
export function startHeartbeatChecker(deviceStatusService: DeviceStatusService, db: Pool) {
  return setInterval(async () => {
    try {
      // Cek semua device aktif dari database, bukan hanya WebSocket clients
      const [activeDevices]: any = await db.query(
        `SELECT id, description, status, last_seen_at, offline_timeout_minutes 
         FROM devices 
         WHERE status = 'online'`
      );

      const now = Date.now();
      
      for (const device of activeDevices) {
        const deviceId = device.id.toString();
        const timeoutMinutes = device.offline_timeout_minutes || 1; // Default 1 menit
        const timeoutMs = timeoutMinutes * 60 * 1000; // Convert ke milliseconds
        let shouldMarkOffline = false;
        let lastSeenTime = 0;

        // Cek WebSocket devices (real-time connection)
        const wsClient = deviceClients.get(deviceId);
        if (wsClient) {
          // Device terhubung via WebSocket - cek heartbeat dengan timeout custom
          if (now - wsClient.lastSeen > timeoutMs) {
            shouldMarkOffline = true;
            deviceClients.delete(deviceId);
            console.log(`🔴 WebSocket device ${deviceId} offline - no heartbeat for ${timeoutMinutes}m`);
          }
        } else {
          // Device HTTP/MQTT - cek last_seen_at dari database dengan timeout custom
          if (device.last_seen_at) {
            lastSeenTime = new Date(device.last_seen_at).getTime();
            if (now - lastSeenTime > timeoutMs) {
              shouldMarkOffline = true;
              console.log(`🔴 HTTP/MQTT device ${deviceId} offline - no data for ${timeoutMinutes}m`);
            }
          } else if (device.status === 'online') {
            // Device online tapi tidak ada last_seen_at - anggap offline
            shouldMarkOffline = true;
            console.log(`🔴 Device ${deviceId} offline - no last_seen_at record`);
          }
        }

        // Mark device as offline dan kirim notifikasi
        if (shouldMarkOffline) {
          try {
            // Update status database ke offline
            await deviceStatusService.updateDeviceStatusOnly(deviceId, "offline");
            
            // BROADCAST STATUS UPDATE ke frontend untuk real-time update
            await broadcastToDeviceOwner(db, parseInt(deviceId), {
              type: "status_update",
              device_id: parseInt(deviceId),
              status: "offline",
              last_seen: device.last_seen_at || new Date().toISOString(),
            });
            
            // SEND DEVICE OFFLINE NOTIFICATION (WhatsApp + Browser + Database log)
            await deviceStatusService.sendDeviceOfflineNotification(parseInt(deviceId));
            
            console.log(`✅ Device ${deviceId} (${device.description}) marked as offline and notification sent`);
          } catch (error) {
            console.error(`❌ Error marking device ${deviceId} offline:`, error);
          }
        }
      }
    } catch (error) {
      console.error("❌ Error in heartbeat checker:", error);
    }
  }, 10000); // Cek setiap 10 detik
}

// ===== SEND COMMAND TO DEVICE =====
// Fungsi untuk mengirim command ke device tertentu
export function sendToDevice(device_id: string, data: any) {
  const client = deviceClients.get(device_id);
  if (client && client.ws) {
    client.ws.send(JSON.stringify(data)); // Serialize data ke JSON string
    return true;
  }
  return false;
}
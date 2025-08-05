/**
 * ===== USER WEBSOCKET ROUTES - KOMUNIKASI REAL-TIME DENGAN USER DASHBOARD =====
 * File ini mengatur koneksi WebSocket untuk user dashboard real-time
 * 
 * SIMPLIFIED APPROACH (NO JWT TOKEN):
 * - WebSocket endpoint: /ws/user/{user_id}
 * - Authentication dilakukan melalui refresh_token di database
 * - Broadcast hanya ke user yang refresh_token IS NOT NULL (online)
 * - Lebih sederhana dan VPS-compatible
 */

import { Elysia, t } from "elysia";
import { sendToDevice } from "./device-ws";

// Map untuk menyimpan koneksi user clients dengan user_id mereka
const userClients = new Map<string, Set<any>>(); // user_id -> Set of WebSocket connections
const wsPingIntervals = new Map<any, NodeJS.Timeout>();
const wsUserMapping = new Map<any, string>(); // WebSocket -> user_id
const PING_INTERVAL_MS = 30000; // 30 detik, optimal untuk VPS

export function userWsRoutes(db: any) {
  return new Elysia({ prefix: "/ws" })
  .ws("/user/:user_id", {
    // Remove strict body validation - messages are dynamic
    // body: t.Object({...}),
    
    // ===== WEBSOCKET CONNECTION OPEN HANDLER =====
    async open(ws) {
      try {
        const userId = ws.data.params?.user_id;
        if (!userId) {
          ws.close(1008, "No user_id");
          return;
        }
        
        // Validasi user online status via refresh_token (optional - untuk extra security)
        if (db) {
          try {
            const [rows]: any = await db.query(
              'SELECT id FROM users WHERE id = ? AND refresh_token IS NOT NULL',
              [userId]
            );
            if (!rows.length) {
              ws.close(1008, "User not online");
              return;
            }
          } catch (dbError) {
            // Lanjutkan tanpa validasi jika DB error
            console.warn("DB validation failed, allowing connection:", dbError);
          }
        }
        
        // Simpan mapping dan koneksi
        wsUserMapping.set(ws, userId);
        if (!userClients.has(userId)) {
          userClients.set(userId, new Set());
        }
        userClients.get(userId)!.add(ws);
        
        // Ping interval untuk keep-alive
        const pingInterval = setInterval(() => {
          try {
            ws.send(JSON.stringify({ type: "ping", timestamp: Date.now() }));
          } catch (err) {
            clearInterval(pingInterval);
          }
        }, PING_INTERVAL_MS);
        wsPingIntervals.set(ws, pingInterval);
        
      } catch (error) {
        ws.close(1008, "Connection failed");
      }
    },
    
    // ===== MESSAGE HANDLER =====
    message(ws, rawData) {
      try {
        // Safe type casting untuk WebSocket message
        const data = rawData as any;
        
        // Basic validation
        if (!data || typeof data !== 'object' || !data.type) {
          console.warn("❌ Invalid WebSocket message format:", rawData);
          return;
        }
        
        if (data.type === "pong") return;
        
        // Device command
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
          ws.send(JSON.stringify({
            type: "command_sent", 
            device_id: data.device_id,
            command_id: commandPayload.command_id,
            message: `Command sent to device ${data.device_id}`
          }));
          return;
        }
        
        // Legacy command support
        if (data.type === "command" && data.device_id && data.command) {
          sendToDevice(data.device_id, {
            type: "command",
            command: data.command,
            value: data.value,
          });
          ws.send(JSON.stringify({ type: "command_sent", device_id: data.device_id }));
          return;
        }
        
        // Echo test
        if (data.type === "echo") {
          ws.send(JSON.stringify({ type: "echo", message: data.message }));
          return;
        }
        
        // Log unknown message types for debugging
        console.log("📥 Unknown WebSocket message type:", data.type);
        
      } catch (error) {
        console.error("❌ Error processing WebSocket message:", error, rawData);
      }
    },
    
    // ===== CONNECTION CLOSE HANDLER =====
    close(ws) {
      const userId = wsUserMapping.get(ws);
      if (userId) {
        const userSockets = userClients.get(userId);
        if (userSockets) {
          userSockets.delete(ws);
          if (userSockets.size === 0) {
            userClients.delete(userId);
          }
        }
        wsUserMapping.delete(ws);
      }
      
      const pingInterval = wsPingIntervals.get(ws);
      if (pingInterval) {
        clearInterval(pingInterval);
        wsPingIntervals.delete(ws);
      }
    }
  });
}

// ===== OPTIMIZED BROADCAST FUNCTIONS =====

// ===== BROADCAST TO DEVICE OWNER (NEW SIMPLIFIED APPROACH) =====
// Broadcast data sensor ke pemilik device yang online (menggunakan refresh_token)
export async function broadcastToDeviceOwner(db: any, deviceId: number, data: any) {
  try {
    console.log(`📡 broadcastToDeviceOwner called for device ${deviceId}, data:`, data);
    
    // Single query untuk mendapatkan user_id dan cek online status sekaligus
    const [rows]: any = await db.query(
      `SELECT u.id as user_id 
       FROM devices d 
       JOIN users u ON d.user_id = u.id 
       WHERE d.id = ? AND u.refresh_token IS NOT NULL`,
      [deviceId]
    );
    
    if (!rows.length) {
      console.log(`⚠️ Device ${deviceId} not found or user not online`);
      return false; // Device tidak ditemukan atau user tidak online
    }
    
    const userId = rows[0].user_id.toString();
    console.log(`📡 Broadcasting to user ${userId} for device ${deviceId}`);
    const result = broadcastToSpecificUser(userId, data);
    console.log(`${result ? '✅' : '❌'} Broadcast result for device ${deviceId}: ${result}`);
    return result;
    
  } catch (error) {
    console.error("❌ Error in broadcastToDeviceOwner:", error);
    return false;
  }
}

// ===== BROADCAST TO SPECIFIC USER =====
// Fungsi untuk broadcast ke user spesifik berdasarkan user_id
export function broadcastToSpecificUser(userId: string, data: any) {
  const userSockets = userClients.get(userId);
  if (userSockets && userSockets.size > 0) {
    const jsonData = JSON.stringify(data);
    let successCount = 0;
    for (const ws of userSockets) {
      try {
        ws.send(jsonData);
        successCount++;
      } catch (error) {
        // Fail silently - frontend has failover
      }
    }
    return successCount > 0;
  }
  return false;
}

// ===== BROADCAST TO ALL USERS =====
// Fungsi untuk broadcast ke semua user yang terhubung (untuk notifikasi global)
export function broadcastToAllUsers(data: any) {
  const jsonData = JSON.stringify(data);
  let totalSent = 0;
  
  for (const [userId, userSockets] of userClients.entries()) {
    if (userSockets && userSockets.size > 0) {
      for (const ws of userSockets) {
        try {
          ws.send(jsonData);
          totalSent++;
        } catch (error) {
          // Fail silently - frontend has failover
        }
      }
    }
  }
  
  return totalSent;
}
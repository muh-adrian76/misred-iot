/**
 * ===== USER WEBSOCKET ROUTES - KOMUNIKASI REAL-TIME DENGAN USER DASHBOARD =====
 * File ini mengatur koneksi WebSocket untuk user dashboard real-time
 * Meliputi: user authentication, device command, broadcast data sensor, ping/pong heartbeat
 */

import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { authorizeRequest } from "../../lib/utils";
import { sendToDevice } from "./device-ws"; // pastikan path benar

// Map untuk menyimpan koneksi user clients dengan user_id mereka
const userClients = new Map<string, Set<any>>(); // user_id -> Set of WebSocket connections
const wsPingIntervals = new Map<any, NodeJS.Timeout>();
const wsUserMapping = new Map<any, string>(); // WebSocket -> user_id
const PING_INTERVAL_MS = 25000; // 25 detik, aman untuk browser dan proxy

export const userWsRoutes = new Elysia({ prefix: "/ws" })
  .use(jwt({ name: 'jwt', secret: process.env.JWT_SECRET! }))
  .ws("/user/:token", {
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
    // ===== WEBSOCKET CONNECTION OPEN HANDLER =====
    async open(ws) {
      try {
        
        // Ambil WebSocket token dari URL parameter
        const wsToken = ws.data.params?.token;
        
        if (!wsToken) {
          ws.close(1008, "Authentication failed: No WebSocket token");
          return;
        }
        
        // Verify WebSocket token dengan JWT
        let decoded;
        try {
          // Debug token websocket untuk development
          // console.log("- Params:", ws.data.params);
          // console.log("🔍 Token length:", wsToken.length);
          // console.log("🔍 Token first 50 chars:", wsToken.substring(0, 50) + "...");
          
          decoded = await ws.data.jwt.verify(wsToken);
          
          // console.log("🔍 Token verification result:", {
          //   hasDecoded: !!decoded,
          //   decodedType: typeof decoded,
          //   sub: decoded ? (decoded as any).sub : null,
          //   type: decoded ? (decoded as any).type : null,
          //   exp: decoded ? (decoded as any).exp : null
          // });
          
          if (!decoded || typeof decoded === 'string' || !decoded.sub) {
            console.log("❌ Invalid WebSocket token structure:", decoded);
            ws.close(1008, "Authentication failed: Invalid token structure");
            return;
          }
          
          // Check jika token khusus untuk WebSocket
          if (decoded.type !== "websocket") {
            console.log("❌ Token is not a WebSocket token, type:", decoded.type);
            ws.close(1008, "Authentication failed: Invalid token type");
            return;
          }

          // Check jika token belum expired
          if (decoded.exp && typeof decoded.exp === 'number' && decoded.exp < Math.floor(Date.now() / 1000)) {
            console.log("❌ WebSocket token has expired, exp:", decoded.exp, "now:", Math.floor(Date.now() / 1000));
            ws.close(1008, "Authentication failed: Token expired");
            return;
          }
          
          // console.log("✅ WebSocket token verified for user:", decoded.sub);
          
        } catch (error: any) {
          console.log("❌ WebSocket token verification failed:", error?.message || error);
          console.log("❌ Full error object:", error);
          ws.close(1008, "Authentication failed: Token verification failed");
          return;
        }

        const userId = decoded.sub;
        
        // console.log(`🔌 User ${userId} telah terkoneksi via WebSocket`);
        
        // Simpan mapping WebSocket ke user_id
        wsUserMapping.set(ws, userId);
        
        // Tambahkan WebSocket ke user's client set
        if (!userClients.has(userId)) {
          userClients.set(userId, new Set());
        }
        userClients.get(userId)!.add(ws);
        
        // Mulai interval ping untuk menjaga koneksi tetap hidup
        const pingInterval = setInterval(() => {
          try {
            ws.send(JSON.stringify({ type: "ping", timestamp: new Date().toISOString() })); // Serialize ping message
          } catch (err) {
            // Jika error, kemungkinan koneksi sudah tutup
            clearInterval(pingInterval);
          }
        }, PING_INTERVAL_MS);
        wsPingIntervals.set(ws, pingInterval);
        
      } catch (error: any) {
        console.error("❌ WebSocket authentication failed:", error?.message || error);
        console.error("Full error:", error);
        
        // Provide error message yang lebih spesifik
        if (error?.message?.includes("token")) {
          ws.close(1008, "Authentication failed: Invalid token");
        } else {
          ws.close(1008, "Authentication failed");
        }
      }
    },
    // ===== MESSAGE HANDLER DARI USER =====
    message(ws, data) {
      // Handler untuk pong response dari client
      if (data.type === "pong") {
        // Bisa tambahkan logika jika ingin cek latency, dsb
        return;
      }
      
      // ===== SEND DEVICE COMMAND (NEW FORMAT) =====
      // Kirim command ke device dengan struktur command yang lebih baik
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
        ws.send(JSON.stringify({ // Serialize command_sent response
          type: "command_sent", 
          device_id: data.device_id,
          command_id: commandPayload.command_id,
          message: `Command berhasil dikirim ke device ${data.device_id}`
        }));
      }
      
      // ===== LEGACY COMMAND SUPPORT =====
      // Support untuk command format lama (backward compatibility)
      if (data.type === "command" && data.device_id && data.command) {
        sendToDevice(data.device_id, {
          type: "command",
          command: data.command,
          value: data.value,
        });
        ws.send(JSON.stringify({ type: "command_sent", device_id: data.device_id })); // Serialize response
      }
      
      // ===== ECHO HANDLER =====
      // Echo handler untuk testing koneksi WebSocket
      if (data.type === "echo") {
        ws.send(JSON.stringify({ type: "echo", message: data.message })); // Serialize echo response
      }
    },
    
    // ===== WEBSOCKET CONNECTION CLOSE HANDLER =====
    close(ws) {
      // Ambil user_id dari mapping
      const userId = wsUserMapping.get(ws);
      if (userId) {
        // Hapus WebSocket dari user's client set
        const userSockets = userClients.get(userId);
        if (userSockets) {
          userSockets.delete(ws);
          // Jika tidak ada socket lagi untuk user ini, hapus entry
          if (userSockets.size === 0) {
            userClients.delete(userId);
          }
        }
        wsUserMapping.delete(ws);
      }
      
      // Hentikan interval ping jika koneksi tutup
      const pingInterval = wsPingIntervals.get(ws);
      if (pingInterval) {
        clearInterval(pingInterval);
        wsPingIntervals.delete(ws);
      }
    }
  });

// ===== BROADCAST TO USERS BY DEVICE OWNERSHIP =====
// Broadcast data sensor HANYA ke user yang memiliki device tersebut (SECURE)
export async function broadcastToUsersByDevice(db: any, deviceId: number, data: any) {
  try {
    // Ambil user_id pemilik device dari database
    const [deviceRows]: any = await db.query(
      "SELECT user_id FROM devices WHERE id = ?",
      [deviceId]
    );
    
    if (!deviceRows.length) {
      console.warn(`Device ${deviceId} not found for broadcasting`);
      return;
    }
    
    const ownerId = deviceRows[0].user_id.toString();
    
    // Broadcast hanya ke user pemilik device (SECURE)
    const userSockets = userClients.get(ownerId);
    if (userSockets && userSockets.size > 0) {
      const jsonData = JSON.stringify(data); // Serialize data ke JSON string
      for (const ws of userSockets) {
        try {
          ws.send(jsonData); // Kirim JSON string, bukan objek JavaScript
        } catch (error) {
          console.error(`Error sending to user ${ownerId}:`, error);
        }
      }
    } else {
      // Debug koneksi websocket user
      // console.log(`📭 User ${ownerId} tidak terhubung via WebSocket`);
    }
  } catch (error) {
    console.error("Error in broadcastToUsersByDevice:", error);
  }
}

// ===== BROADCAST TO ALL USERS (DEPRECATED) =====
// Fungsi lama untuk broadcast ke semua user - TIDAK AMAN, gunakan broadcastToUsersByDevice()
export function broadcastToUsers(data: any) {
  console.warn("⚠️ DEPRECATED: broadcastToUsers() broadcasts to ALL users. Use broadcastToUsersByDevice() instead for security.");
  const jsonData = JSON.stringify(data); // Serialize data ke JSON string
  for (const [userId, userSockets] of userClients) {
    for (const ws of userSockets) {
      try {
        ws.send(jsonData); // Kirim JSON string, bukan objek JavaScript
      } catch (error) {
        console.error(`Error broadcasting to user ${userId}:`, error);
      }
    }
  }
}

// ===== BROADCAST TO SPECIFIC USER =====
// Fungsi untuk broadcast ke user spesifik berdasarkan user_id
export function broadcastToSpecificUser(userId: string, data: any) {
  const userSockets = userClients.get(userId);
  if (userSockets && userSockets.size > 0) {
    const jsonData = JSON.stringify(data); // Serialize data ke JSON string
    for (const ws of userSockets) {
      try {
        ws.send(jsonData); // Kirim JSON string, bukan objek JavaScript
      } catch (error) {
        console.error(`Error sending to user ${userId}:`, error);
      }
    }
    return true;
  }
  return false;
}
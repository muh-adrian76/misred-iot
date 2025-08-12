/**
 * ===== USER WEBSOCKET ROUTES - KOMUNIKASI REAL-TIME DENGAN USER DASHBOARD =====
 * File ini mengatur koneksi WebSocket untuk user dashboard real-time
 * 
 * PENDEKATAN SEDERHANA (TANPA JWT TOKEN):
 * - Endpoint WebSocket: /ws/user/{user_id}
 * - Autentikasi dilakukan melalui refresh_token di database
 * - Broadcast hanya ke user yang refresh_token IS NOT NULL (online)
 * - Lebih sederhana dan cocok untuk VPS
 */

import { Elysia, t } from "elysia";
import { sendToDevice } from "./device-ws";

// Map untuk menyimpan koneksi user clients dengan user_id mereka
const userClients = new Map<string, Set<any>>(); // user_id -> Set of WebSocket connections
const wsPingIntervals = new Map<any, NodeJS.Timeout>();
const wsUserMapping = new Map<any, string>(); // WebSocket -> user_id
const PING_INTERVAL_MS = 30000; // 30 detik, optimal untuk VPS

export function userWsRoutes(db: any) {
  // Helper agar selalu pakai pool aktif (menghindari pool lama yang sudah ditutup)
  const runQuery = async (sql: string, params: any[] = []) => {
    try {
      return await (db as any).safeQuery(sql, params);
    } catch (err) {
      console.error("❌ user-ws runQuery gagal:", err);
      throw err;
    }
  };

  return new Elysia({ prefix: "/ws" })
  .ws("/user/:user_id", {
    // Hilangkan validasi ketat pada body - pesan bersifat dinamis
    // body: t.Object({...}),
    
    // ===== HANDLER SAAT KONEKSI WEBSOCKET TERBUKA =====
    async open(ws) {
      try {
        const userId = ws.data.params?.user_id;
        if (!userId) {
          ws.close(1008, "user_id tidak ada");
          return;
        }
        
        // Validasi status online user via refresh_token (opsional - untuk keamanan tambahan)
        try {
          const [rows]: any = await runQuery(
            'SELECT id FROM users WHERE id = ? AND refresh_token IS NOT NULL',
            [userId]
          );
          if (!rows.length) {
            ws.close(1008, "Pengguna tidak online");
            return;
          }
        } catch (dbError) {
          console.warn("⚠️ Validasi DB gagal (melanjutkan tanpa blokir):", dbError);
        }
        
        // Simpan mapping dan koneksi
        wsUserMapping.set(ws, userId);
        if (!userClients.has(userId)) {
          userClients.set(userId, new Set());
        }
        userClients.get(userId)!.add(ws);
        
        // Interval ping untuk keep-alive
        const pingInterval = setInterval(() => {
          try {
            ws.send(JSON.stringify({ type: "ping", timestamp: Date.now() }));
          } catch (err) {
            clearInterval(pingInterval);
          }
        }, PING_INTERVAL_MS);
        wsPingIntervals.set(ws, pingInterval);
        
      } catch (error) {
        ws.close(1008, "Koneksi gagal");
      }
    },
    
    // ===== HANDLER PESAN =====
    message(ws, rawData) {
      try {
        // Casting tipe yang aman untuk pesan WebSocket
        const data = rawData as any;
        
        // Validasi dasar
        if (!data || typeof data !== 'object' || !data.type) {
          console.warn("❌ Format pesan WebSocket tidak valid:", rawData);
          return;
        }
        
        if (data.type === "pong") return;
        
        // Perintah ke perangkat
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
            message: `Perintah dikirim ke perangkat ${data.device_id}`
          }));
          return;
        }
        
        // Dukungan perintah legacy
        if (data.type === "command" && data.device_id && data.command) {
          sendToDevice(data.device_id, {
            type: "command",
            command: data.command,
            value: data.value,
          });
          ws.send(JSON.stringify({ type: "command_sent", device_id: data.device_id }));
          return;
        }
        
        // Uji echo
        if (data.type === "echo") {
          ws.send(JSON.stringify({ type: "echo", message: data.message }));
          return;
        }
        
        // Log tipe pesan tidak dikenali untuk debugging
        console.log("📥 Tipe pesan WebSocket tidak dikenali:", data.type);
        
      } catch (error) {
        console.error("❌ Kesalahan memproses pesan WebSocket:", error, rawData);
      }
    },
    
    // ===== HANDLER SAAT KONEKSI DITUTUP =====
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

// ===== FUNGSI BROADCAST YANG DIOPTIMALKAN =====

// ===== BROADCAST KE PEMILIK DEVICE (PENDEKATAN SEDERHANA) =====
// Broadcast data sensor ke pemilik device yang online (menggunakan refresh_token)
export async function broadcastToDeviceOwner(db: any, deviceId: number, data: any) {
  try {
    console.log(`📡 broadcastToDeviceOwner dipanggil untuk device ${deviceId}, data:`, data);
    
    // Gunakan safeQuery agar tahan terhadap pool reconnect
    const [rows]: any = await (db as any).safeQuery(
      `SELECT u.id as user_id 
         FROM devices d 
         JOIN users u ON d.user_id = u.id 
         WHERE d.id = ? AND u.refresh_token IS NOT NULL`,
      [deviceId]
    );
    
    if (!rows.length) {
      console.log(`⚠️ Perangkat ${deviceId} tidak ditemukan atau pengguna tidak online`);
      return false; // Device tidak ditemukan atau user tidak online
    }
    
    const userId = rows[0].user_id.toString();
    console.log(`📡 Mengirim broadcast ke pengguna ${userId} untuk device ${deviceId}`);
    const result = broadcastToSpecificUser(userId, data);
    console.log(`${result ? '✅' : '❌'} Hasil broadcast untuk device ${deviceId}: ${result}`);
    return result;
    
  } catch (error) {
    console.error("❌ Kesalahan di broadcastToDeviceOwner:", error);
    return false;
  }
}

// ===== BROADCAST KE USER TERTENTU =====
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
        // Abaikan error - frontend punya mekanisme failover
      }
    }
    return successCount > 0;
  }
  return false;
}

// ===== BROADCAST KE SEMUA USER =====
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
          // Abaikan error - frontend punya mekanisme failover
        }
      }
    }
  }
  
  return totalSent;
}
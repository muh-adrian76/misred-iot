import { Elysia } from "elysia";
import { authorizeRequest } from "../../lib/utils";
import { NotificationService } from "../../services/NotificationService";
import {
  getRecentNotificationsSchema,
  getNotificationHistorySchema,
  testApiConnectionSchema,
  sendTestNotificationSchema,
  sendDeviceOfflineNotificationSchema,
} from "./elysiaSchema";

export function notificationRoutes(
  notificationService: NotificationService
) {
  return new Elysia({ prefix: "/notifications" })
    // 📋 GET Notifikasi saat user login (semua notifikasi dengan status dibaca/belum dibaca)
    .get(
      "/",
      //@ts-ignore
      async ({ query, jwt, cookie, set }) => {
        try {
          const user = await authorizeRequest(jwt, cookie);
          
          if (!user || !user.sub) {
            console.error("❌ Pengguna belum terautentikasi");
            set.status = 401;
            return {
              success: false,
              message: "ID pengguna tidak ditemukan",
              notifications: [],
              total: 0
            };
          }
          
          const userId = parseInt(user.sub);

          // Validasi userId
          if (isNaN(userId) || userId <= 0) {
            console.error("❌ ID pengguna tidak valid:", user.sub);
            set.status = 400;
            return {
              success: false,
              message: "ID pengguna tidak valid",
              notifications: [],
              total: 0
            };
          }

          // Ambil semua notifikasi untuk pengguna (bukan hanya yang belum dibaca)
          // console.log(`🔍 Fetching recent notifications for user ${userId}`);
          const historyResult = await notificationService.getNotificationHistory(
            userId, 1, 50, "all" // halaman 1, limit 50, seluruh rentang waktu
          );
          // console.log(`📊 Found ${historyResult.total} total notifications, showing ${historyResult.notifications.length} recent`);

          // Format notifikasi untuk frontend sesuai skema baru
          const formattedNotifications = historyResult.notifications.map((row: any) => ({
            id: String(row.id),
            type: row.type || 'alarm',
            title: row.title || row.alarm_description || 'Notifikasi',
            message: row.message || `Perangkat: ${row.device_description}\nDatastream: ${row.datastream_description}(${row.field_name})\nNilai: ${row.sensor_value} (${row.conditions_text})`,
            priority: row.priority || 'medium',
            isRead: Boolean(row.is_read),
            createdAt: String(row.triggered_at),
            alarm_id: row.alarm_id || null,
            device_id: row.device_id || null,
            device_description: row.device_description || null,
            datastream_description: row.datastream_description || null,
            sensor_value: row.sensor_value ? Number(row.sensor_value) : null,
            condition_text: row.conditions_text || null,
            user_email: row.user_email
          }));

          return {
            success: true,
            message: formattedNotifications.length === 0 ? "Belum ada notifikasi" : "Berhasil mengambil notifikasi",
            notifications: formattedNotifications,
            total: historyResult.total,
            last_seen: new Date().toISOString()
          };
        } catch (error: any) {
          console.error("Kesalahan saat mengambil notifikasi:", error);
          
          // Periksa jika ini kesalahan koneksi database
          if (error.code === 'ER_WRONG_ARGUMENTS' || error.errno === 1210) {
            set.status = 503;
            return {
              success: false,
              message: "Gangguan koneksi database",
              notifications: [],
              total: 0
            };
          }
          
          // Kesalahan umum database
          if (error.errno) {
            set.status = 503;
            return {
              success: false,
              message: "Terjadi kesalahan pada database",
              notifications: [],
              total: 0
            };
          }
          
          set.status = 500;
          return {
            success: false,
            message: "Kesalahan server internal",
            notifications: [],
            total: 0
          };
        }
      },
      getRecentNotificationsSchema
    )

    // 📋 GET Riwayat Notifikasi dengan pagination dan filter rentang waktu
    .get(
      "/history",
      //@ts-ignore
      async ({ query, jwt, cookie, set }) => {
        try {
          const user = await authorizeRequest(jwt, cookie);
          
          if (!user || !user.sub) {
            set.status = 401;
            return {
              success: false,
              message: "Pengguna belum terautentikasi",
              notifications: [],
              pagination: {
                page: 1,
                limit: 20,
                total: 0,
                pages: 1
              }
            };
          }

          const userId = parseInt(user.sub);
          const page = Math.max(1, parseInt(query.page as string) || 1);
          const limit = Math.min(100, Math.max(1, parseInt(query.limit as string) || 20));
          const offset = (page - 1) * limit;
          const timeRange = query.timeRange as string || "all";
          const type = query.type as string || ""; // Tambahkan parameter filter tipe

          // console.log("📊 API Debug - Parsed parameters:", {
          //   userId: userId,
          //   userIdType: typeof userId,
          //   page: page,
          //   pageType: typeof page,
          //   limit: limit,
          //   limitType: typeof limit,
          //   offset: offset,
          //   offsetType: typeof offset,
          //   timeRange: timeRange
          // });

          // Validasi userId
          if (isNaN(userId) || userId <= 0) {
            console.error("❌ ID pengguna tidak valid:", user.sub);
            set.status = 400;
            return {
              success: false,
              message: "ID pengguna tidak valid"
            };
          }
          
          // Validasi parameter pagination
          if (isNaN(page) || page < 1) {
            set.status = 400;
            return {
              success: false,
              message: "Parameter halaman (page) tidak valid"
            };
          }

          if (isNaN(limit) || limit < 1 || limit > 100) {
            set.status = 400;
            return {
              success: false,
              message: "Parameter limit tidak valid (harus antara 1–100)"
            };
          }
          
          // Ambil riwayat notifikasi dari service
          console.log(`🔍 Mengambil riwayat notifikasi untuk pengguna ${userId}, halaman ${page}, limit ${limit}, rentang ${timeRange}, tipe ${type}`);
          const historyResult = await notificationService.getNotificationHistory(
            userId, page, limit, timeRange, type
          );
          console.log(`📊 Ditemukan total ${historyResult.total} notifikasi, mengembalikan ${historyResult.notifications.length} pada halaman ini`);

          const formattedNotifications = historyResult.notifications.map((row: any) => ({
            id: row.id,
            type: row.type || 'alarm',
            title: row.title || row.alarm_description || 'Notifikasi',
            message: row.message || `Perangkat: ${row.device_description}\nDatastream: ${row.datastream_description}\nNilai: ${row.sensor_value}`,
            priority: row.priority || 'medium',
            alarm_id: row.alarm_id || null,
            device_id: row.device_id || null,
            datastream_id: row.datastream_id || null,
            alarm_description: row.alarm_description || null,
            datastream_description: row.datastream_description || null,
            device_description: row.device_description || null,
            sensor_value: row.sensor_value ? Number(row.sensor_value) : null,
            conditions_text: row.conditions_text || null,
            triggered_at: String(row.triggered_at),
            whatsapp_sent: false, // Field tidak ada lagi di skema baru
            is_read: Boolean(row.is_read),
            read_at: String(row.triggered_at) // Gunakan triggered_at sebagai fallback
          }));

          return {
            success: true,
            message: historyResult.total === 0 ? "Belum ada riwayat notifikasi" : "Berhasil mengambil riwayat notifikasi",
            notifications: formattedNotifications,
            pagination: {
              page: page,
              limit: limit,
              total: historyResult.total,
              pages: Math.ceil(historyResult.total / limit) || 1
            }
          };

        } catch (error: any) {
          console.error("Kesalahan saat mengambil riwayat notifikasi:", error);
          console.error("Detail kesalahan:", {
            message: error.message,
            code: error.code,
            errno: error.errno,
            sqlMessage: error.sqlMessage,
            sql: error.sql
          });
          
          // Periksa jika ini kesalahan autentikasi dari authorizeRequest
          if (error.message && error.message.includes('Unauthorized')) {
            console.error("❌ Kesalahan autentikasi saat mengambil riwayat notifikasi:", error.message);
            set.status = 401;
            return {
              success: false,
              message: "Autentikasi gagal",
              notifications: [],
              pagination: {
                page: 1,
                limit: 20,
                total: 0,
                pages: 1
              }
            };
          }
          
          // Periksa jika ini kesalahan koneksi database
          if (error.code === 'ER_WRONG_ARGUMENTS' || error.errno === 1210) {
            set.status = 503;
            return {
              success: false,
              message: "Gangguan koneksi database",
              notifications: [],
              pagination: {
                page: 1,
                limit: 20,
                total: 0,
                pages: 1
              }
            };
          }
          
          // Kesalahan umum database
          if (error.errno) {
            set.status = 503;
            return {
              success: false,
              message: "Terjadi kesalahan pada database",
              notifications: [],
              pagination: {
                page: 1,
                limit: 20,
                total: 0,
                pages: 1
              }
            };
          }
          
          set.status = 500;
          return {
            success: false,
            message: "Kesalahan server internal",
            notifications: [],
            pagination: {
              page: 1,
              limit: 20,
              total: 0,
              pages: 1
            }
          };
        }
      },
      getNotificationHistorySchema
    )

    // ✅ Tandai semua notifikasi sebagai dibaca
    .put(
      "/read",
      //@ts-ignore
      async ({ jwt, cookie, set }) => {
        try {
          const user = await authorizeRequest(jwt, cookie);
          const userId = parseInt(user.sub);
          
          // Validasi userId
          if (isNaN(userId) || userId <= 0) {
            console.error("❌ ID pengguna tidak valid:", user.sub);
            set.status = 400;
            return {
              success: false,
              message: "ID pengguna tidak valid"
            };
          }
          const affectedRows = await notificationService.markAllAsRead(userId);
          
          return {
            success: true,
            message: "Semua notifikasi berhasil ditandai dibaca",
            affected_rows: affectedRows
          };
        } catch (error: any) {
          console.error("Kesalahan saat menandai semua notifikasi dibaca:", error);
          
          // Periksa jika ini kesalahan autentikasi dari authorizeRequest
          if (error.message && error.message.includes('Unauthorized')) {
            console.error("❌ Kesalahan autentikasi:", error.message);
            set.status = 401;
            return {
              success: false,
              message: "Autentikasi gagal"
            };
          }
          
          // Tangani kesalahan lainnya
          set.status = 500;
          return {
            success: false,
            message: "Kesalahan server internal"
          };
        }
      }
    )

    // 🗑️ Hapus semua notifikasi
    .delete(
      "/",
      //@ts-ignore
      async ({ jwt, cookie, set }) => {
        try {
          const user = await authorizeRequest(jwt, cookie);
          const userId = parseInt(user.sub);

          // Validasi userId
          if (isNaN(userId) || userId <= 0) {
            console.error("❌ ID pengguna tidak valid:", user.sub);
            set.status = 400;
            return {
              success: false,
              message: "ID pengguna tidak valid"
            };
          }

          // Hapus semua notifikasi untuk pengguna ini
          const affectedRows = await notificationService.deleteAllNotifications(userId);

          return {
            success: true,
            message: "Semua notifikasi berhasil dihapus",
            affected_rows: affectedRows
          };
        } catch (error) {
          console.error("Kesalahan saat menghapus semua notifikasi:", error);
          set.status = 500;
          return {
            success: false,
            message: "Kesalahan server internal"
          };
        }
      }
    )

    // 🧪 KIRIM Notifikasi Uji
    .post(
      "/test/send",
      //@ts-ignore
      async ({ body, set }) => {
        try {
          const { phone, message } = body as { phone: string; message: string };

          if (!phone || !message) {
            set.status = 400;
            return {
              success: false,
              message: "Nomor telepon dan pesan wajib diisi",
            };
          }

          const result = await notificationService.sendWhatsAppNotification(phone, message);

          return {
            success: result.success,
            message: result.success ? "Notifikasi uji berhasil dikirim" : "Gagal mengirim notifikasi uji",
            whatsapp_message_id: result.whatsapp_message_id,
            error_message: result.error_message,
          };
        } catch (error) {
          console.error("Kesalahan saat mengirim notifikasi uji:", error);
          set.status = 500;
          return {
            success: false,
            message: "Kesalahan server internal saat mengirim notifikasi uji",
          };
        }
      },
      sendTestNotificationSchema
    )

    // 🧪 UJI Notifikasi Perangkat Offline
    .post(
      "/test/device-offline/:deviceId",
      //@ts-ignore
      async ({ params, set }) => {
        try {
          const { deviceId } = params;
          
          if (!deviceId) {
            set.status = 400;
            return {
              success: false,
              message: "ID perangkat wajib diisi"
            };
          }

          console.log(`🧪 Menguji notifikasi perangkat offline untuk perangkat ${deviceId}`);
          
          // Import DeviceStatusService secara dinamis
          const { DeviceStatusService } = await import('../../services/DeviceStatusService');
          const deviceStatusService = new DeviceStatusService(notificationService.db, notificationService);
          
          // Trigger notifikasi perangkat offline
          await deviceStatusService.sendDeviceOfflineNotification(parseInt(deviceId));

          return {
            success: true,
            message: `Notifikasi uji perangkat offline dikirim untuk perangkat ${deviceId}`,
          };
        } catch (error) {
          console.error("Kesalahan saat mengirim notifikasi uji perangkat offline:", error);
          set.status = 500;
          return {
            success: false,
            message: "Kesalahan server internal saat mengirim notifikasi uji perangkat offline",
          };
        }
      }
    )

    // 🔄 RESET Koneksi WhatsApp
    .post(
      "/whatsapp/reset",
      //@ts-ignore
      async ({ set }) => {
        try {
          await notificationService.resetWhatsApp();
          return {
            success: true,
            message: "Koneksi WhatsApp berhasil direset",
          };
        } catch (error) {
          console.error("Kesalahan saat mereset koneksi WhatsApp:", error);
          set.status = 500;
          return {
            success: false,
            message: "Gagal mereset koneksi WhatsApp",
          };
        }
      }
    )

    // 📱 PAKSA QR Code Baru
    .post(
      "/whatsapp/qr",
      //@ts-ignore
      async ({ set }) => {
        try {
          await notificationService.forceNewQRCode();
          return {
            success: true,
            message: "Kode QR baru berhasil dibuat",
          };
        } catch (error) {
          console.error("Kesalahan saat membuat kode QR baru:", error);
          set.status = 500;
          return {
            success: false,
            message: "Gagal membuat kode QR baru",
          };
        }
      }
    )

    // 📊 Status WhatsApp
    .get(
      "/whatsapp/status",
      //@ts-ignore
      async ({ set }) => {
        try {
          const status = notificationService.getWhatsAppStatus();
          const systemHealth = notificationService.getSystemHealth();

          return {
            success: true,
            whatsapp_status: status,
            system_health: systemHealth,
            message: "Status WhatsApp berhasil diambil",
          };
        } catch (error) {
          console.error("Kesalahan saat mengambil status WhatsApp:", error);
          set.status = 500;
          return {
            success: false,
            message: "Gagal mengambil status WhatsApp",
          };
        }
      }
    )

    // 🔄 Toggle WhatsApp (Admin saja)
    .post(
      "/whatsapp/toggle",
      //@ts-ignore
      async ({ jwt, cookie, body, set }) => {
        try {
          const user = await authorizeRequest(jwt, cookie);
          
          // Cek apakah user adalah admin (pengecekan sederhana)
          if (!user || !user.sub) {
            set.status = 401;
            return {
              success: false,
              message: "Tidak terotorisasi",
            };
          }

          const { enabled } = body as { enabled: boolean };
          await notificationService.toggleWhatsAppService(enabled);

          return {
            success: true,
            message: `Layanan WhatsApp berhasil ${enabled ? 'diaktifkan' : 'dinonaktifkan'}`,
          };
        } catch (error) {
          console.error("Kesalahan saat mengubah status layanan WhatsApp:", error);
          set.status = 500;
          return {
            success: false,
            message: "Gagal mengubah status layanan WhatsApp",
          };
        }
      }
    )

    // 🔄 Mulai ulang WhatsApp (Admin saja)
    .post(
      "/whatsapp/restart",
      //@ts-ignore
      async ({ jwt, cookie, set }) => {
        try {
          const user = await authorizeRequest(jwt, cookie);
          
          // Cek apakah user adalah admin (pengecekan sederhana)
          if (!user || !user.sub) {
            set.status = 401;
            return {
              success: false,
              message: "Tidak terotorisasi",
            };
          }

          await notificationService.restartWhatsApp();

          return {
            success: true,
            message: "Layanan WhatsApp berhasil dimulai ulang",
          };
        } catch (error) {
          console.error("Kesalahan saat memulai ulang layanan WhatsApp:", error);
          set.status = 500;
          return {
            success: false,
            message: "Gagal memulai ulang layanan WhatsApp",
          };
        }
      }
    )

    // 📱 NOTIFIKASI PERANGKAT OFFLINE
    // Endpoint untuk mengirim notifikasi ketika perangkat offline
    .post(
      "/device-offline",
      //@ts-ignore
      async ({ body, jwt, cookie, set }) => {
        try {
          const user = await authorizeRequest(jwt, cookie);
          
          if (!user || !user.sub) {
            set.status = 401;
            return {
              success: false,
              message: "Akses tidak diizinkan"
            };
          }

          const userId = parseInt(user.sub);
          const { device_id, device_name } = body as { device_id: string; device_name: string };

          if (!device_id || !device_name) {
            set.status = 400;
            return {
              success: false,
              message: "Parameter device_id atau device_name tidak ada"
            };
          }

          // Verifikasi kepemilikan perangkat
          const db = notificationService.db;
          const [deviceRows]: any = await db.query(
            "SELECT id, user_id FROM devices WHERE id = ?",
            [device_id]
          );

          if (!deviceRows.length || deviceRows[0].user_id !== userId) {
            set.status = 403;
            return {
              success: false,
              message: "Perangkat tidak ditemukan atau akses ditolak"
            };
          }

          // Buat notifikasi perangkat offline
          console.log(`🔄 Membuat notifikasi perangkat offline via API untuk perangkat ${device_id}, pengguna ${userId}`);
          
          await db.query(
            "INSERT INTO notifications (user_id, type, title, message, priority, device_id, triggered_at, is_read) VALUES (?, ?, ?, ?, ?, ?, NOW(), FALSE)",
            [
              userId,
              "device_status",
              "Perangkat Offline",
              `Perangkat \"${device_name}\" telah offline dan tidak merespons`,
              "high",
              device_id
            ]
          );
          
          console.log(`✅ Notifikasi perangkat offline via API berhasil dibuat untuk perangkat ${device_id}`);

          // Kirim notifikasi real-time ke browser via WebSocket
          try {
            const { broadcastToSpecificUser } = await import('../ws/user-ws');
            const notificationData = {
              type: 'notification',
              data: {
                id: Date.now(), // ID sementara untuk notifikasi real-time
                type: 'device_status',
                title: 'Perubahan Status Perangkat',
                message: `Perangkat \"${device_name}\" telah offline dan tidak merespons`,
                priority: 'high',
                device_id: device_id,
                device_name: device_name,
                triggered_at: new Date().toISOString(),
                is_read: false
              }
            };
            
            console.log(`📡 Mengirim broadcast notifikasi perangkat offline ke pengguna ${userId} via WebSocket`);
            broadcastToSpecificUser(userId.toString(), notificationData);
          } catch (wsError) {
            console.error('Kesalahan saat broadcast notifikasi WebSocket:', wsError);
          }

          // Ambil data user untuk notifikasi WhatsApp
          const [userRows]: any = await db.query(
            "SELECT name, phone, whatsapp_notif FROM users WHERE id = ?",
            [userId]
          );

          const userData = userRows[0];

          // Kirim notifikasi WhatsApp bila diaktifkan
          if (userData && userData.whatsapp_notif && userData.phone) {
            try {
              await notificationService.sendWhatsAppNotification(
                userData.phone,
                `🔴 *Perubahan Status Perangkat*\n\nPerangkat \"${device_name}\" telah offline dan tidak merespons.\n\nSilakan periksa koneksi perangkat Anda.`
              );
            } catch (whatsappError) {
              console.error('Kesalahan saat mengirim notifikasi WhatsApp untuk perangkat offline:', whatsappError);
            }
          }

          console.log(`✅ Notifikasi perangkat offline terkirim untuk perangkat ${device_id} (${device_name}) ke pengguna ${userId}`);

          return {
            success: true,
            message: "Notifikasi perangkat offline berhasil dikirim"
          };

        } catch (error) {
          console.error("Kesalahan saat mengirim notifikasi perangkat offline:", error);
          set.status = 500;
          return {
            success: false,
            message: "Kesalahan server internal"
          };
        }
      },
      sendDeviceOfflineNotificationSchema
    );
}

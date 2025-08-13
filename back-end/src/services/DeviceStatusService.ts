/**
 * ===== DEVICE STATUS SERVICE =====
 * Service untuk monitoring status device secara real-time
 * Mengelola status online/offline berdasarkan aktivitas terakhir device
 * 
 * Fitur utama:
 * - Real-time device status monitoring (online/offline)
 * - Auto status update berdasarkan last_seen_at timestamp
 * - WebSocket broadcasting untuk status changes
 * - Periodic status checking dengan interval
 * - Device activity level classification
 * - Database connection health monitoring
 */
// DeviceStatusService.ts - Service untuk manage status device realtime
import { Pool } from 'mysql2/promise';
import { broadcastToDeviceOwner } from '../api/ws/user-ws';

export class DeviceStatusService {
  private static instance: DeviceStatusService;
  private db: Pool;
  private statusUpdateInterval: NodeJS.Timeout | null = null;
  private notificationService: any; // Shared notification service instance

  constructor(database: Pool, notificationService?: any) {
    this.db = database;
    this.notificationService = notificationService; // Use injected service if provided
    
    // Inisialisasi NotificationService secara asinkron jika tidak diinjeksikan
    if (!this.notificationService) {
      console.log('🔄 NotificationService tidak diinjeksikan, melakukan inisialisasi...');
      this.initializeNotificationService().then(() => {
        console.log('✅ NotificationService berhasil diinisialisasi di constructor DeviceStatusService');
      }).catch((error) => {
        console.error('❌ Gagal menginisialisasi NotificationService di constructor:', error);
      });
    }
    
    this.startStatusMonitoring();  // Mulai monitoring otomatis
  }

  // Initialize notification service only if not injected
  private async initializeNotificationService() {
    try {
      const { NotificationService } = await import('./NotificationService');
      this.notificationService = new NotificationService(this.db);
      console.log('✅ NotificationService berhasil diinisialisasi di DeviceStatusService');
    } catch (error) {
      console.error('❌ Gagal menginisialisasi NotificationService:', error);
    }
  }

  // Singleton pattern untuk memastikan hanya ada satu instance
  static getInstance(database: Pool): DeviceStatusService {
    if (!DeviceStatusService.instance) {
      DeviceStatusService.instance = new DeviceStatusService(database);
    }
    return DeviceStatusService.instance;
  }

  // ===== UPDATE DEVICE LAST SEEN =====
  // Update timestamp terakhir device terlihat ketika mengirim payload
  // Dipanggil dari PayloadService setiap kali menerima data dari device
  async updateDeviceLastSeen(deviceId: number): Promise<void> {
    try {
      // Cek koneksi database terlebih dahulu
      const isConnected = await this.checkDbConnection();
      if (!isConnected) {
        console.warn(`⚠️ Koneksi database tidak tersedia, pembaruan status untuk device ${deviceId} dilewati`);
        return;
      }

      const query = `
        UPDATE devices 
        SET last_seen_at = NOW(), status = 'online'
        WHERE id = ?
      `;
      
      await (this.db as any).safeQuery(query, [deviceId]);

      // Debug log untuk status update
      // console.log(`🟢 Status Device ${deviceId} diupdate menjadi online`);

      // Broadcast status update via WebSocket HANYA ke pemilik device
      await broadcastToDeviceOwner(this.db, deviceId, {
        type: "status_update",
        device_id: deviceId,
        status: "online",
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error(`❌ Gagal memperbarui last seen device ${deviceId}:`, error);
      // Jika error koneksi, coba restart monitoring
      if (error instanceof Error && error.message && error.message.includes('Pool is closed')) {
        console.warn('⚠️ Pool database tertutup, mencoba memulai ulang pemantauan status...');
        this.restartStatusMonitoring();
      }
    }
  }

  // ===== CHECK DB CONNECTION =====
  // Mengecek apakah koneksi database masih sehat
  private async checkDbConnection(): Promise<boolean> {
    try {
      await (this.db as any).safeQuery('SELECT 1');
      return true;
    } catch (error) {
      console.error('❌ Pemeriksaan koneksi database gagal:', error);
      return false;
    }
  }

  /**
   * Bulk update device statuses berdasarkan last_seen_at
   * Dipanggil secara periodic atau manual
   */
  async updateAllDeviceStatuses(): Promise<{ updated: number; offline: number; online: number }> {
    try {
      // Cek koneksi database terlebih dahulu
      const isConnected = await this.checkDbConnection();
      if (!isConnected) {
        console.warn('⚠️ Koneksi database tidak tersedia, pembaruan status dilewati');
        return { updated: 0, offline: 0, online: 0 };
      }

      // Set offline devices yang tidak mengirim data berdasarkan timeout masing-masing device
      const offlineQuery = `
        UPDATE devices 
        SET status = 'offline' 
        WHERE status = 'online' 
        AND (
          last_seen_at IS NULL 
          OR last_seen_at < DATE_SUB(NOW(), INTERVAL COALESCE(offline_timeout_minutes, 1) MINUTE)
        )
      `;
      
      const [offlineResult] = await (this.db as any).safeQuery(offlineQuery);
      
      // Set online devices yang baru mengirim data berdasarkan timeout masing-masing device
      const onlineQuery = `
        UPDATE devices 
        SET status = 'online' 
        WHERE status = 'offline' 
        AND last_seen_at IS NOT NULL 
        AND last_seen_at >= DATE_SUB(NOW(), INTERVAL COALESCE(offline_timeout_minutes, 1) MINUTE)
      `;
      
      const [onlineResult] = await (this.db as any).safeQuery(onlineQuery);
      
      const result = {
        updated: ((offlineResult as any).affectedRows || 0) + ((onlineResult as any).affectedRows || 0),
        offline: (offlineResult as any).affectedRows || 0,
        online: (onlineResult as any).affectedRows || 0
      };
      
      if (result.updated > 0) {
        // Debug log untuk status device
        // console.log(`Status perangkat saat ini: ${result.offline} offline, ${result.online} online`);
        
        // Broadcast status changes via WebSocket jika ada perubahan
        if (result.offline > 0 || result.online > 0) {
          // Get affected devices to broadcast specific changes
          const getAffectedDevicesQuery = `
            SELECT id, status, offline_timeout_minutes FROM devices 
            WHERE (status = 'offline' AND last_seen_at < DATE_SUB(NOW(), INTERVAL COALESCE(offline_timeout_minutes, 1) MINUTE))
            OR (status = 'online' AND last_seen_at >= DATE_SUB(NOW(), INTERVAL COALESCE(offline_timeout_minutes, 1) MINUTE))
          `;
          
          const [affectedDevices] = await (this.db as any).safeQuery(getAffectedDevicesQuery);
          
          // Process affected devices - broadcast untuk semua perubahan status
          for (const device of (affectedDevices as any[])) {
            console.log(`🔄 Menyiarkan pembaruan status untuk device ${device.id}: ${device.status}`);
            
            // Broadcast status_update untuk semua device yang berubah status
            const broadcastSuccess = await broadcastToDeviceOwner(this.db, device.id, {
              type: "status_update",
              device_id: device.id,
              status: device.status,
              timestamp: new Date().toISOString()
            });
            
            if (broadcastSuccess) {
              console.log(`✅ Broadcast status berhasil dikirim untuk device ${device.id}: ${device.status}`);
            } else {
              console.log(`⚠️ Broadcast status gagal untuk device ${device.id}: ${device.status} (user tidak terhubung)`);
            }

            // Kirim notifikasi hanya untuk device yang offline
            if (device.status === 'offline') {
              console.log(`🚨 Perangkat ${device.id} terdeteksi offline, mengirim notifikasi...`);
              await this.sendDeviceOfflineNotification(device.id);
            }
          }
        }
      }
      
      return result;
    } catch (error) {
      console.error('❌ Gagal memperbarui status perangkat:', error);
      // Jika error koneksi, coba restart monitoring
      if (error instanceof Error && error.message && error.message.includes('Pool is closed')) {
        console.warn('⚠️ Pool database tertutup saat pembaruan status, mencoba memulai ulang pemantauan...');
        this.restartStatusMonitoring();
      }
      return { updated: 0, offline: 0, online: 0 };
    }
  }

  /**
   * Get device status dengan informasi detail
   */
  async getDeviceStatusInfo(deviceId: number): Promise<any> {
    try {
      // Cek koneksi database terlebih dahulu
      const isConnected = await this.checkDbConnection();
      if (!isConnected) {
        console.warn(`⚠️ Koneksi database tidak tersedia untuk pengecekan status device ${deviceId}`);
        return null;
      }

      const query = `
        SELECT 
          d.id,
          d.description,
          d.status,
          d.last_seen_at,
          TIMESTAMPDIFF(SECOND, d.last_seen_at, NOW()) as seconds_since_last_seen,
          CASE 
            WHEN d.last_seen_at IS NULL THEN 'never'
            WHEN d.last_seen_at >= DATE_SUB(NOW(), INTERVAL 1 MINUTE) THEN 'active'
            WHEN d.last_seen_at >= DATE_SUB(NOW(), INTERVAL 5 MINUTE) THEN 'recent'
            WHEN d.last_seen_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR) THEN 'inactive'
            ELSE 'long_inactive'
          END as activity_level
        FROM devices d
        WHERE d.id = ?
      `;
      
      const [rows] = await (this.db as any).safeQuery(query, [deviceId]);
      return (rows as any[])[0] || null;
    } catch (error) {
      console.error(`❌ Gagal mengambil status device ${deviceId}:`, error);
      return null;
    }
  }

  /**
   * Get semua devices dengan status info untuk user tertentu
   */
  async getUserDevicesWithStatus(userId: number): Promise<any[]> {
    try {
      // Cek koneksi database terlebih dahulu
      const isConnected = await this.checkDbConnection();
      if (!isConnected) {
        console.warn(`⚠️ Koneksi database tidak tersedia untuk pengecekan device user ${userId}`);
        return [];
      }

      const query = `
        SELECT 
          d.*,
          TIMESTAMPDIFF(SECOND, d.last_seen_at, NOW()) as seconds_since_last_seen,
          CASE 
            WHEN d.last_seen_at IS NULL THEN 'never'
            WHEN d.last_seen_at >= DATE_SUB(NOW(), INTERVAL 1 MINUTE) THEN 'active'
            WHEN d.last_seen_at >= DATE_SUB(NOW(), INTERVAL 5 MINUTE) THEN 'recent'
            WHEN d.last_seen_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR) THEN 'inactive'
            ELSE 'long_inactive'
          END as activity_level,
          (SELECT COUNT(*) FROM payloads p WHERE p.device_id = d.id AND p.server_time >= DATE_SUB(NOW(), INTERVAL 1 HOUR)) as payloads_last_hour
        FROM devices d
        WHERE d.user_id = ?
        ORDER BY d.last_seen_at DESC
      `;
      
      const [rows] = await (this.db as any).safeQuery(query, [userId]);
      return rows as any[];
    } catch (error) {
      console.error(`❌ Gagal mengambil daftar device untuk user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Start periodic status monitoring
   */
  private startStatusMonitoring(): void {
    // Update status setiap 30 detik
    this.statusUpdateInterval = setInterval(async () => {
      await this.updateAllDeviceStatuses();
    }, 30000); // 30 seconds
  }

  /**
   * Restart status monitoring (stop and start again)
   */
  private restartStatusMonitoring(): void {
    console.log('🔄 Memulai ulang pemantauan status...');
    this.stopStatusMonitoring();
    
    // Tunggu sebentar sebelum memulai ulang
    setTimeout(() => {
      this.startStatusMonitoring();
      console.log('✅ Pemantauan status berhasil dimulai ulang');
    }, 5000); // Tunggu 5 detik sebelum restart
  }

  /**
   * Stop monitoring
   */
  stopStatusMonitoring(): void {
    if (this.statusUpdateInterval) {
      clearInterval(this.statusUpdateInterval);
      this.statusUpdateInterval = null;
    }
  }

  /**
   * Force immediate status check untuk semua devices
   */
  async forceStatusUpdate(): Promise<any> {
    return await this.updateAllDeviceStatuses();
  }

  /**
   * Get statistics untuk monitoring
   */
  async getStatusStatistics(): Promise<any> {
    try {
      // Cek koneksi database terlebih dahulu
      const isConnected = await this.checkDbConnection();
      if (!isConnected) {
        console.warn('⚠️ Koneksi database tidak tersedia untuk statistik status');
        return null;
      }

      const query = `
        SELECT 
          COUNT(*) as total_devices,
          SUM(CASE WHEN status = 'online' THEN 1 ELSE 0 END) as online_devices,
          SUM(CASE WHEN status = 'offline' THEN 1 ELSE 0 END) as offline_devices,
          SUM(CASE WHEN last_seen_at IS NULL THEN 1 ELSE 0 END) as never_seen_devices,
          SUM(CASE WHEN last_seen_at >= DATE_SUB(NOW(), INTERVAL 1 MINUTE) THEN 1 ELSE 0 END) as recently_active_devices,
          AVG(TIMESTAMPDIFF(SECOND, last_seen_at, NOW())) as avg_seconds_since_last_seen
        FROM devices
      `;
      
      const [rows] = await (this.db as any).safeQuery(query);
      return (rows as any[])[0] || null;
    } catch (error) {
      console.error('❌ Gagal mengambil statistik status perangkat:', error);
      return null;
    }
  }

  // ===== SEND DEVICE OFFLINE NOTIFICATION =====
  // Mengirim notifikasi ketika device berubah status ke offline
  public async sendDeviceOfflineNotification(deviceId: number): Promise<void> {
    try {
      // Get the minimum cooldown from all active alarms for this device
      const cooldownQuery = `
        SELECT cooldown_minutes
        FROM alarms 
        WHERE device_id = ? AND is_active = TRUE
      `;
      
      const [cooldownResult] = await (this.db as any).safeQuery(cooldownQuery, [deviceId]);
      const deviceCooldownMinutes = (cooldownResult as any[])[0]?.cooldown_minutes || 1; // Default 1 menit jika tidak ada alarm

      // console.log(`⏱️ Menggunakan cooldown ${deviceCooldownMinutes} menit untuk notifikasi offline device ${deviceId}`);
      
      // Check if notification already sent within the cooldown period
      const recentNotificationQuery = `
        SELECT id FROM notifications 
        WHERE device_id = ? AND type = 'device_status' 
        AND triggered_at >= DATE_SUB(NOW(), INTERVAL ? MINUTE)
        ORDER BY triggered_at DESC 
        LIMIT 1
      `;
      
      const [recentNotifications] = await (this.db as any).safeQuery(recentNotificationQuery, [deviceId.toString(), deviceCooldownMinutes]);
      
      if ((recentNotifications as any[]).length > 0) {
        console.log(`⚠️ Notifikasi offline sudah terkirim untuk device ${deviceId} dalam ${deviceCooldownMinutes} menit terakhir, lewati duplikasi`);
        return;
      }
      
      // Get device dan user information
      const query = `
        SELECT 
          d.description as device_name,
          u.id as user_id,
          u.name as user_name,
          u.phone as user_phone,
          u.whatsapp_notif as whatsapp_notification,
          u.email as user_email
        FROM devices d
        JOIN users u ON d.user_id = u.id
        WHERE d.id = ?
      `;
        
      console.log(`🔍 Mengambil informasi perangkat dan user untuk device ${deviceId}`);
      const [result] = await (this.db as any).safeQuery(query, [deviceId.toString()]);
      const deviceData = (result as any[])[0];
        
      if (!deviceData) {
        console.error(`❌ Perangkat ${deviceId} atau user tidak ditemukan untuk notifikasi offline`);
        return;
      }
      
      // Gunakan instance NotificationService bersama
      if (!this.notificationService) {
        console.log('⚠️ NotificationService tidak tersedia, melakukan inisialisasi...');
        await this.initializeNotificationService();
        
        if (!this.notificationService) {
          console.error('❌ Gagal menginisialisasi NotificationService, melewati notifikasi WhatsApp');
          return;
        }
      } else {
        console.log('✅ NotificationService tersedia, memeriksa kemampuan WhatsApp...');
        
        // Periksa apakah NotificationService memiliki method WhatsApp
        if (typeof this.notificationService.sendWhatsAppNotification !== 'function') {
          console.error('❌ NotificationService tidak memiliki method sendWhatsAppNotification');
          return;
        }
        console.log('✅ Method sendWhatsAppNotification ditemukan');
      }

      // Buat notifikasi di database
      console.log(`🔄 Membuat notifikasi perangkat offline untuk device ${deviceId}, user ${deviceData.user_id}`);
      
      await (this.db as any).safeQuery(
        "INSERT INTO notifications (user_id, type, title, message, priority, device_id, triggered_at, is_read) VALUES (?, ?, ?, ?, ?, ?, NOW(), FALSE)",
        [
          deviceData.user_id,
          "device_status",
          "Perangkat Offline",
          `Perangkat "${deviceData.device_name}" telah offline dan tidak merespons`,
          "high", // Priority tinggi untuk device offline
          deviceId
        ]
      );
      
      // Kirim notifikasi WhatsApp jika user mengaktifkan notifikasi WhatsApp
      if (Boolean(deviceData.whatsapp_notification) && deviceData.user_phone && deviceData.user_phone.trim() !== '') {
        console.log(`📲 Mengirim notifikasi WhatsApp untuk device ${deviceId} offline ke ${deviceData.user_phone}`);
        
        const whatsappMessage = `🚨 PERINGATAN STATUS PERANGKAT\n\n` +
                               `📍 Perangkat: ${deviceData.device_name}\n` +
                               `🔴 Status: OFFLINE\n` +
                               `👤 Akun: ${deviceData.user_name}\n` +
                               `📧 Email: ${deviceData.user_email}\n` +
                               `🕐 Waktu: ${new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })} WIB\n\n` +
                               `Mohon periksa koneksi perangkat Anda!`;
        
        try {
          // Cek status layanan WhatsApp - dengan penanganan error yang lebih baik
          let whatsappStatus = { ready: false, initializing: false };
          try {
            if (this.notificationService && typeof this.notificationService.getWhatsAppStatus === 'function') {
              whatsappStatus = this.notificationService.getWhatsAppStatus();
            }
          } catch (statusError) {
            console.warn(`⚠️ Tidak dapat mengambil status WhatsApp:`, statusError);
          }
          
          console.log(`📱 Status layanan WhatsApp sebelum mengirim:`, whatsappStatus);
          
          // Lanjutkan pengiriman meskipun pengecekan status gagal
          const whatsappResult = await this.notificationService.sendWhatsAppNotification(
            deviceData.user_phone, 
            whatsappMessage
          );
          
          if (whatsappResult.success) {
            console.log(`✅ Notifikasi WhatsApp berhasil dikirim untuk device ${deviceId}`);
          } else {
            console.warn(`⚠️ Notifikasi WhatsApp gagal untuk device ${deviceId}:`, whatsappResult.error_message);
          }
        } catch (whatsappError) {
          console.error(`❌ Gagal mengirim notifikasi WhatsApp untuk device ${deviceId}:`, whatsappError);
        }
      } else {
        console.log(`ℹ️ Notifikasi WhatsApp dilewati untuk device ${deviceId}:`, {
          whatsapp_enabled: Boolean(deviceData.whatsapp_notification),
          has_phone: Boolean(deviceData.user_phone),
          phone_value: deviceData.user_phone
        });
      }

      // Kirim notifikasi browser melalui WebSocket broadcasting
      console.log(`📱 Menyiarkan notifikasi perangkat offline untuk device ${deviceId} ke user ${deviceData.user_id}`);
      try {
        const { broadcastToSpecificUser } = await import('../api/ws/user-ws');
        
        // Format yang sama dengan alarm notification di frontend
        const browserNotification = {
          type: "notification",
          data: {
            id: `device_offline_${deviceId}_${Date.now()}`,
            type: "device_status",
            title: "Perangkat Offline",
            message: `Perangkat "${deviceData.device_name}" telah offline dan tidak merespons`,
            priority: "high",
            isRead: false,
            createdAt: new Date().toISOString(),
            triggered_at: new Date().toISOString(), // Add triggered_at for frontend compatibility
            device_id: deviceId,
            device_description: deviceData.device_name,
            user_email: deviceData.user_email
          }
        };
        
        const broadcastSuccess = broadcastToSpecificUser(deviceData.user_id.toString(), browserNotification);
        
        if (broadcastSuccess) {
          console.log(`✅ Notifikasi browser berhasil disiarkan untuk device ${deviceId} offline`);
        } else {
          console.log(`⚠️ Notifikasi browser gagal disiarkan untuk device ${deviceId} (user tidak terhubung)`);
        }
      } catch (broadcastError) {
        console.error(`❌ Gagal menyiarkan notifikasi perangkat offline untuk device ${deviceId}:`, broadcastError);
      }

      console.log(`✅ Proses notifikasi offline perangkat ${deviceId} untuk user ${deviceData.user_name} selesai`);
    } catch (error) {
      console.error(`❌ Gagal mengirim notifikasi offline perangkat ${deviceId}:`, error);
    }
  }

  // ===== UPDATE DEVICE STATUS ONLY =====
  // Method untuk update status device saja tanpa notifikasi (untuk API device)
  async updateDeviceStatusOnly(deviceId: string, status: "online" | "offline"): Promise<void> {
    try {
      console.log(`🔄 Memperbarui status device saja: device ${deviceId} -> ${status}`);
      
      // Check database connection first
      const isConnected = await this.checkDbConnection();
      if (!isConnected) {
        console.warn(`⚠️ Koneksi database tidak tersedia untuk device ${deviceId} status update`);
        return;
      }

      // Update only device status without notification
      const [result] = await (this.db as any).safeQuery(
        "UPDATE devices SET status = ? WHERE id = ?",
        [status, deviceId]
      );
    } catch (error) {
      console.error(`❌ Error updating device ${deviceId} status only:`, error);
      throw error;
    }
  }
}

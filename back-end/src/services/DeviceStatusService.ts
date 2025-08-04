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

  constructor(database: Pool) {
    this.db = database;
    this.startStatusMonitoring();  // Mulai monitoring otomatis
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
        console.warn(`Database connection not available, skipping status update for device ${deviceId}`);
        return;
      }

      const query = `
        UPDATE devices 
        SET last_seen_at = NOW(), status = 'online'
        WHERE id = ?
      `;
      
      await this.db.query(query, [deviceId]);

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
      console.error(`Error updating device ${deviceId} last seen:`, error);
      // Jika error koneksi, coba restart monitoring
      if (error instanceof Error && error.message && error.message.includes('Pool is closed')) {
        console.warn('Database pool is closed, attempting to restart status monitoring...');
        this.restartStatusMonitoring();
      }
    }
  }

  // ===== CHECK DB CONNECTION =====
  // Mengecek apakah koneksi database masih sehat
  private async checkDbConnection(): Promise<boolean> {
    try {
      await this.db.query('SELECT 1');
      return true;
    } catch (error) {
      console.error('Database connection check failed:', error);
      return false;
    }
  }

  /**
   * Bulk update device statuses berdasarkan last_seen_at
   * Dipanggil secara periodic atau manual
   */
  async updateAllDeviceStatuses(): Promise<{ updated: number; offline: number; online: number }> {
    try {
      // Check database connection first
      const isConnected = await this.checkDbConnection();
      if (!isConnected) {
        console.warn('Database connection is not available, skipping status update');
        return { updated: 0, offline: 0, online: 0 };
      }

      // Set offline devices yang tidak mengirim data > 1 menit
      const offlineQuery = `
        UPDATE devices 
        SET status = 'offline' 
        WHERE status = 'online' 
        AND (last_seen_at IS NULL OR last_seen_at < DATE_SUB(NOW(), INTERVAL 1 MINUTE))
      `;
      
      const [offlineResult] = await this.db.query(offlineQuery);
      
      // Set online devices yang baru mengirim data
      const onlineQuery = `
        UPDATE devices 
        SET status = 'online' 
        WHERE status = 'offline' 
        AND last_seen_at IS NOT NULL 
        AND last_seen_at >= DATE_SUB(NOW(), INTERVAL 1 MINUTE)
      `;
      
      const [onlineResult] = await this.db.query(onlineQuery);
      
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
            SELECT id, status FROM devices 
            WHERE (status = 'offline' AND last_seen_at < DATE_SUB(NOW(), INTERVAL 1 MINUTE))
            OR (status = 'online' AND last_seen_at >= DATE_SUB(NOW(), INTERVAL 1 MINUTE))
          `;
          
          const [affectedDevices] = await this.db.query(getAffectedDevicesQuery);
          
          // Process affected devices - broadcast untuk yang online saja
          for (const device of (affectedDevices as any[])) {
            // Only broadcast status_update for online devices
            // Frontend handles offline detection automatically
            if (device.status === 'online') {
              await broadcastToDeviceOwner(this.db, device.id, {
                type: "status_update",
                device_id: device.id,
                status: device.status,
                timestamp: new Date().toISOString()
              });
            }

            // Note: Frontend akan menangani notifikasi offline melalui API calls
          }
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error updating device statuses:', error);
      // If it's a connection error, try to restart monitoring
      if (error instanceof Error && error.message && error.message.includes('Pool is closed')) {
        console.warn('Database pool is closed during status update, attempting to restart monitoring...');
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
      // Check database connection first
      const isConnected = await this.checkDbConnection();
      if (!isConnected) {
        console.warn(`Database connection not available for device ${deviceId} status check`);
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
      
      const [rows] = await this.db.query(query, [deviceId]);
      return (rows as any[])[0] || null;
    } catch (error) {
      console.error(`Error getting device ${deviceId} status:`, error);
      return null;
    }
  }

  /**
   * Get semua devices dengan status info untuk user tertentu
   */
  async getUserDevicesWithStatus(userId: number): Promise<any[]> {
    try {
      // Check database connection first
      const isConnected = await this.checkDbConnection();
      if (!isConnected) {
        console.warn(`Database connection not available for user ${userId} devices check`);
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
      
      const [rows] = await this.db.query(query, [userId]);
      return rows as any[];
    } catch (error) {
      console.error(`Error getting devices for user ${userId}:`, error);
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
    console.log('Restarting status monitoring...');
    this.stopStatusMonitoring();
    
    // Wait a bit before restarting
    setTimeout(() => {
      this.startStatusMonitoring();
      console.log('Status monitoring restarted successfully');
    }, 5000); // Wait 5 seconds before restart
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
      // Check database connection first
      const isConnected = await this.checkDbConnection();
      if (!isConnected) {
        console.warn('Database connection not available for status statistics');
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
      
      const [rows] = await this.db.query(query);
      return (rows as any[])[0] || null;
    } catch (error) {
      console.error('Error getting status statistics:', error);
      return null;
    }
  }

  // ===== SEND DEVICE OFFLINE NOTIFICATION =====
  // Mengirim notifikasi ketika device berubah status ke offline
  public async sendDeviceOfflineNotification(deviceId: number): Promise<void> {
    try {
      console.log(`🔄 DeviceStatusService.sendDeviceOfflineNotification called for device ${deviceId}`);
      
      // Check if notification already sent in last 5 minutes to prevent spam
      const recentNotificationQuery = `
        SELECT id FROM notifications 
        WHERE device_id = ? AND type = 'device_status' 
        AND triggered_at >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)
        ORDER BY triggered_at DESC 
        LIMIT 1
      `;
      
      const [recentNotifications] = await this.db.query(recentNotificationQuery, [deviceId.toString()]);
      
      if ((recentNotifications as any[]).length > 0) {
        console.log(`⚠️ Device offline notification already sent for device ${deviceId} in last 5 minutes, skipping duplicate`);
        return;
      }
      
      // Get device dan user information
      const query = `
        SELECT 
          d.description as device_name,
          u.id as user_id,
          u.name as user_name,
          u.phone as user_phone,
          u.whatsapp_notif as whatsapp_notification
        FROM devices d
        JOIN users u ON d.user_id = u.id
        WHERE d.id = ?
      `;
        
      console.log(`🔍 Querying device and user info for device ${deviceId}`);
      const [result] = await this.db.query(query, [deviceId.toString()]);
      const deviceData = (result as any[])[0];
        
      if (!deviceData) {
        console.error(`❌ Device ${deviceId} or user not found for offline notification`);
        return;
      }
      
      console.log(`✅ Found device data:`, {
        device_name: deviceData.device_name,
        user_id: deviceData.user_id,
        user_name: deviceData.user_name,
        whatsapp_notification: deviceData.whatsapp_notification
      });

      // Dynamic import untuk NotificationService
      const { NotificationService } = await import('./NotificationService');
      const notificationService = new NotificationService(this.db);

      // Create notification di database
      console.log(`🔄 Creating device offline notification for device ${deviceId}, user ${deviceData.user_id}`);
      
      await this.db.query(
        "INSERT INTO notifications (user_id, type, title, message, priority, device_id, triggered_at, is_read) VALUES (?, ?, ?, ?, ?, ?, NOW(), FALSE)",
        [
          deviceData.user_id,
          "device_status",
          "Status Perangkat",
          `Perangkat "${deviceData.device_name}" telah offline dan tidak merespons`,
          "high", // Priority tinggi untuk device offline
          deviceId
        ]
      );
      
      // Send WhatsApp notification jika user mengaktifkan notifikasi WhatsApp
      if (deviceData.whatsapp_notification && deviceData.user_phone) {
        console.log(`📲 Sending WhatsApp notification for device ${deviceId} offline to ${deviceData.user_phone}`);
        
        const whatsappMessage = `🚨 PERINGATAN STATUS PERANGKAT\n\n` +
                               `📍 Perangkat: ${deviceData.device_name}\n` +
                               `🔴 Status: OFFLINE\n` +
                               `👤 Akun: ${deviceData.user_name}\n` +
                               `🕐 Waktu: ${new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })} WIB\n\n` +
                               `Mohon periksa koneksi perangkat Anda!`;
        
        try {
          const whatsappResult = await notificationService.sendWhatsAppNotification(
            deviceData.user_phone, 
            whatsappMessage
          );
          
          if (whatsappResult.success) {
            console.log(`✅ WhatsApp notification sent successfully for device ${deviceId}`);
          } else {
            console.warn(`⚠️ WhatsApp notification failed for device ${deviceId}:`, whatsappResult.error_message);
          }
        } catch (whatsappError) {
          console.error(`❌ Error sending WhatsApp notification for device ${deviceId}:`, whatsappError);
        }
      } else {
        console.log(`ℹ️ WhatsApp notification skipped for device ${deviceId} (disabled or no phone number)`);
      }

      // Send browser notification via WebSocket broadcasting
      console.log(`📱 Broadcasting device offline notification for device ${deviceId} to user ${deviceData.user_id}`);
      try {
        const { broadcastToSpecificUser } = await import('../api/ws/user-ws');
        
        broadcastToSpecificUser(deviceData.user_id.toString(), {
          type: "notification",
          data: {
            id: `device_offline_${deviceId}_${Date.now()}`,
            type: "device_status",
            title: "Status Perangkat",
            message: `Perangkat "${deviceData.device_name}" telah offline dan tidak merespons`,
            priority: "high",
            device_id: deviceId,
            user_id: deviceData.user_id,
            triggered_at: new Date().toISOString(),
            is_read: false
          }
        });
        
        console.log(`✅ Browser notification broadcasted for device ${deviceId} offline`);
      } catch (broadcastError) {
        console.error(`❌ Error broadcasting device offline notification for device ${deviceId}:`, broadcastError);
      }

      console.log(`✅ Device offline notification processed for device ${deviceId} to user ${deviceData.user_name}`);
    } catch (error) {
      console.error(`Error sending device offline notification for device ${deviceId}:`, error);
    }
  }

  // ===== UPDATE DEVICE STATUS ONLY =====
  // Method untuk update status device saja tanpa notifikasi (untuk API device)
  async updateDeviceStatusOnly(deviceId: string, status: "online" | "offline"): Promise<void> {
    try {
      console.log(`🔄 DeviceStatusService.updateDeviceStatusOnly called: device ${deviceId} -> ${status}`);
      
      // Check database connection first
      const isConnected = await this.checkDbConnection();
      if (!isConnected) {
        console.warn(`⚠️ Database connection not available for device ${deviceId} status update`);
        return;
      }

      // Update only device status without notification
      const [result] = await this.db.query(
        "UPDATE devices SET status = ? WHERE id = ?",
        [status, deviceId]
      );

      console.log(`✅ Device ${deviceId} status updated to ${status} (status-only update). Affected rows: ${(result as any).affectedRows}`);
    } catch (error) {
      console.error(`❌ Error updating device ${deviceId} status only:`, error);
      throw error;
    }
  }
}

// DeviceStatusService.ts - Service untuk manage status device realtime
import { Pool } from 'mysql2/promise';
import { broadcastToUsersByDevice } from '../api/ws/user-ws';

export class DeviceStatusService {
  private static instance: DeviceStatusService;
  private db: Pool;
  private statusUpdateInterval: NodeJS.Timeout | null = null;

  constructor(database: Pool) {
    this.db = database;
    this.startStatusMonitoring();
  }

  static getInstance(database: Pool): DeviceStatusService {
    if (!DeviceStatusService.instance) {
      DeviceStatusService.instance = new DeviceStatusService(database);
    }
    return DeviceStatusService.instance;
  }

  /**
   * Update last_seen_at ketika device mengirim payload
   * Dipanggil dari PayloadService setiap kali terima data
   */
  async updateDeviceLastSeen(deviceId: number): Promise<void> {
    try {
      const query = `
        UPDATE devices 
        SET last_seen_at = NOW(), status = 'online'
        WHERE id = ?
      `;
      
      await this.db.query(query, [deviceId]);

      // Debug log untuk status update
      // console.log(`🟢 Status Device ${deviceId} diupdate menjadi online`);

      // Broadcast status update via WebSocket ONLY to device owner
      await broadcastToUsersByDevice(this.db, deviceId, {
        type: "status_update",
        device_id: deviceId,
        status: "online",
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error(`Error updating device ${deviceId} last seen:`, error);
    }
  }

  /**
   * Bulk update device statuses berdasarkan last_seen_at
   * Dipanggil secara periodic atau manual
   */
  async updateAllDeviceStatuses(): Promise<{ updated: number; offline: number; online: number }> {
    try {
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
          
          (affectedDevices as any[]).forEach(async device => {
            await broadcastToUsersByDevice(this.db, device.id, {
              type: "status_update",
              device_id: device.id,
              status: device.status,
              timestamp: new Date().toISOString()
            });
          });
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error updating device statuses:', error);
      return { updated: 0, offline: 0, online: 0 };
    }
  }

  /**
   * Get device status dengan informasi detail
   */
  async getDeviceStatusInfo(deviceId: number): Promise<any> {
    try {
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
}

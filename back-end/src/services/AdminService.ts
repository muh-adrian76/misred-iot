import { Database } from "bun:sqlite";

interface AdminStats {
  totalUsers: number;
  totalDevices: number;
  totalDashboards: number;
  activeUsers: number;
  onlineDevices: number;
  totalAlarms: number;
  totalPayloads: number;
  recentUsers?: RecentUser[];
}

interface RecentUser {
  id: number;
  name: string;
  email: string;
  created_at: string;
  is_admin: boolean;
}

interface DeviceLocation {
  id: number;
  name: string;
  description: string;
  status: string;
  user_id: number;
  user_name: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  last_seen?: string;
}

interface SystemHealth {
  status: 'good' | 'warning' | 'error';
  database: boolean;
  mqtt: boolean;
  websocket: boolean;
  uptime: number;
}

export class AdminService {
  constructor(private db: any) {}

  async getOverviewStats(): Promise<AdminStats> {
    try {
      // Get total users
      const [totalUsersResult] = await this.db.query("SELECT COUNT(*) as count FROM users");
      const totalUsers = totalUsersResult[0]?.count || 0;

      // Get total devices
      const [totalDevicesResult] = await this.db.query("SELECT COUNT(*) as count FROM devices");
      const totalDevices = totalDevicesResult[0]?.count || 0;

      // Get total dashboards
      const [totalDashboardsResult] = await this.db.query("SELECT COUNT(*) as count FROM dashboards");
      const totalDashboards = totalDashboardsResult[0]?.count || 0;

      // Get active users (logged in within last 24 hours)
      const [activeUsersResult] = await this.db.query(`
        SELECT COUNT(*) as count FROM users 
        WHERE last_login >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      `);
      const activeUsers = activeUsersResult[0]?.count || 0;

      // Get online devices
      const [onlineDevicesResult] = await this.db.query(`
        SELECT COUNT(*) as count FROM devices WHERE status = 'online'
      `);
      const onlineDevices = onlineDevicesResult[0]?.count || 0;

      // Get total alarms
      const [totalAlarmsResult] = await this.db.query("SELECT COUNT(*) as count FROM alarms");
      const totalAlarms = totalAlarmsResult[0]?.count || 0;

      // Get total payloads
      const [totalPayloadsResult] = await this.db.query("SELECT COUNT(*) as count FROM payloads");
      const totalPayloads = totalPayloadsResult[0]?.count || 0;

      return {
        totalUsers,
        totalDevices,
        totalDashboards,
        activeUsers,
        onlineDevices,
        totalAlarms,
        totalPayloads
      };
    } catch (error) {
      console.error("Error getting overview stats:", error);
      throw error;
    }
  }

  async getRecentUsers(limit: number = 10): Promise<RecentUser[]> {
    try {
      const query = `
        SELECT id, name, email, created_at, is_admin
        FROM users 
        ORDER BY created_at DESC 
        LIMIT ?
      `;
      
      const [users] = await this.db.query(query, [limit]);
      return users;
    } catch (error) {
      console.error("Error getting recent users:", error);
      throw error;
    }
  }

  async getDeviceLocations(): Promise<DeviceLocation[]> {
    try {
      const query = `
        SELECT 
          d.id,
          d.description as name,
          d.description,
          d.status,
          d.user_id,
          u.name as user_name,
          d.latitude,
          d.longitude,
          d.address,
          CASE 
            WHEN d.status = 'online' THEN 'Aktif sekarang'
            WHEN p.latest_time IS NOT NULL THEN CONCAT('Terakhir aktif: ', DATE_FORMAT(p.latest_time, '%d/%m/%Y %H:%i'))
            ELSE 'Tidak pernah aktif'
          END as last_seen
        FROM devices d
        LEFT JOIN users u ON d.user_id = u.id
        LEFT JOIN (
          SELECT device_id, MAX(server_time) as latest_time
          FROM payloads
          GROUP BY device_id
        ) p ON d.id = p.device_id
        ORDER BY d.created_at DESC
      `;
      
      const [devices] = await this.db.query(query);
      return devices;
    } catch (error) {
      console.error("Error getting device locations:", error);
      throw error;
    }
  }

  async updateDeviceLocation(deviceId: number, latitude: number, longitude: number, address?: string): Promise<boolean> {
    try {
      console.log("Updating device location:", { deviceId, latitude, longitude, address });
      
      const query = `
        UPDATE devices 
        SET latitude = ?, longitude = ?, address = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      
      const [result] = await this.db.query(query, [latitude, longitude, address || null, deviceId]);
      console.log("Update result:", result);
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error updating device location:", error);
      console.error("Query parameters:", { deviceId, latitude, longitude, address });
      throw error;
    }
  }

  async getSystemHealth(): Promise<SystemHealth> {
    try {
      // Test database connection
      let database = true;
      try {
        await this.db.query("SELECT 1");
      } catch {
        database = false;
      }

      // For MQTT and WebSocket, we'll assume they're working
      // In a real implementation, you'd check their actual status
      const mqtt = true;
      const websocket = true;

      // Get system uptime
      const uptime = process.uptime();

      // Determine overall status
      let status: 'good' | 'warning' | 'error' = 'good';
      if (!database) {
        status = 'error';
      } else if (!mqtt || !websocket) {
        status = 'warning';
      }

      return {
        status,
        database,
        mqtt,
        websocket,
        uptime
      };
    } catch (error) {
      console.error("Error getting system health:", error);
      return {
        status: 'error',
        database: false,
        mqtt: false,
        websocket: false,
        uptime: 0
      };
    }
  }

  async getAllUsersWithStats(): Promise<any[]> {
    try {
      // First, try a simple query to get all users
      const simpleQuery = `SELECT * FROM users ORDER BY created_at DESC`;
      const [simpleUsers] = await this.db.query(simpleQuery);
      
      if (simpleUsers && simpleUsers.length > 0) {
        // If simple query works, try the complex one
        const query = `
          SELECT 
            u.id,
            u.name,
            u.email,
            u.is_admin,
            u.created_at,
            u.last_login,
            u.phone,
            u.whatsapp_notif,
            u.onboarding_completed,
            COUNT(DISTINCT d.id) as device_count,
            COUNT(DISTINCT dash.id) as dashboard_count,
            COUNT(DISTINCT a.id) as alarm_count
          FROM users u
          LEFT JOIN devices d ON u.id = d.user_id
          LEFT JOIN dashboards dash ON u.id = dash.user_id
          LEFT JOIN alarms a ON u.id = a.user_id
          GROUP BY u.id, u.name, u.email, u.is_admin, u.created_at, u.last_login, u.phone, u.whatsapp_notif, u.onboarding_completed
          ORDER BY u.created_at DESC
        `;
        
        const [users] = await this.db.query(query);
        return users;
      } else {
        return [];
      }
    } catch (error) {
      console.error("💥 Error getting users with stats:", error);
      // If complex query fails, return simple users
      try {
        const [fallbackUsers] = await this.db.query(`SELECT * FROM users ORDER BY created_at DESC`);
        return fallbackUsers.map((user: any) => ({
          ...user,
          device_count: 0,
          dashboard_count: 0,
          alarm_count: 0
        }));
      } catch (fallbackError) {
        console.error("💥 Fallback query also failed:", fallbackError);
        throw error;
      }
    }
  }

  async getAllDevicesWithStats(): Promise<any[]> {
    try {
      const query = `
        SELECT 
          d.id,
          d.description,
          d.board_type,
          d.protocol,
          d.status,
          d.created_at,
          d.latitude,
          d.longitude,
          d.address,
          u.name as user_name,
          u.email as user_email,
          COUNT(DISTINCT ds.id) as datastream_count,
          COUNT(DISTINCT p.id) as payload_count,
          MAX(p.server_time) as last_data_time
        FROM devices d
        LEFT JOIN users u ON d.user_id = u.id
        LEFT JOIN datastreams ds ON d.id = ds.device_id
        LEFT JOIN payloads p ON d.id = p.device_id
        GROUP BY d.id
        ORDER BY d.created_at DESC
      `;
      
      const [devices] = await this.db.query(query);
      return devices;
    } catch (error) {
      console.error("Error getting devices with stats:", error);
      throw error;
    }
  }
}

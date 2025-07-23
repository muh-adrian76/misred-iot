import { connect, MqttClient } from "mqtt";
import mysql, { Pool } from "mysql2/promise";

// MySQL
export class MySQLDatabase {
  private static instance: Pool | null = null;

  static getInstance(): Pool {
    if (!MySQLDatabase.instance) {
      try {
        MySQLDatabase.instance = mysql.createPool({
          host: process.env.MYSQL_HOST,
          user: process.env.MYSQL_USER,
          password: process.env.MYSQL_PASSWORD,
          database: process.env.MYSQL_NAME,
          port: Number(process.env.MYSQL_PORT),
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0,
          idleTimeout: 300000, // 5 minutes
          maxIdle: 5
        });
        
        // Test initial connection
        MySQLDatabase.instance.execute("SELECT 1")
          .then(() => {
            console.log("✅ Terkoneksi ke Database MySQL.");
          })
          .catch((err) => {
            console.error("❌ Initial MySQL connection test failed:", err);
            // Reset instance on connection failure
            MySQLDatabase.instance = null;
          });
          
      } catch (err) {
        console.error("❌ Gagal konek ke database:", err);
        MySQLDatabase.instance = null;
        throw err;
      }
    }
    return MySQLDatabase.instance;
  }

  // Method to force reconnection
  static forceReconnect(): Pool {
    if (MySQLDatabase.instance) {
      console.log("🔄 Forcing MySQL reconnection...");
      try {
        MySQLDatabase.instance.end();
      } catch (err) {
        console.warn("⚠️ Error closing existing pool:", err);
      }
      MySQLDatabase.instance = null;
    }
    return MySQLDatabase.getInstance();
  }

  // Health check method
  static async healthCheck(): Promise<boolean> {
    try {
      const pool = MySQLDatabase.getInstance();
      await pool.execute("SELECT 1");
      return true;
    } catch (error) {
      console.error("❌ MySQL health check failed:", error);
      return false;
    }
  }
}

// MQTT
export class MQTTClient {
  private static client: MqttClient;

  static getInstance(): MqttClient {
    if (!MQTTClient.client) {
      MQTTClient.client = connect(process.env.RABBITMQ_URL_MQTT!);
    }
    return MQTTClient.client;
  }
}

// CHIRPSTACK
interface ApplicationResponse {
  id: string;
}

interface DeviceResponse {
  device: {
    dev_eui: string;
  };
}

interface IntegrationResponse {
  success: boolean;
}

class ChirpstackService {
  private chirpstackUrl: string;
  private serverUrl: string;

  constructor() {
    this.chirpstackUrl = process.env.CHIRPSTACK_URL!;
    this.serverUrl = process.env.SERVER_URL!;
  }

  async createApplication(jwt_token: string): Promise<string> {
    const response = await fetch(`${this.chirpstackUrl}/api/applications`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt_token}`,
      },
      body: JSON.stringify({
        application: {
          name: "IoT-Monitoring-System",
          description: "Monitoring sensor IoT",
          organization_id: "1",
          service_profile_id: "YOUR_SERVICE_PROFILE_ID",
        },
      }),
    });

    const data: ApplicationResponse = await response.json();
    console.log("Application created:", data);
    return data.id;
  }

  async addHttpIntegration(
    applicationId: string,
    jwt_token: string
  ): Promise<void> {
    const response = await fetch(
      `${this.chirpstackUrl}/api/applications/${applicationId}/integrations`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt_token}`,
        },
        body: JSON.stringify({
          http: {
            headers: {},
            json: true,
            uplink_data_url: `${this.serverUrl}/device`,
            join_notification_url: `${this.serverUrl}/payload`,
          },
        }),
      }
    );

    const data: IntegrationResponse = await response.json();
    console.log("HTTP Integration added:", data);
  }

  async addDevice(
    applicationId: string,
    devEUI: string,
    deviceProfileId: string,
    deviceName: string,
    jwt_token: string
  ): Promise<string> {
    const response = await fetch(`${this.chirpstackUrl}/api/devices`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt_token}`,
      },
      body: JSON.stringify({
        device: {
          application_id: applicationId,
          description: "Sensor IoT",
          dev_eui: devEUI,
          device_profile_id: deviceProfileId,
          name: deviceName,
          skip_fcnt_check: true,
        },
      }),
    });

    const data: DeviceResponse = await response.json();
    console.log("Device added:", data);
    return data.device.dev_eui;
  }

  async addDeviceKeys(
    devEUI: string,
    appKey: string,
    jwt_token: string
  ): Promise<void> {
    const response = await fetch(
      `${this.chirpstackUrl}/api/devices/${devEUI}/keys`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt_token}`,
        },
        body: JSON.stringify({
          deviceKeys: {
            app_key: appKey,
          },
        }),
      }
    );

    const data = await response.json();
    console.log("Device keys added:", data);
  }

  async setupDevice(
    token: string,
    devEUI: string,
    deviceProfileId: string,
    appKey: string,
    deviceName: string = "my-new-device"
  ) {
    try {
      const applicationId = await this.createApplication(token);
      await this.addHttpIntegration(applicationId, token);
      const deviceId = await this.addDevice(
        applicationId,
        devEUI,
        deviceProfileId,
        deviceName,
        token
      );
      await this.addDeviceKeys(deviceId, appKey, token);
      console.log("Berhasil menambah perangkat LoRa.");
      return deviceId;
    } catch (error) {
      console.error("Terjadi kesalahan:", error);
    }
  }
}

export const chirpstackService = new ChirpstackService();

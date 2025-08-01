// ===== IMPORTS =====
// Import MQTT client untuk komunikasi dengan broker MQTT
import { connect, MqttClient } from "mqtt";
// Import MySQL pool untuk koneksi database dengan connection pooling
import mysql, { Pool } from "mysql2/promise";

// ===== MYSQL DATABASE CLASS =====
// Class singleton untuk mengelola koneksi database MySQL dengan connection pooling
export class MySQLDatabase {
  // Instance tunggal untuk pattern singleton
  private static instance: Pool | null = null;

  // ===== GET INSTANCE METHOD =====
  // Method untuk mendapatkan instance database dengan lazy initialization
  static getInstance(): Pool {
    // Jika instance belum ada, buat instance baru
    if (!MySQLDatabase.instance) {
      try {
        // ===== CREATE CONNECTION POOL =====
        // Buat connection pool dengan konfigurasi dari environment variables
        MySQLDatabase.instance = mysql.createPool({
          host: process.env.MYSQL_HOST, // Host database MySQL
          user: process.env.MYSQL_USER, // Username database
          password: process.env.MYSQL_PASSWORD, // Password database
          database: process.env.MYSQL_NAME, // Nama database
          port: Number(process.env.MYSQL_PORT), // Port database
          waitForConnections: true, // Tunggu koneksi jika pool penuh
          connectionLimit: 10, // Maksimal 10 koneksi bersamaan
          queueLimit: 0, // Tidak ada limit antrian query
          idleTimeout: 300000, // Timeout idle 5 menit
          maxIdle: 5 // Maksimal 5 koneksi idle
        });
        
        // ===== TEST INITIAL CONNECTION =====
        // Test koneksi awal untuk memastikan database dapat diakses
        MySQLDatabase.instance.execute("SELECT 1")
          .then(() => {
            console.log("✅ Terkoneksi ke Database MySQL.");
          })
          .catch((err) => {
            console.error("❌ Initial MySQL connection test failed:", err);
            // Reset instance jika koneksi gagal untuk retry berikutnya
            MySQLDatabase.instance = null;
          });
          
      } catch (err) {
        console.error("❌ Gagal konek ke database:", err);
        MySQLDatabase.instance = null; // Reset instance
        throw err; // Re-throw error untuk handling di level atas
      }
    }
    return MySQLDatabase.instance; // Return instance yang sudah ada
  }

  // ===== FORCE RECONNECTION METHOD =====
  // Method untuk memaksa reconnect database (berguna saat koneksi terputus)
  static forceReconnect(): Pool {
    if (MySQLDatabase.instance) {
      console.log("🔄 Forcing MySQL reconnection...");
      try {
        // Tutup pool connection yang ada
        MySQLDatabase.instance.end();
      } catch (err) {
        console.warn("⚠️ Error closing existing pool:", err);
      }
      MySQLDatabase.instance = null; // Reset instance
    }
    return MySQLDatabase.getInstance(); // Buat instance baru
  }

  // ===== HEALTH CHECK METHOD =====
  // Method untuk mengecek kesehatan koneksi database
  static async healthCheck(): Promise<boolean> {
    try {
      const pool = MySQLDatabase.getInstance();
      await pool.execute("SELECT 1"); // Query sederhana untuk test koneksi
      return true; // Koneksi sehat
    } catch (error) {
      console.error("❌ MySQL health check failed:", error);
      return false; // Koneksi bermasalah
    }
  }
}

// ===== MQTT CLIENT CLASS =====
// Class singleton untuk mengelola koneksi MQTT client
export class MQTTClient {
  // Instance tunggal MQTT client
  private static client: MqttClient;

  // ===== GET INSTANCE METHOD =====
  // Method untuk mendapatkan instance MQTT client dengan lazy initialization
  static getInstance(): MqttClient {
    if (!MQTTClient.client) {
      // Buat koneksi MQTT ke broker (RabbitMQ dalam kasus ini)
      MQTTClient.client = connect(process.env.RABBITMQ_URL_MQTT!);
    }
    return MQTTClient.client; // Return instance yang sudah ada
  }
}

// ===== CHIRPSTACK INTEGRATION =====
// Interface dan class untuk integrasi dengan ChirpStack LoRaWAN Network Server

// ===== INTERFACES =====
// Interface untuk response dari ChirpStack API
interface ApplicationResponse {
  id: string; // ID aplikasi yang dibuat
}

interface DeviceResponse {
  device: {
    dev_eui: string; // Device EUI dari device yang ditambahkan
  };
}

interface IntegrationResponse {
  success: boolean; // Status keberhasilan integrasi
}

// ===== CHIRPSTACK SERVICE CLASS =====
// Class untuk mengelola integrasi dengan ChirpStack LoRaWAN Network Server
class ChirpstackService {
  private chirpstackUrl: string; // URL ChirpStack server
  private serverUrl: string; // URL server backend kita

  // ===== CONSTRUCTOR =====
  constructor() {
    this.chirpstackUrl = process.env.CHIRPSTACK_URL!; // URL ChirpStack dari env
    this.serverUrl = process.env.SERVER_URL!; // URL server dari env
  }

  // ===== CREATE APPLICATION =====
  // Method untuk membuat aplikasi baru di ChirpStack
  async createApplication(jwt_token: string): Promise<string> {
    const response = await fetch(`${this.chirpstackUrl}/api/applications`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt_token}`, // Bearer token untuk autentikasi
      },
      body: JSON.stringify({
        application: {
          name: "IoT-Monitoring-System", // Nama aplikasi
          description: "Monitoring sensor IoT", // Deskripsi aplikasi
          organization_id: "1", // ID organisasi
          service_profile_id: "YOUR_SERVICE_PROFILE_ID", // ID service profile
        },
      }),
    });

    const data: ApplicationResponse = await response.json();
    console.log("Application created:", data);
    return data.id; // Return ID aplikasi yang dibuat
  }

  // ===== ADD HTTP INTEGRATION =====
  // Method untuk menambah HTTP integration ke aplikasi ChirpStack
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
          Authorization: `Bearer ${jwt_token}`, // Bearer token untuk autentikasi
        },
        body: JSON.stringify({
          http: {
            headers: {}, // HTTP headers kosong
            json: true, // Format JSON untuk payload
            uplink_data_url: `${this.serverUrl}/device`, // URL untuk uplink data
            join_notification_url: `${this.serverUrl}/payload`, // URL untuk join notification
          },
        }),
      }
    );

    const data: IntegrationResponse = await response.json();
    console.log("HTTP Integration added:", data);
  }

  // ===== ADD DEVICE =====
  // Method untuk menambah device baru ke aplikasi ChirpStack
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
        Authorization: `Bearer ${jwt_token}`, // Bearer token untuk autentikasi
      },
      body: JSON.stringify({
        device: {
          application_id: applicationId, // ID aplikasi
          description: "Sensor IoT", // Deskripsi device
          dev_eui: devEUI, // Device EUI
          device_profile_id: deviceProfileId, // ID profile device
          name: deviceName, // Nama device
          skip_fcnt_check: true, // Skip frame counter check
        },
      }),
    });

    const data: DeviceResponse = await response.json();
    console.log("Device added:", data);
    return data.device.dev_eui; // Return Device EUI
  }

  // ===== ADD DEVICE KEYS =====
  // Method untuk menambah application key ke device
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
          Authorization: `Bearer ${jwt_token}`, // Bearer token untuk autentikasi
        },
        body: JSON.stringify({
          deviceKeys: {
            app_key: appKey, // Application key untuk enkripsi
          },
        }),
      }
    );

    const data = await response.json();
    console.log("Device keys added:", data);
  }

  // ===== SETUP DEVICE (COMPLETE FLOW) =====
  // Method untuk setup device LoRaWAN secara lengkap (aplikasi + integrasi + device + keys)
  async setupDevice(
    token: string,
    devEUI: string,
    deviceProfileId: string,
    appKey: string,
    deviceName: string = "my-new-device"
  ) {
    try {
      // ===== COMPLETE SETUP FLOW =====
      // 1. Buat aplikasi baru
      const applicationId = await this.createApplication(token);
      // 2. Tambah HTTP integration
      await this.addHttpIntegration(applicationId, token);
      // 3. Tambah device ke aplikasi
      const deviceId = await this.addDevice(
        applicationId,
        devEUI,
        deviceProfileId,
        deviceName,
        token
      );
      // 4. Tambah keys ke device
      await this.addDeviceKeys(deviceId, appKey, token);
      console.log("Berhasil menambah perangkat LoRa.");
      return deviceId; // Return device ID yang berhasil dibuat
    } catch (error) {
      console.error("Terjadi kesalahan:", error);
    }
  }
}

// ===== EXPORT CHIRPSTACK INSTANCE =====
// Export instance ChirpstackService untuk digunakan di seluruh aplikasi
export const chirpstackService = new ChirpstackService();

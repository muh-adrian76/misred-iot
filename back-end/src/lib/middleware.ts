// ===== IMPORTS =====
// Import MQTT client untuk komunikasi dengan broker MQTT
import { connect, MqttClient } from "mqtt";
// Import MySQL pool untuk koneksi database dengan pengelompokan koneksi
import mysql, { Pool } from "mysql2/promise";

// ===== MYSQL DATABASE CLASS =====
// Class tunggal untuk mengelola koneksi database MySQL dengan pengelompokan koneksi
export class MySQLDatabase {
  // Instance tunggal untuk pola instance tunggal
  private static instance: Pool | null = null;
  private static isReconnecting: boolean = false;
  private static reconnectAttempts: number = 0;
  private static maxReconnectAttempts: number = 5;

  // ===== GET INSTANCE METHOD =====
  // Method untuk mendapatkan instance database dengan inisialisasi bertahap
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
          connectionLimit: 15, // Peningkatan batas koneksi
          queueLimit: 0, // Tidak ada limit antrian query
          idleTimeout: 300000, // Timeout idle 5 menit
          maxIdle: 8, // Peningkatan koneksi idle
          keepAliveInitialDelay: 0, // Pengaturan keep alive
          enableKeepAlive: true
        });
        
        // ===== ADD SAFE QUERY METHOD TO POOL =====
        // Add safeQuery method to the pool instance
        (MySQLDatabase.instance as any).safeQuery = MySQLDatabase.safeQuery;
        
        // ===== SETUP CONNECTION EVENT HANDLERS =====
        // Note: MySQL2 Pool doesn't expose direct event handlers
        // We'll handle connection errors through try-catch in operations
        
        // ===== TEST INITIAL CONNECTION =====
        // Test koneksi awal untuk memastikan database dapat diakses
        MySQLDatabase.instance.execute("SELECT 1")
          .then(() => {
            console.log("✅ Terkoneksi ke Database MySQL.");
            MySQLDatabase.reconnectAttempts = 0;
          })
          .catch((err) => {
            console.error("❌ Tes koneksi awal MySQL gagal:", err);
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

  // ===== HANDLE CONNECTION LOST =====
  // Method untuk handle connection lost events
  private static async handleConnectionLost(): Promise<void> {
    if (MySQLDatabase.isReconnecting) return;
    
    MySQLDatabase.isReconnecting = true;
    console.log('🔄 Menangani koneksi MySQL yang terputus...');
    
    try {
      await MySQLDatabase.forceReconnectWithRetry();
    } finally {
      MySQLDatabase.isReconnecting = false;
    }
  }

  // ===== FORCE RECONNECTION WITH RETRY =====
  // Method untuk memaksa reconnect database dengan retry mechanism
  static async forceReconnectWithRetry(): Promise<Pool> {
    if (MySQLDatabase.isReconnecting && MySQLDatabase.reconnectAttempts >= MySQLDatabase.maxReconnectAttempts) {
      throw new Error('Maksimum percobaan reconnect telah tercapai');
    }

    MySQLDatabase.reconnectAttempts++;
    console.log(`🔄 Memaksa reconnect MySQL... (Percobaan ${MySQLDatabase.reconnectAttempts}/${MySQLDatabase.maxReconnectAttempts})`);
    
    if (MySQLDatabase.instance) {
      try {
        // Tutup pool connection yang ada dengan shutdown bertahap
        await MySQLDatabase.instance.end();
      } catch (err) {
        console.warn("⚠️ Kesalahan saat menutup pool yang ada:", err);
      }
      MySQLDatabase.instance = null; // Reset instance
    }

    // Tunggu sebelum mencoba lagi (penundaan bertahap)
    const delay = Math.min(1000 * Math.pow(2, MySQLDatabase.reconnectAttempts - 1), 10000);
    await new Promise(resolve => setTimeout(resolve, delay));

    const newInstance = MySQLDatabase.getInstance(); // Buat instance baru
    // Add safeQuery method to the new instance
    (newInstance as any).safeQuery = MySQLDatabase.safeQuery;
    return newInstance;
  }

  // ===== FORCE RECONNECTION METHOD =====
  // Method untuk memaksa reconnect database (berguna saat koneksi terputus)
  static forceReconnect(): Pool {
    if (MySQLDatabase.instance) {
      console.log("🔄 Memaksa reconnect MySQL...");
      try {
        // Tutup pool connection yang ada
        MySQLDatabase.instance.end();
      } catch (err) {
        console.warn("⚠️ Kesalahan saat menutup pool yang ada:", err);
      }
      MySQLDatabase.instance = null; // Reset instance
    }
    const newInstance = MySQLDatabase.getInstance(); // Buat instance baru
    // Add safeQuery method to the new instance
    (newInstance as any).safeQuery = MySQLDatabase.safeQuery;
    return newInstance;
  }

  // ===== METODE PEMERIKSAAN KESEHATAN TINGKAT LANJUT =====
  // Method untuk mengecek kesehatan koneksi database dengan pemeriksaan menyeluruh
  static async healthCheck(): Promise<boolean> {
    try {
      const pool = MySQLDatabase.getInstance();
      if (!pool) return false;

      // Test dengan timeout
      const healthPromise = pool.execute("SELECT 1 as health_check, NOW() as server_time");
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout health check')), 5000)
      );

      await Promise.race([healthPromise, timeoutPromise]);
      return true; // Koneksi sehat
    } catch (error: any) {
      console.error("❌ Health check MySQL gagal:", error);
      
      // Auto reconnect on certain errors
      if (error.message?.includes('Pool is closed') || 
          error.code === 'PROTOCOL_CONNECTION_LOST' ||
          error.code === 'ER_CONNECTION_LOST' ||
          error.code === 'ECONNRESET') {
        console.log('🔄 Mencoba reconnect otomatis karena pemeriksaan kesehatan gagal...');
        try {
          await MySQLDatabase.forceReconnectWithRetry();
          return true;
        } catch (reconnectError) {
          console.error('❌ Reconnect otomatis gagal:', reconnectError);
        }
      }
      return false; // Koneksi bermasalah
    }
  }

  // ===== SAFE QUERY METHOD =====
  // Method untuk execute query dengan auto-retry pada connection errors
  static async safeQuery(sql: string, params: any[] = []): Promise<any> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const pool = MySQLDatabase.getInstance();
        
        // ===== TRANSACTION COMMANDS HANDLING =====
        // Use query() for transaction commands that don't support prepared statements
        const transactionCommands = [
          'START TRANSACTION',
          'BEGIN',
          'COMMIT',
          'ROLLBACK',
          'SET TRANSACTION',
          'SAVEPOINT',
          'RELEASE SAVEPOINT',
          'ROLLBACK TO SAVEPOINT'
        ];
        
        const isTransactionCommand = transactionCommands.some(cmd => 
          sql.trim().toUpperCase().startsWith(cmd)
        );
        
        if (isTransactionCommand) {
          // Use query() for transaction commands
          return await pool.query(sql, params);
        } else {
          // Use execute() for regular queries (supports prepared statements)
          return await pool.execute(sql, params);
        }
      } catch (error: any) {
        lastError = error;
        console.error(`❌ Percobaan query ke-${attempt} gagal:`, error);
        
        if (error.message?.includes('Pool is closed') || 
            error.code === 'PROTOCOL_CONNECTION_LOST' ||
            error.code === 'ER_CONNECTION_LOST' ||
            error.code === 'ECONNRESET') {
          
          if (attempt < 3) {
            console.log(`🔄 Mencoba reconnect database (percobaan ${attempt}/3)...`);
            try {
              await MySQLDatabase.forceReconnectWithRetry();
              // Wait a bit before retry
              await new Promise(resolve => setTimeout(resolve, 1000));
              continue;
            } catch (reconnectError) {
              console.error('❌ Reconnect gagal:', reconnectError);
            }
          }
        }
        
        // If not a connection error or max attempts reached, throw immediately
        if (attempt === 3 || (!error.message?.includes('Pool is closed') && 
            error.code !== 'PROTOCOL_CONNECTION_LOST' &&
            error.code !== 'ER_CONNECTION_LOST' &&
            error.code !== 'ECONNRESET')) {
          break;
        }
      }
    }
    
    throw lastError;
  }

  // ===== INSTANCE SAFE QUERY METHOD =====
  // Instance method untuk safe query yang bisa dipanggil dengan this.db.safeQuery()
  async safeQuery(sql: string, params: any[] = []): Promise<any> {
    return MySQLDatabase.safeQuery(sql, params);
  }

  // ===== SHUTDOWN BERTAHAP =====
  // Method untuk shutdown bertahap database pool
  static async shutdown(): Promise<void> {
    if (MySQLDatabase.instance) {
      console.log('🔄 Mematikan connection pool MySQL...');
      try {
        await MySQLDatabase.instance.end();
        MySQLDatabase.instance = null;
        console.log('✅ Connection pool MySQL berhasil dimatikan dengan bertahap');
      } catch (error) {
        console.error('❌ Kesalahan saat shutdown MySQL:', error);
      }
    }
  }
}


// ===== SIMPLIFIED DATABASE SERVICE =====
// Centralized database service dengan error handling dan query optimization
export class DatabaseService {
  private static instance: DatabaseService | null = null;
  private db: Pool;

  private constructor() {
    this.db = MySQLDatabase.getInstance();
  }

  // ===== POLA INSTANCE TUNGGAL =====
  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  // ===== SAFE QUERY EXECUTION =====
  async query(sql: string, params: any[] = []): Promise<any> {
    try {
      return await MySQLDatabase.safeQuery(sql, params);
    } catch (error: any) {
      console.error('❌ Query database gagal:', error);
      throw error;
    }
  }

  // ===== CONNECTION STATUS =====
  async isConnected(): Promise<boolean> {
    return await MySQLDatabase.healthCheck();
  }

  // ===== GRACEFUL SHUTDOWN =====
  async shutdown(): Promise<void> {
    await MySQLDatabase.shutdown();
    DatabaseService.instance = null;
  }
}

// ===== SIMPLIFIED PERFORMANCE MONITOR =====
// Lightweight performance monitoring untuk basic metrics
export class PerformanceMonitor {
  private static instance: PerformanceMonitor | null = null;
  private metrics: Map<string, any> = new Map();
  private startTime: number = Date.now();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // ===== RECORD METRIC =====
  recordMetric(name: string, value: number): void {
    this.metrics.set(name, {
      value,
      timestamp: Date.now(),
      count: (this.metrics.get(name)?.count || 0) + 1
    });
  }

  // ===== GET SYSTEM METRICS =====
  getSystemMetrics(): any {
    const memUsage = process.memoryUsage();
    
    // Auto-detect runtime
    const isNode = typeof process !== 'undefined' && process.versions?.node;
    const isBun = typeof process !== 'undefined' && process.versions?.bun;
    const runtime = isBun ? 'bun' : (isNode ? 'node' : 'unknown');
    
    return {
      memory: {
        rss: Math.round(memUsage.rss / 1024 / 1024), // MB
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      },
      uptime: Math.round(process.uptime()), // seconds
      runtime,
      metricsCount: this.metrics.size
    };
  }

  // ===== CLEAR METRICS =====
  clearMetrics(): void {
    this.metrics.clear();
  }
}

// ===== EXPORT SINGLETON INSTANCES =====
export const databaseService = DatabaseService.getInstance();
export const performanceMonitor = PerformanceMonitor.getInstance();


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
    console.log("Aplikasi berhasil dibuat:", data);
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
    console.log("HTTP Integration berhasil ditambahkan:", data);
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
    console.log("Device berhasil ditambahkan:", data);
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
    console.log("Device keys berhasil ditambahkan:", data);
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

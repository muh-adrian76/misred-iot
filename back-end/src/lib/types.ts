/**
 * ===== TYPE DEFINITIONS - DEFINISI TIPE DATA SISTEM IoT =====
 * File ini berisi definisi interface dan type untuk type safety dalam TypeScript
 * Meliputi: Request/Response types, WebSocket payloads, Device Command structures
 */

// ===== MAIN REQUEST/RESPONSE INTERFACE =====
// Interface utama untuk struktur request dan response API
export interface Types {
  // Method untuk response JSON dengan name dan description
  json():
    | {
        name: any; // Nama resource atau data
        description: any; // Deskripsi resource atau data
      }
    | PromiseLike<{
        name: any;
        description: any;
      }>;
  
  // Body request yang diterima dari client (form data, JSON payload)
  body: {
    code: string; // Kode verifikasi, command, atau identifier
    name?: string; // Nama user, device, atau resource
    board?: string; // Jenis board IoT (Arduino, ESP32, dll)
    protocol?: string; // Protokol komunikasi (HTTP, MQTT, LoRaWAN)
    device_id?: number; // ID device yang akan dikontrol
    topic?: string; // MQTT topic untuk publish/subscribe
    qos?: number; // Quality of Service untuk MQTT (0, 1, 2)
    lora_profile?: string; // Profile LoRaWAN untuk device
    
    // Sensor data values (data sensor dari payload)
    ph?: number; // Nilai pH sensor
    cod?: number; // Nilai COD (Chemical Oxygen Demand) sensor
    tss?: number; // Nilai TSS (Total Suspended Solids) sensor
    nh3n?: number; // Nilai NH3-N (Ammonia Nitrogen) sensor
    flow?: number; // Nilai flow rate sensor
    server_time?: string; // Timestamp server untuk sinkronisasi
    
    // Alarm configuration (konfigurasi alarm dan threshold)
    operator?: string; // Operator perbandingan (>, <, =, >=, <=)
    threshold?: number; // Nilai threshold untuk trigger alarm
    sensor?: string; // Jenis sensor untuk alarm
    
    // Authentication data (data autentikasi dan user)
    password: string; // Password user (wajib untuk auth)
    email?: string; // Email user untuk registrasi/login
    otp?: string; // One-Time Password untuk verifikasi
    refresh_token?: string; // Refresh token untuk renewal
    description?: string; // Deskripsi device, alarm, atau resource
    sensor_type?: string; // Tipe sensor (analog, digital, boolean)
    last_login?: string; // Timestamp last login user
  };
  
  // URL parameters dari routing (path parameters)
  params: {
    id: string; // Generic ID untuk resource (user, device, alarm, dll)
    device_id: string; // Device ID dari URL path
    sensor: string; // Sensor identifier dari URL path
    sub: string; // Subject dari JWT (user_id atau device_id)
    iat: number; // Issued At timestamp untuk JWT
    type: string; // Type identifier (access, refresh, device, dll)
  };
  
  // Cookie data dari browser
  cookie: {
    auth: any; // Authentication cookies (access_token, refresh_token)
  };
  
  // HTTP headers dari request
  headers: {
    [x: string]: any; // Dynamic headers (custom headers)
    authorization: string; // Authorization header dengan Bearer token
  };
  
  // JWT utilities dan methods
  jwt: {
    // Method untuk signing JWT dengan payload
    sign(arg0: { sub: string; iat: number; type: string }): any;
    // Method untuk verifying dan decoding JWT
    verify: (arg0: any) => any;
  };
  
  // Additional authentication data
  authorization: string; // Authorization string dari middleware
  user: any; // User data setelah authentication
  error: any; // Error object untuk error handling
}

// ===== DEVICE COMMAND MANAGEMENT TYPES =====
// Status enum untuk tracking lifecycle device command
export type CommandStatus = "pending" | "sent" | "acknowledged" | "failed";

// Interface untuk device command yang disimpan di database
export interface DeviceCommand {
  // Primary fields dari tabel device_commands
  id: number; // Auto-increment primary key
  device_id: number; // ID device yang akan menerima command
  datastream_id: number; // ID datastream (pin) yang akan dikontrol
  command_type: "set_value" | "toggle" | "reset"; // Jenis command yang akan dieksekusi
  value: number; // Nilai yang akan dikirim ke device (0/1 untuk toggle, specific value untuk set_value)
  status: CommandStatus; // Status eksekusi command
  sent_at: string; // Timestamp kapan command dikirim (ISO string)
  acknowledged_at?: string; // Optional: timestamp kapan device acknowledge (ISO string)
  user_id: number; // ID user yang mengirim command
  
  // Optional joined fields dari tabel datastreams (untuk display purpose)
  pin?: string; // Pin identifier (V0, V1, D1, dll) dari datastream
  datastream_type?: string; // Tipe datastream (boolean, double, integer)
  datastream_name?: string; // Nama datastream (LED Control, Pump Control, dll)
  
  // Optional joined fields dari tabel users/devices (untuk display purpose)
  user_name?: string; // Nama user yang mengirim command
  device_name?: string; // Nama device yang menerima command
}

// ===== WEBSOCKET COMMAND PAYLOAD =====
// Interface untuk command yang dikirim via WebSocket ke device
export interface WSCommand {
  command_id: string; // Unique identifier untuk tracking command
  device_id: string; // ID device target (string untuk compatibility)
  datastream_id: string; // ID datastream target (string untuk compatibility)
  command_type: "set_value" | "toggle" | "reset"; // Jenis operasi yang akan dilakukan
  value: number; // Nilai yang akan diset ke device (0/1 untuk boolean, specific value untuk numeric)
  pin: string; // Pin identifier yang akan dikontrol (V0, V1, D1, dll)
  timestamp: number; // Unix timestamp kapan command dibuat
}

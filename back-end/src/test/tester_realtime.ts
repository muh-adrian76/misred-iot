/**
 * REAL-TIME TESTER - Continuous Payload Sender
 * ✅ SINKRON DENGAN ESP32: Menggunakan format yang sama dengan ESP32
 * - Sends HTTP and MQTT payloads every second
 * - Realistic sensor data simulation
 * - Perfect for testing real-time dashboard monitoring
 * - AES ENCRYPTION: ESP32 menggunakan device_secret sebagai AES key (data field encrypted dalam JWT)
 */

import crypto from "crypto";
import mqtt, { MqttClient } from "mqtt";
import mysql from "mysql2/promise";

// const SERVER_URL = "http://localhost:7601";
const SERVER_URL = "https://api.misred-iot.com";

const MQTT_CONFIG = {
  // host: "localhost",
  host: "103.82.241.46",
  port: 1883,
  clientId: "Realtime_Test_Client",
};

// Database configuration
// const DB_CONFIG = {
//   host: "localhost",
//   user: "root",
//   password: "",
//   database: "misred_iot",
//   port: 3306,
// };
const DB_CONFIG = {
  host: "103.229.73.15",
  user: "misredio_web",
  password: "misred-iot.com",
  database: "misredio_web",
  port: 3306,
};

// Device configurations (will be loaded from database)
let HTTP_DEVICE = {
  device_id: "1",
  device_secret: "f263a0a44aed3b4d988901d1fc5a4af4",
  name: "ESP32 SPARING",
};

let MQTT_DEVICE = {
  device_id: "2",
  device_secret: "6607bc2eebb3ce7a020ad4e9d9322035",
  name: "ESP32 SPARING 2",
  topic: "device/data",
};

// Realistic sensor ranges with slow variations
const SENSOR_RANGES = {
  V0: { min: 0, max: 14, current: 7.1 }, // pH (slowly varying)
  V1: { min: 0, max: 100.0, current: 30.0 }, // Flow L/min
  V2: { min: 0, max: 200.0, current: 50.0 }, // COD mg/L
  V3: { min: -10.0, max: 60.0, current: 26.0 }, // Temperature °C
  V4: { min: 0, max: 20, current: 2.5 }, // NH3N mg/L
  V5: { min: 0, max: 100.0, current: 10.0 }, // NTU
};

// Global counters for monitoring
let httpCount = 0;
let mqttCount = 0;
let httpSuccessCount = 0;
let mqttSuccessCount = 0;

/**
 * Generate realistic sensor data with gradual changes
 * ✅ SINKRON DENGAN ESP32: Format data sensor sama persis dengan ESP32
 */
function generateRealtimeSensorData(): any {
  // ✅ SAMA SEPERTI ESP32: Timestamp menggunakan timeClient.getEpochTime() (seconds, bukan milliseconds)
  const timestamp = Math.floor(Date.now() / 1000);
  
  const data: any = {
    timestamp: timestamp, // ✅ SAMA SEPERTI ESP32: Unix timestamp dalam SECONDS
  };

  // Generate gradual variations (±5% change from current value)
  Object.entries(SENSOR_RANGES).forEach(([pin, range]) => {
    const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
    let newValue = range.current * (1 + variation);

    // Keep within realistic bounds
    newValue = Math.max(range.min, Math.min(range.max, newValue));

    // Update current value for next iteration
    range.current = newValue;

    // ✅ SAMA SEPERTI ESP32: Round to 2 decimal places seperti ESP32
    data[pin] = Math.round(newValue * 100) / 100;
  });

  return data;
}

/**
 * Load device secrets from database
 */
async function loadDeviceSecrets(): Promise<boolean> {
  let connection;
  try {
    connection = await mysql.createConnection(DB_CONFIG);

    const [rows] = await connection.execute(
      "SELECT id, description, new_secret FROM devices WHERE id IN (1, 2)"
    );

    const devices = rows as any[];

    if (devices.length === 0) {
      console.error("❌ No devices found in database");
      return false;
    }

    devices.forEach((device: any) => {
      if (device.id === 1) {
        HTTP_DEVICE.device_secret = device.new_secret;
        HTTP_DEVICE.name = device.description;
      } else if (device.id === 2) {
        MQTT_DEVICE.device_secret = device.new_secret;
        MQTT_DEVICE.name = device.description;
      }
    });

    // console.log(`🔑 Loaded secrets for devices 1 and 2`);
    return !!(HTTP_DEVICE.device_secret && MQTT_DEVICE.device_secret);
  } catch (error) {
    console.error("❌ Database error:", error);
    return false;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

/**
 * AES-128-CBC Encryption (Compatible with ESP32 AESUtils library)
 * ✅ SINKRON DENGAN ESP32: Same format as ESP32 AESUtils::encryptPayload
 */
function encryptPayloadAES(payload: string, secret: string): string {
  try {
    console.log(`🔒 AES Encrypting payload: ${payload.substring(0, 50)}...`);

    // ✅ SAMA SEPERTI ESP32: Convert hex secret to bytes untuk AES key
    const key = Buffer.from(secret, "hex").subarray(0, 16);
    console.log(`🔑 Key length: ${key.length} bytes (from hex: ${secret.substring(0, 16)}...)`);

    // ✅ SAMA SEPERTI ESP32: Generate random IV (16 bytes) - ESP32 juga generate IV secara random
    const iv = crypto.randomBytes(16);
    console.log(`🔑 Generated IV: ${iv.toString("hex")}`);

    // ✅ SAMA SEPERTI ESP32: Create cipher with AES-128-CBC
    const cipher = crypto.createCipheriv("aes-128-cbc", key, iv);
    cipher.setAutoPadding(true); // PKCS#7 padding like ESP32

    // Encrypt the payload
    let encrypted = cipher.update(payload, "utf8", "hex");
    encrypted += cipher.final("hex");

    console.log(`🔐 Encrypted data: ${encrypted.substring(0, 32)}...`);

    // ✅ SAMA SEPERTI ESP32: Combine IV + encrypted data (same format as AESUtils)
    const combined = Buffer.concat([iv, Buffer.from(encrypted, "hex")]);
    const result = combined.toString("base64");

    console.log(`📦 Final encrypted payload length: ${result.length}`);
    return result;
  } catch (error) {
    console.error("❌ AES encryption error:", error);
    throw error;
  }
}

/**
 * OLD: Encrypt payload using Base64 (NO AES) - DEPRECATED
 */
function encryptPayload(payload: string): string {
  return Buffer.from(payload).toString("base64");
}

/**
 * Create JWT token with HMAC-SHA256
 * ✅ SINKRON DENGAN ESP32: AES encrypted data + timezone +7 sama seperti ESP32
 */
function createJWTToken(
  encryptedPayload: string, // ✅ ENCRYPTED: Data sudah terenkripsi AES
  deviceId: string,
  secret: string
): string {
  const header = {
    alg: "HS256",
    typ: "JWT",
  };

  // ✅ SAMA SEPERTI ESP32: timeClient.getEpochTime() + (7*3600) untuk timezone +7
  const currentTime = Math.floor(Date.now() / 1000);
  const expiryTime = currentTime + 3600; // 1 hour

  const payload = {
    data: encryptedPayload, // ✅ SAMA SEPERTI ESP32: Encrypted data (Base64)
    sub: deviceId,          // ✅ SAMA SEPERTI ESP32: Device ID
    iat: currentTime,       // ✅ SAMA SEPERTI ESP32: Waktu lokal +7
    exp: expiryTime,        // ✅ SAMA SEPERTI ESP32: Expire 1 hour
  };

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString(
    "base64url"
  );
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
    "base64url"
  );

  const data = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto
    .createHmac("sha256", secret)
    .update(data)
    .digest("base64url");

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Send HTTP payload
 * ✅ SINKRON DENGAN ESP32: Hapus enkripsi Base64, langsung JSON seperti ESP32
 */
async function sendHTTPPayload(): Promise<boolean> {
  try {
    httpCount++;

    const sensorData = generateRealtimeSensorData();
    const payload = JSON.stringify(sensorData);

    // ✅ SAMA SEPERTI ESP32: AES encrypt payload menggunakan device_secret
    const encryptedPayload = encryptPayloadAES(payload, HTTP_DEVICE.device_secret);
    
    const jwtToken = createJWTToken(
      encryptedPayload, // ✅ ENCRYPTED: Data sudah terenkripsi AES
      HTTP_DEVICE.device_id,
      HTTP_DEVICE.device_secret
    );

    const response = await fetch(`${SERVER_URL}/payload/http`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwtToken}`,
      },
      body: JSON.stringify({}), // ✅ SAMA SEPERTI ESP32: Empty body, data di JWT
    });

    if (response.ok) {
      httpSuccessCount++;
      return true;
    } else {
      console.error(`❌ HTTP failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error(
      `❌ HTTP error:`,
      error instanceof Error ? error.message : String(error)
    );
    return false;
  }
}

/**
 * Send MQTT payload
 * ✅ SINKRON DENGAN ESP32: Kirim JWT token langsung seperti ESP32
 */
function sendMQTTPayload(mqttClient: MqttClient): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      mqttCount++;

      const sensorData = generateRealtimeSensorData();
      const payload = JSON.stringify(sensorData);

      // ✅ SAMA SEPERTI ESP32: AES encrypt payload menggunakan device_secret
      const encryptedPayload = encryptPayloadAES(payload, MQTT_DEVICE.device_secret);
      
      const jwtToken = createJWTToken(
        encryptedPayload, // ✅ ENCRYPTED: Data sudah terenkripsi AES
        MQTT_DEVICE.device_id,
        MQTT_DEVICE.device_secret
      );

      // ✅ SAMA SEPERTI ESP32: Kirim JWT token langsung, bukan dalam object
      // ESP32: mqttClient.publish(mqtt_topic, mqttPayload.c_str())
      mqttClient.publish(MQTT_DEVICE.topic, jwtToken, (error) => {
        if (error) {
          console.error(`❌ MQTT error:`, error.message);
          resolve(false);
        } else {
          mqttSuccessCount++;
          resolve(true);
        }
      });
    } catch (error) {
      console.error(`❌ MQTT payload error:`, error);
      resolve(false);
    }
  });
}

/**
 * Print statistics
 */
function printStats(): void {
  const httpSuccessRate =
    httpCount > 0 ? Math.round((httpSuccessCount / httpCount) * 100) : 0;
  const mqttSuccessRate =
    mqttCount > 0 ? Math.round((mqttSuccessCount / mqttCount) * 100) : 0;

  console.log(
    `📊 Stats: HTTP ${httpSuccessCount}/${httpCount} (${httpSuccessRate}%) | MQTT ${mqttSuccessCount}/${mqttCount} (${mqttSuccessRate}%)`
  );
}

/**
 * Main real-time testing function
 */
async function runRealtimeTest(): Promise<void> {
  console.log("🚀 REAL-TIME TESTER - Continuous Dashboard Monitoring Test");
  console.log("=========================================================");
  console.log("📡 Sending HTTP and MQTT payloads every second...");
  console.log("🎯 Purpose: Test real-time dashboard monitoring");
  console.log("⏹️  Press Ctrl+C to stop");
  console.log("");

  // Load device secrets
  const secretsLoaded = await loadDeviceSecrets();
  if (!secretsLoaded) {
    console.error("❌ Cannot load device secrets. Exiting...");
    return;
  }

  console.log(
    `🔑 HTTP Device: ${HTTP_DEVICE.name} (ID: ${HTTP_DEVICE.device_id})`
  );
  console.log(
    `🔑 MQTT Device: ${MQTT_DEVICE.name} (ID: ${MQTT_DEVICE.device_id})`
  );
  console.log("");

  // Setup MQTT client
  const mqttClient: MqttClient = mqtt.connect(
    `mqtt://${MQTT_CONFIG.host}:${MQTT_CONFIG.port}`,
    {
      clientId: MQTT_CONFIG.clientId,
    }
  );

  let mqttConnected = false;

  mqttClient.on("connect", () => {
    console.log("✅ MQTT connected");
    mqttConnected = true;
  });

  mqttClient.on("error", (error) => {
    console.error("❌ MQTT connection error:", error.message);
  });

  mqttClient.on("close", () => {
    console.log("🔌 MQTT disconnected");
    mqttConnected = false;
  });

  // Wait for MQTT connection
  while (!mqttConnected) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log("🎬 Starting real-time payload transmission...\n");

  // Setup interval for sending data every second
  const interval = setInterval(async () => {
    const timestamp = new Date().toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta" });

    // Send HTTP payload
    const httpSuccess = await sendHTTPPayload();

    // Send MQTT payload (only if connected)
    let mqttSuccess = false;
    if (mqttConnected) {
      mqttSuccess = await sendMQTTPayload(mqttClient);
    }

    // Print real-time status
    const httpStatus = httpSuccess ? "✅" : "❌";
    const mqttStatus = mqttSuccess ? "✅" : "❌";

    process.stdout.write(
      `\r[${timestamp}] HTTP ${httpStatus} | MQTT ${mqttStatus} | Total: ${
        httpCount + mqttCount
      }`
    );

    // Print detailed stats every 10 seconds
    if ((httpCount + mqttCount) % 10 === 0) {
      console.log(""); // New line
      printStats();
    }
  }, 30000); // Every 5 seconds

  // Setup graceful shutdown
  process.on("SIGINT", () => {
    console.log("\n\n🛑 Stopping real-time test...");
    clearInterval(interval);

    if (mqttClient) {
      mqttClient.end();
    }

    console.log("\n📊 Final Statistics:");
    printStats();

    console.log(
      "\n🎯 Test completed. Check your dashboard for real-time updates!"
    );
    process.exit(0);
  });

  // Keep the process running
  await new Promise(() => {}); // Run indefinitely
}

/**
 * Quick functions for testing individual components
 */
export async function quickHTTPRealtime(): Promise<void> {
  console.log("🚀 Quick HTTP Real-time Test");
  const secretsLoaded = await loadDeviceSecrets();
  if (!secretsLoaded) return;

  console.log("📡 Sending HTTP payload...");
  const success = await sendHTTPPayload();
  console.log(
    success ? "✅ HTTP payload sent successfully" : "❌ HTTP payload failed"
  );
}

export async function quickMQTTRealtime(): Promise<void> {
  console.log("🚀 Quick MQTT Real-time Test");
  const secretsLoaded = await loadDeviceSecrets();
  if (!secretsLoaded) return;

  const client = mqtt.connect(
    `mqtt://${MQTT_CONFIG.host}:${MQTT_CONFIG.port}`,
    {
      clientId: `${MQTT_CONFIG.clientId}_Quick`,
    }
  );

  client.on("connect", async () => {
    console.log("📡 Sending MQTT payload...");
    const success = await sendMQTTPayload(client);
    console.log(
      success ? "✅ MQTT payload sent successfully" : "❌ MQTT payload failed"
    );
    client.end();
  });

  client.on("error", (error) => {
    console.error("❌ MQTT connection error:", error.message);
  });
}

/**
 * Show current sensor values
 */
export async function showCurrentSensorValues(): Promise<void> {
  console.log("📊 Current Sensor Values:");
  console.log("========================");

  const data = generateRealtimeSensorData();

  console.log(`🧪 V0 (pH): ${data.V0}`);
  console.log(`💧 V1 (Flow): ${data.V1} L/min`);
  console.log(`🔬 V2 (COD): ${data.V2} mg/L`);
  console.log(`🌡️ V3 (Temp): ${data.V3} °C`);
  console.log(`⚗️ V4 (NH3N): ${data.V4} mg/L`);
  console.log(`🌊 V5 (NTU): ${data.V5}`);
  console.log(`⏰ Timestamp (Unix seconds): ${data.timestamp}`);
  console.log(
    `⏰ Timestamp (Human readable): ${new Date(data.timestamp * 1000).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}`
  );
}

// Run real-time test if called directly
if (import.meta.main) {
  runRealtimeTest().catch(console.error);
}

// Export main functions
export {
  runRealtimeTest,
  generateRealtimeSensorData,
  sendHTTPPayload,
  sendMQTTPayload,
  loadDeviceSecrets,
};

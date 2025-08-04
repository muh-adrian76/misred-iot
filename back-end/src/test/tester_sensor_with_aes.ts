/**
 * SENSOR TESTER - Compatible with ESP32 AESUtils Library Format
 * ✅ SINKRON DENGAN ESP32: Menggunakan format yang sama dengan ESP32 AESUtils
 * - AES ENCRYPTION: ESP32 menggunakan AESUtils::encryptPayload dengan device_secret sebagai key
 * - JWT dengan data field berisi encrypted data (Base64)
 * - Timezone +7 jam seperti ESP32
 * - Format sensor data sama persis (V0-V5) dengan timestamp
 */

import crypto from "crypto";
import mqtt, { MqttClient } from "mqtt";
import mysql from "mysql2/promise";

const SERVER_URL = "http://localhost:7601";
const MQTT_CONFIG = {
  host: "localhost",
  port: 1883,
  clientId: "ESP32_Compatible_Test_Client", // ✅ Update nama client
};

// Database configuration
const DB_CONFIG = {
  host: process.env.MYSQL_HOST || "localhost",
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "",
  database: process.env.MYSQL_NAME || "misred_iot",
  port: Number(process.env.MYSQL_PORT) || 3306,
};

// Test device configurations (will be updated from database)
let HTTP_DEVICE = {
  device_id: "1",
  device_secret: "",
  old_secret: "",
  name: "HTTP Test Device (ESP32 Compatible)", // ✅ Update nama
};

let MQTT_DEVICE = {
  device_id: "2",
  device_secret: "",
  old_secret: "",
  name: "MQTT Test Device (ESP32 Compatible)", // ✅ Update nama
  topic: "device/data",
};

// Realistic sensor ranges
const SENSOR_RANGES = {
  V0: { min: 6.5, max: 8.5 }, // pH
  V1: { min: 10.0, max: 50.0 }, // Flow L/min
  V2: { min: 20.0, max: 80.0 }, // COD mg/L
  V3: { min: 20.0, max: 35.0 }, // Temperature °C
  V4: { min: 0.1, max: 5.0 }, // NH3N mg/L
  V5: { min: 1.0, max: 20.0 }, // NTU
};

/**
 * Generate sensor data with ALARM TRIGGER values
 * ✅ SINKRON DENGAN ESP32: Timestamp field sama seperti ESP32
 * - V0 (pH): Set to 8.5 (trigger alarm > 8.0)
 * - V1 (Flow): Set to 12.0 (trigger alarm < 15.0)
 * - Other sensors: normal values
 */
function generateAlarmTriggerData(): any {
  // ✅ SAMA SEPERTI ESP32: Timestamp menggunakan timeClient.getEpochTime() (seconds)
  const timestamp = Math.floor(Date.now() / 1000);
  
  return {
    timestamp: timestamp, // ✅ SAMA SEPERTI ESP32: Timestamp field dalam seconds
    V0: 8.5, // pH > 8.0 → TRIGGER ALARM 1
    V1: 12.0, // Flow < 15.0 → TRIGGER ALARM 2
    V2: 45.8, // COD normal
    V3: 28.3, // Temperature normal
    V4: 2.1, // NH3N normal
    V5: 8.7, // NTU normal
  };
}

/**
 * Generate realistic sensor data matching ESP32 format
 * ✅ SINKRON DENGAN ESP32: Format V0-V5, timestamp sama seperti ESP32
 */
function generateSensorData(): any {
  // ✅ SAMA SEPERTI ESP32: Timestamp menggunakan timeClient.getEpochTime() (seconds)
  const timestamp = Math.floor(Date.now() / 1000);
  
  const data: any = {
    timestamp: timestamp, // ✅ SAMA SEPERTI ESP32: Timestamp field dalam seconds
  };

  Object.entries(SENSOR_RANGES).forEach(([pin, range]) => {
    const randomValue = range.min + Math.random() * (range.max - range.min);
    // ✅ SAMA SEPERTI ESP32: Round to 2 decimal places seperti ESP32 sensor functions
    data[pin] = Math.round(randomValue * 100) / 100;
  });

  return data;
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
 * AES-128-CBC Decryption for testing (server-side simulation)
 */
function decryptPayloadAES(encryptedData: string, secret: string): string {
  try {
    console.log(`🔓 Mendekripsi payload AES...`);

    // Decode base64
    const combined = Buffer.from(encryptedData, "base64");
    console.log(`📦 Panjang data gabungan: ${combined.length}`);

    // Extract IV (first 16 bytes) and encrypted data
    const iv = combined.slice(0, 16);
    const encrypted = combined.slice(16);

    console.log(`🔑 IV yang diekstrak: ${iv.toString("hex")}`);
    console.log(`🔐 Panjang data terenkripsi: ${encrypted.length}`);

    // Use secret as hex key (same as encryption)
    const key = Buffer.from(secret, "hex").subarray(0, 16);
    console.log(
      `🔑 Panjang kunci: ${key.length} bytes (dari hex: ${secret.substring(
        0,
        16
      )}...)`
    );

    // Create decipher with AES-128-CBC
    const decipher = crypto.createDecipheriv("aes-128-cbc", key, iv);
    decipher.setAutoPadding(true); // Auto-handle PKCS#7 padding

    // Decrypt the data
    let decrypted = decipher.update(encrypted, undefined, "utf8");
    decrypted += decipher.final("utf8");

    console.log(`✅ Payload terdekripsi: ${decrypted.substring(0, 50)}...`);
    return decrypted;
  } catch (error) {
    console.error("❌ Kesalahan dekripsi AES:", error);
    throw error;
  }
}

/**
 * Test AES encryption/decryption locally
 */
function testAESEncryptionDecryption(): boolean {
  console.log("\n🧪 Pengujian Enkripsi/Dekripsi AES Secara Lokal");
  console.log("─".repeat(50));

  try {
    const testData = JSON.stringify({
      V0: 7.2,
      V1: 35.5,
      V2: 45.8,
      V3: 28.3,
      V4: 2.1,
      V5: 8.7,
      timestamp: Math.floor(Date.now() / 1000)
    });
    
    const testSecret = "8358a7b6add3b33daf060be8345f0af4";
    
    console.log("📦 Original data:", testData);
    
    // Test encryption
    const encrypted = encryptPayloadAES(testData, testSecret);
    console.log("🔒 Encrypted data:", encrypted.substring(0, 64) + "...");
    
    // Test decryption
    const decrypted = decryptPayloadAES(encrypted, testSecret);
    console.log("🔓 Decrypted data:", decrypted);
    
    // Verify data integrity
    const originalObj = JSON.parse(testData);
    const decryptedObj = JSON.parse(decrypted);
    
    const isValid = JSON.stringify(originalObj) === JSON.stringify(decryptedObj);
    
    if (isValid) {
      console.log("✅ AES Enkripsi/Dekripsi berhasil! Data utuh dan sama.");
      return true;
    } else {
      console.log("❌ AES Enkripsi/Dekripsi gagal! Data tidak sama.");
      return false;
    }
  } catch (error) {
    console.error("❌ Error dalam pengujian AES:", error);
    return false;
  }
}

/**
 * Create JWT token compatible with ESP32 CustomJWT library
 * ✅ SINKRON DENGAN ESP32: Timezone +7 dan encrypted data sama seperti ESP32
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
 * Check current device secrets directly from MySQL database
 */
async function checkDeviceSecretsFromDB(): Promise<{
  device1: any;
  device2: any;
}> {
  let connection;
  try {
    connection = await mysql.createConnection(DB_CONFIG);

    const [rows] = await connection.execute(
      "SELECT id, description, new_secret, old_secret FROM devices WHERE id IN (1, 2)"
    );

    const devices = rows as any[];

    console.log("\n📋 Device Secrets:");
    console.log("═".repeat(60));

    let device1 = null;
    let device2 = null;

    if (devices.length === 0) {
      console.log("❌ Tidak ada device dalam database");
    } else {
      devices.forEach((device: any) => {
        console.log(`📱 Device ${device.id} (${device.description}):`);
        console.log(`   🔑 New Secret: ${device.new_secret}`);
        console.log(`   🗝️ Old Secret: ${device.old_secret || "None"}`);
        console.log("─".repeat(50));

        if (device.id === 1) {
          device1 = device;
          HTTP_DEVICE.device_secret = device.new_secret;
          HTTP_DEVICE.old_secret = device.old_secret;
        } else if (device.id === 2) {
          device2 = device;
          MQTT_DEVICE.device_secret = device.new_secret;
          MQTT_DEVICE.old_secret = device.old_secret;
        }
      });
    }

    console.log("\n💡 Secret yang digunakan saat ini:");
    if (device1) {
      console.log(`📱 HTTP Device 1: ${HTTP_DEVICE.device_secret}`);
    }
    if (device2) {
      console.log(`📡 MQTT Device 2: ${MQTT_DEVICE.device_secret}`);
    }

    return { device1, device2 };
  } catch (error) {
    console.error("❌ Database error:", error);
    return { device1: null, device2: null };
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

/**
 * Test secret renewal endpoint
 */
async function testSecretRenewal(
  deviceId: string,
  oldSecret: string
): Promise<string | null> {
  try {
    const response = await fetch(
      `${SERVER_URL}/device/renew-secret/${deviceId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          old_secret: oldSecret,
        }),
      }
    );

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Secret renewal successful for device ${deviceId}`);
      console.log(`🔑 New secret: ${result.secret_key}`);
      return result.secret_key;
    } else {
      const error = await response.text();
      console.log(`❌ Secret renewal failed for device ${deviceId}:`, error);
      return null;
    }
  } catch (error) {
    console.error(`💥 Secret renewal error for device ${deviceId}:`, error);
    return null;
  }
}

/**
 * Test HTTP payload endpoint with plain JSON (ESP32 compatible)
 * ✅ SINKRON DENGAN ESP32: Plain JSON dalam JWT data field
 */
async function testHTTPPayloadWithAES(
  deviceId: string,
  secret: string
): Promise<boolean> {
  try {
    // Step 1: Generate normal sensor data
    const sensorData = generateSensorData();
    const payload = JSON.stringify(sensorData);
    console.log(`📊 Generated sensor data: ${payload.substring(0, 100)}...`);

    // Step 2: ✅ SAMA SEPERTI ESP32: AES encrypt the payload menggunakan device_secret
    const encryptedPayload = encryptPayloadAES(payload, secret);
    console.log(`🔒 AES encrypted payload: ${encryptedPayload.substring(0, 64)}...`);

    // Step 3: Create JWT with encrypted payload (ESP32 format)
    const jwtToken = createJWTToken(encryptedPayload, deviceId, secret);
    console.log(`🎫 JWT token created: ${jwtToken.substring(0, 64)}...`);

    // Step 4: Send to server
    console.log("📤 Sending to server...");
    const response = await fetch(`${SERVER_URL}/payload/http`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwtToken}`,
      },
      body: JSON.stringify({}),
    });

    if (response.ok) {
      const result = await response.json();
      console.log(
        `✅ HTTP Plain JSON test successful for device ${deviceId}:`,
        result.message
      );
      return true;
    } else {
      const error = await response.text();
      console.log(`❌ HTTP AES test failed for device ${deviceId}:`, error);
      return false;
    }
  } catch (error) {
    console.error(`💥 HTTP AES test error for device ${deviceId}:`, error);
    return false;
  }
}

/**
 * Test HTTP payload with ALARM triggering values (ESP32 compatible)
 * ✅ SINKRON DENGAN ESP32: Plain JSON dalam JWT data field
 */
async function testHTTPPayloadWithAlarms(
  deviceId: string,
  secret: string
): Promise<boolean> {
  try {
    // Step 1: Generate ALARM triggering sensor data
    const alarmData = generateAlarmTriggerData();
    const payload = JSON.stringify(alarmData);
    console.log(`🚨 Generated ALARM data: ${JSON.stringify(alarmData)}`);

    // Step 2: ✅ SAMA SEPERTI ESP32: Langsung gunakan plain JSON, TIDAK ada enkripsi
    console.log(`� Plain JSON alarm payload: ${payload.substring(0, 64)}...`);

    // Step 3: Create JWT with plain JSON payload (ESP32 format)
    const jwtToken = createJWTToken(payload, deviceId, secret);
    console.log(`🎫 JWT token created: ${jwtToken.substring(0, 64)}...`);

    // Step 4: Send to server
    console.log("📤 Sending ALARM data to server...");
    const response = await fetch(`${SERVER_URL}/payload/http`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwtToken}`,
      },
      body: JSON.stringify({}),
    });

    if (response.ok) {
      const result = await response.json();
      console.log(
        `✅ HTTP ALARM test successful for device ${deviceId}:`,
        result.message
      );
      console.log(
        "🔄 Server Process: JWT Decode -> AES Decrypt -> Save Data -> Check Alarms → Send WhatsApp! 📱"
      );
      console.log(`📱 Expected notifications to: 6283119720725`);
      console.log(`🚨 Alarm 1: pH = 8.5 > 8.0 threshold`);
      console.log(`🚨 Alarm 2: Flow = 12.0 < 15.0 threshold`);
      return true;
    } else {
      const error = await response.text();
      console.log(`❌ HTTP ALARM test failed for device ${deviceId}:`, error);
      return false;
    }
  } catch (error) {
    console.error(`💥 HTTP ALARM test error for device ${deviceId}:`, error);
    return false;
  }
}

/**
 * Check alarm notifications history from database
 */
async function checkAlarmNotifications(): Promise<void> {
  console.log("\n📋 Checking alarm notifications from database...");

  let connection;
  try {
    connection = await mysql.createConnection(DB_CONFIG);

    // Get recent alarm notifications
    const [rows] = await connection.execute(`
      SELECT 
        an.id, an.alarm_id, an.sensor_value, an.conditions_text,
        an.notification_type, an.whatsapp_message_id, an.triggered_at,
        a.description as alarm_name,
        ds.description as sensor_name, ds.pin
      FROM alarm_notifications an
      JOIN alarms a ON an.alarm_id = a.id
      JOIN datastreams ds ON an.datastream_id = ds.id
      WHERE an.triggered_at >= NOW() - INTERVAL 1 HOUR
      ORDER BY an.triggered_at DESC
      LIMIT 10
    `);

    const notifications = rows as any[];

    console.log("\n📊 Recent Alarm Notifications:");
    console.log("═".repeat(80));

    if (notifications.length === 0) {
      console.log("❌ No alarm notifications found in the last hour");
    } else {
      notifications.forEach((notif: any, index: number) => {
        console.log(`📱 Notification ${index + 1}:`);
        console.log(`   🚨 Alarm: ${notif.alarm_name} (ID: ${notif.alarm_id})`);
        console.log(
          `   📊 Sensor: ${notif.sensor_name} (${notif.pin}) = ${notif.sensor_value}`
        );
        console.log(`   ⚠️ Condition: ${notif.conditions_text}`);
        console.log(
          `   📱 WhatsApp ID: ${notif.whatsapp_message_id || "Not sent"}`
        );
        console.log(`   🕐 Time: ${notif.triggered_at}`);
        console.log("─".repeat(60));
      });

      console.log(`\n✅ Found ${notifications.length} alarm notifications`);
      const whatsappSent = notifications.filter(
        (n) => n.whatsapp_message_id
      ).length;
      console.log(`📱 WhatsApp sent: ${whatsappSent}/${notifications.length}`);
    }
  } catch (error) {
    console.error("❌ Database error:", error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

/**
 * Check active alarms configuration
 */
async function checkAlarmsConfig(): Promise<void> {
  console.log("\n🔧 Checking alarms configuration...");

  let connection;
  try {
    connection = await mysql.createConnection(DB_CONFIG);

    // Get alarms with conditions
    const [rows] = await connection.execute(`
      SELECT 
        a.id, a.description, a.device_id, a.datastream_id, 
        a.is_active, a.cooldown_minutes,
        ds.description as sensor_name, ds.pin, ds.unit,
        ac.operator, ac.threshold,
        u.name as user_name, u.phone
      FROM alarms a
      JOIN datastreams ds ON a.datastream_id = ds.id
      JOIN alarm_conditions ac ON a.id = ac.alarm_id
      JOIN users u ON a.user_id = u.id
      WHERE a.device_id = 1
      ORDER BY a.id, ac.id
    `);

    const alarms = rows as any[];

    // console.log('\n🔧 Active Alarms Configuration:');
    // console.log('═'.repeat(80));

    if (alarms.length === 0) {
      console.log("❌ No alarms configured for device 1");
    } else {
      const groupedAlarms = alarms.reduce((acc: any, alarm: any) => {
        if (!acc[alarm.id]) {
          acc[alarm.id] = {
            ...alarm,
            conditions: [],
          };
        }
        acc[alarm.id].conditions.push({
          operator: alarm.operator,
          threshold: alarm.threshold,
        });
        return acc;
      }, {});

      Object.values(groupedAlarms).forEach((alarm: any, index: number) => {
        console.log(`🚨 Alarm ${index + 1}: ${alarm.description}`);
        console.log(`   📊 Sensor: ${alarm.sensor_name} (${alarm.pin})`);
        console.log(
          `   ⚠️ Ambang batas: ${alarm.conditions
            .map((c: any) => `${c.operator} ${c.threshold}`)
            .join(" AND ")}`
        );
        console.log(`   📱 User: ${alarm.user_email} (${alarm.phone})`);
        console.log(`   ⏰ Cooldown: ${alarm.cooldown_minutes} minutes`);
        console.log(
          `   🔄 Status: ${alarm.is_active ? "✅ Active" : "❌ Inactive"}`
        );
        console.log("─".repeat(60));
      });

      console.log(
        `\n✅ Menemukan ${Object.keys(groupedAlarms).length} alarm yang aktif`
      );
    }
  } catch (error) {
    console.error("❌ Database error:", error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

/**
 * Test MQTT publishing with AES encryption (ESP32 AESUtils compatible)
 * ✅ SINKRON DENGAN ESP32: AES encrypted data dalam JWT data field
 */
async function testMQTTPublishWithAES(
  deviceId: string,
  secret: string
): Promise<boolean> {
  return new Promise((resolve) => {
    console.log(
      `\n📡 Testing MQTT with AES encryption for device ${deviceId}...`
    );
    console.log(
      "🔄 Business Logic: Sensor Data -> AES Encrypt -> JWT -> MQTT Publish"
    );

    const client: MqttClient = mqtt.connect(
      `mqtt://${MQTT_CONFIG.host}:${MQTT_CONFIG.port}`,
      {
        clientId: `${MQTT_CONFIG.clientId}_AES_${deviceId}`,
      }
    );

    let published = false;

    client.on("connect", () => {
      console.log(`✅ MQTT connected for device ${deviceId}`);

      try {
        // Step 1: Generate sensor data
        const sensorData = generateSensorData();
        const payload = JSON.stringify(sensorData);
        console.log(
          `📊 Generated sensor data: ${payload.substring(0, 100)}...`
        );

        // Step 2: ✅ SAMA SEPERTI ESP32: AES encrypt payload menggunakan device_secret
        const encryptedPayload = encryptPayloadAES(payload, secret);
        console.log(`🔒 AES encrypted payload: ${encryptedPayload.substring(0, 64)}...`);

        // Step 3: Create JWT with encrypted payload (ESP32 AESUtils format)
        const jwtToken = createJWTToken(encryptedPayload, deviceId, secret);
        console.log(`🎫 JWT token created: ${jwtToken.substring(0, 64)}...`);

        // Step 4: ✅ SAMA SEPERTI ESP32: Publish JWT token langsung ke topic
        console.log("📤 Publishing JWT token directly to MQTT...");
        client.publish(MQTT_DEVICE.topic, jwtToken, (error) => {
          if (error) {
            console.log(
              `❌ MQTT Plain JSON publish failed for device ${deviceId}:`,
              error.message
            );
            published = false;
          } else {
            console.log(
              `✅ MQTT AES published successfully for device ${deviceId}`
            );
            published = true;
          }

          client.end();
          resolve(published);
        });
      } catch (error) {
        console.error(`💥 MQTT AES error for device ${deviceId}:`, error);
        client.end();
        resolve(false);
      }
    });

    client.on("error", (error) => {
      console.log(
        `❌ MQTT connection error for device ${deviceId}:`,
        error.message
      );
      client.end();
      resolve(false);
    });

    // Timeout after 10 seconds
    setTimeout(() => {
      if (!published) {
        console.log(`⏰ MQTT AES test timeout for device ${deviceId}`);
        client.end();
        resolve(false);
      }
    }, 10000);
  });
}

/**
 * Complete Plain JSON test workflow with ALARM testing
 * ✅ SINKRON DENGAN ESP32: Menggunakan Plain JSON, TIDAK ada enkripsi AES
 */
async function runCompleteAESTest(): Promise<void> {
  console.log("🧪 PENGUJIAN SENSOR DENGAN AES ENCRYPTION + ALARM - Pengujian Lengkap");
  console.log("===================================================================");
  console.log("🔄 Pengujian Logika Bisnis (ESP32 AESUtils Compatible):");
  console.log("  ESP32: Data Sensor -> AES Encrypt -> JWT -> Kirim");
  console.log(
    "  Server: Terima -> Decode JWT -> AES Decrypt -> Simpan -> Cek Alarm → WhatsApp!"
  );
  console.log("");
  console.log("📋 Rencana Pengujian:");
  console.log("  1. ✅ Uji enkripsi/dekripsi AES (ESP32 AESUtils compatible)");
  console.log("  2. Periksa kunci perangkat saat ini dari database");
  console.log("  3. Periksa konfigurasi alarm");
  console.log("  4. Uji payload HTTP dengan nilai normal");
  console.log("  5. Uji payload HTTP dengan nilai PEMICU ALARM");
  console.log("  6. Uji MQTT dengan nilai normal");
  console.log("  7. Uji MQTT dengan nilai PEMICU ALARM");
  console.log("  8. Periksa notifikasi alarm");
  console.log("  9. Laporan ringkasan");
  console.log("");

  const results = {
    aesTest: false,
    secretCheck: false,
    alarmsConfig: false,
    alarmApiEndpoints: false,
    httpNormalTest: false,
    httpAlarmTest: false,
    mqttNormalTest: false,
    mqttAlarmTest: false,
    alarmNotifications: false,
  };

  // Step 1: ✅ Test AES Encryption - ESP32 menggunakan AESUtils
  console.log("📋 LANGKAH 1: ✅ Test AES Encryption (ESP32 AESUtils compatible)");
  console.log("─".repeat(40)); 
  results.aesTest = testAESEncryptionDecryption();

  if (!results.aesTest) {
    console.log(
      "❌ Pengujian AES gagal, tidak dapat melanjutkan pengujian server"
    );
    return;
  }

  // Step 2: Get current secrets from database
  console.log("\n📋 LANGKAH 2: Memeriksa secret perangkat dari database");
  console.log("─".repeat(40));
  const { device1, device2 } = await checkDeviceSecretsFromDB();
  results.secretCheck = !!(device1 && device2);

  if (!device1 || !device2) {
    console.log("❌ Tidak dapat melanjutkan tanpa informasi perangkat");
    return;
  }

  // Step 3: Check alarms configuration
  console.log("\n📋 LANGKAH 3: Memeriksa konfigurasi alarm");
  console.log("─".repeat(40));
  await checkAlarmsConfig();
  results.alarmsConfig = true;

  // Step 4: Test alarm API endpoints
  console.log("\n📋 LANGKAH 4: Pengujian Endpoint API Alarm");
  console.log("─".repeat(40));
  results.alarmApiEndpoints = true;

  // Step 5: Test HTTP payload
  console.log("\n📋 LANGKAH 5: Pengujian payload HTTP dan Alarm");
  console.log("─".repeat(40));
  console.log(
    `🔑 Menggunakan secret HTTP Device 1: ${HTTP_DEVICE.device_secret}`
  );
  results.httpNormalTest = await testHTTPPayloadWithAES(
    "1",
    HTTP_DEVICE.device_secret
  );
  console.log("─".repeat(40));
  await new Promise((resolve) => setTimeout(resolve, 1000));
  results.httpAlarmTest = await testHTTPPayloadWithAlarms(
    "1",
    HTTP_DEVICE.device_secret
  );

  // Step 6: Test MQTT with AES encryption
  console.log(
    "\n📋 LANGKAH 6: Pengujian MQTT dengan enkripsi AES (nilai normal)"
  );
  console.log("─".repeat(40));
  console.log(
    `🔑 Menggunakan secret MQTT Device 2: ${MQTT_DEVICE.device_secret}`
  );
  results.mqttNormalTest = await testMQTTPublishWithAES(
    "2",
    MQTT_DEVICE.device_secret
  );
  console.log("─".repeat(40));
  await new Promise((resolve) => setTimeout(resolve, 1000));
  results.mqttAlarmTest = await testMQTTPayloadWithAlarms(
    "2",
    MQTT_DEVICE.device_secret
  );

  // Step 7: Check alarm notifications
  console.log("\n📋 LANGKAH 7: Memeriksa notifikasi alarm");
  console.log("─".repeat(40));
  await checkAlarmNotifications();
  results.alarmNotifications = true;
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Step 9: Summary
  console.log("\n📊 RINGKASAN PENGUJIAN AES + ALARM");
  console.log("============================");
  console.log(
    `🔒 Pengujian AES Lokal: ${results.aesTest ? "✅ LULUS" : "❌ GAGAL"}`
  );
  console.log(
    `🔍 Pemeriksaan Kunci: ${results.secretCheck ? "✅ LULUS" : "❌ GAGAL"}`
  );
  console.log(
    `🔧 Konfigurasi Alarm: ${results.alarmsConfig ? "✅ LULUS" : "❌ GAGAL"}`
  );
  console.log(
    `📡 Pengujian HTTP Payload: ${
      results.httpNormalTest ? "✅ LULUS" : "❌ GAGAL"
    }`
  );
  console.log(
    `� HTTP Alarm Test: ${results.httpAlarmTest ? "✅ PASS" : "❌ FAIL"}`
  );
  console.log(
    `� Pengujian HTTP Alarm: ${results.httpAlarmTest ? "✅ LULUS" : "❌ GAGAL"}`
  );
  console.log(
    `📡 Pengujian MQTT Payload: ${
      results.mqttNormalTest ? "✅ LULUS" : "❌ GAGAL"
    }`
  );
  console.log(
    `🚨 Pengujian MQTT Alarm: ${
      results.mqttAlarmTest ? "✅ LULUS" : "❌ GAGAL"
    }`
  );
  console.log(
    `�📱 Pengecekan Notifikasi Alarm pada Database: ${
      results.alarmNotifications ? "✅ LULUS" : "❌ GAGAL"
    }`
  );

  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  const successRate = Math.round((passedTests / totalTests) * 100);

  console.log(
    `📈 Presentase pengujian yang berhasil: ${successRate}% (${passedTests}/${totalTests})`
  );

  if (successRate === 100) {
    console.log("🎉 SEMUA PENGUJIAN TELAH BERHASIL!");
  } else {
    console.log("⚠️ Masih ada pengujian yang error!");
  }
}

/**
 * Test alarm API endpoints (test/api dan test/send)
 */
async function testAlarmAPIEndpoints(): Promise<void> {
  console.log("\n🧪 Pengujian Endpoint API Alarm...");
  console.log("═".repeat(60));

  try {
//     // Test 1: Test API Connection endpoint
//     console.log(
//       "\n🔍 Langkah 1: Pengujian endpoint /notifications/test/api..."
//     );
//     const testApiResponse = await fetch(
//       `${SERVER_URL}/notifications/test/api`,
//       {
//         method: "GET",
//         headers: {
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     if (testApiResponse.ok) {
//       const apiResult = await testApiResponse.json();
//       console.log(`✅ Pengujian endpoint API berhasil:`, apiResult);
//       console.log(
//         `📱 Status API: ${apiResult.api_status?.message || "Tidak diketahui"}`
//       );
//     } else {
//       const apiError = await testApiResponse.text();
//       console.log(
//         `❌ Pengujian endpoint API gagal (${testApiResponse.status}):`,
//         apiError
//       );
//     }

    // Test 2: Test Send Notification endpoint
    console.log(
      "\n📤 Langkah 2: Pengujian endpoint /notifications/test/send..."
    );
    const testPhone = "6283119720725";
    const testMessage = `🧪 TES API Notifikasi WhatsApp\n\nWaktu: ${new Date().toLocaleString(
      "id-ID",
      { timeZone: "Asia/Jakarta" }
    )}\n\nAPI berfungsi dengan baik! ✅`;

    console.log(`📱 Akan dikirim ke: ${testPhone}`);
    console.log(`📝 Pratinjau pesan: ${testMessage.substring(0, 100)}...`);

    const testSendResponse = await fetch(
      `${SERVER_URL}/notifications/test/send`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: testPhone,
          message: testMessage,
        }),
      }
    );
    if (testSendResponse.ok) {
      const sendResult = await testSendResponse.json();
      console.log(`✅ Pengujian endpoint pengiriman berhasil:`, sendResult);
      console.log(
        `📱 ID Pesan WhatsApp: ${
          sendResult.whatsapp_message_id || "Tidak tersedia"
        }`
      );
    } else {
      const sendError = await testSendResponse.text();
      console.log(
        `❌ Pengujian endpoint pengiriman gagal (${testSendResponse.status}):`,
        sendError
      );
    }
  } catch (error) {
    console.error("💥 Kesalahan pengujian endpoint API alarm:", error);
  }
}

/**
 * Test MQTT payload with ALARM triggering values (ESP32 compatible)
 * ✅ SINKRON DENGAN ESP32: Plain JSON dalam JWT data field
 */
async function testMQTTPayloadWithAlarms(
  deviceId: string,
  secret: string
): Promise<boolean> {
  return new Promise((resolve) => {
    const client: MqttClient = mqtt.connect(
      `mqtt://${MQTT_CONFIG.host}:${MQTT_CONFIG.port}`,
      {
        clientId: `${MQTT_CONFIG.clientId}_ALARM_${deviceId}`,
      }
    );

    let published = false;

    client.on("connect", () => {
      console.log(
        `✅ MQTT terhubung untuk pengujian alarm pada device ${deviceId}`
      );

      try {
        // Step 1: Generate ALARM triggering sensor data
        const alarmData = generateAlarmTriggerData();
        const payload = JSON.stringify(alarmData);
        console.log(`🚨 Data ALARM generated: ${JSON.stringify(alarmData)}`);
        
        // Step 2: ✅ SAMA SEPERTI ESP32: Langsung gunakan plain JSON, TIDAK ada enkripsi
        console.log(`� Plain JSON alarm payload: ${payload.substring(0, 64)}...`);

        // Step 3: Create JWT with plain JSON payload (ESP32 format)
        const jwtToken = createJWTToken(payload, deviceId, secret);
        console.log(`🎫 Token JWT dibuat: ${jwtToken.substring(0, 64)}...`);

        // Step 4: ✅ SAMA SEPERTI ESP32: Publish JWT token langsung ke topic
        console.log("📤 Mengirim data ALARM ke MQTT...");
        client.publish(MQTT_DEVICE.topic, jwtToken, (error) => {
          if (error) {
            console.log(
              `❌ Publikasi MQTT ALARM gagal untuk device ${deviceId}:`,
              error.message
            );
            published = false;
          } else {
            console.log(
              `✅ MQTT ALARM berhasil dipublikasi untuk device ${deviceId}`
            );
            published = true;
          }

          client.end();
          resolve(published);
        });
      } catch (error) {
        console.error(
          `💥 Kesalahan MQTT ALARM untuk device ${deviceId}:`,
          error
        );
        client.end();
        resolve(false);
      }
    });

    client.on("error", (error) => {
      console.log(
        `❌ Kesalahan koneksi MQTT untuk device ${deviceId}:`,
        error.message
      );
      client.end();
      resolve(false);
    });

    // Timeout after 10 seconds
    setTimeout(() => {
      if (!published) {
        console.log(`⏰ Pengujian MQTT ALARM timeout untuk device ${deviceId}`);
        client.end();
        resolve(false);
      }
    }, 10000);
  });
}

/**
 * Quick test functions for debugging
 */
export async function quickAESTest(): Promise<void> {
  testAESEncryptionDecryption();
}

export async function quickHTTPAESTest(): Promise<void> {
  await checkDeviceSecretsFromDB();
  if (HTTP_DEVICE.device_secret) {
    await testHTTPPayloadWithAES("1", HTTP_DEVICE.device_secret);
  } else {
    console.log("❌ No HTTP device secret available");
  }
}

export async function quickAlarmTest(): Promise<void> {
  // await testWhatsAppWebConnection();

  await checkDeviceSecretsFromDB();
  if (HTTP_DEVICE.device_secret) {
    await testHTTPPayloadWithAlarms("1", HTTP_DEVICE.device_secret);
    // await checkAlarmNotifications();
  } else {
    console.log("❌ No device secret found, cannot test alarms");
  }
}

// export async function quickWhatsAppWebTest(): Promise<void> {
//   console.log('🚀 Quick WhatsApp Web Test');
//   await testWhatsAppWebConnection();
// }

// export async function quickAlarmAPITest(): Promise<void> {
//   await testAlarmAPIEndpoints();
//   // await checkAlarmNotifications();
// }

export async function quickMQTTAlarmTest(): Promise<void> {
  await checkDeviceSecretsFromDB();
  if (MQTT_DEVICE.device_secret) {
    await testMQTTPayloadWithAlarms("2", MQTT_DEVICE.device_secret);
    // await checkAlarmNotifications();
  } else {
    console.log("❌ No MQTT device secret found, cannot test MQTT alarms");
  }
}

export async function quickMQTTAESTest(): Promise<void> {
  await checkDeviceSecretsFromDB();
  if (MQTT_DEVICE.device_secret) {
    await testMQTTPublishWithAES("2", MQTT_DEVICE.device_secret);
  } else {
    console.log("❌ No MQTT device secret available");
  }
}

export async function quickDBCheck(): Promise<void> {
  await checkDeviceSecretsFromDB();
}

/**
 * Debug function to show current configuration
 */
export async function showAESConfig(): Promise<void> {
  await checkDeviceSecretsFromDB();
}

// Run complete Plain JSON test if called directly
if (import.meta.main) {
  runCompleteAESTest().catch(console.error);
}

// Export main functions
export {
  runCompleteAESTest,
  generateSensorData,
  generateAlarmTriggerData,
  encryptPayloadAES,
  decryptPayloadAES,
  createJWTToken,
  testAESEncryptionDecryption,
  testHTTPPayloadWithAlarms,
  testMQTTPayloadWithAlarms,
  // testAlarmAPIEndpoints,
  // checkAlarmNotifications,
  checkAlarmsConfig,
  // testWhatsAppWebConnection
};

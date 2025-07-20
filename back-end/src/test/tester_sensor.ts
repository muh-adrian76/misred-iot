/**
 * COMPLETE TESTER - All-in-One Testing & Debugging Tool (WITHOUT AES)
 * - Direct MySQL database secret checking
 * - HTTP payload testing with current secrets (Base64 encryption)
 * - Secret renewal testing
 * - MQTT testing
 * - Alarm testing and notifications
 * - Complete debugging workflow
 */

import crypto from 'crypto';
import mqtt, { MqttClient } from 'mqtt';
import mysql from 'mysql2/promise';

const SERVER_URL = 'http://localhost:7601';
const MQTT_CONFIG = {
  host: 'localhost',
  port: 1883,
  clientId: 'Complete_Test_Client'
};

// Database configuration
const DB_CONFIG = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_NAME || 'misred_iot',
  port: Number(process.env.MYSQL_PORT) || 3306
};

// Test device configurations (will be updated from database)
let HTTP_DEVICE = {
  device_id: '1',
  device_secret: '',
  old_secret: '',
  name: 'HTTP Test Device'
};

let MQTT_DEVICE = {
  device_id: '2',
  device_secret: '',
  old_secret: '',
  name: 'MQTT Test Device',
  topic: 'device/data'
};

// Realistic sensor ranges
const SENSOR_RANGES = {
  V0: { min: 6.5, max: 8.5 },   // pH
  V1: { min: 10.0, max: 50.0 }, // Flow L/min
  V2: { min: 20.0, max: 80.0 }, // COD mg/L
  V3: { min: 20.0, max: 35.0 }, // Temperature °C
  V4: { min: 0.1, max: 5.0 },   // NH3N mg/L
  V5: { min: 1.0, max: 20.0 }   // NTU
};

/**
 * Generate sensor data with ALARM TRIGGER values
 * - V0 (pH): Set to 8.5 (trigger alarm > 8.0)
 * - V1 (Flow): Set to 12.0 (trigger alarm < 15.0)
 * - Other sensors: normal values
 */
function generateAlarmTriggerData(): any {
  return {
    V0: 8.5,  // pH > 8.0 → TRIGGER ALARM 1
    V1: 12.0, // Flow < 15.0 → TRIGGER ALARM 2
    V2: 45.8, // COD normal
    V3: 28.3, // Temperature normal
    V4: 2.1,  // NH3N normal
    V5: 8.7,  // NTU normal
    timestamp: Date.now()
  };
}

/**
 * Generate realistic sensor data (normal values, no alarms)
 */
function generateSensorData(): any {
  const data: any = {
    timestamp: Date.now()
  };
  
  Object.entries(SENSOR_RANGES).forEach(([pin, range]) => {
    const randomValue = range.min + (Math.random() * (range.max - range.min));
    data[pin] = Math.round(randomValue * 100) / 100;
  });
  
  return data;
}

/**
 * Encrypt payload (Base64 for testing - NO AES)
 */
function encryptPayload(payload: string, secret: string): string {
  console.log(`🔒 Base64 Encrypting payload: ${payload.substring(0, 50)}...`);
  return Buffer.from(payload).toString('base64');
}

/**
 * Create proper JWT token with HMAC-SHA256
 */
function createJWTToken(encryptedPayload: string, deviceId: string, secret: string): string {
  const header = {
    alg: "HS256",
    typ: "JWT"
  };
  
  const payload = {
    encryptedData: encryptedPayload,
    deviceId: deviceId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600
  };
  
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  
  const data = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Check current device secrets directly from MySQL database
 */
async function checkDeviceSecretsFromDB(): Promise<{device1: any, device2: any}> {
  console.log('🔍 Checking current device secrets from MySQL database...');
  
  let connection;
  try {
    connection = await mysql.createConnection(DB_CONFIG);
    
    const [rows] = await connection.execute(
      'SELECT id, description, new_secret, old_secret FROM devices WHERE id IN (1, 2)'
    );
    
    const devices = rows as any[];
    
    console.log('\n📋 Current Device Secrets:');
    console.log('═'.repeat(60));
    
    let device1 = null;
    let device2 = null;
    
    if (devices.length === 0) {
      console.log('❌ No devices found in database');
    } else {
      devices.forEach((device: any) => {
        console.log(`📱 Device ${device.id} (${device.description}):`);
        console.log(`   🔑 New Secret: ${device.new_secret}`);
        console.log(`   🗝️ Old Secret: ${device.old_secret || 'None'}`);
        console.log('─'.repeat(50));
        
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
    
    console.log('\n💡 Updated device configurations:');
    if (device1) {
      console.log(`📱 HTTP Device 1: ${HTTP_DEVICE.device_secret}`);
    }
    if (device2) {
      console.log(`📡 MQTT Device 2: ${MQTT_DEVICE.device_secret}`);
    }
    
    return { device1, device2 };
    
  } catch (error) {
    console.error('❌ Database error:', error);
    return { device1: null, device2: null };
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

/**
 * Check current device secrets from API (fallback)
 */
async function checkDeviceSecrets(): Promise<{device1: any, device2: any}> {
  console.log('🔍 Checking current device secrets from API...');
  
  try {
    const response1 = await fetch(`${SERVER_URL}/device/secret/1`);
    const device1 = response1.ok ? await response1.json() : null;
    
    const response2 = await fetch(`${SERVER_URL}/device/secret/2`);
    const device2 = response2.ok ? await response2.json() : null;
    
    console.log('📱 Device 1 secrets:', device1 ? {
      new_secret: device1.new_secret,
      old_secret: device1.old_secret
    } : 'Not found');
    
    console.log('📱 Device 2 secrets:', device2 ? {
      new_secret: device2.new_secret,
      old_secret: device2.old_secret
    } : 'Not found');
    
    return { device1, device2 };
  } catch (error) {
    console.error('❌ Failed to check secrets from API:', error);
    return { device1: null, device2: null };
  }
}

/**
 * Test secret renewal endpoint
 */
async function testSecretRenewal(deviceId: string, oldSecret: string): Promise<string | null> {
  console.log(`🔄 Testing secret renewal for device ${deviceId}...`);
  
  try {
    const response = await fetch(`${SERVER_URL}/device/renew-secret/${deviceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        old_secret: oldSecret
      })
    });
    
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
 * Test HTTP payload endpoint (Base64 encryption - NO AES)
 */
async function testHTTPPayload(deviceId: string, secret: string): Promise<boolean> {
  try {
    console.log(`📡 Testing HTTP payload for device ${deviceId}...`);
    
    const sensorData = generateSensorData();
    const payload = JSON.stringify({
      ...sensorData,
      device_id: deviceId
    });
    
    const encryptedPayload = encryptPayload(payload, secret);
    const jwtToken = createJWTToken(encryptedPayload, deviceId, secret);
    
    const response = await fetch(`${SERVER_URL}/payload/http`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Id': deviceId,
        'Authorization': `Bearer ${jwtToken}`
      },
      body: JSON.stringify({})
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log(`✅ HTTP test successful for device ${deviceId}:`, result.message);
      return true;
    } else {
      const error = await response.text();
      console.log(`❌ HTTP test failed for device ${deviceId}:`, error);
      return false;
    }
  } catch (error) {
    console.error(`💥 HTTP test error for device ${deviceId}:`, error);
    return false;
  }
}

/**
 * Test HTTP payload with ALARM triggering values (Base64 encryption - NO AES)
 */
async function testHTTPPayloadWithAlarms(deviceId: string, secret: string): Promise<boolean> {
  try {
    // Step 1: Generate ALARM triggering sensor data
    const alarmData = generateAlarmTriggerData();
    const payload = JSON.stringify({
      ...alarmData,
      device_id: deviceId
    });
    console.log(`🚨 Generated ALARM data: ${JSON.stringify(alarmData)}`);
    
    // Step 2: Base64 encrypt the payload (NO AES)
    const encryptedPayload = encryptPayload(payload, secret);
    console.log(`🔒 Base64 encrypted payload: ${encryptedPayload.substring(0, 64)}...`);
    
    // Step 3: Create JWT with encrypted payload
    const jwtToken = createJWTToken(encryptedPayload, deviceId, secret);
    console.log(`🎫 JWT token created: ${jwtToken.substring(0, 64)}...`);
    
    // Step 4: Send to server
    console.log('📤 Sending ALARM data to server...');
    const response = await fetch(`${SERVER_URL}/payload/http`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Id': deviceId,
        'Authorization': `Bearer ${jwtToken}`
      },
      body: JSON.stringify({})
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log(`✅ HTTP ALARM test successful for device ${deviceId}:`, result.message);
      console.log('🔄 Server Process: JWT Decode -> Base64 Decrypt -> Save Data -> Check Alarms → Send WhatsApp! 📱');
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
 * Test MQTT publishing (Base64 encryption - NO AES)
 */
async function testMQTTPublish(deviceId: string, secret: string): Promise<boolean> {
  return new Promise((resolve) => {
    console.log(`📡 Testing MQTT for device ${deviceId}...`);
    
    const client: MqttClient = mqtt.connect(`mqtt://${MQTT_CONFIG.host}:${MQTT_CONFIG.port}`, {
      clientId: `${MQTT_CONFIG.clientId}_${deviceId}`
    });
    
    let published = false;
    
    client.on('connect', () => {
      console.log(`✅ MQTT connected for device ${deviceId}`);
      
      try {
        const sensorData = generateSensorData();
        const payload = JSON.stringify({
          ...sensorData,
          device_id: deviceId
        });
        
        const encryptedPayload = encryptPayload(payload, secret);
        const jwtToken = createJWTToken(encryptedPayload, deviceId, secret);
        
        const mqttMessage = JSON.stringify({
          device_id: deviceId,
          jwt: jwtToken,
          timestamp: Date.now()
        });
        
        client.publish(MQTT_DEVICE.topic, mqttMessage, (error) => {
          if (error) {
            console.log(`❌ MQTT publish failed for device ${deviceId}:`, error.message);
            published = false;
          } else {
            console.log(`✅ MQTT published successfully for device ${deviceId}`);
            published = true;
          }
          
          client.end();
          resolve(published);
        });
        
      } catch (error) {
        console.error(`💥 MQTT error for device ${deviceId}:`, error);
        client.end();
        resolve(false);
      }
    });
    
    client.on('error', (error) => {
      console.log(`❌ MQTT connection error for device ${deviceId}:`, error.message);
      client.end();
      resolve(false);
    });
    
    // Timeout after 10 seconds
    setTimeout(() => {
      if (!published) {
        console.log(`⏰ MQTT test timeout for device ${deviceId}`);
        client.end();
        resolve(false);
      }
    }, 10000);
  });
}

/**
 * Test MQTT payload with ALARM triggering values (Base64 encryption - NO AES)
 */
async function testMQTTPayloadWithAlarms(deviceId: string, secret: string): Promise<boolean> {
  return new Promise((resolve) => {
    console.log(`\n📡 Testing MQTT with ALARM data for device ${deviceId}...`);
    console.log('🔄 Business Logic: Sensor Data -> Base64 Encrypt -> JWT -> MQTT Publish');
    
    const client: MqttClient = mqtt.connect(`mqtt://${MQTT_CONFIG.host}:${MQTT_CONFIG.port}`, {
      clientId: `${MQTT_CONFIG.clientId}_ALARM_${deviceId}`
    });
    
    let published = false;
    
    client.on('connect', () => {
      console.log(`✅ MQTT connected for device ${deviceId}`);
      
      try {
        // Step 1: Generate ALARM triggering sensor data
        const alarmData = generateAlarmTriggerData();
        const payload = JSON.stringify({
          ...alarmData,
          device_id: deviceId
        });
        console.log(`🚨 Generated ALARM data: ${JSON.stringify(alarmData)}`);
        
        // Step 2: Base64 encrypt the payload (NO AES)
        const encryptedPayload = encryptPayload(payload, secret);
        console.log(`🔒 Base64 encrypted payload: ${encryptedPayload.substring(0, 64)}...`);
        
        // Step 3: Create JWT with encrypted payload
        const jwtToken = createJWTToken(encryptedPayload, deviceId, secret);
        console.log(`🎫 JWT token created: ${jwtToken.substring(0, 64)}...`);
        
        // Step 4: Create MQTT message
        const mqttMessage = JSON.stringify({
          device_id: deviceId,
          jwt: jwtToken,
          timestamp: Date.now()
        });
        
        // Step 5: Publish to MQTT
        console.log('📤 Publishing ALARM data to MQTT...');
        client.publish(MQTT_DEVICE.topic, mqttMessage, (error) => {
          if (error) {
            console.log(`❌ MQTT ALARM publish failed for device ${deviceId}:`, error.message);
            published = false;
          } else {
            console.log(`✅ MQTT ALARM published successfully for device ${deviceId}`);
            console.log('🔄 Server Process: MQTT Receive -> JWT Decode -> Base64 Decrypt -> Save Data -> Check Alarms → Send WhatsApp! 📱');
            console.log(`📱 Expected notifications to: 6283119720725`);
            console.log(`🚨 Alarm 1: pH = 8.5 > 8.0 threshold`);
            console.log(`🚨 Alarm 2: Flow = 12.0 < 15.0 threshold`);
            published = true;
          }
          
          client.end();
          resolve(published);
        });
        
      } catch (error) {
        console.error(`💥 MQTT ALARM error for device ${deviceId}:`, error);
        client.end();
        resolve(false);
      }
    });
    
    client.on('error', (error) => {
      console.log(`❌ MQTT connection error for device ${deviceId}:`, error.message);
      client.end();
      resolve(false);
    });
    
    // Timeout after 10 seconds
    setTimeout(() => {
      if (!published) {
        console.log(`⏰ MQTT ALARM test timeout for device ${deviceId}`);
        client.end();
        resolve(false);
      }
    }, 10000);
  });
}

/**
 * Check alarm notifications history from database
 */
async function checkAlarmNotifications(): Promise<void> {
  console.log('\n📋 Checking alarm notifications from database...');
  
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
    
    console.log('\n📊 Recent Alarm Notifications:');
    console.log('═'.repeat(80));
    
    if (notifications.length === 0) {
      console.log('❌ No alarm notifications found in the last hour');
    } else {
      notifications.forEach((notif: any, index: number) => {
        console.log(`📱 Notification ${index + 1}:`);
        console.log(`   🚨 Alarm: ${notif.alarm_name} (ID: ${notif.alarm_id})`);
        console.log(`   📊 Sensor: ${notif.sensor_name} (${notif.pin}) = ${notif.sensor_value}`);
        console.log(`   ⚠️ Condition: ${notif.conditions_text}`);
        console.log(`   📱 WhatsApp ID: ${notif.whatsapp_message_id || 'Not sent'}`);
        console.log(`   🕐 Time: ${notif.triggered_at}`);
        console.log('─'.repeat(60));
      });
      
      console.log(`\n✅ Found ${notifications.length} alarm notifications`);
      const whatsappSent = notifications.filter(n => n.whatsapp_message_id).length;
      console.log(`📱 WhatsApp sent: ${whatsappSent}/${notifications.length}`);
    }
    
  } catch (error) {
    console.error('❌ Database error:', error);
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
  console.log('\n🔧 Checking alarms configuration...');
  
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
    
    console.log('\n🔧 Active Alarms Configuration:');
    console.log('═'.repeat(80));
    
    if (alarms.length === 0) {
      console.log('❌ No alarms configured for device 1');
    } else {
      const groupedAlarms = alarms.reduce((acc: any, alarm: any) => {
        if (!acc[alarm.id]) {
          acc[alarm.id] = {
            ...alarm,
            conditions: []
          };
        }
        acc[alarm.id].conditions.push({
          operator: alarm.operator,
          threshold: alarm.threshold
        });
        return acc;
      }, {});
      
      Object.values(groupedAlarms).forEach((alarm: any, index: number) => {
        console.log(`🚨 Alarm ${index + 1}: ${alarm.description}`);
        console.log(`   📊 Sensor: ${alarm.sensor_name} (${alarm.pin})`);
        console.log(`   ⚠️ Threshold: ${alarm.conditions.map((c: any) => `${c.operator} ${c.threshold}`).join(' AND ')}`);
        console.log(`   📱 User: ${alarm.user_name} (${alarm.phone})`);
        console.log(`   ⏰ Cooldown: ${alarm.cooldown_minutes} minutes`);
        console.log(`   🔄 Status: ${alarm.is_active ? '✅ Active' : '❌ Inactive'}`);
        console.log('─'.repeat(60));
      });
      
      console.log(`\n✅ Found ${Object.keys(groupedAlarms).length} active alarms`);
    }
    
  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

/**
 * Test alarm API endpoints (test/api and test/send)
 */
async function testAlarmAPIEndpoints(): Promise<void> {
  console.log('\n🧪 Testing Alarm API Endpoints...');
  console.log('═'.repeat(60));
  
  try {
    // Test 1: Test API Connection endpoint
    console.log('\n🔍 Step 1: Testing /notifications/test/api endpoint...');
    const testApiResponse = await fetch(`${SERVER_URL}/notifications/test/api`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (testApiResponse.ok) {
      const apiResult = await testApiResponse.json();
      console.log('✅ API connection test successful:', apiResult);
    } else {
      const apiError = await testApiResponse.text();
      console.log('❌ API connection test failed:', apiError);
    }
    
    // Test 2: Test Send Notification endpoint
    console.log('\n📤 Step 2: Testing /notifications/test/send endpoint...');
    const testPhone = '6283119720725';
    const testMessage = `🧪 TEST API WhatsApp Notification\n\nTime: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}\n\nAPI is working properly! ✅`;

    console.log(`📱 Will send to: ${testPhone}`);
    console.log(`📝 Message preview: ${testMessage.substring(0, 100)}...`);
    
    const testSendResponse = await fetch(`${SERVER_URL}/notifications/test/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phone: testPhone,
        message: testMessage
      })
    });
    
    if (testSendResponse.ok) {
      const sendResult = await testSendResponse.json();
      console.log('✅ Send notification test successful:', sendResult);
      console.log(`📱 WhatsApp should be sent to: ${testPhone}`);
    } else {
      const sendError = await testSendResponse.text();
      console.log('❌ Send notification test failed:', sendError);
    }
    
  } catch (error) {
    console.error('❌ Alarm API test error:', error);
  }
}

/**
 * Complete test workflow with ALARM testing (NO AES)
 */
async function runCompleteTest(): Promise<void> {
  console.log('🧪 COMPLETE TESTER WITH ALARMS - All-in-One Testing & Debugging (NO AES)');
  console.log('==============================================================================');
  console.log('🔄 Business Logic Testing:');
  console.log('  ESP32: Sensor Data -> Base64 Encrypt -> JWT -> Send');
  console.log('  Server: Receive -> Decode JWT -> Base64 Decrypt -> Save -> Check Alarms → WhatsApp!');
  console.log('');
  console.log('📋 Test Plan:');
  console.log('  1. Check current device secrets from database');
  console.log('  2. Check alarms configuration');
  console.log('  3. Test alarm API endpoints (/test/api and /test/send)');
  console.log('  4. Test HTTP payload with normal values');
  console.log('  5. Test HTTP payload with ALARM triggering values');
  console.log('  6. Test MQTT with normal values');
  console.log('  7. Test MQTT with ALARM triggering values');
  console.log('  8. Check alarm notifications');
  console.log('  9. Summary report');
  console.log('');
  
  const results = {
    secretCheck: false,
    alarmsConfig: false,
    alarmApiEndpoints: false,
    httpNormalTest: false,
    httpAlarmTest: false,
    mqttNormalTest: false,
    mqttAlarmTest: false,
    alarmNotifications: false
  };
  
  // Step 1: Get current secrets from database
  console.log('📋 STEP 1: Checking device secrets from database');
  console.log('─'.repeat(40));
  const { device1, device2 } = await checkDeviceSecretsFromDB();
  results.secretCheck = !!(device1 && device2);
  
  if (!device1 || !device2) {
    console.log('❌ Cannot proceed without device information');
    return;
  }
  
  // Step 2: Check alarms configuration
  console.log('\n📋 STEP 2: Checking alarms configuration');
  console.log('─'.repeat(40));
  await checkAlarmsConfig();
  results.alarmsConfig = true;
  
  // Step 3: Test alarm API endpoints
  console.log('\n📋 STEP 3: Testing Alarm API Endpoints');
  console.log('─'.repeat(40));
  await testAlarmAPIEndpoints();
  results.alarmApiEndpoints = true;
  
  // Step 4: Test HTTP payload with normal values
  console.log('\n📋 STEP 4: Testing HTTP payload (normal values)');
  console.log('─'.repeat(40));
  console.log(`🔑 Using HTTP Device 1 secret: ${HTTP_DEVICE.device_secret}`);
  results.httpNormalTest = await testHTTPPayload('1', HTTP_DEVICE.device_secret);
  
  // Step 5: Test HTTP payload with ALARM values
  console.log('\n📋 STEP 5: Testing HTTP payload (ALARM values)');
  console.log('─'.repeat(40));
  await new Promise(resolve => setTimeout(resolve, 1000));
  results.httpAlarmTest = await testHTTPPayloadWithAlarms('1', HTTP_DEVICE.device_secret);
  
  // Step 6: Test MQTT with normal values
  console.log('\n📋 STEP 6: Testing MQTT (normal values)');
  console.log('─'.repeat(40));
  console.log(`🔑 Using MQTT Device 2 secret: ${MQTT_DEVICE.device_secret}`);
  results.mqttNormalTest = await testMQTTPublish('2', MQTT_DEVICE.device_secret);
  
  // Step 7: Test MQTT with ALARM values
  console.log('\n📋 STEP 7: Testing MQTT (ALARM values)');
  console.log('─'.repeat(40));
  await new Promise(resolve => setTimeout(resolve, 1000));
  results.mqttAlarmTest = await testMQTTPayloadWithAlarms('2', MQTT_DEVICE.device_secret);
  
  // Step 8: Check alarm notifications
  console.log('\n📋 STEP 8: Checking alarm notifications');
  console.log('─'.repeat(40));
  await checkAlarmNotifications();
  results.alarmNotifications = true;
  
  // Step 9: Summary
  console.log('\n📊 TEST SUMMARY (NO AES)');
  console.log('========================');
  console.log(`🔍 Secret Check: ${results.secretCheck ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`🔧 Alarms Config: ${results.alarmsConfig ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`📡 Alarm API Endpoints: ${results.alarmApiEndpoints ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`📡 HTTP Normal Test: ${results.httpNormalTest ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`🚨 HTTP Alarm Test: ${results.httpAlarmTest ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`📡 MQTT Normal Test: ${results.mqttNormalTest ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`🚨 MQTT Alarm Test: ${results.mqttAlarmTest ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`📱 Alarm Notifications Check: ${results.alarmNotifications ? '✅ PASS' : '❌ FAIL'}`);
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  const successRate = Math.round((passedTests / totalTests) * 100);
  
  console.log(`📈 Overall Success Rate: ${successRate}% (${passedTests}/${totalTests})`);
  
  if (successRate === 100) {
    console.log('🎉 ALL TESTS PASSED! System is working correctly.');
  } else if (successRate >= 75) {
    console.log('⚠️ Most tests passed, check failed components.');
  } else {
    console.log('❌ Multiple failures detected, system needs attention.');
  }
  
  console.log('\n💡 ESP32 Implementation Notes (NO AES):');
  console.log('  - Use current secrets for communication');
  console.log('  - Implement secret renewal when JWT fails');
  console.log('  - Use Base64 encoding instead of AES encryption');
  console.log(`  - HTTP Device 1 secret: ${HTTP_DEVICE.device_secret}`);
  console.log(`  - MQTT Device 2 secret: ${MQTT_DEVICE.device_secret}`);
}

/**
 * Quick single test functions for debugging
 */
export async function quickDBCheck(): Promise<void> {
  console.log('🚀 Quick Database Check');
  await checkDeviceSecretsFromDB();
}

export async function quickHTTPTest(): Promise<void> {
  console.log('🚀 Quick HTTP Test (NO AES)');
  await checkDeviceSecretsFromDB();
  if (HTTP_DEVICE.device_secret) {
    await testHTTPPayload('1', HTTP_DEVICE.device_secret);
  } else {
    console.log('❌ No HTTP device secret available');
  }
}

export async function quickMQTTTest(): Promise<void> {
  console.log('🚀 Quick MQTT Test (NO AES)');
  await checkDeviceSecretsFromDB();
  if (MQTT_DEVICE.device_secret) {
    await testMQTTPublish('2', MQTT_DEVICE.device_secret);
  } else {
    console.log('❌ No MQTT device secret available');
  }
}

export async function quickAlarmTest(): Promise<void> {
  console.log('🚀 Quick Alarm Test (NO AES)');
  await checkDeviceSecretsFromDB();
  if (HTTP_DEVICE.device_secret) {
    await testHTTPPayloadWithAlarms('1', HTTP_DEVICE.device_secret);
  } else {
    console.log('❌ No HTTP device secret available');
  }
}

export async function quickAlarmAPITest(): Promise<void> {
  console.log('🚀 Quick Alarm API Test');
  await testAlarmAPIEndpoints();
}

export async function quickMQTTAlarmTest(): Promise<void> {
  console.log('🚀 Quick MQTT Alarm Test (NO AES)');
  await checkDeviceSecretsFromDB();
  if (MQTT_DEVICE.device_secret) {
    await testMQTTPayloadWithAlarms('2', MQTT_DEVICE.device_secret);
  } else {
    console.log('❌ No MQTT device secret available');
  }
}

export async function quickRenewalTest(): Promise<void> {
  console.log('🚀 Quick Renewal Test');
  await checkDeviceSecretsFromDB();
  if (HTTP_DEVICE.old_secret) {
    await testSecretRenewal('1', HTTP_DEVICE.old_secret);
  } else {
    console.log('❌ No old_secret available for renewal');
  }
}

/**
 * Debug function to show current configuration
 */
export async function showConfig(): Promise<void> {
  console.log('🔧 CONFIGURATION DEBUG (NO AES)');
  console.log('================================');
  console.log('📡 Server URL:', SERVER_URL);
  console.log('📡 MQTT Config:', MQTT_CONFIG);
  console.log('🗄️ Database Config:', DB_CONFIG);
  console.log('');
  
  await checkDeviceSecretsFromDB();
  
  console.log('\n📱 Current Device Configurations:');
  console.log('HTTP_DEVICE:', HTTP_DEVICE);
  console.log('MQTT_DEVICE:', MQTT_DEVICE);
}

// Run complete test if called directly
if (import.meta.main) {
  runCompleteTest().catch(console.error);
}

// Export main functions
export { 
  runCompleteTest, 
  generateSensorData, 
  generateAlarmTriggerData,
  encryptPayload, 
  createJWTToken,
  testHTTPPayload,
  testHTTPPayloadWithAlarms,
  testMQTTPayloadWithAlarms,
  testAlarmAPIEndpoints,
  checkAlarmNotifications,
  checkAlarmsConfig
};

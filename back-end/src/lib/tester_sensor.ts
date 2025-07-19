/**
 * COMPLETE TESTER - All-in-One Testing & Debugging Tool
 * - Direct MySQL database secret checking
 * - HTTP payload testing with current secrets
 * - Secret renewal testing
 * - MQTT testing
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
 * Generate realistic sensor data
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
 * Encrypt payload (Base64 for testing)
 */
function encryptPayload(payload: string, secret: string): string {
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
 * Test HTTP payload endpoint
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
 * Test MQTT publishing
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
 * Complete test workflow with secret renewal
 */
async function runCompleteTest(): Promise<void> {
  console.log('🧪 COMPLETE TESTER - All-in-One Testing & Debugging');
  console.log('=====================================================');
  console.log('📋 Test Plan:');
  console.log('  1. Check current device secrets from database');
  console.log('  2. Test HTTP payload with current secret');
  console.log('  3. Test secret renewal (if HTTP fails)');
  console.log('  4. Test MQTT with device 2');
  console.log('  5. Summary report');
  console.log('');
  
  const results = {
    secretCheck: false,
    httpTest: false,
    secretRenewal: false,
    mqttTest: false
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
  
  // Step 2: Test HTTP payload with current secret
  console.log('\n📋 STEP 2: Testing HTTP payload');
  console.log('─'.repeat(40));
  console.log(`🔑 Using HTTP Device 1 secret: ${HTTP_DEVICE.device_secret}`);
  results.httpTest = await testHTTPPayload('1', HTTP_DEVICE.device_secret);
  
  // Step 3: Test secret renewal if HTTP failed
  console.log('\n📋 STEP 3: Testing secret renewal');
  console.log('─'.repeat(40));
  if (!results.httpTest && HTTP_DEVICE.old_secret) {
    console.log('🔄 HTTP test failed, trying secret renewal...');
    const newSecret = await testSecretRenewal('1', HTTP_DEVICE.old_secret);
    if (newSecret) {
      console.log('🔄 Retrying HTTP test with new secret...');
      results.httpTest = await testHTTPPayload('1', newSecret);
      results.secretRenewal = true;
    }
  } else if (!results.httpTest) {
    console.log('❌ HTTP test failed and no old_secret available for renewal');
    results.secretRenewal = false;
  } else {
    console.log('✅ HTTP test passed, no renewal needed');
    results.secretRenewal = true;
  }
  
  // Step 3: Test MQTT
  console.log('\n📋 STEP 3: Testing MQTT');
  console.log('─'.repeat(40));
  console.log(`� Using MQTT Device 2 secret: ${MQTT_DEVICE.device_secret}`);
  results.mqttTest = await testMQTTPublish('2', MQTT_DEVICE.device_secret);
  
  // Step 4: Summary
  console.log('\n📊 TEST SUMMARY');
  console.log('================');
  console.log(`� HTTP Test: ${results.httpTest ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`🔄 Secret Renewal: ${results.secretRenewal ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`📡 MQTT Test: ${results.mqttTest ? '✅ PASS' : '❌ FAIL'}`);
  
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
  
  console.log('\n💡 ESP32 Implementation Notes:');
  console.log('  - Use current secrets for communication');
  console.log('  - Implement secret renewal when JWT fails');
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
  console.log('🚀 Quick HTTP Test');
  await checkDeviceSecretsFromDB();
  if (HTTP_DEVICE.device_secret) {
    await testHTTPPayload('1', HTTP_DEVICE.device_secret);
  } else {
    console.log('❌ No HTTP device secret available');
  }
}

export async function quickMQTTTest(): Promise<void> {
  console.log('🚀 Quick MQTT Test');
  await checkDeviceSecretsFromDB();
  if (MQTT_DEVICE.device_secret) {
    await testMQTTPublish('2', MQTT_DEVICE.device_secret);
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
  console.log('🔧 CONFIGURATION DEBUG');
  console.log('=======================');
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

// Export main function
export { runCompleteTest, generateSensorData, encryptPayload, createJWTToken };

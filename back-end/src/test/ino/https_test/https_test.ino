#include <WiFi.h>
#include <WiFiUdp.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <CustomJWT.h>
#include <NTPClient.h>

// ---- SETUP VARIABEL ------
#define DEVICE_ID "1"
#define JWT_SECRET "8358a7b6add3b33daf060be8345f0af4"

// Waktu lokal (GMT +7)
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org", 7*3600, 60000);

// WiFi configuration
const char* ssid = "K.WATT -2.4G";
const char* password = "KentungMusthofa";

// Server configuration
const char* server_url = "https://api.misred-iot.com";

// Sertifikat server VPS
const char* root_ca = \
"-----BEGIN CERTIFICATE-----
MIIDyDCCA06gAwIBAgISBnoA4tDtvQfROfBi0AlsNwrsMAoGCCqGSM49BAMDMDIxCzAJBgNVBAYT
AlVTMRYwFAYDVQQKEw1MZXQncyBFbmNyeXB0MQswCQYDVQQDEwJFNTAeFw0yNTA2MjYwMzU2NDJa
Fw0yNTA5MjQwMzU2NDFaMBkxFzAVBgNVBAMTDm1pc3JlZC1pb3QuY29tMFkwEwYHKoZIzj0CAQYI
KoZIzj0DAQcDQgAEP3QQVE4x5D2zGztl9jE6HQZARfTZsSHQwNZLOKO2XBDMhmILESz5FBjgw9+H
OQYMGVi5u1X6Ll2wAN/UwjpBBKOCAlswggJXMA4GA1UdDwEB/wQEAwIHgDAdBgNVHSUEFjAUBggr
BgEFBQcDAQYIKwYBBQUHAwIwDAYDVR0TAQH/BAIwADAdBgNVHQ4EFgQUlL4M04I2LwUJUo6P97aw
AomhVs4wHwYDVR0jBBgwFoAUnytfzzwhT50Et+0rLMTGcIvS1w0wMgYIKwYBBQUHAQEEJjAkMCIG
CCsGAQUFBzAChhZodHRwOi8vZTUuaS5sZW5jci5vcmcvMFcGA1UdEQRQME6CFGFkbWluLm1pc3Jl
ZC1pb3QuY29tghJhcGkubWlzcmVkLWlvdC5jb22CDm1pc3JlZC1pb3QuY29tghJ3d3cubWlzcmVk
LWlvdC5jb20wEwYDVR0gBAwwCjAIBgZngQwBAgEwLgYDVR0fBCcwJTAjoCGgH4YdaHR0cDovL2U1
LmMubGVuY3Iub3JnLzEwOS5jcmwwggEEBgorBgEEAdZ5AgQCBIH1BIHyAPAAdwCkQsUGSWBhVI8P
1Oqc+3otJkVNh6l/L99FWfYnTzqEVAAAAZeqlwExAAAEAwBIMEYCIQDjg+ttTHx46AjnqSXJ58s+
xkAVB38c5+SR+FwOT2pEnQIhAMrcKQHZH4k68rFFav7ve2SQrTujCDQFa3io75/AuNFBAHUArxga
KNaMo+CpikycZ6sJ+Lu8IrquvLE4o6Gd0/m2Aw0AAAGXqpcCBAAABAMARjBEAiBMW2kIjjzwzsPs
zRtKKQkWeTt/Tdd8WVT+S3LuatNe8AIgBFIVo08u1HuExG0H/HONsqCEDQg805gmAFS4DQILMU0w
CgYIKoZIzj0EAwMDaAAwZQIwIPIuKha9KvibQ+WxVc6ydYviJLTNkzSVR+v95Sxsk7Zgpnxg+U9W
FjDHGJaTKiFkAjEAmAVD8jwSLDwJYqt6Y35rLIbn5ZBqgPod7yJzyWH0/rpcN0gA4LFrfR7L2dqM
tzwT
-----END CERTIFICATE-----\n";

// Device configuration (akan di-update otomatis dari server)
char device_secret[] = JWT_SECRET;
String device_id = DEVICE_ID;

// JWT configuration
CustomJWT jwt(device_secret, 512); // 512 bytes for payload

// Sensor pins
const int PH_SENSOR   = 36;
const int FLOW_SENSOR = 39;
const int COD_SENSOR  = 34;
const int TEMP_SENSOR = 35;
const int NH3N_SENSOR = 32;
const int NTU_SENSOR  = 33;

unsigned long lastSensorSend = 0;
const unsigned long SENSOR_INTERVAL = 5000; // 5 seconds
int messageCount = 0;

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  // Setup sensor pins
  pinMode(PH_SENSOR, INPUT);
  pinMode(FLOW_SENSOR, INPUT);
  pinMode(COD_SENSOR, INPUT);
  pinMode(TEMP_SENSOR, INPUT);
  pinMode(NH3N_SENSOR, INPUT);
  pinMode(NTU_SENSOR, INPUT);
  
  // Connect to WiFi
  Serial.println("🔗 Connecting to WiFi...");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n✅ WiFi connected");
  Serial.print("📡 ESP32 IP Address: ");
  Serial.println(WiFi.localIP());
  
  // Initialize random seed
  randomSeed(analogRead(0));
  
  Serial.println("🧪 SIMPLE HTTP Sensor Data Test with CustomJWT");
  Serial.println("Target: Send sensor data to server for database storage");
  Serial.println("Expected response: 'Berhasil menyimpan data sensor ke VPS'");
  
  // Initialize JWT memory
  jwt.allocateJWTMemory();
  Serial.println("✅ JWT memory allocated");

  // Inisialisasi NTP
  timeClient.begin();
  
  WiFiClientSecure *client = new WiFiClientSecure;

  lastSensorSend = millis() - SENSOR_INTERVAL; // Send immediately
}

void loop() {
  unsigned long now = millis();
  timeClient.update();

  if (now - lastSensorSend >= SENSOR_INTERVAL && messageCount < 10) {
    lastSensorSend = now;
    messageCount++;
    sendSensorDataHTTPS();
  }
  
  // Stop after 10 messages
  if (messageCount >= 2) {
    Serial.println("🏁 Testing completed");
    Serial.println("✅ ESP32 HTTPS  test finished. Check server logs for database storage.");
    while (true) {
      delay(1000);
      // Optional: Print periodic status
      Serial.println("💤 Reset to restart");
      delay(590000); // Print every 10 seconds total
      messageCount = 0; // Reset for continuous testing
    }
  }
  
  delay(100);
}

void sendSensorDataHTTPS() {
  Serial.println("\n📊 Reading sensors (" + String(messageCount) + "/10)...");
  
  // Read sensor values (realistic simulation)
  float phValue = readPHSensor();
  float flowValue = readFlowSensor();
  float codValue = readCODSensor();
  float tempValue = readTempSensor();
  float nh3nValue = readNH3NSensor();
  float ntuValue = readNTUSensor();
  
  // Create sensor data payload
  StaticJsonDocument<512> sensorDoc;
  sensorDoc["V0"] = phValue;        // pH sensor on pin A0
  sensorDoc["V1"] = flowValue;      // Flow sensor on pin A1  
  sensorDoc["V2"] = codValue;       // COD sensor on pin A2
  sensorDoc["V3"] = tempValue;      // Temperature sensor on pin A3
  sensorDoc["V4"] = nh3nValue;      // NH3N sensor on pin A4
  sensorDoc["V5"] = ntuValue;       // NTU sensor on pin A5
  sensorDoc["timestamp"] = timeClient.getEpochTime() - (7*3600);
  
  String sensorPayload;
  serializeJson(sensorDoc, sensorPayload);
  
  Serial.println("📦 Sensor payload: " + sensorPayload);
  
  // Create JWT with encrypted payload
  String jwt_token = createJWTWithCustomJWT(sensorPayload);
  
  if (jwt_token.length() > 0) {
    // Send HTTP POST request
    HTTPClient http;
    http.begin(server_url + String("/payload/http"));
    http.addHeader("Content-Type", "application/json");
    http.addHeader("Authorization", "Bearer " + jwt_token);
    
    // Empty body since data is in JWT
    String requestBody = "{}";
    
    Serial.println("📤 Mengirim data ke server menggunakan protokol HTTPS...");
    int httpResponseCode = http.POST(requestBody);
    
    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println("✅ Respons dari server (" + String(httpResponseCode) + "): " + response);
      
      // Check if response contains success message
      if (response.indexOf("Berhasil") >= 0 || response.indexOf("success") >= 0) {
        Serial.println("🎉 SUCCESS: Data saved to database!");
      }
    } else {
      Serial.println("❌ HTTP Error: " + String(httpResponseCode));
      
      // Jika error 401 atau 403, coba renewal secret
      if (httpResponseCode == 401 || httpResponseCode == 403) {
        Serial.println("🔄 JWT might be invalid, trying secret renewal...");
        if (renewDeviceSecret()) {
          Serial.println("🔄 Retrying with new secret...");
          // Rekursif call dengan secret baru
          sendSensorDataHTTPS();
          return;
        }
      }
    }
    
    http.end();
  } else {
    Serial.println("❌ Failed to create JWT token");
  }
}

// Simple sensor reading functions with realistic values
float readPHSensor() {
  // pH sensor: 6.5 - 8.5 (realistic water pH range)
  return 6.5 + (random(0, 200) / 100.0);
}

float readFlowSensor() {
  // Flow sensor: 10 - 50 L/min
  return 10.0 + (random(0, 4000) / 100.0);
}

float readCODSensor() {
  // COD sensor: 20 - 80 mg/L
  return 20.0 + (random(0, 6000) / 100.0);
}

float readTempSensor() {
  // Temperature sensor: 20 - 35°C
  return 20.0 + (random(0, 1500) / 100.0);
}

float readNH3NSensor() {
  // NH3N sensor: 0.1 - 5.0 mg/L
  return 0.1 + (random(0, 490) / 100.0);
}

float readNTUSensor() {
  // NTU sensor: 1 - 20 NTU
  return 1.0 + (random(0, 1900) / 100.0);
}

// Create JWT token using CustomJWT library
String createJWTWithCustomJWT(String data) {
  Serial.println("🔐 Creating JWT token with CustomJWT...");
  unsigned long currentTime = timeClient.getEpochTime();
  unsigned long expiryTime = currentTime + 3600; // 1 hour from now
  
  // Create payload JSON with encryptedData field
  StaticJsonDocument<256> payloadDoc;
  payloadDoc["data"] = data; // For simplicity, we'll send plain data as "encrypted"
  payloadDoc["sub"] = device_id;
  payloadDoc["iat"] = currentTime;
  payloadDoc["exp"] = expiryTime; // 1 hour expiry
  
  String payloadStr;
  serializeJson(payloadDoc, payloadStr);
  
  Serial.println("📦 JWT Payload: " + payloadStr);
  
  // Create JWT using CustomJWT library
  bool success = jwt.encodeJWT((char*)payloadStr.c_str());
  
  if (success) {
    String token = String(jwt.out);
    Serial.println("✅ JWT Token created successfully");
    Serial.println("🔑 Token length: " + String(token.length()));
    return token;
  } else {
    Serial.println("❌ Failed to create JWT token");
    return "";
  }
}

// Renew device secret when JWT fails
bool renewDeviceSecret() {
  Serial.println("🔄 Attempting to renew device secret...");
  HTTPClient http;
  http.begin(server_url + String("/device/renew-secret/") + device_id);
  http.addHeader("Content-Type", "application/json");
  
  // Send current secret as old_secret
  String requestBody = "{\"old_secret\":\"" + String(device_secret) + "\"}";
  
  int httpResponseCode = http.POST(requestBody);
  
  if (httpResponseCode == 200) {
    String response = http.getString();
    Serial.println("📋 Renewal response: " + response);
    
    // Parse JSON response to get new secret
    StaticJsonDocument<256> doc;
    DeserializationError error = deserializeJson(doc, response);
    
    if (!error && doc.containsKey("secret_key")) {
      String newSecret = doc["secret_key"];
      
      // Update device secret
      strcpy(device_secret, newSecret.c_str());
      
      // Reinitialize JWT with new secret
      CustomJWT newJwt(device_secret, 256);
      jwt = newJwt;
      jwt.allocateJWTMemory();
      
      Serial.println("✅ Secret renewed successfully!");
      Serial.println("🔑 New secret: " + String(device_secret));
      
      http.end();
      return true;
    } else {
      Serial.println("❌ Failed to parse renewal response");
    }
  } else {
    String error = http.getString();
    Serial.println("❌ Secret renewal failed (" + String(httpResponseCode) + "): " + error);
  }
  
  http.end();
  return false;
}

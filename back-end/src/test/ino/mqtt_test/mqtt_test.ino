#include <AESUtils.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <CustomJWT.h>
#include <NTPClient.h>
#include <WiFiUdp.h>

// ---- SETUP VARIABEL ------
// Sesuaikan dengan nilai UID dan JWT Secret pada halaman Devices -- PENTING
#define DEVICE_ID "27"
#define JWT_SECRET "266750b1e2c90b9c42ad59828335d68b"
#define MQTT_TOPIC "device/data"

// Waktu UTC
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org");

// WiFi configuration
const char* ssid = "yoo";
const char* password = "yooooooo";
// const char* ssid = "K.WATT -2.4G";
// const char* password = "KentungMusthofa";

// MQTT configuration
const char* mqtt_server = "103.82.241.46"; // VPS
// const char* mqtt_server = "192.168.18.238"; // Local
const int mqtt_port = 1883;
// Sesuaikan dengan nilai Topik MQTT pada halaman Devices -- PENTING
char* mqtt_topic = MQTT_TOPIC;

// Device configuration (akan di-update otomatis dari server)
char device_secret[] = JWT_SECRET;
String device_id = DEVICE_ID;

// JWT configuration
CustomJWT jwt(device_secret, 256); // 256 bytes for payload

// Sensor pins
const int PH_SENSOR   = 36;
const int FLOW_SENSOR = 39;
const int COD_SENSOR  = 34;
const int TEMP_SENSOR = 35;
const int NH3N_SENSOR = 32;
const int NTU_SENSOR  = 33;

WiFiClient espClient;
PubSubClient mqttClient(espClient);

byte aesKey[16];
byte iv[16];

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

  // Setup MQTT
  mqttClient.setServer(mqtt_server, mqtt_port);
  mqttClient.setBufferSize(512);
  mqttClient.setCallback(onMqttMessage);

  // Initialize random seed
  randomSeed(analogRead(0));
  
  // Inisialisasi NTP
  timeClient.begin();

  // Initialize JWT memory
  jwt.allocateJWTMemory();
  
  convertHexToBytes(JWT_SECRET, aesKey);
  lastSensorSend = millis() - SENSOR_INTERVAL; // Send immediately
}

void loop() {
  // Maintain MQTT connection
  if (!mqttClient.connected()) {
    reconnectMQTT();
  }
  mqttClient.loop();

  unsigned long now = millis();
  timeClient.update();
  sendSensorDataMQTT();
  
  // Send sensor data every 5 seconds (limit to 10 messages for testing)
  // if (now - lastSensorSend >= SENSOR_INTERVAL && messageCount < 10) {
  //   lastSensorSend = now;
  //   messageCount++;
  //   sendSensorDataMQTT();
  // }
  
  // Stop after 10 messages
  // if (messageCount >= 10) {
  //   Serial.println("🏁 MQTT Testing completed");
  //   Serial.println("✅ ESP32 MQTT test finished. Check server logs for database storage.");
  //   while (true) {
  //     delay(1000);
  //     // Optional: Print periodic status
  //     Serial.println("💤 Tekan tombol EN untuk mengirim ulang.");
  //     delay(590000); // Print every 10 seconds total
  //     messageCount = 0; // Reset for continuous testing
  //   }
  // }
  
  delay(10000);
}

void reconnectMQTT() {
  while (!mqttClient.connected()) {
    Serial.println("📡 Connecting to MQTT broker...");
    
    String clientId = "ESP32Client_" + String(random(0xffff), HEX);
    
    if (mqttClient.connect(clientId.c_str())) {
      Serial.println("✅ Connected to MQTT broker");
    } else {
      Serial.print("❌ MQTT connection failed, rc=");
      Serial.print(mqttClient.state());
      Serial.println(" trying again in 5 seconds");
      delay(5000);
    }
  }
}

void sendSensorDataMQTT() {
  // Serial.println("\n📊 Reading sensors for MQTT (" + String(messageCount) + "/10)...");
  
  // Read sensor values (realistic simulation)
  float phValue = readPHSensor();
  float flowValue = readFlowSensor();
  float codValue = readCODSensor();
  float tempValue = readTempSensor();
  float nh3nValue = readNH3NSensor();
  float ntuValue = readNTUSensor();
  
  // Create sensor data payload
  // Sesuaikan dengan Virtual Pin yang ditambahkan pada halaman Datastreams -- PENTING
  StaticJsonDocument<256> sensorDoc;
  sensorDoc["V0"] = phValue;        // pH sensor on pin A0
  sensorDoc["V1"] = flowValue;      // Flow sensor on pin A1  
  sensorDoc["V2"] = codValue;       // COD sensor on pin A2
  sensorDoc["V3"] = tempValue;      // Temperature sensor on pin A3
  sensorDoc["V4"] = nh3nValue;      // NH3N sensor on pin A4
  sensorDoc["V5"] = ntuValue;       // NTU sensor on pin A5
  sensorDoc["timestamp"] = timeClient.getEpochTime();
  
  String sensorPayload;
  serializeJson(sensorDoc, sensorPayload);
  
  String encrypted = AESUtils::encryptPayload(sensorPayload, aesKey, iv);
  Serial.println("📦 Sensor payload: " + sensorPayload);
  
  // Create JWT with encrypted payload
  String mqttPayload = createJWTWithCustomJWT(encrypted);
  Serial.println("🔑 Token length: " + String(mqttPayload.length()));
  
  if (mqttPayload.length() > 0) {
    Serial.println("📤 Publishing to MQTT topic: " + String(mqtt_topic));
    
    // Syntax: publish(topic, payload)
    if (mqttClient.publish(mqtt_topic, mqttPayload.c_str())) {
      Serial.println("✅ MQTT published successfully");
    } else {
      Serial.println("❌ MQTT publish failed");
    }
  } else {
    Serial.println("❌ Failed to create JWT token");
  }
}

void onMqttMessage(char* topic, byte* payload, unsigned int length) {
  Serial.print("📥 MQTT message received on topic: ");
  Serial.println(topic);
  
  String message;
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  Serial.println("📄 Pesan yang diterima dari publisher: " + message);
}

// Simple sensor reading functions with realistic values
float readPHSensor() {
  // pH sensor: 6.5 - 8.5 (realistic water pH range)
  return 6.5 + (random(0, 200) / 100.0);
}

float readFlowSensor() {
  // Flow sensor: 1 - 5 L/min
  return 1.0 + (random(0, 400) / 100.0);
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
  Serial.println("🔐 Membuat JWT menggunakan library CustomJWT...");
  unsigned long currentTime = timeClient.getEpochTime(); // Sesuai dengan waktu lokal (Zona waktu Asia/Jakarta, +7 jam)
  unsigned long expiryTime = currentTime + 3600; // 1 dari sekarang
  
  StaticJsonDocument<256> payloadDoc;
  payloadDoc["data"] = data; // Payload sensor
  payloadDoc["sub"] = device_id;
  payloadDoc["iat"] = currentTime;
  payloadDoc["exp"] = expiryTime;

  String payloadStr;
  serializeJson(payloadDoc, payloadStr);
  
  Serial.println("📦 Payload JWT: " + payloadStr);
  
  // Create JWT using CustomJWT library
  bool success = jwt.encodeJWT((char*)payloadStr.c_str());
  
  if (success) {
    String token = String(jwt.out);
    Serial.println("✅ Berhasil membuat Token JWT");
    Serial.println("🔑 Token length: " + String(token.length()));
    return token;
  } else {
    Serial.println("❌ Failed to create JWT token");
    return "";
  }
}


void convertHexToBytes(const String& hexString, byte* output){
  for(int i = 0; i < 16 && i * 2 < hexString.length(); i++){
    String byteString = hexString.substring(i * 2, i * 2 + 2);
    output[i] = (byte)strtol(byteString.c_str(), NULL, 16);
  }
}


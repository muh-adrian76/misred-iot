#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <CustomJWT.h>

// WiFi configuration
const char* ssid = "K.WATT -2.4G";
const char* password = "KentungMusthofa";

// MQTT configuration
const char* mqtt_server = "192.168.18.121";
const int mqtt_port = 1883;
const char* mqtt_topic = "device/data";

// Device configuration (device 2 for MQTT)
char device_secret[] = "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
String device_id = "2"; // Device 2 is configured for MQTT in database

// JWT configuration
CustomJWT jwt(device_secret, 512); // 512 bytes for payload

// Sensor pins
const int PH_SENSOR = A0;
const int FLOW_SENSOR = A1;
const int COD_SENSOR = A2;
const int TEMP_SENSOR = A3;
const int NH3N_SENSOR = A4;
const int NTU_SENSOR = A5;

WiFiClient espClient;
PubSubClient mqttClient(espClient);

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
  mqttClient.setCallback(onMqttMessage);

  // Initialize random seed
  randomSeed(analogRead(0));
  
  Serial.println("📡 SIMPLE MQTT Sensor Data Test with CustomJWT");
  Serial.println("Target: Publish sensor data via MQTT for database storage");
  Serial.println("Expected: Server processes MQTT data and stores in database");
  
  // Initialize JWT memory
  jwt.allocateJWTMemory();
  Serial.println("✅ JWT memory allocated");
  
  lastSensorSend = millis() - SENSOR_INTERVAL; // Send immediately
}

void loop() {
  // Maintain MQTT connection
  if (!mqttClient.connected()) {
    reconnectMQTT();
  }
  mqttClient.loop();

  unsigned long now = millis();
  
  // Send sensor data every 5 seconds (limit to 10 messages for testing)
  if (now - lastSensorSend >= SENSOR_INTERVAL && messageCount < 10) {
    lastSensorSend = now;
    messageCount++;
    sendSensorDataMQTT();
  }
  
  // Stop after 10 messages
  if (messageCount >= 10) {
    Serial.println("🏁 MQTT Testing completed - published 10 messages");
    Serial.println("✅ ESP32 MQTT test finished. Check server logs for database storage.");
    delay(60000); // Wait 1 minute
    messageCount = 0; // Reset for continuous testing
  }
  
  delay(100);
}

void reconnectMQTT() {
  while (!mqttClient.connected()) {
    Serial.println("📡 Connecting to MQTT broker...");
    
    String clientId = "ESP32_Simple_Test_" + device_id;
    
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
  Serial.println("\n📊 Reading sensors for MQTT (" + String(messageCount) + "/10)...");
  
  // Read sensor values (realistic simulation)
  float phValue = readPHSensor();
  float flowValue = readFlowSensor();
  float codValue = readCODSensor();
  float tempValue = readTempSensor();
  float nh3nValue = readNH3NSensor();
  float ntuValue = readNTUSensor();
  
  // Create sensor data payload
  StaticJsonDocument<512> sensorDoc;
  sensorDoc["A0"] = phValue;        // pH sensor on pin A0
  sensorDoc["A1"] = flowValue;      // Flow sensor on pin A1  
  sensorDoc["A2"] = codValue;       // COD sensor on pin A2
  sensorDoc["A3"] = tempValue;      // Temperature sensor on pin A3
  sensorDoc["A4"] = nh3nValue;      // NH3N sensor on pin A4
  sensorDoc["A5"] = ntuValue;       // NTU sensor on pin A5
  sensorDoc["timestamp"] = millis();
  sensorDoc["device_id"] = device_id;
  
  String sensorPayload;
  serializeJson(sensorDoc, sensorPayload);
  
  Serial.println("📦 Sensor payload: " + sensorPayload);
  
  // Create JWT with encrypted payload
  String jwt_token = createJWTWithCustomJWT(sensorPayload);
  
  if (jwt_token.length() > 0) {
    // Create MQTT message with JWT
    StaticJsonDocument<256> mqttDoc;
    mqttDoc["device_id"] = device_id;
    mqttDoc["jwt"] = jwt_token;
    mqttDoc["timestamp"] = millis();
    mqttDoc["message_count"] = messageCount;
    
    String mqttPayload;
    serializeJson(mqttDoc, mqttPayload);
    
    Serial.println("📤 Publishing to MQTT topic: " + String(mqtt_topic));
    
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
  Serial.println("📄 Message: " + message);
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
  Serial.println("🔐 Creating MQTT JWT token with CustomJWT...");
  
  // Create payload JSON with encryptedData field
  StaticJsonDocument<256> payloadDoc;
  payloadDoc["encryptedData"] = data; // For simplicity, we'll send plain data as "encrypted"
  payloadDoc["deviceId"] = device_id;
  payloadDoc["iat"] = millis() / 1000;
  payloadDoc["exp"] = (millis() / 1000) + 3600; // 1 hour expiry
  
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

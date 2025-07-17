#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// WiFi credentials
const char* ssid = "K.WATT -2.4G";
const char* password = "KentungMusthofa";

// MQTT settings
const char* mqtt_server = "192.168.18.121";
const int mqtt_port = 1883;
const char* device_secret = "0df2b4a05b798a451dd2c0a9ee791c3ed6add2bd2e8f42f5a798ed518a870605";
const String device_id = "1";
const String mqtt_topic = "device/1/data"; // Device-specific topic

WiFiClient espClient;
PubSubClient client(espClient);

void setup() {
  Serial.begin(115200);
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected");
  
  // Setup MQTT
  client.setServer(mqtt_server, mqtt_port);
  
  // Connect to MQTT broker
  connectToMQTT();
}

void loop() {
  if (!client.connected()) {
    connectToMQTT();
  }
  client.loop();
  
  // Send sensor data every 5 seconds
  static unsigned long lastSend = 0;
  if (millis() - lastSend > 5000) {
    sendMQTTPayload();
    lastSend = millis();
  }
}

void connectToMQTT() {
  while (!client.connected()) {
    Serial.println("Connecting to MQTT...");
    
    // Use device_id as client ID
    if (client.connect(("ESP32_" + device_id).c_str())) {
      Serial.println("✅ Connected to MQTT Broker");
    } else {
      Serial.print("❌ Failed to connect. Status=");
      Serial.println(client.state());
      delay(2000);
    }
  }
}

void sendMQTTPayload() {
  // Generate sensor data
  String sensorData = generateSensorData();
  
  // Create JWT with encrypted payload
  String jwt_token = createJWTWithEncryptedPayload(sensorData, device_secret);
  
  // Create MQTT payload with JWT
  StaticJsonDocument<512> mqttPayload;
  mqttPayload["device_id"] = device_id;
  mqttPayload["jwt"] = jwt_token;
  mqttPayload["timestamp"] = millis();
  
  String payload;
  serializeJson(mqttPayload, payload);
  
  // Publish to MQTT topic
  if (client.publish(mqtt_topic.c_str(), payload.c_str())) {
    Serial.println("✅ MQTT payload sent successfully");
    Serial.println("📤 Topic: " + mqtt_topic);
    Serial.println("📦 Payload: " + payload);
  } else {
    Serial.println("❌ Failed to send MQTT payload");
  }
}

String generateSensorData() {
  StaticJsonDocument<512> doc;
  doc["uid"] = device_id;
  doc["phValue"] = random(600, 800) / 100.0;
  doc["flowMilliLitres"] = random(2000, 3000) / 10.0;
  doc["COD_val"] = random(300, 400) / 10.0;
  doc["CODTemp_val"] = random(250, 300) / 10.0;
  doc["NH3N_val"] = random(30, 80) / 10.0;
  doc["NTU"] = random(10, 30);
  doc["timestamp"] = millis();
  
  String payload;
  serializeJson(doc, payload);
  return payload;
}

// Placeholder function - implement proper JWT + AES encryption
String createJWTWithEncryptedPayload(String data, String secret) {
  // 1. Encrypt data with AES-128-CBC using secret as key
  String encryptedData = encryptAES(data, secret);
  
  // 2. Create JWT payload
  StaticJsonDocument<256> jwtPayload;
  jwtPayload["encryptedData"] = encryptedData;
  jwtPayload["iat"] = WiFi.getTime();
  
  // 3. Sign JWT with secret
  String jwt = signJWT(jwtPayload, secret);
  
  return jwt;
}

// Implement these functions with proper cryptographic libraries
String encryptAES(String plaintext, String key) {
  // TODO: Implement AES-128-CBC encryption
  return base64_encode(plaintext); // Placeholder
}

String signJWT(JsonDocument& payload, String secret) {
  // TODO: Implement proper JWT signing with HMAC-SHA256
  return "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.placeholder.signature";
}

String base64_encode(String input) {
  // TODO: Implement base64 encoding
  return input;
}

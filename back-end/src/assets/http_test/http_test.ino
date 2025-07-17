#include <WiFi.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>

// Device configuration
const char* ssid = "K.WATT -2.4G";
const char* password = "KentungMusthofa";
const char* ws_host = "192.168.18.121";
const uint16_t ws_port = 7601;         
const char* ws_path = "/ws/connect";
const char* device_secret = "0df2b4a05b798a451dd2c0a9ee791c3ed6add2bd2e8f42f5a798ed518a870605"; 
String device_id = "1";

// Control pins (actuators)
const int RELAY_PIN = 4;    // Digital output
const int LED_PIN = 2;      // PWM output
const int PUMP_PIN = 5;     // Digital output

// Sensor pins
const int PH_SENSOR = A0;
const int FLOW_SENSOR = 12;

bool isRegistered = false;
WebSocketsClient webSocket;
unsigned long lastHeartbeat = 0;
unsigned long lastSensorSend = 0;

void setup() {
  Serial.begin(115200);
  
  // Setup control pins
  pinMode(RELAY_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);
  pinMode(PUMP_PIN, OUTPUT);
  
  // Setup sensor pins
  pinMode(PH_SENSOR, INPUT);
  pinMode(FLOW_SENSOR, INPUT);
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected");

  // Connect to WebSocket
  webSocket.begin(ws_host, ws_port, ws_path);
  webSocket.onEvent(webSocketEvent);
  webSocket.setReconnectInterval(5000);

  lastHeartbeat = millis() - 10000;
  lastSensorSend = millis() - 5000;
}

void loop() {
  webSocket.loop();
  unsigned long now = millis();

  if (isRegistered) {
    // Send heartbeat every 10 seconds
    if (now - lastHeartbeat > 10000) {
      lastHeartbeat = now;
      sendHeartbeat();
    }

    // Send sensor data every 5 seconds
    if (now - lastSensorSend > 5000) {
      lastSensorSend = now;
      sendSensorData();
    }
  }
}

void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  if (type == WStype_TEXT) {
    Serial.printf("📩 Received: %s\n", payload);

    StaticJsonDocument<512> doc;
    DeserializationError err = deserializeJson(doc, payload, length);
    if (err) {
      Serial.println("⚠️ Failed to parse JSON");
      return;
    }

    String msgType = doc["type"] | "";

    // Server says hello, register device
    if (msgType == "hello") {
      registerDevice();
    }
    
    // Registration successful
    else if (msgType == "registered") {
      int id = doc["device_id"] | -1;
      if (id != -1) {
        device_id = String(id);
        Serial.println("✅ Registered with device_id: " + device_id);
        isRegistered = true;
      }
    }
    
    // Device command received
    else if (msgType == "device_command") {
      handleDeviceCommand(doc);
    }
  }
}

void registerDevice() {
  StaticJsonDocument<128> reg;
  reg["type"] = "register";
  reg["secret"] = device_secret;
  String out;
  serializeJson(reg, out);
  Serial.println("📤 Registering device...");
  webSocket.sendTXT(out);
}

void sendHeartbeat() {
  StaticJsonDocument<128> doc;
  doc["type"] = "status_update";
  doc["device_id"] = device_id;
  doc["status"] = "online";
  doc["timestamp"] = millis();
  
  String out;
  serializeJson(doc, out);
  Serial.println("📤 Sending heartbeat...");
  webSocket.sendTXT(out);
}

void sendSensorData() {
  // Read actual sensors
  float phValue = readPHSensor();
  float flowRate = readFlowSensor();
  
  // Create sensor data with JWT + AES encryption
  StaticJsonDocument<512> sensorDoc;
  sensorDoc["uid"] = device_id;
  sensorDoc["phValue"] = phValue;
  sensorDoc["flowMilliLitres"] = flowRate;
  sensorDoc["COD_val"] = random(300, 400) / 10.0;
  sensorDoc["CODTemp_val"] = random(250, 300) / 10.0;
  sensorDoc["NH3N_val"] = random(30, 80) / 10.0;
  sensorDoc["NTU"] = random(10, 30);
  sensorDoc["timestamp"] = millis();

  String sensorPayload;
  serializeJson(sensorDoc, sensorPayload);
  
  // Create JWT with encrypted payload (implement proper encryption)
  String jwt_token = createJWTWithEncryptedPayload(sensorPayload, device_secret);
  
  // Send via WebSocket
  StaticJsonDocument<256> wsDoc;
  wsDoc["type"] = "sensor_update";
  wsDoc["device_id"] = device_id;
  wsDoc["jwt"] = jwt_token;
  wsDoc["timestamp"] = millis();
  
  String out;
  serializeJson(wsDoc, out);
  Serial.println("📤 Sending sensor data...");
  webSocket.sendTXT(out);
}

void handleDeviceCommand(JsonDocument& doc) {
  String commandType = doc["command_type"] | "";
  String controlId = doc["control_id"] | "";
  String commandId = doc["command_id"] | "";
  float value = doc["value"] | 0.0;
  
  Serial.println("🎛️ Received command: " + commandType + " = " + String(value));
  
  bool success = false;
  
  // Execute command based on control_id
  if (controlId == "1") { // Relay control
    digitalWrite(RELAY_PIN, value > 0 ? HIGH : LOW);
    success = true;
  }
  else if (controlId == "2") { // LED PWM control
    analogWrite(LED_PIN, (int)(value * 255 / 100)); // Assuming value is 0-100%
    success = true;
  }
  else if (controlId == "3") { // Pump control
    digitalWrite(PUMP_PIN, value > 0 ? HIGH : LOW);
    success = true;
  }
  
  // Send acknowledgment back to server
  sendCommandAck(commandId, success);
}

void sendCommandAck(String commandId, bool success) {
  StaticJsonDocument<128> ackDoc;
  ackDoc["type"] = "command_ack";
  ackDoc["device_id"] = device_id;
  ackDoc["command_id"] = commandId;
  ackDoc["success"] = success;
  ackDoc["timestamp"] = millis();
  
  String out;
  serializeJson(ackDoc, out);
  Serial.println("📤 Sending command acknowledgment...");
  webSocket.sendTXT(out);
}

// Sensor reading functions
float readPHSensor() {
  int rawValue = analogRead(PH_SENSOR);
  // Convert to pH value (0-14)
  float voltage = rawValue * (3.3 / 4095.0);
  float phValue = 7.0 + ((2.5 - voltage) / 0.18);
  return constrain(phValue, 0.0, 14.0);
}

float readFlowSensor() {
  // Simulate flow sensor reading
  // In real implementation, use interrupt-based pulse counting
  return random(200, 300) / 10.0; // L/min
}

// Placeholder for JWT + AES encryption (implement with proper crypto library)
String createJWTWithEncryptedPayload(String data, String secret) {
  // TODO: Implement proper JWT + AES encryption
  // For now, return a placeholder
  return "jwt_encrypted_payload_placeholder";
}

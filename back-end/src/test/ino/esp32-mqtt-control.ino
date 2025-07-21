/*
  🤖 ESP32 Device Control - MQTT Version
  
  Contoh implementasi untuk menerima dan mengeksekusi perintah
  dari sistem Misred-IoT menggunakan protokol MQTT
  
  Hardware yang dibutuhkan:
  - ESP32 Development Board
  - LED (pin D2)
  - Relay/Pump (pin D4) 
  - Servo Motor (pin D5)
  - Buzzer (pin D18)
*/

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <ESP32Servo.h>

// ================================
// CONFIGURATION
// ================================
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* mqtt_server = "your-server.com";  // Ganti dengan IP server Anda
const int mqtt_port = 1883;
const int deviceId = 1;  // Sesuaikan dengan device_id di database
const char* device_secret = "your-device-secret";  // JWT token untuk device

// ================================
// HARDWARE PIN DEFINITIONS
// ================================
const int LED_PIN = 2;        // D0 - LED Control (Boolean)
const int PUMP_PIN = 4;       // D1 - Pump Control (Boolean)
const int SERVO_PIN = 5;      // D2 - Servo Position (String/Range)
const int BUZZER_PIN = 18;    // D3 - Buzzer Control (Boolean)

// ================================
// OBJECTS
// ================================
WiFiClient espClient;
PubSubClient mqttClient(espClient);
Servo servoMotor;

// ================================
// SETUP
// ================================
void setup() {
  Serial.begin(115200);
  Serial.println("🚀 Starting ESP32 Device Control...");
  
  // Initialize hardware pins
  setupHardware();
  
  // Connect to WiFi
  setupWiFi();
  
  // Setup MQTT
  setupMQTT();
  
  Serial.println("✅ Device ready for commands!");
  blinkStatus(3); // Blink LED 3 times to indicate ready
}

void setupHardware() {
  // Digital outputs
  pinMode(LED_PIN, OUTPUT);
  pinMode(PUMP_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  
  // Initialize servo
  servoMotor.attach(SERVO_PIN);
  servoMotor.write(0); // Start position
  
  // Turn off all outputs initially
  digitalWrite(LED_PIN, LOW);
  digitalWrite(PUMP_PIN, LOW);
  digitalWrite(BUZZER_PIN, LOW);
  
  Serial.println("🔧 Hardware initialized");
}

void setupWiFi() {
  WiFi.begin(ssid, password);
  Serial.print("🌐 Connecting to WiFi");
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println();
  Serial.print("✅ WiFi connected! IP: ");
  Serial.println(WiFi.localIP());
}

void setupMQTT() {
  mqttClient.setServer(mqtt_server, mqtt_port);
  mqttClient.setCallback(onMqttMessage);
  connectMQTT();
}

// ================================
// MAIN LOOP
// ================================
void loop() {
  // Maintain MQTT connection
  if (!mqttClient.connected()) {
    connectMQTT();
  }
  mqttClient.loop();
  
  // Send periodic status (optional)
  static unsigned long lastStatus = 0;
  if (millis() - lastStatus > 30000) { // Every 30 seconds
    sendDeviceStatus();
    lastStatus = millis();
  }
  
  delay(100);
}

// ================================
// MQTT FUNCTIONS
// ================================
void connectMQTT() {
  while (!mqttClient.connected()) {
    Serial.print("🔌 Connecting to MQTT...");
    
    String clientId = "ESP32Device_" + String(deviceId);
    
    if (mqttClient.connect(clientId.c_str())) {
      Serial.println(" connected!");
      
      // Subscribe to command topic
      String commandTopic = "command/" + String(deviceId);
      mqttClient.subscribe(commandTopic.c_str());
      Serial.println("📡 Subscribed to: " + commandTopic);
      
      // Send device online status
      sendDeviceStatus();
      
    } else {
      Serial.print(" failed, rc=");
      Serial.print(mqttClient.state());
      Serial.println(" retrying in 5 seconds");
      delay(5000);
    }
  }
}

void onMqttMessage(char* topic, byte* payload, unsigned int length) {
  // Convert payload to string
  String message = "";
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  
  Serial.println("📨 Received command: " + message);
  
  // Parse JSON command
  DynamicJsonDocument doc(512);
  DeserializationError error = deserializeJson(doc, message);
  
  if (error) {
    Serial.println("❌ JSON parse error: " + String(error.c_str()));
    return;
  }
  
  // Extract command data
  int commandId = doc["command_id"];
  String pin = doc["pin"];
  String commandType = doc["command_type"];
  int value = doc["value"];
  
  Serial.println("🎯 Executing: " + pin + " = " + String(value));
  
  // Execute command
  bool success = executeCommand(pin, commandType, value);
  
  // Send acknowledgment
  sendCommandAck(commandId, success ? "acknowledged" : "failed");
}

// ================================
// COMMAND EXECUTION
// ================================
bool executeCommand(String pin, String commandType, int value) {
  try {
    if (pin == "D0") {
      // LED Control (Boolean: 0=OFF, 1=ON)
      digitalWrite(LED_PIN, value ? HIGH : LOW);
      Serial.println("💡 LED " + String(value ? "ON" : "OFF"));
      
    } else if (pin == "D1") {
      // Pump Control (Boolean: 0=OFF, 1=ON)
      digitalWrite(PUMP_PIN, value ? HIGH : LOW);
      Serial.println("💧 Pump " + String(value ? "ON" : "OFF"));
      
    } else if (pin == "D2") {
      // Servo Position (Range: 0-180 degrees)
      value = constrain(value, 0, 180);
      servoMotor.write(value);
      Serial.println("🔄 Servo position: " + String(value) + "°");
      
    } else if (pin == "D3") {
      // Buzzer Control (Boolean: 0=OFF, 1=ON)
      if (value) {
        // Beep pattern for ON
        for (int i = 0; i < 3; i++) {
          digitalWrite(BUZZER_PIN, HIGH);
          delay(100);
          digitalWrite(BUZZER_PIN, LOW);
          delay(100);
        }
      } else {
        digitalWrite(BUZZER_PIN, LOW);
      }
      Serial.println("🔊 Buzzer " + String(value ? "ON" : "OFF"));
      
    } else {
      Serial.println("❌ Unknown pin: " + pin);
      return false;
    }
    
    return true;
    
  } catch (...) {
    Serial.println("❌ Error executing command");
    return false;
  }
}

// ================================
// ACKNOWLEDGMENT & STATUS
// ================================
void sendCommandAck(int commandId, String status) {
  DynamicJsonDocument doc(256);
  doc["type"] = "command_ack";
  doc["device_id"] = deviceId;
  doc["command_id"] = commandId;
  doc["status"] = status;
  doc["timestamp"] = millis();
  
  String ackMessage;
  serializeJson(doc, ackMessage);
  
  String ackTopic = "ack/" + String(deviceId);
  mqttClient.publish(ackTopic.c_str(), ackMessage.c_str());
  
  Serial.println("✅ Sent acknowledgment: " + status);
}

void sendDeviceStatus() {
  DynamicJsonDocument doc(512);
  doc["type"] = "device_status";
  doc["device_id"] = deviceId;
  doc["status"] = "online";
  doc["wifi_rssi"] = WiFi.RSSI();
  doc["free_heap"] = ESP.getFreeHeap();
  doc["uptime"] = millis();
  
  // Current pin states
  JsonObject pins = doc.createNestedObject("pins");
  pins["D0"] = digitalRead(LED_PIN);
  pins["D1"] = digitalRead(PUMP_PIN);
  pins["D2"] = servoMotor.read();
  pins["D3"] = digitalRead(BUZZER_PIN);
  
  String statusMessage;
  serializeJson(doc, statusMessage);
  
  String statusTopic = "status/" + String(deviceId);
  mqttClient.publish(statusTopic.c_str(), statusMessage.c_str());
}

// ================================
// UTILITY FUNCTIONS
// ================================
void blinkStatus(int times) {
  for (int i = 0; i < times; i++) {
    digitalWrite(LED_PIN, HIGH);
    delay(200);
    digitalWrite(LED_PIN, LOW);
    delay(200);
  }
}

/*
  📋 TESTING CHECKLIST:
  
  1. Upload code ini ke ESP32
  2. Buka Serial Monitor (115200 baud)
  3. Pastikan WiFi dan MQTT connected
  4. Dari web dashboard, test:
     - Toggle switch untuk LED (D0)
     - Toggle switch untuk Pump (D1) 
     - Slider untuk Servo (D2, range 0-180)
     - Toggle switch untuk Buzzer (D3)
  5. Monitor Serial untuk melihat command execution
  6. Cek database untuk command acknowledgments
  
  🔧 HARDWARE CONNECTIONS:
  - LED: Pin D2 → LED → 220Ω → GND
  - Pump: Pin D4 → Relay → Pump
  - Servo: Pin D5 → Servo Signal (VCC=5V, GND=GND)
  - Buzzer: Pin D18 → Buzzer → GND
  
  📡 MQTT TOPICS:
  - Subscribe: command/{device_id}
  - Publish: ack/{device_id}
  - Publish: status/{device_id}
*/

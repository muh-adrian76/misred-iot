/*
  🌐 ESP32 Device Control - HTTP Version
  
  Contoh implementasi untuk menerima dan mengeksekusi perintah
  dari sistem Misred-IoT menggunakan protokol HTTP polling
  
  Metode ini lebih simple dan cocok untuk testing/prototyping
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <ESP32Servo.h>

// ================================
// CONFIGURATION
// ================================
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverURL = "http://your-server.com:3001";  // Ganti dengan server Anda
const int deviceId = 1;
const char* deviceSecret = "your-jwt-token-here";  // JWT token untuk authentication

// Polling interval (seconds)
const int pollInterval = 5;

// ================================
// HARDWARE PIN DEFINITIONS
// ================================
const int LED_PIN = 2;        // D0 - LED Control
const int PUMP_PIN = 4;       // D1 - Pump Control  
const int SERVO_PIN = 5;      // D2 - Servo Position
const int BUZZER_PIN = 18;    // D3 - Buzzer Control

// ================================
// OBJECTS
// ================================
Servo servoMotor;

// ================================
// SETUP
// ================================
void setup() {
  Serial.begin(115200);
  Serial.println("🚀 Starting ESP32 HTTP Device Control...");
  
  // Initialize hardware
  setupHardware();
  
  // Connect WiFi
  setupWiFi();
  
  Serial.println("✅ Device ready! Polling for commands...");
  blinkStatus(3);
}

void setupHardware() {
  pinMode(LED_PIN, OUTPUT);
  pinMode(PUMP_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  
  servoMotor.attach(SERVO_PIN);
  servoMotor.write(0);
  
  // Turn off all outputs
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

// ================================
// MAIN LOOP
// ================================
void loop() {
  // Check for pending commands
  checkPendingCommands();
  
  // Wait before next poll
  delay(pollInterval * 1000);
}

// ================================
// HTTP FUNCTIONS
// ================================
void checkPendingCommands() {
  HTTPClient http;
  
  // Build URL
  String url = String(serverURL) + "/device-command/pending/" + String(deviceId);
  http.begin(url);
  
  // Add headers
  http.addHeader("Authorization", "Bearer " + String(deviceSecret));
  http.addHeader("Content-Type", "application/json");
  
  // Make GET request
  int httpCode = http.GET();
  
  if (httpCode == 200) {
    String payload = http.getString();
    Serial.println("📨 Received: " + payload);
    
    // Parse JSON response
    DynamicJsonDocument doc(2048);
    DeserializationError error = deserializeJson(doc, payload);
    
    if (!error && doc["success"]) {
      JsonArray commands = doc["data"];
      
      if (commands.size() > 0) {
        Serial.println("🎯 Processing " + String(commands.size()) + " commands");
        
        for (JsonObject command : commands) {
          executeHttpCommand(command);
        }
      } else {
        Serial.println("📭 No pending commands");
      }
    }
  } else if (httpCode == 401) {
    Serial.println("❌ Authentication failed - check device secret");
  } else {
    Serial.println("❌ HTTP error: " + String(httpCode));
  }
  
  http.end();
}

void executeHttpCommand(JsonObject command) {
  int commandId = command["id"];
  String pin = command["pin"];
  String commandType = command["command_type"];
  int value = command["value"];
  
  Serial.println("⚡ Executing command " + String(commandId) + ": " + pin + " = " + String(value));
  
  // Execute the command
  bool success = executeCommand(pin, commandType, value);
  
  // Send acknowledgment
  sendHttpAck(commandId, success ? "acknowledged" : "failed");
}

bool executeCommand(String pin, String commandType, int value) {
  try {
    if (pin == "D0") {
      // LED Control
      digitalWrite(LED_PIN, value ? HIGH : LOW);
      Serial.println("💡 LED " + String(value ? "ON" : "OFF"));
      
    } else if (pin == "D1") {
      // Pump Control
      digitalWrite(PUMP_PIN, value ? HIGH : LOW);
      Serial.println("💧 Pump " + String(value ? "ON" : "OFF"));
      
    } else if (pin == "D2") {
      // Servo Position
      value = constrain(value, 0, 180);
      servoMotor.write(value);
      Serial.println("🔄 Servo: " + String(value) + "°");
      
    } else if (pin == "D3") {
      // Buzzer Control
      if (value) {
        // Beep pattern
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

void sendHttpAck(int commandId, String status) {
  HTTPClient http;
  
  // Build URL
  String url = String(serverURL) + "/device-command/status/" + String(commandId);
  http.begin(url);
  
  // Add headers
  http.addHeader("Authorization", "Bearer " + String(deviceSecret));
  http.addHeader("Content-Type", "application/json");
  
  // Build JSON payload
  DynamicJsonDocument doc(256);
  doc["status"] = status;
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  // Make PATCH request
  int httpCode = http.PATCH(jsonString);
  
  if (httpCode == 200) {
    Serial.println("✅ Acknowledgment sent: " + status);
  } else {
    Serial.println("❌ Failed to send ack: " + String(httpCode));
  }
  
  http.end();
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
  📋 TESTING STEPS:
  
  1. Edit konfigurasi WiFi dan server URL
  2. Dapatkan JWT token untuk device dari database
  3. Upload code ke ESP32
  4. Buka Serial Monitor (115200 baud)
  5. Pastikan WiFi connected dan polling started
  6. Dari web dashboard, kirim command:
     - Toggle LED switch
     - Move servo slider
     - Toggle pump switch
  7. Monitor Serial untuk melihat execution
  8. Cek database untuk command status updates
  
  🔧 KELEBIHAN HTTP:
  ✅ Simple implementation
  ✅ Easy debugging
  ✅ Works with firewalls
  
  ⚠️ KEKURANGAN HTTP:
  ❌ Delay karena polling (5 detik)
  ❌ Lebih boros bandwidth
  ❌ Tidak real-time
  
  💡 TIPS:
  - Kurangi pollInterval untuk response lebih cepat
  - Tambah error handling untuk network issues
  - Monitor free heap untuk memory leaks
*/

# 🎛️ Panduan Testing Fitur Pengendalian Perangkat IoT (Aktuator)

## 📋 Status Implementasi
✅ **IMPLEMENTASI LENGKAP** - Semua fitur pengendalian perangkat IoT telah berhasil diimplementasikan:

### Backend Components:
- ✅ `DeviceCommandService` - Service untuk mengelola perintah device
- ✅ `/device-command/*` API endpoints - REST API untuk command management
- ✅ Multi-protokol support: HTTP, MQTT, WebSocket
- ✅ Database schema dengan tabel `device_commands`
- ✅ Cleanup job untuk command timeout (10 detik)

### Frontend Components:
- ✅ `useDeviceControl` hook - Hook untuk kontrol device
- ✅ Switch widget dengan mode aktuator/sensor
- ✅ Slider widget dengan mode aktuator/sensor
- ✅ WebSocket integration untuk real-time commands
- ✅ Toast notifications untuk feedback

### Features:
- ✅ Deteksi otomatis aktuator vs sensor berdasarkan tipe datastream
- ✅ Switch toggle (boolean 0/1) untuk LED, relay, dll
- ✅ Slider control (range nilai) untuk motor, servo, dll
- ✅ Multi-protokol command sending
- ✅ Real-time status feedback
- ✅ Error handling dengan toast alerts

---

## 🧪 Cara Testing Fitur

### 1. Testing Database & Backend

#### A. Cek Database Schema
```sql
-- Cek tabel device_commands sudah ada
DESCRIBE device_commands;

-- Cek data aktuator yang sudah ada
SELECT * FROM datastreams WHERE type IN ('string', 'boolean');

-- Contoh datastreams aktuator yang sudah ada:
-- Device 1: D0 (LED), D1 (Pump), D2 (Fan), D3 (Valve)
```

#### B. Testing Backend API
```bash
# 1. Start backend server
cd back-end
npm run dev

# 2. Test health check
curl http://localhost:3001/health

# 3. Test create command (perlu login token)
curl -X POST http://localhost:3001/device-command/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "device_id": 1,
    "datastream_id": 1,
    "command_type": "toggle",
    "value": 1
  }'

# 4. Test get command history
curl http://localhost:3001/device-command/history/1

# 5. Test get pending commands
curl http://localhost:3001/device-command/pending/1
```

### 2. Testing Frontend

#### A. Start Frontend
```bash
cd front-end
npm run dev
# Buka http://localhost:3000
```

#### B. Testing Switch Widget
1. Login ke aplikasi
2. Buka dashboard yang memiliki switch widget
3. **Untuk Sensor (integer/double):**
   - Switch akan disabled
   - Label: "📊 Monitor"
   - Hanya menampilkan status dari data sensor
4. **Untuk Aktuator (string/boolean):**
   - Switch akan enabled
   - Label: "🎛️ Control"
   - Klik switch untuk toggle 0/1
   - Toast notification muncul saat berhasil/gagal

#### C. Testing Slider Widget
1. Buka dashboard yang memiliki slider widget
2. **Untuk Sensor:**
   - Slider disabled
   - Label: "📊 Monitor"
   - Menampilkan nilai real-time
3. **Untuk Aktuator:**
   - Slider enabled
   - Label: "🎛️ Control"
   - Geser slider, command dikirim saat drag selesai
   - Range sesuai min_value/max_value datastream

### 3. Testing Multi-Protocol

#### A. MQTT Testing
```bash
# Install MQTT client untuk testing
npm install -g mqtt

# Subscribe ke topic command untuk melihat perintah
mqtt sub -t "command/1" -h localhost -p 1883

# Saat Anda toggle switch di frontend, akan muncul:
{
  "command_id": 123,
  "device_id": 1,
  "datastream_id": 1,
  "pin": "D0",
  "command_type": "toggle",
  "value": 1,
  "timestamp": "2025-01-22T10:30:00.000Z"
}
```

#### B. WebSocket Testing
```javascript
// Test di browser console
const ws = new WebSocket('ws://localhost:3001/user-ws');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('WebSocket message:', data);
};

// Saat ada command, akan muncul:
// { type: "command_status", command_id: 123, status: "sent", ... }
```

---

## 🤖 Pemrograman Perangkat IoT

### Apakah Perlu Program Device?
**YA**, Anda perlu memprogram perangkat IoT untuk:
1. **Menerima perintah** dari server
2. **Mengeksekusi aksi** (nyalakan LED, putar motor, dll)
3. **Kirim acknowledgment** (opsional)

### Contoh Code untuk ESP32/Arduino

#### A. HTTP Polling Method
```cpp
// ESP32 HTTP Client Example
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* ssid = "YOUR_WIFI";
const char* password = "YOUR_PASSWORD";
const char* serverURL = "http://your-server.com:3001";
const int deviceId = 1;
const String deviceSecret = "your-device-secret";

// Pin definitions untuk aktuator
const int LED_PIN = 2;     // D0 - LED
const int PUMP_PIN = 4;    // D1 - Pump
const int FAN_PIN = 5;     // D2 - Fan
const int VALVE_PIN = 18;  // D3 - Valve

void setup() {
  Serial.begin(115200);
  
  // Setup pins
  pinMode(LED_PIN, OUTPUT);
  pinMode(PUMP_PIN, OUTPUT);
  pinMode(FAN_PIN, OUTPUT);
  pinMode(VALVE_PIN, OUTPUT);
  
  // Connect WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
  Serial.println("WiFi Connected!");
}

void loop() {
  checkPendingCommands();
  delay(5000); // Check every 5 seconds
}

void checkPendingCommands() {
  HTTPClient http;
  http.begin(serverURL + "/device-command/pending/" + String(deviceId));
  http.addHeader("Authorization", "Bearer " + deviceSecret);
  
  int httpCode = http.GET();
  if (httpCode == 200) {
    String payload = http.getString();
    DynamicJsonDocument doc(1024);
    deserializeJson(doc, payload);
    
    if (doc["success"] && doc["data"].size() > 0) {
      for (auto command : doc["data"].as<JsonArray>()) {
        executeCommand(command);
      }
    }
  }
  http.end();
}

void executeCommand(JsonObject command) {
  int commandId = command["id"];
  String pin = command["pin"];
  String commandType = command["command_type"];
  int value = command["value"];
  
  Serial.println("Executing command: " + pin + " = " + String(value));
  
  // Execute based on pin
  if (pin == "D0") {
    digitalWrite(LED_PIN, value);
  } else if (pin == "D1") {
    digitalWrite(PUMP_PIN, value);
  } else if (pin == "D2") {
    digitalWrite(FAN_PIN, value);
  } else if (pin == "D3") {
    digitalWrite(VALVE_PIN, value);
  }
  
  // Send acknowledgment
  acknowledgeCommand(commandId);
}

void acknowledgeCommand(int commandId) {
  HTTPClient http;
  http.begin(serverURL + "/device-command/status/" + String(commandId));
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", "Bearer " + deviceSecret);
  
  String payload = "{\"status\":\"acknowledged\"}";
  http.PATCH(payload);
  http.end();
}
```

#### B. MQTT Method (Recommended)
```cpp
// ESP32 MQTT Client Example
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

const char* mqtt_server = "your-server.com";
const int mqtt_port = 1883;
const int deviceId = 1;

WiFiClient espClient;
PubSubClient client(espClient);

void setup() {
  Serial.begin(115200);
  
  // Setup pins (same as above)
  
  // Connect WiFi & MQTT
  WiFi.begin(ssid, password);
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(onMqttMessage);
  
  connectMQTT();
}

void loop() {
  if (!client.connected()) {
    connectMQTT();
  }
  client.loop();
}

void connectMQTT() {
  while (!client.connected()) {
    if (client.connect(("device_" + String(deviceId)).c_str())) {
      // Subscribe to command topic
      client.subscribe(("command/" + String(deviceId)).c_str());
      Serial.println("MQTT Connected & Subscribed");
    } else {
      delay(5000);
    }
  }
}

void onMqttMessage(char* topic, byte* payload, unsigned int length) {
  String message = "";
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  
  Serial.println("Received command: " + message);
  
  DynamicJsonDocument doc(512);
  deserializeJson(doc, message);
  
  String pin = doc["pin"];
  int value = doc["value"];
  int commandId = doc["command_id"];
  
  // Execute command (same logic as HTTP method)
  executeCommand(pin, value);
  
  // Send acknowledgment via MQTT
  String ackTopic = "ack/" + String(deviceId);
  String ackMessage = "{\"command_id\":" + String(commandId) + ",\"status\":\"acknowledged\"}";
  client.publish(ackTopic.c_str(), ackMessage.c_str());
}
```

#### C. WebSocket Method
```cpp
// ESP32 WebSocket Client Example
#include <WiFi.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>

WebSocketsClient webSocket;

void setup() {
  Serial.begin(115200);
  
  // Setup pins & WiFi (same as above)
  
  // Connect WebSocket
  webSocket.begin("your-server.com", 3001, "/device-ws");
  webSocket.onEvent(onWebSocketEvent);
  webSocket.setReconnectInterval(5000);
}

void loop() {
  webSocket.loop();
}

void onWebSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_CONNECTED:
      Serial.println("WebSocket Connected");
      // Send device registration
      webSocket.sendTXT("{\"type\":\"register\",\"device_id\":" + String(deviceId) + "}");
      break;
      
    case WStype_TEXT:
      {
        String message = String((char*)payload);
        DynamicJsonDocument doc(512);
        deserializeJson(doc, message);
        
        if (doc["type"] == "device_command") {
          String pin = doc["pin"];
          int value = doc["value"];
          int commandId = doc["command_id"];
          
          executeCommand(pin, value);
          
          // Send acknowledgment
          String ack = "{\"type\":\"command_ack\",\"command_id\":" + String(commandId) + ",\"status\":\"acknowledged\"}";
          webSocket.sendTXT(ack);
        }
      }
      break;
      
    default:
      break;
  }
}
```

---

## 🎯 Skenario Testing Lengkap

### 1. End-to-End Testing
1. **Upload code ke ESP32** dengan salah satu metode di atas
2. **Pastikan device connect** ke WiFi dan server
3. **Login ke web dashboard**
4. **Test Switch Widget:**
   - Toggle switch untuk LED (D0)
   - Lihat LED di ESP32 menyala/mati
   - Cek toast notification di web
5. **Test Slider Widget:**
   - Geser slider untuk Fan (D2) dengan PWM
   - Lihat kecepatan fan berubah
   - Cek nilai di database

### 2. Protocol Testing
Test masing-masing protokol:
- **HTTP:** Device polling setiap 5 detik
- **MQTT:** Real-time command via MQTT broker
- **WebSocket:** Instant bidirectional communication

### 3. Error Handling Testing
- **Disconnect device** → command timeout after 10 seconds
- **Invalid command** → error toast di frontend
- **Network error** → retry mechanism

---

## 📊 Monitoring & Debugging

### 1. Backend Logs
```bash
# Monitor server logs
cd back-end
npm run dev

# Will show:
# 📤 Sending command to device 1 via mqtt: {...}
# ✅ MQTT command sent to device 1 on topic command/1
# 🧹 Marked 2 old device commands as failed
```

### 2. Database Monitoring
```sql
-- Monitor commands
SELECT 
  dc.*,
  ds.pin,
  ds.description as datastream_name,
  d.description as device_name
FROM device_commands dc
JOIN datastreams ds ON dc.datastream_id = ds.id  
JOIN devices d ON dc.device_id = d.id
ORDER BY dc.sent_at DESC
LIMIT 10;

-- Check command statistics
SELECT status, COUNT(*) as count 
FROM device_commands 
GROUP BY status;
```

### 3. Frontend Debug
```javascript
// Di browser console, monitor WebSocket
window.addEventListener('beforeunload', () => {
  console.log('Command status:', useDeviceControl().commandStatus);
});
```

---

## 🎉 Kesimpulan

**Fitur pengendalian perangkat IoT sudah LENGKAP dan siap digunakan!**

### Yang Sudah Tersedia:
✅ Backend API lengkap dengan multi-protokol  
✅ Frontend widgets dengan auto-detection  
✅ Real-time communication  
✅ Error handling & timeout  
✅ Database logging & cleanup  

### Yang Perlu Anda Lakukan:
1. **Program ESP32/Arduino** dengan salah satu metode di atas
2. **Test end-to-end** dari web dashboard ke device fisik
3. **Monitor logs** untuk debugging
4. **Enjoy controlling your IoT devices!** 🚀

### Rekomendasi:
- Gunakan **MQTT** untuk production (real-time & efficient)
- Gunakan **HTTP** untuk testing/debugging (simple polling)
- Gunakan **WebSocket** untuk advanced real-time features

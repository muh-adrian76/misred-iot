#include <WiFi.h> // Untuk ESP8266: #include <ESP8266WiFi.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>

const char* ssid = "K.WATT -2.4G";
const char* password = "KentungMusthofa";
const char* ws_host = "192.168.18.121";
const uint16_t ws_port = 7601;         
const char* ws_path = "/ws/connect";

const char* device_secret = "0df2b4a05b798a451dd2c0a9ee791c3ed6add2bd2e8f42f5a798ed518a870605"; 
String device_id = "";

bool isRegistered = false;

WebSocketsClient webSocket;
unsigned long lastHeartbeat = 0;
unsigned long lastSensorSend = 0;

void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  if (type == WStype_TEXT) {
    Serial.printf("📩 Received: %s\n", payload);

    StaticJsonDocument<256> doc;
    DeserializationError err = deserializeJson(doc, payload, length);
    if (err) {
      Serial.println("⚠️ Failed to parse JSON");
      return;
    }

    String msgType = doc["type"] | "";

    if (msgType == "hello") {
      StaticJsonDocument<128> reg;
      reg["type"] = "register";
      reg["secret"] = device_secret;
      String out;
      serializeJson(reg, out);
      Serial.println("📤 Sending register...");
      webSocket.sendTXT(out);
    }

    else if (msgType == "registered") {
      int id = doc["device_id"] | -1;
      if (id != -1) {
        device_id = String(id);
        Serial.print("✅ Registered with device_id: ");
        Serial.println(device_id);
        isRegistered = true;
      } else {
        Serial.println("⚠️ 'device_id' not found in JSON response");
      }
    }
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(2, OUTPUT); // LED di pin 2

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected");

  webSocket.begin(ws_host, ws_port, ws_path);
  webSocket.onEvent(webSocketEvent);
  webSocket.setReconnectInterval(5000); // Auto reconnect

  lastHeartbeat = millis() - 10000;
  lastSensorSend = millis() - 5000;
}

void loop() {
  webSocket.loop();

  unsigned long now = millis();

  if (isRegistered) {
    if (now - lastHeartbeat > 10000) {
      lastHeartbeat = now;
      Serial.println("📤 Sending heartbeat...");

      StaticJsonDocument<128> doc;
      doc["type"] = "status_update";
      doc["device_id"] = device_id;
      doc["status"] = "online";
      String out;
      serializeJson(doc, out);
      webSocket.sendTXT(out);
    }

//    if (now - lastSensorSend > 5000) {
//      lastSensorSend = now;
//      Serial.println("📤 Sending sensor data...");
//
//      StaticJsonDocument<128> doc;
//      doc["type"] = "sensor_update";
//      doc["device_id"] = device_id;
//      JsonObject sensor = doc.createNestedObject("sensor");
//      sensor["temperature"] = random(25, 35);
//      sensor["humidity"] = random(40, 60);
//      String out;
//      serializeJson(doc, out);
//      webSocket.sendTXT(out);
//    }
  }
}

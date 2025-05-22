#include <ArduinoJson.h>
#include <HTTPClient.h>
#include <WiFi.h>
#include <PubSubClient.h>


// const char* ssid = "yoo_rio";
// const char* password = "yooooooo";
const char* ssid = "K.WATT -2.4G";
const char* password = "KentungMusthofa";
const char* mqtt_server = "192.168.18.121";
const String serverURL = "http://192.168.18.121:7600";
String accessToken = "";

const String email = "test@user.com";
const char* passwordESP = "12345678";

WiFiClient espClient;
PubSubClient client(espClient);

int iterationCount = 0;

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }

  Serial.println("Connected to WiFi");
  Serial.print("ESP32 IP Address: ");
  Serial.println(WiFi.localIP());

  if (accessToken != "") {
    client.setServer(mqtt_server, 1883);

    while (!client.connected()) {
      Serial.println("Connecting to MQTT...");
      if (client.connect("ESP32Client", "ESP32", accessToken.c_str())) {
        Serial.println("Connected to MQTT Broker");
      } else {
        Serial.print("Failed to connect. Status=");
        Serial.println(client.state());
        delay(2000);
      }
    }  
  } else {
    Serial.println("Access token kosong. Mencoba request ke server...");
    login();
  }
  
}

void loop() {
  while (iterationCount < 5) {
    String message = "{\"device_id\":1, \"ph\":7.0, \"cod\":12.5, \"tss\":45, \"nh3n\":0.8, \"flow\":120}";
    client.publish("device/data", message.c_str());
    Serial.println("Berhasil mengirim data sensor.");
    iterationCount++;
    delay(5000);  // Mengirim data setiap 5 detik
  }
}

void login() {
  HTTPClient http;
  http.begin(serverURL + "/user/login");
  http.addHeader("Content-Type", "application/json");

  String jsonData = "{\"email\":\"" + email + "\", \"password\":\"" + passwordESP + "\"}";

  int httpResponseCode = http.POST(jsonData);

  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("Login response: " + response);

    DynamicJsonDocument doc(1024);
    deserializeJson(doc, response);

    if (doc.containsKey("accessToken")) {
      accessToken = doc["accessToken"].as<String>(); // Simpan access token
      Serial.println("Access token diterima: " + accessToken);
    } else {
      Serial.println("Access token tidak ada.");
    }
  } else {
    Serial.print("Login gagal. Code: ");
    Serial.println(httpResponseCode);
  }

  http.end();
}

#include <ArduinoJson.h>
#include <WiFi.h>
#include <HTTPClient.h>
//
//const char* ssid = "yoo_rio";
//const char* password = "yooooooo";
const char* ssid = "K.WATT -2.4G";
const char* password = "KentungMusthofa";
const String serverURL = "http://192.168.18.121:7600";
String accessToken = "";
int iterationCount = 0;

const String email = "test@user.com";
const char* passwordESP = "12345678";

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
  Serial.println("Connected to WiFi");
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    if (accessToken != "") {
      while (iterationCount < 5) {
        // Gunakan access token untuk permintaan POST berikutnya
          HTTPClient http;
          http.begin(serverURL + "/payload");
          http.addHeader("Content-Type", "application/json");
    
          String bearerHeader = "Bearer " + accessToken;
          http.addHeader("Authorization", bearerHeader);
    
          String jsonData = "{\"device_id\":1, \"ph\":7.0, \"cod\":12.5, \"tss\":45, \"nh3n\":0.8, \"flow\":120}";
          int httpResponseCode = http.POST(jsonData);
  S
          if (httpResponseCode > 0) {
            String response = http.getString();
            Serial.println("Server response: " + response);
          } else {
            Serial.print("Error sending POST request. Code: ");
            Serial.println(httpResponseCode);
          }
    
          http.end();
          iterationCount++;
          delay(5000);
        } 
      }
      else {
        Serial.println("Access token kosong. Mencoba request ke server...");
        login();
    }
  } else {
    Serial.println("WiFi Disconnected. Reconnecting...");
    WiFi.begin(ssid, password);
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
  delay(5000);
}

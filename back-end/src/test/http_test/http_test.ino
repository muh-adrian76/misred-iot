#include <WiFi.h>
#include <HTTPClient.h>

const char* ssid = "yoo_rio";
const char* password = "yooooooo";
const char* serverURL = "http://192.168.16.3:7600/payload";
const char* bearerToken = "your_jwt_token_here";

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
    HTTPClient http;
    http.begin(serverURL);
    http.addHeader("Content-Type", "application/json");

    String bearerHeader = "Bearer " + String(bearerToken);
    http.addHeader("Authorization", bearerHeader);

    String jsonData = "{\"device_id\":1, \"ph\":7.0, \"cod\":12.5, \"tss\":45, \"nh3n\":0.8, \"flow\":120}";
    int httpResponseCode = http.POST(jsonData);

    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println("Server response: " + response);
    } else {
      Serial.print("Error sending POST request. Code: ");
      Serial.println(httpResponseCode);
    }

    http.end();
  } else {
    Serial.println("WiFi Disconnected. Reconnecting...");
    WiFi.begin(ssid, password);
  }

  delay(5000);
}

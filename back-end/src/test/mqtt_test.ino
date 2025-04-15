#include <WiFi.h>
#include <PubSubClient.h>

const char* ssid = "yoo_rio";
const char* password = "yooooooo";
const char* serverURL = "http://192.168.192.168:7600/sensor";

WiFiClient espClient;
PubSubClient client(espClient);

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }

  Serial.println("Connected to WiFi");

  client.setServer(serverURL, 1883);

  while (!client.connected()) {
    Serial.println("Connecting to MQTT...");
    if (client.connect("ESP32Client")) {
      Serial.println("Connected to MQTT Broker");
    } else {
      Serial.print("Failed to connect. Status=");
      Serial.println(client.state());
      delay(2000);
    }
  }
}

void loop() {
  String message = "{\"device_id\":\"ESP32\", \"ph\":7.0, \"cod\":12.5, \"tss\":45, \"nh3_n\":0.8, \"flow\":120}";
  client.publish("device/data", message.c_str());
  delay(5000);  // Mengirim data setiap 5 detik
}

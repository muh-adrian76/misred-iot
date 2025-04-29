#include <WiFi.h>
#include <PubSubClient.h>

// const char* ssid = "yoo_rio";
// const char* password = "yooooooo";
const char* ssid = "K.WATT -2.4G";
const char* password = "KentungMusthofa";
const char* mqtt_server = "192.168.18.121";
// const char* serverURL = "http://192.168.18.121:7600/payload";

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

  client.setServer(mqtt_server, 1883);

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
  while (iterationCount < 5) {
  String message = "{\"device_id\":1, \"ph\":7.0, \"cod\":12.5, \"tss\":45, \"nh3n\":0.8, \"flow\":120}";
  client.publish("device/data", message.c_str());
  Serial.println("Berhasil mengirim data sensor.");
  iterationCount++;
  delay(5000);  // Mengirim data setiap 5 detik
  }
}

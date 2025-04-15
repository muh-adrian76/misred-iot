#include <SPI.h>
#include <LoRa.h>

#define SCK     5
#define MISO    19
#define MOSI    27
#define SS      18
#define RST     14
#define DI0     26

void setup() {
  Serial.begin(115200);
  LoRa.setPins(SS, RST, DI0);

  if (!LoRa.begin(915E6)) { // Frekuensi 915 MHz (sesuaikan dengan regional)
    Serial.println("Starting LoRa failed!");
    while (1);
  }

  Serial.println("LoRa initialization successful");
}

void loop() {
  String message = "{\"device_id\":\"ESP32\", \"ph\":7.0, \"cod\":12.5, \"tss\":45, \"nh3_n\":0.8, \"flow\":120}";
  
  LoRa.beginPacket();
  LoRa.print(message);
  LoRa.endPacket();
  
  Serial.println("Data sent via LoRaWAN: " + message);

  delay(5000);
}

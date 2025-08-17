# MiSREd IoT Arduino Examples

[![Visit MiSREd IoT](https://img.shields.io/badge/MiSREd%20IoT-Visit%20Platform-blue?logo=internet-explorer)](https://misred-iot.com)

Contoh penggunaan Arduino ESP32 untuk mengirim data sensor ke platform **[MiSREd IoT](https://misred-iot.com)**, menggunakan tiga jenis protokol:

- 🔗 HTTP
- 🔒 HTTPS
- 📡 MQTT

Repositori ini bertujuan membantu pengguna MiSREd IoT dalam memahami integrasi data dari ESP32 ke platform melalui metode yang aman dan efisien.

---

## 📁 Contoh Program

| Contoh        | Deskripsi                                                                 |
|---------------|---------------------------------------------------------------------------|
| `HTTP_Test`   | Mengirim data sensor menggunakan koneksi HTTP biasa                       |
| `HTTPS_Test`  | Mengirim data sensor secara aman melalui HTTPS dengan sertifikat TLS     |
| `MQTT_Test`   | Mengirim data menggunakan protokol MQTT Asinkron untuk komunikasi realtime|

---

## ⚙️ Persyaratan

- **Board**: ESP32
- **Library Arduino** (instal via Library Manager atau manual):
  - `WiFi.h`
  - `ArduinoJson.h`
  - `AsyncMqttClient.h` atau download di sini *https://github.com/marvinroger/async-mqtt-client/*
  - `NTPClient.h`
  - `CustomJWT.h` 

---

## 🔧 Cara Menggunakan

1. Clone repositori ini:
   ```bash
   git clone https://github.com/username/misred-iot-arduino-examples.git
   ```

2. Buka contoh program yang ingin digunakan di Arduino IDE
3. Ikuti **Langkah Konfigurasi Penting** di bawah ini
4. Upload ke board ESP32

---

## ⚠️ Langkah Konfigurasi Penting

Sebelum menggunakan contoh program, pastikan untuk melakukan konfigurasi berikut di platform **MiSREd IoT**:

### 🔧 1. Konfigurasi Device
Pada halaman **Devices** di platform MiSREd IoT:
- Catat nilai **UID (Device ID)** perangkat Anda
- Catat nilai **JWT Secret** perangkat Anda
- Untuk MQTT: Catat nilai **Topik MQTT** perangkat Anda

```cpp
// Sesuaikan dengan nilai dari halaman Devices
#define DEVICE_ID "1"  // Ganti dengan UID perangkat Anda
#define JWT_SECRET "23050c3dcef3c669690aab113a21c3b2"  // Ganti dengan JWT Secret Anda
const char* mqtt_topic = "device/data";  // Untuk MQTT: Ganti dengan topik perangkat Anda
```

### 📊 2. Konfigurasi Datastreams
Pada halaman **Datastreams** di platform MiSREd IoT:
- Tambahkan Virtual Pin sesuai dengan sensor yang digunakan
- Pastikan mapping Virtual Pin sesuai dengan kode program

```cpp
// Sesuaikan dengan Virtual Pin yang ditambahkan pada halaman Datastreams
StaticJsonDocument<256> sensorDoc;
sensorDoc["V0"] = phValue;        // pH sensor pada Virtual Pin V0
sensorDoc["V1"] = flowValue;      // Flow sensor pada Virtual Pin V1  
sensorDoc["V2"] = codValue;       // COD sensor pada Virtual Pin V2
sensorDoc["V3"] = tempValue;      // Temperature sensor pada Virtual Pin V3
sensorDoc["V4"] = nh3nValue;      // NH3N sensor pada Virtual Pin V4
sensorDoc["V5"] = ntuValue;       // NTU sensor pada Virtual Pin V5
```

### 🌐 3. Konfigurasi Jaringan
Sesuaikan konfigurasi WiFi dan server:

```cpp
// WiFi configuration
const char* ssid = "NAMA_WIFI_ANDA";
const char* password = "PASSWORD_WIFI_ANDA";

// Server configuration
const char* server_url = "https://api.misred-iot.com";  // Server produksi
// const char* server_url = "http://localhost:7601";   // Server lokal untuk development
```

### 📋 Checklist Sebelum Upload
- [ ] ✅ Device ID dan JWT Secret sudah disesuaikan
- [ ] ✅ Virtual Pin di Datastreams sudah dikonfigurasi
- [ ] ✅ Kredensial WiFi sudah benar
- [ ] ✅ URL server sudah sesuai (produksi/development)
- [ ] ✅ Untuk MQTT: Topik MQTT sudah benar
- [ ] ✅ Library yang diperlukan sudah terinstal

---

## 🌐 Tentang MiSREd IoT

MiSREd IoT adalah platform monitoring IoT berbasis web yang memungkinkan pengguna memantau data dari berbagai perangkat secara real-time. Platform ini mendukung komunikasi melalui HTTP/HTTPS/MQTT dan menggunakan JWT untuk autentikasi data.

---

## 🧩 Kontribusi & Masukan

Silakan ajukan Issue untuk melaporkan masalah atau meminta fitur tambahan. Kontribusi juga sangat diterima!
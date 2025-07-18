# 🧪 SIMPLE Testing Setup - ESP32 dengan CustomJWT Library!

## 🎯 **Testing Goal:**
**ESP32 menggunakan CustomJWT → Server menyimpan ke database MySQL → ESP32 menerima response "Berhasil menyimpan data sensor ke VPS"**

**MENGGUNAKAN LIBRARY CustomJWT UNTUK PROPER JWT!** ✅

## 📚 **Persiapan Library ESP32:**

### **Install CustomJWT Library:**
1. Buka Arduino IDE
2. Go to **Sketch → Include Library → Manage Libraries**
3. Search "**CustomJWT**" 
4. Install by **@debsahu**

### **Include Library:**
```cpp
#include <CustomJWT.h>
```

## 🚀 **Quick Setup:**

### Step 1: Database Setup (SIMPLE)
```bash
# Import database dengan semua yang dibutuhkan sudah ada
mysql -u root -p your_database < back-end/db.sql
```

### Step 2: Start Server
```bash
cd back-end
bun run dev
```

### Step 3: Test JWT Format Understanding
```bash
# Test JWT format yang akan dikirim ESP32
bun run src/assets/jwt_decoder_test.ts
```

### Step 4: ESP32 Testing
- **HTTP:** Upload `http_test.ino` dengan CustomJWT → Monitor Serial
- **MQTT:** Upload `mqtt_test.ino` dengan CustomJWT → Monitor Serial

## 📊 **Expected Results dengan CustomJWT:**

### ✅ **ESP32 HTTP (http_test.ino):**
```
🧪 SIMPLE HTTP Sensor Data Test with CustomJWT
📦 Sensor payload: {"A0":7.12,"A1":35.6,"A2":41.2,"A3":27.9,"A4":2.3,"A5":7.8,"timestamp":12345,"device_id":"1"}
🔐 Creating JWT token with CustomJWT...
� JWT Payload: {"encryptedData":"{\"A0\":7.12,\"A1\":35.6,\"A2\":41.2}","deviceId":"1","iat":1234567,"exp":1234570}
✅ JWT Token created successfully
🔑 Token length: 284
📤 Sending HTTP request to server...
✅ Server Response (201): {"message":"Berhasil menambah data sensor","id":123,"device_id":"1"}
🎉 SUCCESS: Data saved to database!
```

### ✅ **ESP32 MQTT (mqtt_test.ino):**
```
� SIMPLE MQTT Sensor Data Test with CustomJWT
📦 Sensor payload: {"A0":6.89,"A1":41.2,"A2":38.7,"A3":29.1,"A4":1.9,"A5":14.2,"timestamp":12345,"device_id":"2"}
� Creating MQTT JWT token with CustomJWT...
📦 JWT Payload: {"encryptedData":"{\"A0\":6.89,\"A1\":41.2}","deviceId":"2","iat":1234567,"exp":1234570}
✅ JWT Token created successfully
🔑 Token length: 287
�📤 Publishing to MQTT topic: device/data
✅ MQTT published successfully
```

### ✅ **Backend Server Logs:**
```
📦 CustomJWT payload parsed successfully
📊 Sensor data saved: Pin A0 → Value 7.12 pH
📊 Sensor data saved: Pin A1 → Value 35.6 L/min
📊 Sensor data saved: Pin A2 → Value 41.2 mg/L
✅ Parsed 6 sensor readings
```

## 🔐 **CustomJWT Implementation:**

### **ESP32 Code Structure:**
```cpp
// JWT setup
char device_secret[] = "your_device_secret";
CustomJWT jwt(device_secret, 512); // 512 bytes payload

void setup() {
  // Initialize JWT memory
  jwt.allocateJWTMemory();
}

// Create JWT
String createJWTWithCustomJWT(String data) {
  StaticJsonDocument<256> payloadDoc;
  payloadDoc["encryptedData"] = data; // Direct sensor data
  payloadDoc["deviceId"] = device_id;
  payloadDoc["iat"] = millis() / 1000;
  payloadDoc["exp"] = (millis() / 1000) + 3600;
  
  String payloadStr;
  serializeJson(payloadDoc, payloadStr);
  
  bool success = jwt.encodeJWT((char*)payloadStr.c_str());
  if (success) {
    return String(jwt.out);
  }
  return "";
}
```

### **Backend Processing:**
```typescript
// PayloadService automatically handles CustomJWT format
const decoded = jwt.verify(token, secret, { algorithms: ["HS256"] });

// Parse sensor data directly (no AES decryption needed)
const sensorData = JSON.parse(decoded.encryptedData);
// sensorData contains: {A0: 7.12, A1: 35.6, A2: 41.2, ...}
```

## 🎯 **Testing Focus:**

### ✅ **Yang Ditest:**
- **CustomJWT Library:** Proper HMAC-SHA256 JWT creation
- **ESP32 → Server:** Authenticated communication  
- **JWT Verification:** Backend validates signature dengan device secret
- **Data Parsing:** Direct JSON parsing tanpa AES decryption
- **Database Storage:** Sensor data tersimpan dengan benar
- **Response:** "Berhasil menyimpan data sensor ke VPS"

### 🔐 **Security Features:**
- **HMAC-SHA256:** Proper JWT signature
- **Device Secret:** 64-char hex secret per device
- **Token Expiry:** 1 hour validity
- **Signature Verification:** Backend validates setiap request

## 📱 **Real ESP32 Usage:**

### **Required Libraries:**
```cpp
#include <WiFi.h>
#include <HTTPClient.h>      // for HTTP
#include <PubSubClient.h>    // for MQTT  
#include <ArduinoJson.h>
#include <CustomJWT.h>       // ⭐ NEW: Proper JWT
```

### **Device Secrets:**
- Device 1 (HTTP): `0df2b4a05b798a451dd2c0a9ee791c3ed6add2bd2e8f42f5a798ed518a870605`
- Device 2 (MQTT): `1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef`

### **Expected JWT Format:**
```json
{
  "header": {"alg":"HS256","typ":"JWT"},
  "payload": {
    "encryptedData": "{\"A0\":7.12,\"A1\":35.6,\"A2\":41.2,\"A3\":27.9,\"A4\":2.3,\"A5\":7.8,\"timestamp\":12345,\"device_id\":\"1\"}",
    "deviceId": "1", 
    "iat": 1234567,
    "exp": 1234570
  }
}
```

## ✅ **Success Criteria:**

1. **ESP32 Libraries:** CustomJWT library installed dan berfungsi
2. **JWT Creation:** Token ~250-300 characters dengan proper signature
3. **HTTP Test:** 10/10 requests berhasil dengan CustomJWT
4. **MQTT Test:** 10/10 messages published dengan CustomJWT
5. **Backend:** JWT verification sukses, data tersimpan
6. **Database:** Sensor data di tabel `payloads` dengan proper parsing

**CUSTOMJWT = PROPER SECURITY + SIMPLE!** 🎉

*ESP32 dengan proper JWT → Server validates & saves to database → Success response!*

Folder `src` berisi seluruh kode sumber backend untuk aplikasi MiSREd IoT. Struktur ini diorganisir dengan pola **arsitektur modular** yang memisahkan kepedulian menjadi lapisan-lapisan yang jelas: rute API, layanan logika bisnis, utilitas, dan pengujian.

## 📁 Gambaran Besar Struktur Kode Sumber

```
src/
├── server.ts                        # 🚀 Titik masuk aplikasi - Server utama
├── api/                            # 🌐 Rute API - Endpoint REST API
├── services/                       # 💼 Logika Bisnis - Lapisan layanan
├── lib/                           # 🔧 Utilitas - Fungsi pembantu
├── assets/                        # 📁 Berkas Statis - Logo, firmware
└── test/                          # 🧪 Pengujian - Alat pengembangan
```

## 🚀 Titik Masuk (`server.ts`)

Berkas utama yang menginisialisasi dan menjalankan server Elysia:

**Fungsi Utama:**
- Konfigurasi server Elysia dengan port 7601
- Pengaturan middleware (CORS, header keamanan, pembatasan laju)
- Pendaftaran semua rute API dari folder `api/`
- Konfigurasi WebSocket untuk komunikasi waktu nyata
- Pengaturan koneksi basis data dan broker MQTT
- Penanganan kesalahan dan pencatatan global

**Teknologi yang Diinisialisasi:**
- Kerangka kerja web Elysia
- Koneksi basis data MySQL
- Klien MQTT untuk komunikasi IoT
- Server WebSocket untuk pembaruan waktu nyata
- Middleware autentikasi JWT
- Layanan WhatsApp Web.js

## 🌐 Rute API (folder `api/`)

Folder `api` berisi semua endpoint REST API yang diorganisir berdasarkan **modul fitur**. Setiap subfolder memiliki 2 berkas utama:

### Struktur Modul API

```
api/
├── health.ts                       # Endpoint pemeriksaan kesehatan
├── admin/                          # 👑 API manajemen admin
├── alarm/                          # 🚨 API sistem alarm
├── auth/                           # 🔐 API autentikasi
├── dashboard/                      # 📊 API manajemen dasbor
├── datastream/                     # 📡 API konfigurasi sensor
├── device/                         # 🔌 Device management APIs
├── device-command/                 # 📤 Device command APIs
├── notification/                   # 📬 Notification APIs
├── otaa/                          # 📡 OTA firmware update APIs
├── payload/                       # 📈 IoT data ingestion APIs
├── user/                          # 👤 User management APIs
├── widget/                        # 📋 Dashboard widget APIs
└── ws/                            # ⚡ WebSocket real-time APIs
```

### Penjelasan Detail API Modules

#### 🔐 **Authentication APIs (`auth/`)**
**Fungsi:** Mengelola autentikasi dan otorisasi pengguna
- `POST /auth/login` - Login dengan email/password
- `POST /auth/register` - Registrasi user baru
- `POST /auth/refresh` - Refresh JWT token
- `GET /auth/google` - Login dengan Google OAuth
- `POST /auth/logout` - Logout dan invalidate token
- `GET /auth/profile` - Get profile user yang login
- `PUT /auth/profile` - Update profile user

#### 🔌 **Device Management APIs (`device/`)**
**Fungsi:** CRUD dan monitoring perangkat IoT
- `GET /devices` - List semua device user
- `POST /devices` - Tambah device IoT baru
- `GET /devices/:id` - Detail device berdasarkan ID
- `PUT /devices/:id` - Update konfigurasi device
- `DELETE /devices/:id` - Hapus device dari sistem
- `GET /devices/:id/status` - Status real-time device (online/offline)
- `POST /devices/:id/control` - Kirim command ke device

#### 📡 **Datastream Configuration APIs (`datastream/`)**
**Fungsi:** Konfigurasi sensor dan aktuator pada device
- `GET /datastreams` - List datastream untuk device
- `POST /datastreams` - Tambah sensor/aktuator baru
- `PUT /datastreams/:id` - Update konfigurasi sensor
- `DELETE /datastreams/:id` - Hapus sensor dari device
- `GET /datastreams/:id/data` - Data historis sensor

#### 📈 **Payload Data APIs (`payload/`)**
**Fungsi:** Ingestion dan retrieval data sensor real-time
- `GET /payloads` - Query data sensor dengan filter
- `POST /payloads` - Insert data dari IoT device (MQTT)
- `GET /payloads/export` - Export data ke CSV/PDF
- `GET /payloads/realtime` - Stream data real-time
- `DELETE /payloads/cleanup` - Cleanup data lama

#### 🚨 **Alarm System APIs (`alarm/`)**
**Fungsi:** Sistem peringatan berdasarkan kondisi sensor
- `GET /alarms` - List alarm rules user
- `POST /alarms` - Buat alarm rule baru
- `PUT /alarms/:id` - Update kondisi alarm
- `DELETE /alarms/:id` - Hapus alarm rule
- `GET /alarms/history` - History alarm triggered
- `POST /alarms/test` - Test alarm condition

#### 📊 **Dashboard Management APIs (`dashboard/`)**
**Fungsi:** Konfigurasi layout dan widget dashboard
- `GET /dashboards` - List dashboard user
- `POST /dashboards` - Buat dashboard baru
- `PUT /dashboards/:id` - Update layout dashboard
- `DELETE /dashboards/:id` - Hapus dashboard
- `GET /dashboards/:id/widgets` - List widget di dashboard

#### 📋 **Widget Management APIs (`widget/`)**
**Fungsi:** CRUD widget untuk visualisasi data
- `GET /widgets` - List widget user
- `POST /widgets` - Buat widget baru (chart/gauge/table)
- `PUT /widgets/:id` - Update konfigurasi widget
- `DELETE /widgets/:id` - Hapus widget
- `GET /widgets/:id/data` - Data untuk render widget

#### 📬 **Notification APIs (`notification/`)**
**Fungsi:** Multi-channel notification system
- `GET /notifications` - History notifikasi user
- `POST /notifications/send` - Kirim notifikasi manual
- `PUT /notifications/settings` - Update preferensi notifikasi
- `POST /notifications/test/email` - Test email notification
- `POST /notifications/test/whatsapp` - Test WhatsApp notification

#### 👤 **User Management APIs (`user/`)**
**Fungsi:** Manajemen profil dan pengaturan user
- `GET /users/profile` - Profile user yang login
- `PUT /users/profile` - Update profile user
- `POST /users/change-password` - Ganti password
- `GET /users/preferences` - Pengaturan user
- `PUT /users/preferences` - Update pengaturan

#### 📤 **Device Command APIs (`device-command/`)**
**Fungsi:** Queue dan delivery command ke IoT device
- `POST /device-commands` - Kirim command ke device
- `GET /device-commands/:deviceId` - History command device
- `GET /device-commands/:id/status` - Status delivery command
- `DELETE /device-commands/:id` - Cancel command

#### 📡 **OTA Update APIs (`otaa/`)**
**Fungsi:** Over-the-air firmware update management
- `POST /otaa/upload` - Upload firmware file
- `GET /otaa/versions` - List firmware versions
- `POST /otaa/deploy/:deviceId` - Deploy firmware ke device
- `GET /otaa/status/:deviceId` - Status OTA update
- `DELETE /otaa/versions/:id` - Hapus firmware version

#### 👑 **Admin APIs (`admin/`)**
**Fungsi:** Administrative functions (admin-only)
- `GET /admin/users` - List semua user sistem
- `PUT /admin/users/:id/role` - Update role user
- `GET /admin/statistics` - Statistik sistem global
- `POST /admin/maintenance` - Mode maintenance
- `GET /admin/logs` - System logs

#### ⚡ **WebSocket APIs (`ws/`)**
**Fungsi:** Real-time communication dengan client
- **device-ws.ts**: WebSocket untuk device status real-time
- **user-ws.ts**: WebSocket untuk user-specific updates

## 💼 Business Logic Services (`services/` folder)

Layer **service** berisi business logic yang digunakan oleh API routes. Setiap service bertanggung jawab untuk satu domain tertentu:

### Core Services

#### 🔐 **AuthService.ts**
**Fungsi:** Business logic autentikasi dan otorisasi
- Password hashing dengan bcrypt
- JWT token generation dan validation
- Google OAuth integration
- Session management
- Role-based access control

#### 🔌 **DeviceService.ts**
**Fungsi:** Manajemen lifecycle perangkat IoT
- Device registration dan validation
- Device key generation (unique identifier)
- Status monitoring (online/offline detection)
- Device metadata management
- Connection monitoring via MQTT

#### 📡 **DatastreamService.ts**
**Fungsi:** Konfigurasi sensor dan aktuator
- Sensor type validation (integer, double, boolean, string)
- Unit of measurement management
- Data type conversion dan validation
- Sensor calibration settings

#### 📈 **PayloadService.ts**
**Fungsi:** Processing data sensor real-time
- Data ingestion dari MQTT broker
- Data validation dan sanitization
- Time-series data storage optimization
- Data aggregation untuk dashboard
- Real-time broadcasting via WebSocket

#### 🚨 **AlarmService.ts**
**Fungsi:** Sistem alarm dan conditional monitoring
- Condition evaluation (>, <, =, !=, >=, <=)
- Threshold monitoring real-time
- Alarm triggering logic
- Notification dispatch ke multiple channels
- Alarm history tracking

#### 📬 **NotificationService.ts**
**Fungsi:** Multi-channel notification delivery
- Email notifications via Resend API
- WhatsApp notifications via WhatsApp Web.js
- Notification templating system
- Delivery status tracking
- Retry mechanism untuk failed notifications

#### 👤 **UserService.ts**
**Fungsi:** User lifecycle management
- User profile CRUD operations
- Preference management
- User-device associations
- Account activation/deactivation

#### 📊 **DashboardService.ts**
**Fungsi:** Dashboard layout dan configuration
- Dashboard layout persistence
- Widget positioning system
- Dashboard sharing dan permissions
- Layout templates

#### 📋 **WidgetService.ts**
**Fungsi:** Widget configuration dan data processing
- Widget type management (line chart, gauge, table, etc.)
- Data source binding
- Widget refresh intervals
- Color theme dan styling options

### Infrastructure Services

#### 📤 **DeviceCommandService.ts**
**Fungsi:** Command queue dan delivery management
- Command queuing system
- MQTT command delivery
- Delivery confirmation tracking
- Command retry logic
- Batch command operations

#### 🌡️ **DeviceStatusService.ts**
**Fungsi:** Real-time device monitoring
- Heartbeat monitoring
- Connection status tracking
- Last-seen timestamp management
- Status change notifications

#### 📡 **OtaaUpdateService.ts**
**Fungsi:** Over-the-air firmware update orchestration
- Firmware file validation
- Version management
- Update scheduling
- Progress tracking
- Rollback capabilities

#### 🔧 **MQTTTopicManager.ts**
**Fungsi:** MQTT topic management dan routing
- Dynamic topic subscription
- Topic naming conventions
- Message routing logic
- Topic permission management

#### 👑 **AdminService.ts**
**Fungsi:** Administrative operations
- System statistics generation
- User management operations
- System maintenance functions
- Audit logging

#### 🛡️ **MiddlewareService.ts**
**Fungsi:** Custom middleware functions
- Rate limiting logic
- Request validation
- Security headers management
- Logging middleware

## 🔧 Utilities (`lib/` folder)

Library utilities yang digunakan across services:

#### **middleware.ts**
**Fungsi:** Custom middleware functions untuk Elysia
- Authentication middleware
- Role-based authorization middleware
- Request logging middleware
- Error handling middleware
- CORS configuration

#### **tokenizer.ts**
**Fungsi:** JWT token utilities
- Token generation dengan custom claims
- Token validation dan parsing
- Token refresh logic
- Token blacklisting untuk logout

#### **types.ts**
**Fungsi:** TypeScript type definitions
- API request/response types
- Database model types
- MQTT message types
- WebSocket event types
- Service method signatures

#### **utils.ts**
**Fungsi:** General utility functions
- Date/time formatting
- String manipulation helpers
- Data conversion utilities
- Validation helpers
- Encryption/decryption utilities

#### **truncate.ts**
**Fungsi:** String truncation utilities
- Smart text truncation
- Database field length validation
- Log message truncation
- Error message formatting

## 📁 Static Assets (`assets/` folder)

#### **web-logo.svg**
**Fungsi:** Logo aplikasi yang digunakan dalam email templates dan PDF exports

#### **firmware/** (subfolder)
**Fungsi:** Storage untuk firmware files yang diupload melalui OTA system
- Organized by user ID (`user-1/`, `user-2/`, etc.)
- Stores `.bin` files untuk ESP32/ESP8266
- Version tracking dan metadata

## 🧪 Testing dan Development (`test/` folder)

#### **tester_realtime.ts**
**Fungsi:** Testing tool untuk real-time data simulation
- Simulate MQTT data payload
- Test WebSocket connections
- Performance testing untuk data ingestion

#### **tester_sensor_with_aes.ts**
**Fungsi:** Testing tool untuk encrypted sensor data
- Test AES encryption/decryption
- Validate security protocols
- Test encrypted MQTT communication

#### **ino/** (subfolder)
**Fungsi:** Arduino firmware examples dan testing code
- **esp32-http-control.ino**: HTTP-based device control
- **esp32-mqtt-control.ino**: MQTT-based device control
- **http_test/**: HTTP communication testing
- **lora_test/**: LoRa communication testing  
- **mqtt_test/**: MQTT communication testing

## 🔄 Data Flow Architecture

### 1. **Request Flow**
```
Client Request → server.ts → API Route → Service Layer → Database/MQTT
```

### 2. **Real-time Data Flow**
```
IoT Device → MQTT Broker → PayloadService → WebSocket → Frontend
```

### 3. **Alarm Flow**
```
Sensor Data → AlarmService → Condition Check → NotificationService → Email/WhatsApp
```

### 4. **Authentication Flow**
```
Login Request → AuthService → JWT Generation → Middleware Validation → Protected Routes
```

## 🏗️ Architecture Patterns

### **Layered Architecture**
- **API Layer**: Route handling dan request/response
- **Service Layer**: Business logic dan domain operations
- **Data Layer**: Database operations dan external services

### **Dependency Injection**
- Services di-inject ke dalam API routes
- Utilities di-import oleh services
- Modular dan testable architecture

### **Event-Driven Architecture**
- MQTT events trigger data processing
- WebSocket events untuk real-time updates
- Alarm events trigger notifications

---


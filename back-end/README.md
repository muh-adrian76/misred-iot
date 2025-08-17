# Back-end - API Server MiSREd IoT

Folder `back-end` berisi aplikasi server untuk sistem monitoring dan kontrol IoT yang dibangun menggunakan **Elysia** dengan **runtime Bun.js**. Server ini menyediakan REST API, komunikasi waktu nyata WebSocket, dan integrasi dengan berbagai layanan IoT.

## 🏗️ Arsitektur Backend

### Kerangka Kerja dan Teknologi Utama

- **Elysia**: Kerangka kerja web TypeScript modern
- **Bun.js**: Runtime JavaScript berkinerja tinggi
- **TypeScript**: Bahasa pemrograman utama
- **MySQL**: Basis data relasional untuk penyimpanan data
- **MQTT**: Protokol pesan untuk perangkat IoT
- **WhatsApp Web.js**: Integrasi notifikasi WhatsApp

## 📁 Struktur Folder

```
back-end/
├── .env                              # Variabel lingkungan (pengembangan)
├── .env.example                      # Template variabel lingkungan
├── .gitignore                        # Aturan ignore Git untuk backend
├── package.json                      # Dependensi dan skrip Bun
├── bun.lock                         # Lockfile dependensi Bun
├── tsconfig.json                    # Konfigurasi TypeScript
├── db.sql                           # Skema basis data dan data awal
├── DATABASE_CLEANUP.md              # Panduan pemeliharaan basis data
├── install-whatsapp-deps.sh         # Skrip instalasi dependensi WhatsApp
├── certificates/                    # Sertifikat SSL untuk HTTPS
│   ├── localhost.pem                # Sertifikat SSL
│   └── localhost-key.pem            # Kunci privat SSL
├── wwebjs_auth/                     # Data sesi WhatsApp Web.js
│   └── session-misred-iot-server/   # Penyimpanan sesi WhatsApp
└── src/                             # Kode sumber utama aplikasi
    ├── server.ts                    # Titik masuk aplikasi
    ├── api/                         # Penanganan rute endpoint API
    ├── assets/                      # Berkas statis dan firmware
    ├── lib/                         # Fungsi utilitas dan pembantu
    ├── services/                    # Layanan logika bisnis
    └── test/                        # Pengujian dan alat pengembangan
```

## 📄 Penjelasan File Konfigurasi

### Berkas Lingkungan (`.env`)

```properties
# Konfigurasi Basis Data
DB_HOST=localhost                     # Host MySQL
DB_PORT=3306                         # Port MySQL
DB_USER=root                         # Database username
DB_PASSWORD=password                 # Database password
DB_NAME=misred_iot                   # Database name

# Server Configuration
PORT=7601                            # Server port
FRONTEND_URL=http://localhost:7600   # Frontend URL untuk CORS
SSL_CERT_PATH=./certificates/localhost.pem        # SSL certificate
SSL_KEY_PATH=./certificates/localhost-key.pem     # SSL private key

# JWT Authentication
JWT_SECRET=your-super-secret-key     # JWT signing secret
JWT_EXPIRE=24h                       # Token expiration

# External Services
RESEND_API_KEY=your-resend-api-key   # Email service API
GOOGLE_CLIENT_ID=your-google-id      # Google OAuth client ID
GOOGLE_CLIENT_SECRET=your-secret     # Google OAuth secret

# MQTT Configuration
MQTT_BROKER_URL=mqtt://localhost:1883    # MQTT broker URL
MQTT_USERNAME=username               # MQTT username
MQTT_PASSWORD=password               # MQTT password

# WhatsApp Configuration
WHATSAPP_SESSION_PATH=./wwebjs_auth/session-misred-iot-server
WHATSAPP_WEBHOOK_URL=http://localhost:7601/whatsapp/webhook
```

### File Database (`db.sql`)

Schema database MySQL dengan struktur:

```sql
-- Tabel utama sistem
users           -- Data pengguna dan autentikasi
devices         -- Perangkat IoT terdaftar
datastreams     -- Konfigurasi sensor/aktuator
payloads        -- Data realtime dari perangkat
alarms          -- Sistem alarm dan notifikasi
notifications   -- Log notifikasi terkirim
widgets         -- Konfigurasi dashboard widgets
dashboards      -- Layout dashboard pengguna
```

## 🚀 Scripts yang Tersedia

### Development Scripts

```bash
# Development server dengan hot reload
bun run dev                          # Port 7601, auto-restart on changes

# Production server
bun run start                        # Start production server
bun run build                        # Build TypeScript to JavaScript

# Database management
bun run db:migrate                   # Run database migrations
bun run db:seed                      # Seed initial data
bun run db:reset                     # Reset dan rebuild database

# Testing dan development
bun run test                         # Run unit tests
bun run test:watch                   # Watch mode testing
bun run lint                         # ESLint TypeScript files

# WhatsApp setup
chmod +x install-whatsapp-deps.sh    # Make script executable
./install-whatsapp-deps.sh           # Install WhatsApp dependencies
```

### Contoh Penggunaan

```bash
# Setup awal
cd back-end
bun install
cp .env.example .env                 # Edit environment variables

# Setup database
mysql -u root -p < db.sql            # Import database schema

# Setup WhatsApp (jika dibutuhkan)
./install-whatsapp-deps.sh

# Development
bun run dev                          # Server siap di http://localhost:7601

# Production
bun run build
bun run start
```

## 🗂️ Arsitektur Source Code

### Entry Point (`server.ts`)

File utama yang mengkonfigurasi dan menjalankan server:

```typescript
// Inisialisasi Elysia app dengan plugins
const app = new Elysia()
  .use(cors())                       // CORS middleware
  .use(helmet())                     // Security headers
  .use(rateLimit())                  // Rate limiting
  .use(compression())                // Response compression
  .use(swagger())                    // API documentation
  .listen(PORT)

// Plugin registrations
app.group('/api/v1', (app) =>
  app.use(authRoutes)                // Authentication routes
     .use(deviceRoutes)              // Device management
     .use(datastreamRoutes)          // Sensor configuration
     .use(alarmRoutes)               // Alarm system
     .use(notificationRoutes)        // Notification management
)
```

### API Routes (`api/` folder)

Struktur routing modular:

```
api/
├── health.ts                        # Health check endpoint
├── auth/                           # Authentication & authorization
│   ├── login.ts                    # POST /auth/login
│   ├── register.ts                 # POST /auth/register
│   ├── refresh.ts                  # POST /auth/refresh
│   └── google.ts                   # GET /auth/google (OAuth)
├── device/                         # Device management
│   ├── index.ts                    # GET/POST /devices
│   ├── [id].ts                     # GET/PUT/DELETE /devices/:id
│   ├── status.ts                   # GET /devices/:id/status
│   └── control.ts                  # POST /devices/:id/control
├── datastream/                     # Sensor/actuator configuration
├── alarm/                          # Alarm management
├── notification/                   # Notification system
├── dashboard/                      # Dashboard configuration
├── widget/                         # Widget management
├── user/                           # User management
├── payload/                        # IoT data ingestion
├── otaa/                           # Over-the-air updates
├── device-command/                 # Device command queue
├── admin/                          # Admin-only endpoints
└── ws/                             # WebSocket connections
```

### Business Logic (`services/` folder)

Service layer untuk business logic:

```
services/
├── AuthService.ts                   # Authentication logic
├── DeviceService.ts                 # Device management logic
├── DatastreamService.ts             # Sensor configuration logic
├── AlarmService.ts                  # Alarm processing logic
├── NotificationService.ts           # Multi-channel notifications
├── PayloadService.ts                # IoT data processing
├── UserService.ts                   # User management logic
├── DashboardService.ts              # Dashboard configuration
├── WidgetService.ts                 # Widget logic
├── DeviceCommandService.ts          # Command queue management
├── DeviceStatusService.ts           # Device status monitoring
├── OtaaUpdateService.ts             # OTA firmware updates
├── AdminService.ts                  # Admin operations
├── MQTTTopicManager.ts              # MQTT topic management
└── MiddlewareService.ts             # Custom middleware logic
```

### Utilities (`lib/` folder)

Helper functions dan utilities:

```
lib/
├── middleware.ts                    # Custom middleware functions
├── tokenizer.ts                     # JWT token utilities
├── truncate.ts                      # String truncation helpers
├── types.ts                         # TypeScript type definitions
└── utils.ts                         # General utility functions
```

## 🔧 Teknologi Dependencies

### Core Dependencies

```json
{
  "elysia": "^1.x",                   // Web framework
  "bun": "^1.x",                      // Runtime dan package manager
  "typescript": "^5.x",               // TypeScript support
  "@types/node": "^20.x"              // Node.js type definitions
}
```

### Database dan ORM

```json
{
  "mysql2": "^3.x",                   // MySQL client driver
  "drizzle-orm": "^0.x",              // TypeScript ORM
  "drizzle-kit": "^0.x"               // Database migrations
}
```

### Authentication dan Security

```json
{
  "@elysiajs/jwt": "^1.x",            // JWT plugin untuk Elysia
  "@elysiajs/cookie": "^0.x",         // Cookie management
  "bcryptjs": "^2.x",                 // Password hashing
  "@types/bcryptjs": "^2.x",          // Bcrypt types
  "helmet": "^7.x",                   // Security headers
  "rate-limiter-flexible": "^5.x"     // Rate limiting
}
```

### IoT dan Real-time Communication

```json
{
  "mqtt": "^5.x",                     // MQTT client
  "@types/mqtt": "^2.x",              // MQTT types
  "@elysiajs/websocket": "^0.x",      // WebSocket plugin
  "ws": "^8.x",                       // WebSocket library
  "@types/ws": "^8.x"                 // WebSocket types
}
```

### External Integrations

```json
{
  "whatsapp-web.js": "^1.x",          // WhatsApp integration
  "qrcode-terminal": "^0.x",          // QR code untuk WhatsApp
  "resend": "^3.x",                   // Email service
  "googleapis": "^143.x",             // Google OAuth integration
  "puppeteer": "^22.x"                // Browser automation (WhatsApp)
}
```

### Development Tools

```json
{
  "@elysiajs/swagger": "^1.x",        // API documentation
  "@elysiajs/cors": "^1.x",           // CORS support
  "compression": "^1.x",              // Response compression
  "nodemon": "^3.x",                  // Development auto-restart
  "eslint": "^8.x",                   // Code linting
  "@typescript-eslint/parser": "^7.x" // TypeScript ESLint
}
```

## 🔌 API Endpoints

### Authentication Endpoints

```typescript
POST   /api/v1/auth/login            // User login
POST   /api/v1/auth/register         // User registration  
POST   /api/v1/auth/refresh          // Refresh JWT token
GET    /api/v1/auth/google           // Google OAuth redirect
POST   /api/v1/auth/google/callback  // Google OAuth callback
POST   /api/v1/auth/logout           // User logout
GET    /api/v1/auth/profile          // Get user profile
PUT    /api/v1/auth/profile          // Update user profile
```

### Device Management

```typescript
GET    /api/v1/devices               // List all devices
POST   /api/v1/devices               // Create new device
GET    /api/v1/devices/:id           // Get device by ID
PUT    /api/v1/devices/:id           // Update device
DELETE /api/v1/devices/:id           // Delete device
GET    /api/v1/devices/:id/status    // Get device status
POST   /api/v1/devices/:id/control   // Send device command
```

### Data Management

```typescript
GET    /api/v1/datastreams           // List datastreams
POST   /api/v1/datastreams           // Create datastream
PUT    /api/v1/datastreams/:id       // Update datastream
DELETE /api/v1/datastreams/:id       // Delete datastream

GET    /api/v1/payloads              // Get sensor data
POST   /api/v1/payloads              // Insert sensor data
GET    /api/v1/payloads/export       // Export data (CSV/PDF)
```

### Alarm System

```typescript
GET    /api/v1/alarms                // List alarms
POST   /api/v1/alarms                // Create alarm rule
PUT    /api/v1/alarms/:id            // Update alarm rule
DELETE /api/v1/alarms/:id            // Delete alarm rule
GET    /api/v1/alarms/history        // Alarm trigger history
```

### Dashboard & Widgets

```typescript
GET    /api/v1/dashboards            // User dashboards
POST   /api/v1/dashboards            // Create dashboard
PUT    /api/v1/dashboards/:id        // Update dashboard layout

GET    /api/v1/widgets               // Available widgets
POST   /api/v1/widgets               // Create widget
PUT    /api/v1/widgets/:id           // Update widget config
DELETE /api/v1/widgets/:id           // Delete widget
```

### Notifications

```typescript
GET    /api/v1/notifications         // Notification history
POST   /api/v1/notifications/test    // Test notification
PUT    /api/v1/notifications/settings // Update notification preferences
```

### OTA Updates

```typescript
POST   /api/v1/otaa/upload           // Upload firmware
GET    /api/v1/otaa/versions         // List firmware versions
POST   /api/v1/otaa/deploy/:deviceId // Deploy firmware to device
GET    /api/v1/otaa/status/:deviceId // OTA update status
```

## 📡 Real-time Communication

### WebSocket Connections

```typescript
// WebSocket endpoints
WS     /ws/devices                   // Real-time device status
WS     /ws/payloads                  // Real-time sensor data
WS     /ws/alarms                    // Real-time alarm notifications
WS     /ws/dashboard/:id             // Dashboard-specific updates
```

### MQTT Integration

```typescript
// MQTT topic structure
devices/{deviceId}/data              // Sensor data ingestion
devices/{deviceId}/status            // Device status updates
devices/{deviceId}/commands          // Command delivery
devices/{deviceId}/ota               // OTA update delivery

// MQTT event handlers
mqttClient.on('message', (topic, message) => {
  const { deviceId, type } = parseTopic(topic)
  
  switch(type) {
    case 'data':
      await PayloadService.ingest(deviceId, message)
      broadcastToWebSocket('payloads', { deviceId, data: message })
      break
    case 'status':
      await DeviceService.updateStatus(deviceId, message)
      broadcastToWebSocket('devices', { deviceId, status: message })
      break
  }
})
```

## 🗄️ Database Schema

### Core Tables

```sql
-- Users table
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  google_id VARCHAR(100),
  role ENUM('admin', 'user') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Devices table  
CREATE TABLE devices (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  device_key VARCHAR(32) UNIQUE NOT NULL,
  user_id INT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_seen TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Datastreams table
CREATE TABLE datastreams (
  id INT PRIMARY KEY AUTO_INCREMENT,
  device_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  key_name VARCHAR(50) NOT NULL,
  data_type ENUM('integer', 'double', 'boolean', 'string') NOT NULL,
  unit VARCHAR(20),
  is_sensor BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
);

-- Payloads table (sensor data)
CREATE TABLE payloads (
  id INT PRIMARY KEY AUTO_INCREMENT,
  datastream_id INT NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (datastream_id) REFERENCES datastreams(id) ON DELETE CASCADE,
  INDEX idx_datastream_time (datastream_id, created_at)
);
```

### Alarm System Tables

```sql
-- Alarms table
CREATE TABLE alarms (
  id INT PRIMARY KEY AUTO_INCREMENT,
  datastream_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  condition_type ENUM('>', '<', '>=', '<=', '=', '!=') NOT NULL,
  threshold_value DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  notification_email BOOLEAN DEFAULT false,
  notification_whatsapp BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (datastream_id) REFERENCES datastreams(id) ON DELETE CASCADE
);

-- Notifications table
CREATE TABLE notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  alarm_id INT NOT NULL,
  type ENUM('alarm_triggered', 'device_offline', 'device_online') NOT NULL,
  message TEXT NOT NULL,
  channels JSON,  -- ['email', 'whatsapp']
  status ENUM('sent', 'failed', 'pending') DEFAULT 'pending',
  sent_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (alarm_id) REFERENCES alarms(id) ON DELETE CASCADE
);
```

## 🔒 Security Implementation

### Authentication Flow

```typescript
// JWT Token Strategy
1. User login → Verify credentials
2. Generate JWT token (24h expiry)
3. Return access token + refresh token
4. Client stores tokens in httpOnly cookies
5. API requests include Authorization header
6. Middleware validates token on protected routes
7. Auto-refresh on token expiry

// Password Security
- bcryptjs hashing (salt rounds: 12)
- Password requirements: min 8 chars, mixed case, numbers
- Account lockout after failed attempts
```

### Authorization Middleware

```typescript
// Role-based access control
const authMiddleware = (requiredRole?: 'admin' | 'user') => {
  return async (context: Context) => {
    const token = extractTokenFromHeader(context.request.headers.authorization)
    
    if (!token) {
      return context.error(401, 'Token required')
    }
    
    try {
      const payload = await jwt.verify(token, JWT_SECRET)
      const user = await UserService.findById(payload.sub)
      
      if (!user) {
        return context.error(401, 'Invalid token')
      }
      
      if (requiredRole && user.role !== requiredRole) {
        return context.error(403, 'Insufficient permissions')
      }
      
      context.user = user
      return context.next()
    } catch (error) {
      return context.error(401, 'Invalid token')
    }
  }
}
```

### Security Headers

```typescript
// Helmet.js security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}))
```

## 📈 Performance Optimizations

### Database Optimizations

```sql
-- Indexing strategy
CREATE INDEX idx_payloads_device_time ON payloads(datastream_id, created_at);
CREATE INDEX idx_devices_user ON devices(user_id);
CREATE INDEX idx_alarms_datastream ON alarms(datastream_id);

-- Query optimization
-- Partitioning payloads table by date
ALTER TABLE payloads PARTITION BY RANGE (YEAR(created_at)) (
  PARTITION p2024 VALUES LESS THAN (2025),
  PARTITION p2025 VALUES LESS THAN (2026)
);
```

### Caching Strategy

```typescript
// Redis caching (if implemented)
const cache = new Redis(process.env.REDIS_URL)

// Cache device status (5 minute TTL)
const getDeviceStatus = async (deviceId: string) => {
  const cached = await cache.get(`device:${deviceId}:status`)
  if (cached) return JSON.parse(cached)
  
  const status = await DeviceService.getStatus(deviceId)
  await cache.setex(`device:${deviceId}:status`, 300, JSON.stringify(status))
  return status
}
```

### Rate Limiting

```typescript
// Rate limiting configuration
const rateLimiter = new RateLimiterFlexible({
  storeClient: redisClient,
  keyPrefix: 'api_rate_limit',
  points: 100,        // Number of requests
  duration: 60,       // Per 60 seconds
  blockDuration: 60,  // Block for 60 seconds if limit exceeded
})

// Apply to all API routes
app.use('/api', async (context, next) => {
  try {
    await rateLimiter.consume(context.request.ip)
    return next()
  } catch {
    return context.error(429, 'Too Many Requests')
  }
})
```

## 🔧 Development Tools

### API Documentation

```typescript
// Swagger/OpenAPI integration
app.use(swagger({
  documentation: {
    info: {
      title: 'MiSREd IoT API',
      version: '1.0.0',
      description: 'REST API untuk sistem monitoring IoT'
    },
    servers: [
      { url: 'http://localhost:7601', description: 'Development' },
      { url: 'https://api.misred-iot.com', description: 'Production' }
    ]
  }
}))

// Access documentation at: http://localhost:7601/swagger
```

### Health Monitoring

```typescript
// Health check endpoint
app.get('/api/health', async () => {
  const checks = {
    database: await checkDatabaseConnection(),
    mqtt: await checkMQTTConnection(),
    whatsapp: await checkWhatsAppStatus(),
    memory: process.memoryUsage(),
    uptime: process.uptime()
  }
  
  const allHealthy = Object.values(checks).every(check => 
    typeof check === 'object' ? check.status === 'healthy' : true
  )
  
  return {
    status: allHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    checks
  }
})
```

### Logging Strategy

```typescript
// Structured logging
const logger = {
  info: (message: string, meta?: object) => {
    console.log(JSON.stringify({
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      ...meta
    }))
  },
  error: (message: string, error?: Error, meta?: object) => {
    console.error(JSON.stringify({
      level: 'error',
      message,
      error: error?.stack,
      timestamp: new Date().toISOString(),
      ...meta
    }))
  }
}

// Usage in services
logger.info('Device status updated', { deviceId, status })
logger.error('Database connection failed', error, { retryCount })
```

## 🚀 Deployment

### Production Configuration

```bash
# Environment variables untuk production
NODE_ENV=production
PORT=7601
SSL_CERT_PATH=/etc/ssl/certs/api.misred-iot.com.pem
SSL_KEY_PATH=/etc/ssl/private/api.misred-iot.com.key

# Database configuration
DB_HOST=db.misred-iot.com
DB_PORT=3306
DB_SSL=true

# External services
MQTT_BROKER_URL=mqtts://mqtt.misred-iot.com:8883
RESEND_API_KEY=re_production_key
```

### Process Management

```bash
# PM2 ecosystem configuration
module.exports = {
  apps: [{
    name: 'misred-iot-api',
    script: 'bun',
    args: 'run src/server.ts',
    cwd: '/path/to/back-end',
    instances: 'max',
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 7601
    }
  }]
}

# Deployment commands
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Errors**:
   ```bash
   # Check MySQL service
   systemctl status mysql
   
   # Test connection
   mysql -h localhost -u root -p misred_iot
   ```

2. **MQTT Connection Issues**:
   ```bash
   # Test MQTT broker
   mosquitto_pub -h localhost -t test/topic -m "hello"
   mosquitto_sub -h localhost -t test/topic
   ```

3. **WhatsApp Authentication**:
   ```bash
   # Clear session dan re-authenticate
   rm -rf wwebjs_auth/session-misred-iot-server
   bun run dev  # Scan QR code yang muncul
   ```

4. **SSL Certificate Issues**:
   ```bash
   # Generate self-signed certificates
   openssl req -x509 -newkey rsa:4096 -keyout certificates/localhost-key.pem -out certificates/localhost.pem -days 365 -nodes
   ```

5. **Memory Issues**:
   ```bash
   # Monitor memory usage
   ps aux | grep bun
   
   # Increase memory limit
   bun --max-old-space-size=4096 run src/server.ts
   ```

---


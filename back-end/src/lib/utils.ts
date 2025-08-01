/**
 * ===== UTILITY FUNCTIONS - FUNGSI UTILITAS SISTEM IoT =====
 * File ini berisi kumpulan fungsi utilitas untuk mendukung operasi sistem IoT
 * Meliputi: CORS handling, JWT authentication, enkripsi, validasi data sensor
 */

// Fungsi untuk memperbaiki masalah CORS dengan menambahkan www subdomain
function subDomain(url: string) {
  if (!url) return url; // Return langsung jika URL kosong
  try {
    const u = new URL(url); // Parse URL string ke objek URL
    // Tambahkan www. jika belum ada untuk konsistensi domain
    if (!u.hostname.startsWith("www.")) {
      u.hostname = "www." + u.hostname;
    }
    return u.toString().replace(/\/$/, ""); // Hilangkan trailing slash untuk konsistensi
  } catch {
    return url; // Return URL asli jika parsing gagal
  }
}

// ===== API DOCUMENTATION TAGS =====
// Objek untuk mengelompokkan endpoint API dalam dokumentasi Swagger
const apiTags = [
  {
    name: "Auth",
    description: "Endpoint untuk keperluan autentikasi user atau pengguna",
  },
  { 
    name: "JWT", 
    description: "Endpoint untuk keperluan token JWT dan refresh token" 
  },
  {
    name: "User",
    description: "Endpoint untuk keperluan user atau pengguna",
  },
  {
    name: "Device",
    description: "Endpoint untuk keperluan device atau perangkat IoT",
  },
  {
    name: "Widget",
    description: "Endpoint untuk keperluan widget pada dashboard",
  },
  {
    name: "Payload",
    description: "Endpoint untuk keperluan data sensor dari perangkat IoT",
  },
  {
    name: "Alarm",
    description: "Endpoint untuk keperluan alarm notifikasi dan monitoring",
  },
  {
    name: "Admin",
    description: "Endpoint untuk keperluan administrasi sistem",
  },
];

// ===== TIME CONVERSION UTILITY =====
// Konversi string waktu ke detik (untuk JWT expiration dan cookie maxAge)
function ageConverter(input: string): number {
  const match = input.match(/^(\d+)([smhd])$/); // Regex untuk memisahkan angka dan satuan waktu
  if (!match)
    throw new Error(
      "Format waktu tidak valid. Gunakan format seperti '30m', '1h', '7d', dll."
    );

  const value = parseInt(match[1], 10); // Ekstrak angka dari string
  const unit = match[2]; // Ekstrak satuan waktu (s/m/h/d)

  // Konversi semua satuan ke detik
  switch (unit) {
    case "s": // Detik -> langsung return
      return value;
    case "m": // Menit -> detik (x60)
      return value * 60;
    case "h": // Jam -> detik (x3600)
      return value * 60 * 60;
    case "d": // Hari -> detik (x86400)
      return value * 60 * 60 * 24;
    default:
      throw new Error(
        "Satuan waktu tidak valid. Gunakan 's' (detik), 'm' (menit), 'h' (jam), atau 'd' (hari)."
      );
  }
}

// ===== AUTHENTICATION COOKIE MANAGEMENT =====
// Fungsi untuk membuat cookie autentikasi user (access token + refresh token)
async function setAuthCookie(
  cookie: any,
  jwt: any,
  userId: string,
  refreshToken: string
) {
  // Generate access token dengan JWT standard format
  const value = await jwt.sign({
    sub: userId, // Subject: user ID yang login
    iat: Math.floor(Date.now() / 1000), // Issued At: timestamp UTC (JWT standard)
    type: "access", // Token type untuk membedakan access dan refresh
  });

  // Set access token di cookie dengan konfigurasi keamanan
  cookie.access_token.set({
    value,
    httpOnly: true, // Tidak bisa diakses via JavaScript (XSS protection)
    sameSite: process.env.USE_SECURE_COOKIE === "true" ? "none" : "lax", // CSRF protection
    secure: process.env.USE_SECURE_COOKIE === "true" ? true : false, // HTTPS only in production
    path: "/", // Cookie berlaku untuk semua path
    maxAge: ageConverter(process.env.ACCESS_TOKEN_AGE!), // Durasi hidup token (misal: 15m)
  });

  // Set refresh token di cookie dengan konfigurasi keamanan yang sama
  cookie.refresh_token.set({
    value: refreshToken, // Refresh token dari database
    httpOnly: true, // Keamanan: tidak bisa diakses JavaScript
    sameSite: process.env.USE_SECURE_COOKIE === "true" ? "none" : "lax", // CSRF protection
    secure: process.env.USE_SECURE_COOKIE === "true" ? true : false, // HTTPS only in production
    path: "/", // Cookie berlaku untuk semua path
    maxAge: ageConverter(process.env.REFRESH_TOKEN_AGE!), // Durasi hidup lebih lama (misal: 7d)
  });
}

// ===== AUTHENTICATION COOKIE CLEANUP =====
// Fungsi untuk menghapus cookie autentikasi user saat logout
function clearAuthCookie(cookie: any) {
  // Hapus access token dengan set value kosong dan maxAge 0
  cookie.access_token.set({
    value: "", // Value kosong
    httpOnly: true,
    sameSite: process.env.USE_SECURE_COOKIE === "true" ? "none" : "lax",
    secure: process.env.USE_SECURE_COOKIE === "true" ? true : false,
    path: "/",
    maxAge: 0, // Expired immediately
  });

  // Hapus refresh token dengan konfigurasi yang sama
  cookie.refresh_token.set({
    value: "", // Value kosong
    httpOnly: true,
    sameSite: process.env.USE_SECURE_COOKIE === "true" ? "none" : "lax",
    secure: process.env.USE_SECURE_COOKIE === "true" ? true : false,
    path: "/",
    maxAge: 0, // Expired immediately
  });
}

// ===== TOKEN RENEWAL SERVICE =====
// Fungsi untuk meminta access token baru menggunakan refresh token
async function renewToken(decoded: any, cookie: any) {
  // Panggil endpoint renew token dengan refresh token di cookie
  const response = await fetch(
    `${process.env.BACKEND_URL}/auth/renew/${decoded.sub}`, // Endpoint renewal dengan user ID
    {
      headers: {
        cookie: `refresh_token=${cookie.refresh_token?.value}`, // Kirim refresh token
      },
    }
  );
  const result = await response.json();

  // Validasi response dari server
  if (!result.accessToken) {
    throw new Error("Gagal memperbarui access token. Server tidak mengembalikan token baru.");
  }
  return { accessToken: result.accessToken }; // Return access token baru
}

// ===== JWT AUTHORIZATION MIDDLEWARE =====
// Fungsi untuk memverifikasi JWT token dan mengatur auto-renewal
async function authorizeRequest(jwt: any, cookie: any) {
  try {
    const accessToken = cookie.access_token?.value;
    const refreshToken = cookie.refresh_token?.value;
    let decoded;

    // STEP 1: Coba verifikasi access token jika ada
    if (accessToken) {
      decoded = await jwt.verify(accessToken);
      if (!decoded) throw new Error("Access token tidak valid atau sudah expired");
      return decoded; // Return langsung jika access token masih valid
    }

    // STEP 2: Jika access token tidak ada/invalid, cek refresh token
    if (!refreshToken) {
      throw new Error("Token tidak ditemukan di cookie. Silakan login ulang.");
    }

    // STEP 3: Verifikasi refresh token
    const decodedRefresh = await jwt.verify(refreshToken);
    if (!decodedRefresh) throw new Error("Refresh token tidak valid atau sudah expired");

    // STEP 4: Request access token baru dari server
    const { accessToken: newAccessToken } = await renewToken(decodedRefresh, cookie);
    if (!newAccessToken) throw new Error("Gagal memperbarui access token.");

    // STEP 5: Set access token baru ke cookie untuk request selanjutnya
    cookie.access_token.set({
      value: newAccessToken,
      httpOnly: true, // Keamanan: tidak bisa diakses JavaScript
      sameSite: process.env.USE_SECURE_COOKIE === "true" ? "none" : "lax",
      secure: process.env.USE_SECURE_COOKIE === "true" ? true : false,
      path: "/",
      maxAge: ageConverter(process.env.ACCESS_TOKEN_AGE!), // Durasi hidup token baru
    });

    // STEP 6: Verifikasi dan return payload dari access token baru
    decoded = await jwt.verify(newAccessToken);
    return decoded;
  } catch (error: any) {
    console.error("❌ Terjadi kesalahan pada JWT authorization:", error);
    throw new Error(`Unauthorized: ${error.message}`);
  }
}

// ===== AES DECRYPTION UTILITY =====
// Fungsi untuk mendekripsi data menggunakan algoritma AES-128-CBC
function decryptAES(
  crypto: any,
  encryptedBase64: string,
  secretKeyHex: string
) {
  // Decode base64 encrypted data menjadi buffer
  const encrypted = Buffer.from(encryptedBase64, "base64");
  if (encrypted.length < 32) throw new Error("Data terenkripsi terlalu pendek (minimum 32 bytes)");
  
  // Ekstrak IV (Initialization Vector) dari 16 byte pertama
  const iv = encrypted.subarray(0, 16);
  // Ekstrak ciphertext dari byte ke-17 sampai akhir
  const ciphertext = encrypted.subarray(16);
  
  // Konversi secret key dari hex string ke buffer (ambil 16 byte pertama untuk AES-128)
  const key = Buffer.from(secretKeyHex, "hex").subarray(0, 16);
  
  // Buat decipher dengan algoritma AES-128-CBC
  const decipher = crypto.createDecipheriv("aes-128-cbc", key, iv);
  decipher.setAutoPadding(true); // Aktifkan auto padding removal
  
  // Dekripsi data
  let decrypted = decipher.update(ciphertext);
  let final = decipher.final();
  decrypted = Buffer.concat([decrypted, final]);
  
  // Return sebagai string UTF-8
  return decrypted.toString("utf8");
}

// ===== JWT DEVICE ID EXTRACTION =====
// Fungsi untuk mengekstraksi device_id dari payload JWT tanpa verifikasi signature
function extractDeviceIdFromJWT(token: string): string | null {
  try {
    // Split JWT menjadi 3 bagian: header.payload.signature
    const [header, payload, signature] = token.split('.');
    if (!header || !payload || !signature) {
      return null; // Format JWT tidak valid
    }
    
    // Decode payload dari base64url ke JSON
    const decodedPayload = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return decodedPayload.sub || null; // Return subject (device_id) atau null
  } catch (error) {
    console.warn("Failed to extract device_id from JWT:", error);
    return null; // Return null jika decoding gagal
  }
}

// ===== DEVICE JWT VERIFICATION AND PAYLOAD DECRYPTION =====
// Fungsi kompleks untuk memverifikasi JWT dari device dan mendekripsi payload sensor
async function verifyDeviceJWTAndDecrypt({
  deviceService,
  deviceId,
  token,
}: {
  deviceService: any;
  deviceId: string;
  token: string;
}) {

  console.log(`🔐 [JWT VERIFY] Memulai verifikasi JWT untuk device: ${deviceId}`);
  
  // STEP 1: Ambil device secret dari database untuk verifikasi
  const devices = await deviceService.getDeviceById(deviceId);
  //@ts-ignore
  if (!devices || devices.length === 0) {
    console.error(`❌ [JWT VERIFY] Device ${deviceId} tidak terdaftar di database`);
    throw new Error("Device tidak terdaftar");
  }
  
  //@ts-ignore
  const device = devices[0]; // getDeviceById returns array
  const secret = device.new_secret; // Device-specific secret untuk JWT signing
  if (!secret) {
    console.error(`❌ [JWT VERIFY] Device secret tidak valid untuk device ${deviceId}`);
    throw new Error("Device secret tidak valid");
  }

  console.log(`✅ [JWT VERIFY] Device ditemukan: ${device.description || deviceId}`);
  console.log(`🔑 [JWT VERIFY] Secret berhasil diambil untuk verifikasi`);

  try {
    // STEP 2: Manual JWT verification dengan device-specific secret
    const [header, payload, signature] = token.split('.');
    
    if (!header || !payload || !signature) {
      console.error(`❌ [JWT VERIFY] Format JWT tidak valid`);
      throw new Error("Invalid JWT format");
    }
    
    console.log(`🔍 [JWT VERIFY] Memverifikasi signature JWT...`);
    // Verify signature menggunakan HMAC-SHA256 dengan device secret
    const data = `${header}.${payload}`;
    const crypto = require('crypto');
    const expectedSignature = crypto.createHmac('sha256', secret).update(data).digest('base64url');
    
    // console.log(signature, expectedSignature); // Debug signature matching
    if (signature !== expectedSignature) {
      console.error(`❌ [JWT VERIFY] Signature JWT tidak cocok`);
      throw new Error("Invalid JWT signature");
    }
    
    console.log(`✅ [JWT VERIFY] Signature JWT valid`);
    
    // STEP 3: Decode dan validasi payload
    let decodedPayload;
    try {
      decodedPayload = JSON.parse(Buffer.from(payload, 'base64url').toString());
      console.log(`📄 [JWT VERIFY] Payload JWT berhasil didecode:`, decodedPayload);
    } catch (decodeError) {
      console.error("❌ [JWT VERIFY] Gagal decode JWT payload:", decodeError);
      throw new Error("Invalid JWT payload encoding");
    }
    
    // STEP 4: Check expiration menggunakan UTC timestamp (JWT standard)
    const currentUtcTimestamp = Math.floor(Date.now() / 1000);
    if (decodedPayload.exp && currentUtcTimestamp > decodedPayload.exp) {
      console.error(`❌ [JWT VERIFY] JWT sudah expired. Current: ${currentUtcTimestamp}, Exp: ${decodedPayload.exp}`);
      throw new Error("JWT expired");
    }
    
    console.log(`✅ [JWT VERIFY] JWT belum expired`);
    
    // STEP 5: Validasi keberadaan encrypted data
    if (!decodedPayload.encryptedData) {
      console.error(`❌ [JWT VERIFY] encryptedData tidak ditemukan di JWT`);
      throw new Error("Missing encryptedData in JWT");
    }
    
    console.log(`🔓 [DECRYPT] Memulai proses dekripsi data...`);
    // STEP 6: Handle different encryption methods (backward compatibility)
    let decrypted;
    try {
      // Method 1: Try parsing as JSON directly (untuk CustomJWT format terbaru)
      decrypted = JSON.parse(decodedPayload.encryptedData);
      console.log(`Timestamp device: ${decodedPayload.timestamp}`);
      console.log(`✅ [DECRYPT] Data berhasil didekripsi menggunakan JSON parsing`);
    } catch (parseError) {
      try {
        // Method 2: Try base64 decode (untuk format base64 encoded)
        const decodedData = Buffer.from(decodedPayload.encryptedData, 'base64').toString();
        decrypted = JSON.parse(decodedData);
        console.log(`Timestamp device: ${decodedPayload.timestamp}`);
        console.log(`✅ [DECRYPT] Data berhasil didekripsi menggunakan base64 decode`);
      } catch (base64Error) {
        // Method 3: Fallback ke AES decryption (untuk backward compatibility)
        try {
          const decryptedString = decryptAES(crypto, decodedPayload.encryptedData, secret);
          decrypted = JSON.parse(decryptedString);
          console.log(`Timestamp device: ${decodedPayload.timestamp}`);
          console.log(`✅ [DECRYPT] Data berhasil didekripsi menggunakan AES decryption`);
        } catch (aesError) {
          console.error("❌ [DECRYPT] Semua metode dekripsi gagal:", aesError);
          throw new Error("Unable to decrypt payload data");
        }
      }
    }
    
    console.log(`🎉 [JWT VERIFY] Verifikasi dan dekripsi berhasil untuk device ${deviceId}`);
    console.log(`📊 [DECRYPT] Data hasil dekripsi:`, decrypted);
    return decrypted; // Return data sensor yang sudah didekripsi
    
  } catch (error) {
    console.error("❌ [JWT VERIFY] JWT verification failed:", error);
    throw new Error(`Payload tidak valid: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// ===== SENSOR VALUE VALIDATION AND NORMALIZATION =====
// Fungsi untuk memvalidasi dan menormalisasi nilai sensor sesuai konfigurasi datastream
function validateAndNormalizeValue(
  value: any,
  datastream: any
): { validatedValue: number; hasWarning: boolean; warningMessage?: string } {
  let numericValue: number;
  let hasWarning = false;
  let warningMessage = '';

  // STEP 1: Konversi berbagai tipe data ke number
  if (typeof value === 'string') {
    numericValue = parseFloat(value);
    if (isNaN(numericValue)) {
      throw new Error(`Invalid numeric value: ${value}`);
    }
  } else if (typeof value === 'number') {
    numericValue = value; // Sudah number, langsung gunakan
  } else if (typeof value === 'boolean') {
    numericValue = value ? 1 : 0; // Boolean: true=1, false=0
  } else {
    throw new Error(`Unsupported value type: ${typeof value}`);
  }

  // STEP 2: Validasi tipe data khusus
  if (datastream.type === 'integer') {
    numericValue = Math.round(numericValue); // Bulatkan ke integer
  } else if (datastream.type === 'boolean') {
    numericValue = numericValue ? 1 : 0; // Normalize ke 0 atau 1
  }

  // STEP 3: Clamping untuk min/max values (penting untuk keamanan sensor)
  const originalValue = numericValue;
  if (numericValue < datastream.min_value) {
    numericValue = datastream.min_value; // Clamp ke nilai minimum
    hasWarning = true;
    warningMessage = `Value ${originalValue} clamped to minimum ${datastream.min_value}`;
  } else if (numericValue > datastream.max_value) {
    numericValue = datastream.max_value; // Clamp ke nilai maximum
    hasWarning = true;
    warningMessage = `Value ${originalValue} clamped to maximum ${datastream.max_value}`;
  }

  // STEP 4: Pembulatan sesuai decimal_value untuk tipe double
  if (datastream.type === 'double' && datastream.decimal_value) {
    // decimal_value format: '0.0', '0.00', '0.000', '0.0000'
    const decimalStr = datastream.decimal_value.toString();
    const decimalPlaces = decimalStr.includes('.') ? decimalStr.split('.')[1].length : 0;
    
    if (decimalPlaces > 0) {
      // Bulatkan sesuai jumlah decimal places
      const factor = Math.pow(10, decimalPlaces);
      numericValue = Math.round(numericValue * factor) / factor;
    } else {
      // Jika decimal_value adalah '0' atau tidak ada desimal, bulatkan ke integer
      numericValue = Math.round(numericValue);
    }
  }

  return { validatedValue: numericValue, hasWarning, warningMessage };
}

// ===== PAYLOAD PARSING AND DATABASE NORMALIZATION =====
// Fungsi kompleks untuk parsing raw sensor data dan menyimpan ke database
async function parseAndNormalizePayload(
  db: any,
  deviceId: number, 
  rawData: any, 
  rawPayloadId: number
): Promise<number[]> {
  try {
    // STEP 1: Ambil konfigurasi datastreams untuk device ini
    const [datastreams]: any = await db.query(
      `SELECT id, pin, type, unit, min_value, max_value, decimal_value, description 
       FROM datastreams WHERE device_id = ?`,
      [deviceId]
    );
    
    const insertedIds: number[] = []; // Array untuk menyimpan ID payload yang berhasil disimpan
    const validationWarnings: string[] = []; // Array untuk warning validasi
    
    // STEP 2: Ekstrak dan konversi timestamp dari raw data
    let deviceTime = null;
    if (rawData.timestamp && typeof rawData.timestamp === 'number') {
      let timestamp = rawData.timestamp;
      
      // Handle berbagai format timestamp (seconds vs milliseconds)
      if (timestamp < 10000000000) {
        timestamp = timestamp * 1000; // Konversi seconds ke milliseconds
      }
      
      // Konversi ke MySQL DATETIME format (YYYY-MM-DD HH:MM:SS)
      deviceTime = new Date(timestamp).toISOString().slice(0, 19).replace('T', ' ');
      
      // Debug log untuk timestamp conversion
      // console.log(`Raw timestamp: ${rawData.timestamp}, Detected format: ${rawData.timestamp < 10000000000 ? 'seconds' : 'milliseconds'}, Converted: ${deviceTime}`);
    }
    
    // STEP 3: Parse dan simpan setiap pin di raw data
    for (const [pin, value] of Object.entries(rawData)) {
      // Skip timestamp dan device_id karena bukan data sensor
      if ((typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean') 
          && pin !== 'timestamp' && pin !== 'device_id') {
        
        // Cari datastream configuration yang cocok dengan pin
        const datastream = datastreams.find((ds: any) => ds.pin === pin);
        if (datastream) {
          try {
            // Validasi dan normalisasi nilai sesuai konfigurasi datastream
            const { validatedValue, hasWarning, warningMessage } = validateAndNormalizeValue(value, datastream);
            console.log(`💾 [PARSE] Menyimpan data ke database: Pin "${pin}" → Value: ${validatedValue}`);
            
            // Insert ke tabel payloads dengan metadata lengkap
            const [result] = await db.query(
              `INSERT INTO payloads (device_id, datastream_id, value, raw_data, device_time, server_time)
              VALUES (?, ?, ?, ?, ?, NOW())`,
              [
                deviceId, 
                datastream.id, 
                validatedValue, // Gunakan nilai yang sudah divalidasi dan dinormalisasi
                JSON.stringify({ 
                  raw_payload_id: rawPayloadId, // Link ke raw payload untuk audit trail
                  pin, 
                  original_value: value, // Nilai asli dari device
                  validated_value: validatedValue, // Nilai setelah validasi
                  validation_applied: hasWarning // Flag apakah ada clamping/normalisasi
                }),
                deviceTime // Timestamp dari device (jika ada)
              ]
            );
            
            insertedIds.push((result as any).insertId);
            console.log(`✅ [PARSE] Data berhasil disimpan dengan ID: ${(result as any).insertId}`);
            
          } catch (insertError) {
            console.error(`❌ [PARSE] Error menyimpan data untuk pin "${pin}":`, insertError);
            // Continue processing other pins meskipun ada yang gagal
          }
        } else {
          console.warn(`⚠️ [PARSE] Datastream tidak ditemukan untuk pin "${pin}" - data diabaikan`);
        }
      }
    }
    
    // Log validation warnings jika ada
    if (validationWarnings.length > 0) {
      console.warn(`⚠️ [PARSE] Validation warnings ditemukan:`);
      validationWarnings.forEach(warning => console.warn(`   • ${warning}`));
    }
    
    console.log(`🎉 [PARSE] Parsing selesai. Total ${insertedIds.length} payload berhasil disimpan`);
    return insertedIds;
  } catch (error) {
    console.error("Error in parseAndNormalizePayload:", error);
    throw new Error("Failed to parse and normalize payload");
  }
}

// ===== REAL-TIME WEBSOCKET BROADCASTING =====
// Fungsi untuk broadcasting sensor updates real-time HANYA ke pemilik device
async function broadcastSensorUpdates(
  db: any,
  broadcastFunction: any,
  deviceId: number, 
  rawData: any,
  protocol?: string
) {
  try {
    console.log(`📡 [BROADCAST] Memulai broadcast data real-time untuk device ${deviceId}`);
    
    // STEP 1: Extract device timestamp dari rawData (konsisten dengan parseAndNormalizePayload)
    let deviceTimestamp = null;
    if (rawData.timestamp && typeof rawData.timestamp === 'number') {
      let timestamp = rawData.timestamp;
      
      // Handle berbagai format timestamp (seconds vs milliseconds)
      if (timestamp < 10000000000) {
        timestamp = timestamp * 1000; // Konversi seconds ke milliseconds
      }
      
      // Gunakan timestamp asli dari device untuk akurasi waktu
      deviceTimestamp = new Date(timestamp).toISOString();
    } else {
      // Fallback ke server time jika tidak ada device timestamp
      deviceTimestamp = new Date().toISOString();
    }
    
    // STEP 2: Get device info dan pemilik untuk authorization
    const [deviceRows]: any = await db.query(
      `SELECT d.id, d.description as device_name, d.user_id, u.name as user_name
       FROM devices d 
       LEFT JOIN users u ON d.user_id = u.id 
       WHERE d.id = ?`,
      [deviceId]
    );

    if (!deviceRows.length) {
      console.warn(`⚠️ [BROADCAST] Device ${deviceId} tidak ditemukan untuk broadcast`);
      return;
    }

    const device = deviceRows[0];
    console.log(`✅ [BROADCAST] Device ditemukan: ${device.device_name} (Owner: ${device.user_name || 'Unknown'})`);
    
    // STEP 3: Get datastreams untuk mapping pin data ke informasi sensor
    const [datastreams]: any = await db.query(
      `SELECT id, pin, description, unit, type FROM datastreams WHERE device_id = ?`,
      [deviceId]
    );

    console.log(`🔍 [BROADCAST] Ditemukan ${datastreams.length} datastream untuk broadcast`);

    // STEP 4: Broadcast setiap sensor value dengan datastream info
    let broadcastCount = 0;
    for (const [pin, value] of Object.entries(rawData)) {
      // Skip timestamp dan device_id, hanya proses data sensor
      if (typeof value === 'number' && pin !== 'timestamp' && pin !== 'device_id') {
        const datastream = datastreams.find((ds: any) => ds.pin === pin);
        
        if (datastream) {
          console.log(`📤 [BROADCAST] Mengirim data sensor: Pin "${pin}" → ${datastream.description} = ${value} ${datastream.unit || ''}`);
          
          // Buat payload untuk WebSocket broadcast
          const broadcastData: any = {
            type: "sensor_update", // Jenis message WebSocket
            device_id: deviceId,
            datastream_id: datastream.id,
            value: value,
            timestamp: deviceTimestamp, // PENTING: Gunakan timestamp asli dari device
            device_name: device.device_name,
            sensor_name: datastream.description,
            unit: datastream.unit,
            user_id: device.user_id, // KEAMANAN: Hanya kirim ke pemilik device
            pin: pin
          };

          // Tambah protocol info jika ada
          if (protocol) {
            broadcastData.protocol = protocol;
          }

          // KEAMANAN: Gunakan broadcast function yang aman (broadcastToUsersByDevice)
          if (typeof broadcastFunction === 'function' && broadcastFunction.name === 'broadcastToUsersByDevice') {
            await broadcastFunction(db, deviceId, broadcastData);
            console.log(`✅ [BROADCAST] Data berhasil dikirim ke WebSocket user ${device.user_id}`);
          } else {
            console.warn("⚠️ [BROADCAST] Menggunakan legacy broadcast function. Harap update ke broadcastToUsersByDevice untuk keamanan.");
            broadcastFunction(broadcastData);
          }
          broadcastCount++;
        } else {
          console.warn(`⚠️ [BROADCAST] Datastream tidak ditemukan untuk pin "${pin}" - tidak di-broadcast`);
        }
      }
    }
    
    console.log(`🎉 [BROADCAST] Selesai broadcast ${broadcastCount} sensor data ke user ${device.user_id}`);
  } catch (error) {
    console.error("❌ [BROADCAST] Error dalam broadcast sensor updates:", error);
    // Don't throw error untuk avoid breaking payload saving process
  }
}

// ===== EXPORTS =====
// Export semua fungsi utilitas untuk digunakan di bagian lain aplikasi
export {
  subDomain, // CORS subdomain fixing
  apiTags, // API documentation tags
  authorizeRequest, // JWT authorization middleware
  setAuthCookie, // Set authentication cookies
  clearAuthCookie, // Clear authentication cookies
  renewToken, // Refresh token renewal
  decryptAES, // AES decryption utility
  ageConverter, // Time string to seconds converter
  extractDeviceIdFromJWT, // Extract device ID from JWT payload
  verifyDeviceJWTAndDecrypt, // Device JWT verification and payload decryption
  parseAndNormalizePayload, // Raw payload parsing and database storage
  broadcastSensorUpdates, // Real-time WebSocket broadcasting
  validateAndNormalizeValue, // Sensor value validation and normalization
};

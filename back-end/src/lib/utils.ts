// Fix CORS error
function subDomain(url: string) {
  if (!url) return url;
  try {
    const u = new URL(url);
    if (!u.hostname.startsWith("www.")) {
      u.hostname = "www." + u.hostname;
    }
    return u.toString().replace(/\/$/, ""); // hilangkan trailing slash
  } catch {
    return url;
  }
}

// Objek group untuk pembuatan dokumentasi API
const apiTags = [
  {
    name: "Auth",
    description: "Endpoint untuk keperluan autentikasi user atau pengguna",
  },
  { name: "JWT", description: "Endpoint untuk keperluan token JWT" },
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
    description: "Endpoint untuk keperluan data sensor",
  },
  {
    name: "Alarm",
    description: "Endpoint untuk keperluan alarm notifikasi",
  },
  {
    name: "Admin",
    description: "Endpoint untuk keperluan administrasi sistem",
  },
];

// Konversi waktu dari string ke angka
function ageConverter(input: string): number {
  const match = input.match(/^(\d+)([smhd])$/); // Regex untuk memisahkan angka dan satuan
  if (!match)
    throw new Error(
      "Format waktu tidak valid. Gunakan format seperti '30m', '1h', dll."
    );

  const value = parseInt(match[1], 10); // Angka
  const unit = match[2]; // Satuan

  switch (unit) {
    case "s": // Detik
      return value;
    case "m": // Menit
      return value * 60;
    case "h": // Jam
      return value * 60 * 60;
    case "d": // Hari
      return value * 60 * 60 * 24;
    default:
      throw new Error(
        "Satuan waktu tidak valid. Gunakan 's', 'm', 'h', atau 'd'."
      );
  }
}

// Fungsi untuk membuat cookie user
async function setAuthCookie(
  cookie: any,
  jwt: any,
  userId: string,
  refreshToken: string
) {
  const value = await jwt.sign({
    sub: userId,
    iat: Math.floor(Date.now() / 1000), // UTC timestamp (JWT standard)
    type: "access",
  });

  // Set access token
  cookie.access_token.set({
    value,
    httpOnly: true,
    sameSite: process.env.USE_SECURE_COOKIE === "true" ? "none" : "lax",
    secure: process.env.USE_SECURE_COOKIE === "true" ? true : false,
    path: "/",
    maxAge: ageConverter(process.env.ACCESS_TOKEN_AGE!),
  });

  // Set refresh token
  cookie.refresh_token.set({
    value: refreshToken,
    httpOnly: true,
    sameSite: process.env.USE_SECURE_COOKIE === "true" ? "none" : "lax",
    secure: process.env.USE_SECURE_COOKIE === "true" ? true : false,
    path: "/",
    maxAge: ageConverter(process.env.REFRESH_TOKEN_AGE!), // misal 7d
  });
}

// Fungsi untuk menghapus cookie user
function clearAuthCookie(cookie: any) {
  // Hapus access token
  cookie.access_token.set({
    value: "",
    httpOnly: true,
    sameSite: process.env.USE_SECURE_COOKIE === "true" ? "none" : "lax",
    secure: process.env.USE_SECURE_COOKIE === "true" ? true : false,
    path: "/",
    maxAge: 0,
  });

  // Hapus refresh token
  cookie.refresh_token.set({
    value: "",
    httpOnly: true,
    sameSite: process.env.USE_SECURE_COOKIE === "true" ? "none" : "lax",
    secure: process.env.USE_SECURE_COOKIE === "true" ? true : false,
    path: "/",
    maxAge: 0,
  });
}

// Fungsi untuk request token baru
async function renewToken(decoded: any, cookie: any) {
  const response = await fetch(
    `${process.env.BACKEND_URL}/auth/renew/${decoded.sub}`,
    {
      headers: {
        cookie: `refresh_token=${cookie.refresh_token?.value}`,
      },
    }
  );
  const result = await response.json();

  if (!result.accessToken) {
    throw new Error("Gagal memperbarui access token.");
  }
  return { accessToken: result.accessToken };
}

// Fungsi untuk verify token jwt
async function authorizeRequest(jwt: any, cookie: any) {
  try {
    const accessToken = cookie.access_token?.value;
    const refreshToken = cookie.refresh_token?.value;
    let decoded;

    // 1. Jika access token ada, coba verifikasi
    if (accessToken) {
      decoded = await jwt.verify(accessToken);
      if (!decoded) throw new Error("Token tidak valid");
      return decoded;
    }

    // 2. Jika access token tidak ada/invalid, cek refresh token
    if (!refreshToken) {
      throw new Error("Token tidak ditemukan di cookie");
    }

    // 3. Verifikasi refresh token di database melalui endpoint renew
    const decodedRefresh = await jwt.verify(refreshToken);
    if (!decodedRefresh) throw new Error("Refresh token tidak valid");

    // 4. Request access token baru
    const { accessToken: newAccessToken } = await renewToken(decodedRefresh, cookie);
    if (!newAccessToken) throw new Error("Gagal memperbarui access token.");

    // 5. Set access token baru ke cookie
    cookie.access_token.set({
      value: newAccessToken,
      httpOnly: true,
      sameSite: process.env.USE_SECURE_COOKIE === "true" ? "none" : "lax",
      secure: process.env.USE_SECURE_COOKIE === "true" ? true : false,
      path: "/",
      maxAge: ageConverter(process.env.ACCESS_TOKEN_AGE!),
    });

    decoded = await jwt.verify(newAccessToken);
    return decoded;
  } catch (error: any) {
    console.error("❌ Terjadi kesalahan:", error);
    throw new Error(`Unauthorized. ${error.message}`);
  }
}

// Fungsi dekripsi AES-128-CBC
function decryptAES(
  crypto: any,
  encryptedBase64: string,
  secretKeyHex: string
) {
  const encrypted = Buffer.from(encryptedBase64, "base64");
  if (encrypted.length < 32) throw new Error("Data terenkripsi terlalu pendek");
  const iv = encrypted.subarray(0, 16);
  const ciphertext = encrypted.subarray(16);
  const key = Buffer.from(secretKeyHex, "hex").subarray(0, 16);
  const decipher = crypto.createDecipheriv("aes-128-cbc", key, iv);
  decipher.setAutoPadding(true);
  let decrypted = decipher.update(ciphertext);
  let final = decipher.final();
  decrypted = Buffer.concat([decrypted, final]);
  return decrypted.toString("utf8");
}

// Fungsi untuk mengekstraksi device_id dari JWT payload
function extractDeviceIdFromJWT(token: string): string | null {
  try {
    const [header, payload, signature] = token.split('.');
    if (!header || !payload || !signature) {
      return null;
    }
    
    const decodedPayload = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return decodedPayload.sub || null;
  } catch (error) {
    console.warn("Failed to extract device_id from JWT:", error);
    return null;
  }
}

// Fungsi verifikasi JWT dan dekripsi payload untuk device
async function verifyDeviceJWTAndDecrypt({
  deviceService,
  deviceId,
  token,
}: {
  deviceService: any;
  deviceId: string;
  token: string;
}) {
  // Ambil secret dari database
  const devices = await deviceService.getDeviceById(deviceId);
  //@ts-ignore
  if (!devices || devices.length === 0) {
    throw new Error("Device tidak terdaftar");
  }
  
  //@ts-ignore
  const device = devices[0]; // getDeviceById returns array
  const secret = device.new_secret;
  if (!secret) throw new Error("Device secret tidak valid");

  try {
    // Manual JWT verification dengan device-specific secret
    const [header, payload, signature] = token.split('.');
    
    if (!header || !payload || !signature) {
      throw new Error("Invalid JWT format");
    }
    
    // Verify signature menggunakan device secret
    const data = `${header}.${payload}`;
    const crypto = require('crypto');
    const expectedSignature = crypto.createHmac('sha256', secret).update(data).digest('base64url');
    
    // console.log(signature, expectedSignature);
    if (signature !== expectedSignature) {
      throw new Error("Invalid JWT signature");
    }
    
    // Decode payload
    let decodedPayload;
    try {
      decodedPayload = JSON.parse(Buffer.from(payload, 'base64url').toString());
    } catch (decodeError) {
      console.error("❌ Failed to decode JWT payload:", decodeError);
      throw new Error("Invalid JWT payload encoding");
    }
    
    // Check expiration (use UTC timestamp to match JWT standard)
    const currentUtcTimestamp = Math.floor(Date.now() / 1000);
    if (decodedPayload.exp && currentUtcTimestamp > decodedPayload.exp) {
      throw new Error("JWT expired");
    }
    
    if (!decodedPayload.encryptedData) {
      throw new Error("Missing encryptedData in JWT");
    }
    
    // Handle different encryption methods
    let decrypted;
    try {
      // Method 1: Try parsing as JSON directly (for CustomJWT)
      decrypted = JSON.parse(decodedPayload.encryptedData);
    } catch (parseError) {
      try {
        // Method 2: Try base64 decode
        const decodedData = Buffer.from(decodedPayload.encryptedData, 'base64').toString();
        decrypted = JSON.parse(decodedData);
      } catch (base64Error) {
        // Method 3: Fallback to AES decryption for backward compatibility
        try {
          const decryptedString = decryptAES(crypto, decodedPayload.encryptedData, secret);
          decrypted = JSON.parse(decryptedString);
        } catch (aesError) {
          console.error("❌ All decryption methods failed:", aesError);
          throw new Error("Unable to decrypt payload data");
        }
      }
    }
    
    return decrypted;
    
  } catch (error) {
    console.error("JWT verification failed:", error);
    throw new Error(`Payload tidak valid: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Fungsi untuk validasi dan normalisasi nilai sensor
function validateAndNormalizeValue(
  value: any,
  datastream: any
): { validatedValue: number; hasWarning: boolean; warningMessage?: string } {
  let numericValue: number;
  let hasWarning = false;
  let warningMessage = '';

  // Konversi ke number jika belum
  if (typeof value === 'string') {
    numericValue = parseFloat(value);
    if (isNaN(numericValue)) {
      throw new Error(`Invalid numeric value: ${value}`);
    }
  } else if (typeof value === 'number') {
    numericValue = value;
  } else if (typeof value === 'boolean') {
    numericValue = value ? 1 : 0;
  } else {
    throw new Error(`Unsupported value type: ${typeof value}`);
  }

  // Validasi untuk tipe data tertentu
  if (datastream.type === 'integer') {
    numericValue = Math.round(numericValue);
  } else if (datastream.type === 'boolean') {
    numericValue = numericValue ? 1 : 0;
  }

  // Clamping untuk min/max values
  const originalValue = numericValue;
  if (numericValue < datastream.min_value) {
    numericValue = datastream.min_value;
    hasWarning = true;
    warningMessage = `Value ${originalValue} clamped to minimum ${datastream.min_value}`;
  } else if (numericValue > datastream.max_value) {
    numericValue = datastream.max_value;
    hasWarning = true;
    warningMessage = `Value ${originalValue} clamped to maximum ${datastream.max_value}`;
  }

  // Pembulatan sesuai decimal_value untuk tipe double
  if (datastream.type === 'double' && datastream.decimal_value) {
    // decimal_value format: '0.0', '0.00', '0.000', '0.0000'
    const decimalStr = datastream.decimal_value.toString();
    const decimalPlaces = decimalStr.includes('.') ? decimalStr.split('.')[1].length : 0;
    
    if (decimalPlaces > 0) {
      const factor = Math.pow(10, decimalPlaces);
      numericValue = Math.round(numericValue * factor) / factor;
    } else {
      // Jika decimal_value adalah '0' atau tidak ada desimal
      numericValue = Math.round(numericValue);
    }
  }

  return { validatedValue: numericValue, hasWarning, warningMessage };
}

// Fungsi untuk parsing dan normalisasi payload ke database
async function parseAndNormalizePayload(
  db: any,
  deviceId: number, 
  rawData: any, 
  rawPayloadId: number
): Promise<number[]> {
  try {
    // Ambil datastreams yang ada untuk device ini dengan informasi validasi
    const [datastreams]: any = await db.query(
      `SELECT id, pin, type, unit, min_value, max_value, decimal_value, description 
       FROM datastreams WHERE device_id = ?`,
      [deviceId]
    );
    
    const insertedIds: number[] = [];
    const validationWarnings: string[] = [];
    
    // Ekstrak dan konversi timestamp dari raw data
    let deviceTime = null;
    if (rawData.timestamp && typeof rawData.timestamp === 'number') {
      // Konversi dari Unix timestamp (milliseconds) ke MySQL DATETIME
      deviceTime = new Date(rawData.timestamp).toISOString().slice(0, 19).replace('T', ' ');
    }
    
    // Parse setiap pin di raw data
    for (const [pin, value] of Object.entries(rawData)) {
      if ((typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean') 
          && pin !== 'timestamp' && pin !== 'device_id') {
        
        // Cari datastream yang cocok dengan pin
        const datastream = datastreams.find((ds: any) => ds.pin === pin);
        if (datastream) {
          try {
            // Validasi dan normalisasi nilai
            const { validatedValue, hasWarning, warningMessage } = validateAndNormalizeValue(value, datastream);
            
            if (hasWarning && warningMessage) {
              validationWarnings.push(`Pin ${pin} (${datastream.description}): ${warningMessage}`);
            }

            // Insert ke tabel payloads dengan nilai yang sudah divalidasi
            const [result] = await db.query(
              `INSERT INTO payloads (device_id, datastream_id, value, raw_data, device_time, server_time)
              VALUES (?, ?, ?, ?, ?, NOW())`,
              [
                deviceId, 
                datastream.id, 
                validatedValue, // Gunakan nilai yang sudah divalidasi
                JSON.stringify({ 
                  raw_payload_id: rawPayloadId, 
                  pin, 
                  original_value: value,
                  validated_value: validatedValue,
                  validation_applied: hasWarning
                }),
                deviceTime
              ]
            );
            insertedIds.push(result.insertId);
            
          } catch (error) {
            console.error(`Error saving sensor data for pin ${pin}:`, error);
            // Continue processing other pins even if one fails
          }
        } else {
          console.warn(`⚠️ No datastream found for pin ${pin} on device ${deviceId}`);
        }
      }
    }
    
    // Log validation warnings if any
    if (validationWarnings.length > 0) {
      console.warn(`📊 Data validation applied for device ${deviceId}:`, validationWarnings);
    }
    
    return insertedIds;
  } catch (error) {
    console.error("Error in parseAndNormalizePayload:", error);
    throw new Error("Failed to parse and normalize payload");
  }
}

// Fungsi untuk broadcasting real-time sensor updates HANYA ke pemilik device
async function broadcastSensorUpdates(
  db: any,
  broadcastFunction: any,
  deviceId: number, 
  rawData: any,
  protocol?: string
) {
  try {
    // Get device info and owner
    const [deviceRows]: any = await db.query(
      `SELECT d.id, d.description as device_name, d.user_id, u.name as user_name
       FROM devices d 
       LEFT JOIN users u ON d.user_id = u.id 
       WHERE d.id = ?`,
      [deviceId]
    );

    if (!deviceRows.length) {
      console.warn(`Device ${deviceId} not found for broadcasting`);
      return;
    }

    const device = deviceRows[0];
    
    // Get datastreams for this device to map pin data
    const [datastreams]: any = await db.query(
      `SELECT id, pin, description, unit, type FROM datastreams WHERE device_id = ?`,
      [deviceId]
    );

    // Broadcast each sensor value with datastream info
    for (const [pin, value] of Object.entries(rawData)) {
      if (typeof value === 'number' && pin !== 'timestamp' && pin !== 'device_id') {
        const datastream = datastreams.find((ds: any) => ds.pin === pin);
        
        if (datastream) {
          // Broadcast real-time sensor update HANYA ke pemilik device
          const broadcastData: any = {
            type: "sensor_update",
            device_id: deviceId,
            datastream_id: datastream.id,
            value: value,
            timestamp: new Date().toISOString(),
            device_name: device.device_name,
            sensor_name: datastream.description,
            unit: datastream.unit,
            user_id: device.user_id,
            pin: pin
          };

          if (protocol) {
            broadcastData.protocol = protocol;
          }

          // Gunakan broadcastFunction yang aman (harus broadcastToUsersByDevice)
          if (typeof broadcastFunction === 'function' && broadcastFunction.name === 'broadcastToUsersByDevice') {
            await broadcastFunction(db, deviceId, broadcastData);
          } else {
            console.warn("⚠️ Using legacy broadcast function. Please update to use broadcastToUsersByDevice for security.");
            broadcastFunction(broadcastData);
          }
        }
      }
    }
  } catch (error) {
    console.error("Error broadcasting sensor updates:", error);
    // Don't throw error to avoid breaking payload saving
  }
}

export {
  subDomain,
  apiTags,
  authorizeRequest,
  setAuthCookie,
  clearAuthCookie,
  renewToken,
  decryptAES,
  ageConverter,
  extractDeviceIdFromJWT,
  verifyDeviceJWTAndDecrypt,
  parseAndNormalizePayload,
  broadcastSensorUpdates,
  validateAndNormalizeValue,
};

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
    iat: Math.floor(Date.now() / 1000),
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
    
    // Check expiration
    if (decodedPayload.exp && Date.now() / 1000 > decodedPayload.exp) {
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
}// Fungsi untuk parsing dan normalisasi payload ke database
async function parseAndNormalizePayload(
  db: any,
  deviceId: number, 
  rawData: any, 
  rawPayloadId: number
): Promise<number[]> {
  try {
    // Ambil datastreams yang ada untuk device ini
    const [datastreams]: any = await db.query(
      `SELECT id, pin, type, unit FROM datastreams WHERE device_id = ?`,
      [deviceId]
    );
    
    const insertedIds: number[] = [];
    
    // Ekstrak dan konversi timestamp dari raw data
    let deviceTime = null;
    if (rawData.timestamp && typeof rawData.timestamp === 'number') {
      // Konversi dari Unix timestamp (milliseconds) ke MySQL DATETIME
      deviceTime = new Date(rawData.timestamp).toISOString().slice(0, 19).replace('T', ' ');
    }
    
    // Parse setiap pin di raw data
    for (const [pin, value] of Object.entries(rawData)) {
      if (typeof value === 'number' && pin !== 'timestamp' && pin !== 'device_id') {
        
        // Cari datastream yang cocok dengan pin
        const datastream = datastreams.find((ds: any) => ds.pin === pin);
        if (datastream) {
          try {
            // Insert ke tabel payloads yang sudah ada dengan device_time
            const [result] = await db.query(
              `INSERT INTO payloads (device_id, datastream_id, value, raw_data, device_time, server_time)
              VALUES (?, ?, ?, ?, ?, NOW())`,
              [
                deviceId, 
                datastream.id, 
                value,
                JSON.stringify({ raw_payload_id: rawPayloadId, pin, value }),
                deviceTime
              ]
            );
            insertedIds.push(result.insertId);
            
          } catch (error) {
            console.error(`Error saving sensor data for pin ${pin}:`, error);
          }
        } else {
          console.warn(`⚠️ No datastream found for pin ${pin}`);
        }
      }
    }
    
    return insertedIds;
  } catch (error) {
    console.error("Error in parseAndNormalizePayload:", error);
    throw new Error("Failed to parse and normalize payload");
  }
}

// Fungsi untuk broadcasting real-time sensor updates
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
          // Broadcast real-time sensor update to all users
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

          broadcastFunction(broadcastData);
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
  verifyDeviceJWTAndDecrypt,
  parseAndNormalizePayload,
  broadcastSensorUpdates,
};

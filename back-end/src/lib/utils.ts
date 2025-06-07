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
];

// Konversi waktu dari string ke angka
function cookieAgeConverter(input: string) {
  const match = input.match(/^(\d+)([smhd])$/); // Regex untuk memisahkan angka dan satuan
  if (!match) throw new Error("Format waktu tidak valid. Gunakan format seperti '30m', '1h', dll.");

  const value = parseInt(match[1], 10); // Angka
  const unit = match[2];                // Satuan

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
      throw new Error("Satuan waktu tidak valid. Gunakan 's', 'm', 'h', atau 'd'.");
  }
}

// Fungsi untuk membuat cookie user
async function setAuthCookie(auth: any, jwt: any, userId: string) {
  const value = await jwt.sign({
    sub: userId,
    iat: Math.floor(Date.now() / 1000),
    type: "access",
  });

  auth.set({
    value,
    httpOnly: true,
    sameSite: process.env.USE_SECURE_COOKIE === "true" ? "none" : "lax",
    secure: process.env.USE_SECURE_COOKIE === "true" ? true : false,
    path: "/",
    maxAge: cookieAgeConverter(process.env.ACCESS_TOKEN_AGE!),
  });
}

// Fungsi untuk menghapus cookie user
function clearAuthCookie(auth: any) {
  auth.set({
    value: "",
    httpOnly: true,
    sameSite: process.env.USE_SECURE_COOKIE === "true" ? "none" : "lax",
    secure: process.env.USE_SECURE_COOKIE === "true" ? true : false,
    path: "/",
    maxAge: 0,
  });
}

// Fungsi untuk request token baru
async function renewToken(decoded: any) {
  const response = await fetch(
    `http://localhost:7600/auth/renew/${decoded.sub}`
  );
  const { accessToken } = await response.json();

  if (!accessToken) {
    throw new Error("Gagal memperbarui access token.");
  }
  return { accessToken };
}

// Fungsi untuk verify token jwt
async function authorizeRequest(jwt: any, auth: any) {
  try {
    let token = auth?.value;
    if (!token) throw new Error("Token tidak ditemukan di cookie");
    let decoded;
    try {
      decoded = await jwt.verify(token);
      if (!decoded) throw new Error("Token tidak valid");
      return decoded;
    } catch (err: any) {
      // Cek apakah token sudah expired
      if (err?.message?.toLowerCase().includes("expired")) {
        const { accessToken } = await renewToken(jwt.decode(token));
        if (!accessToken) throw new Error("Gagal memperbarui access token.");
        
        auth.value = accessToken;
        return await jwt.verify(accessToken);
      }
      throw err;
    }
  } catch (error: any) {
    console.error("❌ Terjadi kesalahan:", error);
    throw new Error(`Unauthorized. ${error.message}`);
  }
}

export { apiTags, authorizeRequest, setAuthCookie, clearAuthCookie, renewToken };

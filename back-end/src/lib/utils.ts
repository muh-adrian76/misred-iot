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
    maxAge: cookieAgeConverter(process.env.ACCESS_TOKEN_AGE!),
  });

  // Set refresh token
  cookie.refresh_token.set({
    value: refreshToken,
    httpOnly: true,
    sameSite: process.env.USE_SECURE_COOKIE === "true" ? "none" : "lax",
    secure: process.env.USE_SECURE_COOKIE === "true" ? true : false,
    path: "/",
    maxAge: cookieAgeConverter(process.env.REFRESH_TOKEN_AGE!), // misal 7d
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
      maxAge: cookieAgeConverter(process.env.ACCESS_TOKEN_AGE!),
    });

    decoded = await jwt.verify(newAccessToken);
    return decoded;
  } catch (error: any) {
    console.error("❌ Terjadi kesalahan:", error);
    throw new Error(`Unauthorized. ${error.message}`);
  }
}

export {
  apiTags,
  authorizeRequest,
  setAuthCookie,
  clearAuthCookie,
  renewToken,
};

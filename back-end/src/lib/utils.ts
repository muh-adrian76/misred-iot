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

async function setAuthCookie(auth: any, jwt: any, userId: string) {
  const value = await jwt.sign({
    sub: userId,
    iat: Math.floor(Date.now() / 1000),
    type: "access",
  });

  auth.set({
    value,
    httpOnly: true,
    sameSite: Bun.env.USE_SECURE_COOKIE === "true" ? "none" : "lax",
    secure: Bun.env.USE_SECURE_COOKIE === "true" ? true : false,
    path: "/",
    maxAge: 60 * 60 * 24,
  });
}

function clearAuthCookie(auth: any) {
  auth.set({
    value: "",
    httpOnly: true,
    sameSite: Bun.env.USE_SECURE_COOKIE === "true" ? "none" : "lax",
    secure: Bun.env.USE_SECURE_COOKIE === "true" ? true : false,
    path: "/",
    maxAge: 0,
  });
}

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

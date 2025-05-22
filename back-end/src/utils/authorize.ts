async function renewToken(decoded: any) {
  const response = await fetch(
      `http://localhost:7600/auth/renew/${decoded.sub}`
    );
    const { accessToken } = await response.json();

    if (!accessToken) {
      throw new Error("Gagal memperbarui access token.");
    }
    console.log("Access Token:", accessToken);
    return { accessToken };
  }

export async function authorizeRequest(jwt: any, authorization: string) {
  try {
    if (!authorization || !authorization.startsWith("Bearer ")) {
      throw new Error("Authorization header tidak ada atau tidak valid");
    }
    const token = authorization.split(" ")[1]; 
    const decoded = await jwt.verify(token);
    if (!decoded) {
      throw new Error("Token tidak valid");
    }
    return decoded;
  } catch (error: any) {
    console.error("❌ Terjadi kesalahan:", error);
    throw new Error(`Unauthorized. ${error.message}`);
  }
}

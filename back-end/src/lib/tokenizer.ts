// ===== IMPORTS =====
// Import plugin CORS untuk mengatur Cross-Origin Resource Sharing
import { cors } from "@elysiajs/cors";
// Import plugin JWT untuk pembuatan dan verifikasi JSON Web Token
import { jwt } from "@elysiajs/jwt";
// Import plugin Swagger untuk dokumentasi API otomatis
import { swagger } from "@elysiajs/swagger";
// Import framework Elysia untuk membangun REST API
import { Elysia } from "elysia";

// ===== TOKENIZER SERVER =====
// Server khusus untuk pembuatan refresh token terpisah dari main server
// Tujuan: Isolasi service token generation untuk keamanan dan skalabilitas
const app = new Elysia()
  // ===== CORS PLUGIN =====
  // Mengizinkan semua origin untuk mengakses tokenizer service
  .use(
    cors({
      origin: "*", // Izinkan semua origin (bisa dibatasi sesuai kebutuhan production)
    })
  )
  
  // ===== SWAGGER PLUGIN =====
  // Dokumentasi API otomatis untuk endpoints tokenizer
  .use(swagger())
  
  // ===== JWT PLUGIN =====
  // Konfigurasi JWT untuk pembuatan refresh token
  .use(
    jwt({
      name: "jwt", // Nama instance JWT
      secret: process.env.JWT_SECRET!, // Secret key dari environment variable
      exp: process.env.REFRESH_TOKEN_AGE, // Expiration time untuk refresh token
    })
  )
  
  // ===== TOKEN GENERATION ENDPOINT =====
  // Endpoint untuk generate refresh token berdasarkan nama/identifier
  .get("/sign/:name", ({ jwt, params: { name } }) => {
    // Generate dan return refresh token dengan payload standar
    return jwt.sign({
      // @ts-ignore - Suppress TypeScript warning untuk sub field
      iat: Math.floor(Date.now() / 1000), // Issued at time (UTC timestamp)
      sub: name, // Subject (biasanya user ID atau identifier)
      type: "refresh", // Type token untuk membedakan dari access token
    });
  })
  
  // ===== ERROR HANDLER =====
  // Global error handler untuk menangani error yang tidak terduga
  .onError(({ code }) => {
    // Handle 404 Not Found error
    if (code === "NOT_FOUND") {
      return "Route not found :("; // Response user-friendly untuk route tidak ditemukan
    }
  });

// ===== SERVER LISTENER =====
// Start tokenizer server pada port terpisah dari main server
app.listen(Number(process.env.TOKENIZER_PORT), () => {
  console.log(
    `🦊 Token Server telah berjalan pada ${app.server?.hostname}:${app.server?.port}`
  );
});

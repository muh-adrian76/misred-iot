/**
 * ===== AUTHENTICATION API ROUTES - ENDPOINT AUTENTIKASI SISTEM IoT =====
 * File ini mengatur semua endpoint API untuk autentikasi dan manajemen user
 * Meliputi: registrasi, login, verify OTP, Google OAuth, JWT token management
 */

import { Elysia, redirect } from "elysia";
import {
  authorizeRequest,
  clearAuthCookie,
  setAuthCookie,
} from "../../lib/utils";
import { AuthService } from "../../services/AuthService";
import { UserService } from "../../services/UserService";
import {
  getRefreshTokenSchema,
  getVerifyTokenSchema,
  postGoogleLoginSchema,
  postLoginSchema,
  postLogoutSchema,
  postRegisterSchema,
  postResetPasswordSchema,
  postResetForgottenPasswordSchema,
} from "./elysiaSchema";

export function authRoutes(authService: AuthService, userService: UserService) {
  return (
    new Elysia({ prefix: "/auth" })

      // ===== USER REGISTRATION ENDPOINT =====
      // POST /auth/register - Mendaftarkan user baru dengan verifikasi OTP
      .post(
        "/register",
        async ({ body }: any) => {
          const result = await authService.register(body);
          return new Response(JSON.stringify(result), {
            status: result.status,
          });
        },
        // @ts-ignore
        postRegisterSchema
      )

      // ===== OTP VERIFICATION ENDPOINT =====
      // POST /auth/verify-otp - Verifikasi kode OTP untuk aktivasi akun
      .post(
        "/verify-otp",
        async ({ body }: any) => {
          const result = await authService.verifyOTP(body);
          return new Response(JSON.stringify(result), {
            status: result.status,
          });
        }
      )

      // ===== RESEND OTP ENDPOINT =====
      // POST /auth/resend-otp - Kirim ulang kode OTP jika expired/tidak diterima
      .post(
        "/resend-otp",
        async ({ body }: any) => {
          const result = await authService.resendOTP(body);
          return new Response(JSON.stringify(result), {
            status: result.status,
          });
        }
      )

      // ===== ADMIN USER REGISTRATION ENDPOINT =====
      // POST /auth/admin/register - Admin mendaftarkan user baru (bypass OTP)
      .post(
        "/admin/register",
        // @ts-ignore
        async ({ jwt, cookie, body }) => {
          const decoded = await authorizeRequest(jwt, cookie);
          
          // Validasi apakah user yang request adalah admin
          const adminUser = await userService.getUserById(decoded.sub);
          if (!adminUser?.is_admin) {
            return new Response(JSON.stringify({
              status: "error",
              message: "Unauthorized: Admin access required"
            }), { status: 403 });
          }

          const result = await authService.registerAdmin(body);
          return new Response(JSON.stringify(result), {
            status: result.status,
          });
        },
        // @ts-ignore
        postRegisterSchema
      )

      // ===== USER LOGIN ENDPOINT =====
      // POST /auth/login - Login user dengan email/password dan set authentication cookies
      .post(
        "/login",
        // @ts-ignore
        async ({ jwt, body, cookie }) => {
          try {
            const result = await authService.login(body);

            // Jika login berhasil dan ada user data + refresh token
            if (
              result.status === 200 &&
              result.user?.id &&
              result.refreshToken
            ) {
              // Set authentication cookies (access_token + refresh_token)
              await setAuthCookie(
                cookie,
                jwt,
                result.user?.id,
                result.refreshToken
              );
              return new Response(JSON.stringify({ user: result.user }), {
                status: 200,
              });
            }
            // Jika login gagal, return pesan error
            return new Response(JSON.stringify({ message: result.message }), {
              status: result.status,
            });
          } catch (error) {
            console.error(error); // Log error untuk debugging
            return { status: 500, message: "Terjadi kesalahan pada server." };
          }
        },
        postLoginSchema
      )

      // ===== TOKEN VERIFICATION ENDPOINT =====
      // GET /auth/verify-token - Verifikasi validitas JWT token dari cookies
      .get(
        "/verify-token",
        // @ts-ignore
        async ({ jwt, cookie }) => {
          const result = await authService.verifyToken(jwt, cookie);
          return new Response(
            JSON.stringify(
              result ?? {
                status: 500,
                message: "Terjadi kesalahan pada server.",
              }
            ),
            { status: result?.status ?? 500 }
          );
        },
        getVerifyTokenSchema
      )

      // ===== REFRESH TOKEN ENDPOINT =====
      // GET /auth/renew/:id - Generate access token baru menggunakan refresh token
      .get(
        "/renew/:id",
        // @ts-ignore
        async ({ jwt, params, cookie }) => {
          const refreshTokenFromCookie = cookie.refresh_token?.value;
          const result = await authService.renewToken(
            jwt,
            params.id,
            refreshTokenFromCookie
          );
          return new Response(JSON.stringify(result), {
            status: result.status,
          });
        },
        getRefreshTokenSchema
      )

      // ===== GOOGLE OAUTH LOGIN ENDPOINT =====
      // POST /auth/google - Login menggunakan Google OAuth dengan token/code
      .post(
        "/google",
        // @ts-ignore
        async ({ jwt, body, cookie }) => {
          try {
            const result = await authService.googleLogin(body);

            // Jika Google login berhasil
            if (
              result.status === 200 &&
              result.user?.id &&
              result.refreshToken
            ) {
              // Set authentication cookies untuk sesi login
              await setAuthCookie(
                cookie,
                jwt,
                //@ts-ignore
                result.user.id,
                result.refreshToken
              );
              return new Response(JSON.stringify({ user: result.user }), {
                status: 200,
              });
            }
            return new Response(JSON.stringify({ message: result.message }), {
              status: result.status,
            });
          } catch (error) {
            console.error(error); // Log error untuk debugging
            return { status: 500, message: "Terjadi kesalahan pada server." };
          }
        },
        postGoogleLoginSchema
      )

      // ===== GOOGLE OAUTH CALLBACK ENDPOINT =====
      // GET /auth/google/callback - Handle redirect dari Google OAuth untuk mobile app
      .get("/google/callback", 
        // @ts-ignore
        async ({ request, cookie, jwt }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code"); // Authorization code dari Google
        if (!code) {
          return new Response(
            JSON.stringify({ message: "Authorization code not provided" }),
            { status: 400 }
          );
        }
        
        try {
          const result = await authService.googleLogin({ code, mode: "redirect" });
          
          if (result.status === 200 && result.user?.id && result.refreshToken) {
            // Set authentication cookies
            await setAuthCookie(
              cookie,
              jwt,
              result.user.id.toString(),
              result.refreshToken
            );
            
            // Generate JWT token untuk redirect ke aplikasi Android
            const token = await jwt.sign({
              sub: result.user.id,
              iat: Date.now(),
              type: "access",
            });
            
            // Redirect ke aplikasi Android WebView dengan custom scheme
            return redirect(`misredapp://callback?token=${token}`);
          } else {
            // Jika login gagal, redirect ke halaman error
            return redirect(`${process.env.FRONTEND_URL}/auth/error?message=${encodeURIComponent(result.message || "Authentication failed")}`);
          }
        } catch (error) {
          console.error("Google callback error:", error);
          return redirect(`${process.env.FRONTEND_URL}/auth/error?message=${encodeURIComponent("Authentication failed")}`);
        }
      })

      // ===== FORGOT PASSWORD RESET ENDPOINT =====
      // PUT /auth/reset-forgotten-password - Reset password menggunakan OTP (lupa password)
      .put(
        "/reset-forgotten-password",
        // @ts-ignore
        async ({ body }: any) => {
          const result = await authService.resetForgottenPassword(body);
          return new Response(JSON.stringify(result), {
            status: result.status,
          });
        },
        postResetForgottenPasswordSchema
      )

      // ===== PASSWORD CHANGE ENDPOINT =====
      // PUT /auth/reset-password - Ganti password untuk user yang sudah login
      .put(
        "/reset-password",
        // @ts-ignore
        async ({ jwt, cookie, body }: any) => {
          try {
            const decoded = await authorizeRequest(jwt, cookie);
            if (!decoded) {
              return new Response(JSON.stringify({ message: "Unauthorized" }), {
                status: 401,
              });
            }
            const result = await authService.resetPassword(decoded.sub, body);
            return new Response(JSON.stringify(result), {
              status: result.status,
            });
          } catch (error) {
            return new Response(JSON.stringify({ message: "Unauthorized" }), {
              status: 401,
            });
          }
        },
        postResetPasswordSchema
      )

      // ===== USER LOGOUT ENDPOINT =====
      // POST /auth/logout - Logout user dan hapus authentication cookies
      .post(
        "/logout",
        // @ts-ignore
        async ({ jwt, cookie }) => {
          const result = await authService.logout(jwt, cookie);
          clearAuthCookie(cookie); // Hapus cookies dari browser

          return new Response(JSON.stringify(result), {
            status: result.status,
          });
        },
        postLogoutSchema
      )

      // ===== ADMIN AUTHORIZATION CHECK ENDPOINT =====
      // GET /auth/check-admin - Cek apakah user yang login memiliki akses admin
      .get(
        "/check-admin",
        // @ts-ignore
        async ({ jwt, cookie }) => {
          try {
            const decoded = await authorizeRequest(jwt, cookie);
            // console.log("🔍 Decoded JWT:", { sub: decoded.sub });
            
            const user = await userService.getUserById(decoded.sub);
            // console.log("🔍 User from database:", { 
            //   id: user?.id, 
            //   name: user?.name, 
            //   email: user?.email,
            //   is_admin: user?.is_admin,
            //   is_admin_type: typeof user?.is_admin,
            //   boolean_value: Boolean(user?.is_admin)
            // });
            
            const response = {
              status: 200,
              isAdmin: Boolean(user?.is_admin), // Convert ke boolean untuk konsistensi
              user: {
                id: user?.id,
                name: user?.name,
                email: user?.email,
              }
            };
            
            // console.log("🔍 Sending response:", response);
            
            return new Response(JSON.stringify(response), { 
              status: 200,
              headers: {
                'Content-Type': 'application/json'
              }
            });
          } catch (error) {
            console.error("❌ Admin check error:", error);
            return new Response(JSON.stringify({
              status: 401,
              message: "Unauthorized"
            }), { status: 401 });
          }
        }
      )

      // ===== WEBSOCKET TOKEN GENERATION ENDPOINT =====
      // GET /auth/ws-token - Generate temporary token untuk WebSocket connection
      .get(
        "/ws-token",
        // @ts-ignore
        async ({ jwt, cookie }) => {
          try {
            const decoded = await authorizeRequest(jwt, cookie);
            if (!decoded) {
              console.log("❌ WebSocket token request: Authorization failed");
              return new Response(JSON.stringify({ 
                status: 401,
                message: "Unauthorized" 
              }), { status: 401 });
            }
            
            // Generate temporary WebSocket token (valid selama 30 menit)
            const wsTokenPayload = { 
              sub: decoded.sub, // User ID dari JWT yang ada
              type: "websocket", // Tipe khusus untuk WebSocket authentication
              exp: Date.now() + (30 * 60 * 1000) // Expired dalam 30 menit
            };
            
            // Debug token websocket (server-side logging)
            // console.log("🔑 Generating WebSocket token for user:", decoded.sub, "with payload:", wsTokenPayload);
            
            const wsToken = await jwt.sign(wsTokenPayload);
            
            return new Response(JSON.stringify({
              status: 200,
              ws_token: wsToken // Token untuk digunakan di WebSocket connection
            }), { 
              status: 200,
              headers: {
                'Content-Type': 'application/json'
              }
            });
          } catch (error) {
            console.error("❌ WebSocket token generation error:", error);
            return new Response(JSON.stringify({
              status: 401,
              message: "Unauthorized"
            }), { status: 401 });
          }
        }
      )
  );
}

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

      // ===== ENDPOINT REGISTRASI PENGGUNA =====
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

      // ===== ENDPOINT VERIFIKASI OTP =====
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

      // ===== ENDPOINT KIRIM ULANG OTP =====
      // POST /auth/resend-otp - Kirim ulang kode OTP jika kedaluwarsa/tidak diterima
      .post(
        "/resend-otp",
        async ({ body }: any) => {
          const result = await authService.resendOTP(body);
          return new Response(JSON.stringify(result), {
            status: result.status,
          });
        }
      )

      // ===== ENDPOINT REGISTRASI USER OLEH ADMIN =====
      // POST /auth/admin/register - Admin mendaftarkan user baru (bypass OTP)
      .post(
        "/admin/register",
        // @ts-ignore
        async ({ jwt, cookie, body }) => {
          const decoded = await authorizeRequest(jwt, cookie);
          
          // Validasi apakah user yang request adalah admin
          const adminUser = await userService.getUserById(decoded.sub);
          if (!adminUser?.is_admin) {
            return new Response(
              JSON.stringify({
                status: "error",
                message: "Tidak terotorisasi: Akses admin diperlukan",
              }),
              { status: 403 }
            );
          }

          const result = await authService.registerAdmin(body);
          return new Response(JSON.stringify(result), {
            status: result.status,
          });
        },
        // @ts-ignore
        postRegisterSchema
      )

      // ===== ENDPOINT LOGIN PENGGUNA =====
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
            console.error("Kesalahan saat login:", error);
            return { status: 500, message: "Terjadi kesalahan pada server." };
          }
        },
        postLoginSchema
      )

      // ===== ENDPOINT VERIFIKASI TOKEN =====
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

      // ===== ENDPOINT REFRESH TOKEN =====
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

      // ===== ENDPOINT LOGIN GOOGLE OAUTH =====
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
            console.error("Kesalahan saat login Google:", error);
            return { status: 500, message: "Terjadi kesalahan pada server." };
          }
        },
        postGoogleLoginSchema
      )

      // ===== ENDPOINT CALLBACK GOOGLE OAUTH =====
      // GET /auth/google/callback - Handle redirect dari Google OAuth untuk mobile app
      .get(
        "/google/callback",
        // @ts-ignore
        async ({ request, cookie, jwt }) => {
          const url = new URL(request.url);
          const code = url.searchParams.get("code"); // Authorization code dari Google
          if (!code) {
            return new Response(
              JSON.stringify({ message: "Authorization code tidak disediakan" }),
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
              return redirect(
                `${process.env.FRONTEND_URL}/auth/error?message=${encodeURIComponent(
                  result.message || "Autentikasi gagal"
                )}`
              );
            }
          } catch (error) {
            console.error("Google callback error:", error);
            return redirect(
              `${process.env.FRONTEND_URL}/auth/error?message=${encodeURIComponent(
                "Autentikasi gagal"
              )}`
            );
          }
        }
      )

      // ===== ENDPOINT RESET PASSWORD (LUPA PASSWORD) =====
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

      // ===== ENDPOINT GANTI PASSWORD =====
      // PUT /auth/reset-password - Ganti password untuk user yang sudah login
      .put(
        "/reset-password",
        // @ts-ignore
        async ({ jwt, cookie, body, set }: any) => {
          try {
            const decoded = await authorizeRequest(jwt, cookie);
            
            if (!decoded) {
              return new Response(
                JSON.stringify({ message: "Tidak terotorisasi" }),
                {
                  status: 401,
                }
              );
            }
            const result = await authService.resetPassword(decoded.sub, body);
            return new Response(JSON.stringify(result), {
              status: result.status,
            });
          } catch (error: any) {
            if (error.message && error.message.includes("Unauthorized")) {
              console.error("❌ Error autentikasi:", error.message);
              set.status = 401;
              return {
                success: false,
                message: "Autentikasi gagal",
              };
            }

            // Tangani error lainnya
            return new Response(
              JSON.stringify({
                success: false,
                message: error.message || "Terjadi kesalahan pada server",
              }),
              { status: 500 }
            );
          }
        },
        postResetPasswordSchema
      )

      // ===== ENDPOINT LOGOUT PENGGUNA =====
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

      // ===== ENDPOINT CEK AKSES ADMIN =====
      // GET /auth/check-admin - Cek apakah user yang login memiliki akses admin
      .get(
        "/check-admin",
        // @ts-ignore
        async ({ jwt, cookie }) => {
          try {
            const decoded = await authorizeRequest(jwt, cookie);
            
            const user = await userService.getUserById(decoded.sub);
            
            const response = {
              status: 200,
              isAdmin: Boolean(user?.is_admin),
              user: {
                id: user?.id,
                name: user?.name,
                email: user?.email,
              },
            };
            
            return new Response(JSON.stringify(response), {
              status: 200,
              headers: {
                "Content-Type": "application/json",
              },
            });
          } catch (error) {
            console.error("❌ Error cek admin:", error);
            return new Response(
              JSON.stringify({
                status: 401,
                message: "Tidak terotorisasi",
              }),
              { status: 401 }
            );
          }
        }
      )
  );
}

import { Elysia } from "elysia";
import {
  authorizeRequest,
  clearAuthCookie,
  setAuthCookie,
} from "../../lib/utils";
import { AuthService } from "../../services/AuthService";
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

export function authRoutes(authService: AuthService) {
  return (
    new Elysia({ prefix: "/auth" })

      // Register User
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

      // Login User
      .post(
        "/login",
        // @ts-ignore
        async ({ jwt, body, cookie }) => {
          try {
            const result = await authService.login(body);

            if (
              result.status === 200 &&
              result.user?.id &&
              result.refreshToken
            ) {
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
            return new Response(JSON.stringify({ message: result.message }), {
              status: result.status,
            });
          } catch (error) {
            console.error(error); // Show error in console
            return { status: 500, message: "Terjadi kesalahan pada server." };
          }
        },
        postLoginSchema
      )

      // Verify Token
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

      // Refresh Token
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

      // Google OAuth
      .post(
        "/google",
        // @ts-ignore
        async ({ jwt, body, cookie }) => {
          try {
            const result = await authService.googleLogin(body);

            if (
              result.status === 200 &&
              result.user?.id &&
              result.refreshToken
            ) {
              await setAuthCookie(
                cookie,
                jwt,
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
            console.error(error); // Show error in console
            return { status: 500, message: "Terjadi kesalahan pada server." };
          }
        },
        postGoogleLoginSchema
      )

      // Reset-forgotten-password
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

      // Reset-password
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

      // Logout
      .post(
        "/logout",
        // @ts-ignore
        async ({ jwt, cookie }) => {
          const result = await authService.logout(jwt, cookie);
          clearAuthCookie(cookie);

          return new Response(JSON.stringify(result), {
            status: result.status,
          });
        },
        postLogoutSchema
      )
  );
}

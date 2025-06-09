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
        async ({ jwt, body, cookie: { auth } }) => {
          const result = await authService.login(body);

          if (result.status === 200) {
            await setAuthCookie(auth, jwt, result.user?.id);
            return new Response(JSON.stringify({ user: result.user }), {
              status: 200,
            });
          }
          return new Response(JSON.stringify({ message: result.message }), {
            status: result.status,
          });
        },
        postLoginSchema
      )

      // Verify Token
      .get(
        "/verify-token",
        // @ts-ignore
        async ({ jwt, cookie: { auth } }) => {
          const result = await authService.verifyToken(jwt, auth);
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
        async ({ jwt, params }) => {
          const result = await authService.renewToken(jwt, params.id);
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
        async ({ jwt, body, cookie: { auth } }) => {
          const result = await authService.googleLogin(body);

          if (result.status === 200 && result.user?.id) {
            await setAuthCookie(auth, jwt, result.user.id);
            return new Response(JSON.stringify({ user: result.user }), {
              status: 200,
            });
          }
          return new Response(JSON.stringify({ message: result.message }), {
            status: result.status,
          });
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
        async ({ jwt, cookie: { auth }, body }: any) => {
          const decoded = await authorizeRequest(jwt, auth);
          const result = await authService.resetPassword(decoded.sub, body);
          return new Response(JSON.stringify(result), {
            status: result.status,
          });
        },
        postResetPasswordSchema
      )

      // Logout
      .post(
        "/logout",
        // @ts-ignore
        async ({ jwt, cookie: { auth } }) => {
          const result = await authService.logout(jwt, auth);
          clearAuthCookie(auth);

          return new Response(JSON.stringify(result), {
            status: result.status,
          });
        },
        postLogoutSchema
      )
  );
}

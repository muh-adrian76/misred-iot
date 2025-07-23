import { Elysia } from "elysia";
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

      // Admin: Register User
      .post(
        "/admin/register",
        // @ts-ignore
        async ({ jwt, cookie, body }) => {
          const decoded = await authorizeRequest(jwt, cookie);
          
          // Check if user is admin
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

      // Check admin status
      .get(
        "/check-admin",
        // @ts-ignore
        async ({ jwt, cookie }) => {
          try {
            console.log("🔍 Admin check endpoint called");
            const decoded = await authorizeRequest(jwt, cookie);
            console.log("🔍 Decoded JWT:", { sub: decoded.sub });
            
            const user = await userService.getUserById(decoded.sub);
            console.log("🔍 User from database:", { 
              id: user?.id, 
              name: user?.name, 
              email: user?.email,
              is_admin: user?.is_admin,
              is_admin_type: typeof user?.is_admin,
              boolean_value: Boolean(user?.is_admin)
            });
            
            const response = {
              status: 200,
              isAdmin: Boolean(user?.is_admin),
              user: {
                id: user?.id,
                name: user?.name,
                email: user?.email,
              }
            };
            
            console.log("🔍 Sending response:", response);
            
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
  );
}

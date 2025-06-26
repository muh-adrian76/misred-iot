import { cors } from "@elysiajs/cors";
import { jwt } from "@elysiajs/jwt";
import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";

// Server untuk pembuatan refresh token
const app = new Elysia()
  .use(
    cors({
      origin: "*",
    })
  )
  .use(swagger())
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET!,
      exp: process.env.REFRESH_TOKEN_AGE,
    })
  )
  .get("/sign/:name", ({ jwt, params: { name } }) => {
    return jwt.sign({
      // @ts-ignore
      sub: name,
      iat: Math.floor(Date.now() / 1000),
      type: "refresh",
    });
  })
  .onError(({ code }) => {
    if (code === "NOT_FOUND") {
      return "Route not found :(";
    }
  });

app.listen(Number(process.env.TOKENIZER_PORT), () => {
  console.log(
    `🦊 Token Server telah berjalan pada ${app.server?.hostname}:${app.server?.port}`
  );
});

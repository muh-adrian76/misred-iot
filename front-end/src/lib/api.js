import { edenTreaty } from "@elysiajs/eden";

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";
export const api = edenTreaty(backendUrl, {
  fetch: (input, init = {}) =>
    fetch(input, { ...init, credentials: "include" }),
});
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export async function fetchFromBackend(endpoint, options = {}) {
  const server = process.env.NEXT_PUBLIC_BACKEND_URL;

  const res = await fetch(`${server}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    credentials: "include", // penting untuk cookie
  });

  const data = await res.json();
  return { status: res.status, data };
}
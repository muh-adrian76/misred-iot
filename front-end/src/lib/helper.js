import { cache } from "react";

// Fungsi fetch ke API Backend
export function fetchFromBackend(endpoint, options = {}) {
  const server = process.env.NEXT_PUBLIC_BACKEND_URL;

  return fetch(`${server}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    credentials: "include", // penting untuk cookie
  });
}

// Direktori logo
export const brandLogo = `/${process.env.NEXT_PUBLIC_LOGO}`;

// Fungsi untuk konversi tanggal ke zona waktu Jakarta
export function convertDate(dateString) {
  const date = new Date(dateString).toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta", // GMT+7
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return `${date} (GMT +7)`;
}

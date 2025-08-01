// Directive untuk Next.js - menandakan bahwa komponen ini berjalan di client-side
"use client";

import { useEffect } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

// Wrapper untuk NextThemesProvider dengan konfigurasi default
// Mengelola tema aplikasi (light/dark/system)
export function ThemeProvider({ children, ...props }) {
  // Effect untuk mengatur tema default saat pertama kali aplikasi dimuat
  useEffect(() => {
    // Cek apakah sudah ada tema yang tersimpan di localStorage
    const savedTheme = localStorage.getItem("theme");

    // Jika belum ada tema tersimpan, set default ke "system"
    // System theme akan mengikuti preferensi OS user
    if (!savedTheme) {
      localStorage.setItem("theme", "system");
    }
  }, []);

  // Return NextThemesProvider dengan props yang diteruskan
  // Props bisa berisi konfigurasi seperti themes, defaultTheme, dll
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

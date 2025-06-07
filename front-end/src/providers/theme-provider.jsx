"use client";

import { useEffect } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({ children, ...props }) {
  // Reset tema ke "system" saat user menutup tab
  useEffect(() => {
    const resetThemeToSystem = () => {
      localStorage.setItem("theme", "system");
    };

    window.addEventListener("beforeunload", resetThemeToSystem);
    return () => {
      window.removeEventListener("beforeunload", resetThemeToSystem);
    };
  }, []);

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

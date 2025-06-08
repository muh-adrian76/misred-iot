"use client";

import { useEffect } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({ children, ...props }) {
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");

    if (!savedTheme) {
      localStorage.setItem("theme", "system");
    }
  }, []);

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

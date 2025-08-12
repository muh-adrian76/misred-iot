// Menggunakan "use client" untuk komponen React sisi klien
"use client";

// Import hooks React untuk state dan callback
import { useCallback, useEffect, useState } from "react";
// Import hook theme dari next-themes
import { useTheme } from "next-themes";
// Import ikon sun dan moon dari Lucide React
import { Sun, Moon } from "lucide-react";
// Import komponen Button UI
import { Button } from "@/components/ui/button";
// Import Framer Motion untuk animasi
import { motion, AnimatePresence } from "framer-motion";
// Import tooltip untuk deskripsi
import DescriptionTooltip from "../other/description-tooltip";

// Komponen button untuk toggle antara light dan dark theme
export default function ThemeButton({variant = "outline"}) {
  // Hook untuk mengakses dan mengubah theme
  const { setTheme, theme, systemTheme } = useTheme();
  // State untuk memastikan komponen sudah mounted (menghindari hydration error)
  const [mounted, setMounted] = useState(false);

  // Effect untuk set mounted state setelah komponen mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handler untuk toggle theme dengan animasi view transition
  const handleThemeToggle = useCallback(
    (e) => {
      // Tentukan theme baru (toggle antara dark dan light)
      const newMode = theme === "dark" ? "light" : "dark";
      const root = document.documentElement;

      // Jika browser tidak support view transition, langsung set theme
      if (!document.startViewTransition) {
        setTheme(newMode);
        return;
      }

      // Jika ada event click, set koordinat untuk animasi
      if (e) {
        root.style.setProperty("--x", `${e.clientX}px`);
        root.style.setProperty("--y", `${e.clientY}px`);
      }

      // Gunakan view transition API untuk animasi smooth
      document.startViewTransition(() => {
        setTheme(newMode);
      });
    },
    [theme, setTheme] // Dependencies untuk useCallback
  );

  return (
    // Tooltip untuk menjelaskan fungsi button
  <DescriptionTooltip content="Ganti Tema">
      <Button
        variant={variant} // Variant button (default: outline)
        size="icon" // Ukuran button khusus untuk ikon
        className="rounded-full hover:scale-105 cursor-pointer transition-all duration-500"
        onClick={handleThemeToggle} // Handler untuk toggle theme
      >
        {/* AnimatePresence untuk transisi smooth antar ikon */}
        <AnimatePresence mode="wait">
          {/* Hanya render jika komponen sudah mounted */}
          {mounted && (
            <motion.div
              key={theme} // Key berdasarkan theme untuk trigger animasi
              initial={{ opacity: 0 }} // Animasi masuk: mulai transparan
              animate={{ opacity: 1 }} // Animasi aktif: menjadi opaque
              exit={{ opacity: 0 }} // Animasi keluar: kembali transparan
              transition={{ duration: 0.5, ease: "easeInOut" }} // Konfigurasi animasi
            >
              {/* Conditional rendering ikon berdasarkan theme */}
              {theme === "dark" ? (
                <Moon className="w-5 h-5" />
              ) : theme === "light" ? (
                <Sun className="w-5 h-5" />
              ) : systemTheme === "dark" ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
              <span className="sr-only">Ganti tema</span>
            </motion.div>
          )}
        </AnimatePresence>
      </Button>
    </DescriptionTooltip>
  );
}
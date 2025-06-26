"use client";

import { useCallback } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import DescriptionTooltip from "../other/description-tooltip";

export default function ThemeButton() {
  const { setTheme, theme, systemTheme } = useTheme();

  const handleThemeToggle = useCallback(
    (e) => {
      const newMode = theme === "dark" ? "light" : "dark";
      const root = document.documentElement;

      if (!document.startViewTransition) {
        setTheme(newMode);
        return;
      }

      // Set coordinates from the click event
      if (e) {
        root.style.setProperty("--x", `${e.clientX}px`);
        root.style.setProperty("--y", `${e.clientY}px`);
      }

      document.startViewTransition(() => {
        setTheme(newMode);
      });
    },
    [theme, setTheme]
  );

  return (
    <DescriptionTooltip content="Ganti Tema">
      <Button
        variant="outline"
        size="icon"
        className="rounded-full cursor-pointer"
        onClick={handleThemeToggle}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={theme}
            initial={{ x: 5, y: -5, opacity: 0 }} // Muncul dari kanan atas
            animate={{ x: 0, y: 0, opacity: 1 }} // Bergerak ke tengah
            exit={{ x: -5, y: 5, opacity: 0 }} // Keluar ke kiri bawah
            transition={{ duration: 0.5, ease: "easeInOut" }}
          >
            {theme === "dark" ? (
              <Moon className="w-5 h-5" />
            ) : theme === "light" ? (
              <Sun className="w-5 h-5" />
            ) : systemTheme === "dark" ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
            <span className="sr-only">Toggle theme</span>
          </motion.div>
        </AnimatePresence>
      </Button>
    </DescriptionTooltip>
  );
}

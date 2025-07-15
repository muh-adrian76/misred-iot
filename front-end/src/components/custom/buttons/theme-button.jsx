"use client";

import { useCallback, useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import DescriptionTooltip from "../other/description-tooltip";

export default function ThemeButton() {
  const { setTheme, theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleThemeToggle = useCallback(
    (e) => {
      const newMode = theme === "dark" ? "light" : "dark";
      const root = document.documentElement;

      if (!document.startViewTransition) {
        setTheme(newMode);
        return;
      }

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
        className="rounded-full hover:scale-105 cursor-pointer transition-all duration-500"
        onClick={handleThemeToggle}
      >
        <AnimatePresence mode="wait">
          {mounted && (
            <motion.div
              key={theme}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
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
          )}
        </AnimatePresence>
      </Button>
    </DescriptionTooltip>
  );
}
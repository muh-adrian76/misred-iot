// Hooks untuk responsive breakpoint detection - detect ukuran layar dan device type
// Includes SSR safety untuk prevent hydration mismatch
"use client";
import * as React from "react"

// Hook utama untuk detect multiple breakpoints sekaligus
export function useBreakpoint() {
  const getStatus = () => {
    // SSR safety - default ke desktop width jika window belum ada
    const width = typeof window !== "undefined" ? window.innerWidth : 1200;
    return {
      isMobile: width < 640,      // Mobile phones
      isMedium: width >= 640 && width < 890,  // Small tablets
      isTablet: width >= 890 && width < 1025, // Tablets
      isDesktop: width >= 1025,   // Desktop & laptops
    };
  };

  const [status, setStatus] = React.useState(getStatus);

  React.useEffect(() => {
    const onResize = () => setStatus(getStatus());
    if (typeof window !== "undefined") {
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }
  }, []);

  return status;
}

// Hook khusus untuk mobile detection dengan SSR safety
// Berguna untuk sidebar toggling dan mobile-specific UI
export function useMobile() {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      if (typeof window !== "undefined") {
        setIsMobile(window.innerWidth < 768); // 768px breakpoint untuk mobile
      }
    };

    // Check on component mount
    checkMobile();

    // Add resize listener untuk dynamic updates
    if (typeof window !== "undefined") {
      window.addEventListener("resize", checkMobile);
      return () => window.removeEventListener("resize", checkMobile);
    }
  }, []);

  return isMobile;
}

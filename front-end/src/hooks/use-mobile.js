"use client";
import * as React from "react"

export function useBreakpoint() {
  const getStatus = () => {
    const width = typeof window !== "undefined" ? window.innerWidth : 1200;
    return {
      isMobile: width < 640,
      isMedium: width >= 640 && width < 890,
      isTablet: width >= 890 && width < 1025,
      isDesktop: width >= 1025,
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

// Hook khusus untuk cek mobile dengan SSR safety
export function useMobile() {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      if (typeof window !== "undefined") {
        setIsMobile(window.innerWidth < 768);
      }
    };

    // Check on mount
    checkMobile();

    // Add resize listener
    if (typeof window !== "undefined") {
      window.addEventListener("resize", checkMobile);
      return () => window.removeEventListener("resize", checkMobile);
    }
  }, []);

  return isMobile;
}

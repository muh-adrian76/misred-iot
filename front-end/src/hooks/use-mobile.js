// Hooks untuk responsive breakpoint detection - detect ukuran layar dan device type
// Includes SSR safety untuk prevent hydration mismatch
"use client";
import * as React from "react"

// Hook utama untuk detect multiple breakpoints sekaligus
export function useBreakpoint() {
  const [isClient, setIsClient] = React.useState(false);
  
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
    // Mark that we're now on the client
    setIsClient(true);
    
    const onResize = () => setStatus(getStatus());
    if (typeof window !== "undefined") {
      // Update status on client mount
      setStatus(getStatus());
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }
  }, []);

  // During SSR, return default desktop layout to avoid hydration mismatches
  if (!isClient) {
    return {
      isMobile: false,
      isMedium: false,
      isTablet: false,
      isDesktop: true,
    };
  }

  return status;
}

// Hook khusus untuk mobile detection dengan SSR safety
// Berguna untuk sidebar toggling dan mobile-specific UI
export function useMobile() {
  const [isMobile, setIsMobile] = React.useState(false);
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    // Mark that we're now on the client
    setIsClient(true);
    
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

  // Return false during SSR to avoid hydration mismatches
  return isClient ? isMobile : false;
}

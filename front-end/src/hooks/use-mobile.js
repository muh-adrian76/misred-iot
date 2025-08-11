// Hooks untuk deteksi breakpoint responsif - mendeteksi ukuran layar dan tipe perangkat
// Termasuk keamanan SSR untuk mencegah hydration mismatch
"use client";
import * as React from "react"

// Hook utama untuk mendeteksi banyak breakpoint sekaligus
export function useBreakpoint() {
  const [isClient, setIsClient] = React.useState(false);
  
  const getStatus = () => {
    // Keamanan SSR - default ke lebar desktop jika window belum ada
    const width = typeof window !== "undefined" ? window.innerWidth : 1200;
    return {
      isMobile: width < 640,      // Ponsel
      isMedium: width >= 640 && width < 890,  // Tablet kecil
      isTablet: width >= 890 && width < 1025, // Tablet
      isDesktop: width >= 1025,   // Desktop & laptop
    };
  };

  const [status, setStatus] = React.useState(getStatus);

  React.useEffect(() => {
    // Tandai bahwa kita sekarang berada di sisi client
    setIsClient(true);
    
    const onResize = () => setStatus(getStatus());
    if (typeof window !== "undefined") {
      // Perbarui status saat komponen ter-mount di client
      setStatus(getStatus());
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }
  }, []);

  // Selama SSR, kembalikan layout default desktop untuk menghindari hydration mismatch
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

// Hook khusus untuk deteksi mobile dengan keamanan SSR
// Berguna untuk toggle sidebar dan UI spesifik mobile
export function useMobile() {
  const [isMobile, setIsMobile] = React.useState(false);
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    // Tandai bahwa kita sekarang berada di sisi client
    setIsClient(true);
    
    const checkMobile = () => {
      if (typeof window !== "undefined") {
        setIsMobile(window.innerWidth < 768); // breakpoint 768px untuk mobile
      }
    };

    // Cek saat komponen mount
    checkMobile();

    // Tambahkan listener resize untuk pembaruan dinamis
    if (typeof window !== "undefined") {
      window.addEventListener("resize", checkMobile);
      return () => window.removeEventListener("resize", checkMobile);
    }
  }, []);

  // Kembalikan false selama SSR untuk menghindari hydration mismatch
  return isClient ? isMobile : false;
}

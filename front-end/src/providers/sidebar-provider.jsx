// Directive untuk Next.js - menandakan bahwa komponen ini berjalan di client-side
"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { useBreakpoint } from "@/hooks/use-mobile";

// Membuat context untuk mengatur state sidebar (terbuka/tertutup)
const SidebarOpenContext = createContext();

// Provider untuk mengelola state sidebar dan responsivitas
export function SidebarOpenProvider({ children }) {
  // State untuk mengontrol apakah sidebar terbuka atau tertutup
  // Default false (tertutup) untuk menghemat ruang layar
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Hook untuk mendeteksi ukuran layar (mobile, tablet, desktop)
  const { isMobile, isTablet, isDesktop } = useBreakpoint();

  // Effect untuk mengatur sidebar berdasarkan ukuran layar
  // Pada mobile, sidebar otomatis tertutup untuk menghemat ruang
  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [isMobile, sidebarOpen]);

  // Return provider dengan value yang berisi state dan setter
  return (
    <SidebarOpenContext.Provider value={{ sidebarOpen, setSidebarOpen }}>
      {children}
    </SidebarOpenContext.Provider>
  );
}

// Custom hook untuk mengakses sidebar context
// Memudahkan komponen lain untuk mengontrol sidebar
export function useSidebarOpen() {
  return useContext(SidebarOpenContext);
}

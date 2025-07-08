"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { useBreakpoint } from "@/hooks/use-mobile";

const SidebarOpenContext = createContext();

export function SidebarOpenProvider({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false); // default: terbuka
  const { isMobile, isTablet, isDesktop } = useBreakpoint();

  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [isMobile, sidebarOpen]);

  return (
    <SidebarOpenContext.Provider value={{ sidebarOpen, setSidebarOpen }}>
      {children}
    </SidebarOpenContext.Provider>
  );
}

export function useSidebarOpen() {
  return useContext(SidebarOpenContext);
}

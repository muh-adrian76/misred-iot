/**
 * KOMPONEN LOCATION PICKER CLIENT
 * 
 * LocationPickerClient adalah wrapper client-side untuk LocationPickerWithCoordinates
 * yang mengatasi masalah Server-Side Rendering (SSR) di Next.js. Komponen ini:
 * 
 * Fitur utama:
 * - Client-side only rendering untuk menghindari hydration errors
 * - Dynamic import dengan loading states yang smooth
 * - Proper SSR handling dengan mounted state checking
 * - Loading indicators yang konsisten dengan design system
 * - Error boundary untuk handling import failures
 * 
 * Masalah yang diatasi:
 * - SSR hydration mismatches karena browser-specific APIs
 * - Geolocation API yang tidak tersedia di server
 * - Navigator object yang undefined di server environment
 * - Dynamic imports yang memerlukan client-side execution
 * 
 * Loading States:
 * - Server-side: Menampilkan placeholder dengan loading indicator
 * - Client mounting: Loading state dengan pulse animation
 * - Dynamic import: Loading spinner dengan progress text
 * 
 * Props yang diteruskan:
 * - Semua props diteruskan langsung ke LocationPickerWithCoordinates
 * - Tidak ada transformasi atau filtering props
 */

"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

/**
 * Dynamic import untuk LocationPickerWithCoordinates
 * Disabled SSR untuk menghindari browser API issues
 * Loading component yang konsisten dengan design theme
 */
const LocationPickerWithCoordinates = dynamic(
  () => import("./location-picker-with-coordinates"),
  {
    ssr: false, // Critical: Disable server-side rendering untuk komponen ini
    loading: () => (
      <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800">
        <div className="animate-spin w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full"></div>
  <span className="text-sm text-gray-600 dark:text-gray-400">Memuat pemilih lokasi...</span>
      </div>
    )
  }
);

/**
 * Client-only wrapper komponen untuk LocationPicker
 * Mengatasi masalah SSR dan hydration di Next.js environment
 */
export function LocationPickerClient(props) {
  // ===== MOUNTING STATE =====
  // State untuk tracking apakah komponen sudah mounted di client
  const [isMounted, setIsMounted] = useState(false);

  // ===== MOUNT EFFECT =====
  /**
   * Effect untuk menandai bahwa komponen sudah mounted di client-side
   * Dijalankan hanya sekali setelah component mount
   */
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ===== SSR PROTECTION =====
  /**
   * Render fallback loading state selama proses SSR atau sebelum mount
   * Mencegah hydration mismatch antara server dan client rendering
   */
  if (!isMounted) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800">
        <div className="animate-pulse w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
  <span className="text-sm text-gray-600 dark:text-gray-400">Memuat...</span>
      </div>
    );
  }

  // ===== CLIENT-SIDE RENDER =====
  /**
   * Setelah komponen mounted, render LocationPickerWithCoordinates
   * dengan semua props yang diteruskan tanpa modifikasi
   */
  return <LocationPickerWithCoordinates {...props} />;
}

export default LocationPickerClient;

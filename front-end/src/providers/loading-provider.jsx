// Directive untuk Next.js - menandakan bahwa komponen ini berjalan di client-side
"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Progress } from "@/components/ui/progress";

// Komponen provider untuk menampilkan loading progress bar saat navigasi antar halaman
export default function LoadingProviders({ children }) {
  // Hook untuk mendapatkan pathname saat ini dan mendeteksi perubahan route
  const pathname = usePathname();
  
  // State untuk mengontrol visibilitas loading bar
  const [loading, setLoading] = useState(false);
  
  // State untuk mengontrol progress value (0-100)
  const [progress, setProgress] = useState(0);

  // Effect yang berjalan setiap kali pathname berubah (navigasi ke halaman lain)
  useEffect(() => {
    // Mulai loading sequence
    setLoading(true);
    setProgress(0);

    // Timer untuk animasi progress bar yang smooth
    // Progress dimulai dari 0, naik ke 80% dalam 100ms
    const start = setTimeout(() => setProgress(80), 100);
    
    // Progress naik ke 100% dalam 700ms
    const finish = setTimeout(() => setProgress(100), 700);
    
    // Sembunyikan loading bar dan reset progress dalam 900ms
    const end = setTimeout(() => {
      setLoading(false);
      setProgress(0);
    }, 900);

    // Cleanup function untuk membersihkan semua timeout jika component unmount
    // atau pathname berubah lagi sebelum animasi selesai
    return () => {
      clearTimeout(start);
      clearTimeout(finish);
      clearTimeout(end);
    };
  }, [pathname]);

  // Render loading progress bar dan children
  return (
    <>
      {/* Progress bar yang muncul di bagian atas layar saat loading */}
      {loading && (
        <Progress
          value={progress}
          className="fixed top-0 left-0 w-full z-[9999] transition-all"
        />
      )}
      {/* Render children components (konten halaman) */}
      {children}
    </>
  );
}

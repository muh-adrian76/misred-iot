// Hook untuk autentikasi user - verifikasi token dan handle auto-redirect
// Dipakai di seluruh aplikasi untuk melindungi rute dan memeriksa status login
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchFromBackend } from "@/lib/helper";

// Helper untuk verifikasi token ke backend
// Termasuk penanganan error dan opsi redirect ke halaman 401
const verifyToken = async (router, skipRedirect = false) => {
  try {
    const res = await fetchFromBackend("/auth/verify-token", {
      method: "GET",
    });

    if (!res.ok) {
      // Auto redirect ke 401 kecuali skipRedirect = true
      if (!skipRedirect) {
        router.push("/401");
      }
      return false;
    }

    return true;
  } catch (error) {
    console.error("useAuth: Kesalahan jaringan saat verifikasi token:", error);
    // Kesalahan jaringan juga dianggap tidak terautentikasi
    if (!skipRedirect) {
      router.push("/401");
    }
    return false;
  }
};

// Hook utama useAuth - cek status autentikasi dengan auto-redirect
export const useAuth = (skipRedirect = false) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true); // Loading state untuk mencegah flash konten
  const router = useRouter();

  useEffect(() => {
    const checkToken = async () => {
      try {
        const isValid = await verifyToken(router, skipRedirect);
        setIsAuthenticated(isValid);
        
        // Double-check redirect jika token tidak valid
        if (!isValid && !skipRedirect) {
          router.push("/401");
        }
      } catch (error) {
        console.error("useAuth: Kesalahan pada checkToken:", error);
        setIsAuthenticated(false);
        
        // Penanganan error dengan redirect ke 401
        if (!skipRedirect) {
          router.push("/401");
        }
      } finally {
        setLoading(false);
      }
    };

    checkToken();
  }, [router, skipRedirect]);
  
  return { isAuthenticated, loading };
};

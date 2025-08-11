// Hook untuk autentikasi admin - mengecek apakah user memiliki hak admin
// Digunakan untuk melindungi rute admin dan menampilkan konten khusus admin
"use client";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "./use-auth";
import { fetchFromBackend } from "@/lib/helper";

export function useAdminAuth() {
  // Menggunakan useAuth dengan skipRedirect untuk penanganan manual
  const { isAuthenticated, loading: authLoading } = useAuth(true);
  
  // State untuk status admin dan data user
  const [isAdmin, setIsAdmin] = useState(undefined); // undefined = belum dicek, true/false = hasil cek
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Effect untuk cek status admin setelah autentikasi selesai
  useEffect(() => {
    const checkAdminStatus = async () => {
      // Tunggu sampai auth loading selesai
      if (authLoading) {
        return;
      }

      // Jika tidak terautentikasi, set admin = false
      if (!isAuthenticated) {
        setIsAdmin(false);
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        // Panggil API untuk cek hak admin
        const response = await fetchFromBackend("/auth/check-admin");
        if (response.ok) {
          const data = await response.json();
          
          setIsAdmin(data.isAdmin || false);
          setUser(data.user || null);
          if (!data.isAdmin) {
            // Biarkan client.jsx yang menangani tampilan error
            return;
          }
        } else {
          setIsAdmin(false);
          setUser(null);
          // Jika cek admin gagal, biarkan client.jsx yang menangani
          return;
        }
      } catch (error) {
        console.error("useAdminAuth: Kesalahan saat memeriksa status admin:", error);
        setIsAdmin(false);
        setUser(null);
        // Error handling diserahkan ke client.jsx
        return;
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [isAuthenticated, authLoading]);
  
  // Memoize hasil untuk mencegah re-render yang tidak perlu
  const result = useMemo(() => ({
    isAdmin,
    isAuthenticated,
    user,
    loading: loading || authLoading, // Gabungkan auth loading dengan admin loading
  }), [isAdmin, isAuthenticated, user, loading, authLoading]);
  
  return result;
}

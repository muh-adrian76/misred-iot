// Hook untuk admin authentication - mengecek apakah user memiliki admin privileges
// Digunakan untuk protect admin routes dan menampilkan konten admin-only
"use client";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "./use-auth";
import { fetchFromBackend } from "@/lib/helper";

export function useAdminAuth() {
  // Menggunakan useAuth dengan skipRedirect untuk manual handling
  const { isAuthenticated, loading: authLoading } = useAuth(true);
  
  // States untuk admin status dan user data
  const [isAdmin, setIsAdmin] = useState(undefined); // undefined = belum dicek, true/false = hasil check
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Effect untuk check admin status setelah authentication selesai
  useEffect(() => {
    const checkAdminStatus = async () => {
      // Wait sampai auth loading selesai
      if (authLoading) {
        return;
      }

      // Jika tidak authenticated, set admin false
      if (!isAuthenticated) {
        setIsAdmin(false);
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        // API call untuk check admin privileges
        const response = await fetchFromBackend("/auth/check-admin");
        if (response.ok) {
          const data = await response.json();
          
          setIsAdmin(data.isAdmin || false);
          setUser(data.user || null);
          if (!data.isAdmin) {
            // Biarkan client.jsx yang handle tampilan error
            return;
          }
        } else {
          setIsAdmin(false);
          setUser(null);
          // Jika check admin gagal, biarkan client.jsx yang handle
          return;
        }
      } catch (error) {
        console.error("useAdminAuth: Error checking admin status:", error);
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
  
  // Memoize result untuk prevent unnecessary re-renders
  const result = useMemo(() => ({
    isAdmin,
    isAuthenticated,
    user,
    loading: loading || authLoading, // Gabungkan auth loading dengan admin loading
  }), [isAdmin, isAuthenticated, user, loading, authLoading]);
  
  return result;
}

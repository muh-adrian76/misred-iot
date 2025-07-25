"use client";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "./use-auth";
import { fetchFromBackend } from "@/lib/helper";

export function useAdminAuth() {
  const { isAuthenticated, loading: authLoading } = useAuth(true); // Skip redirect untuk handle manual
  const [isAdmin, setIsAdmin] = useState(undefined); // undefined = belum dicek
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      // Wait for auth to finish loading
      if (authLoading) {
        return;
      }

      if (!isAuthenticated) {
        console.log("useAdminAuth: Not authenticated - redirecting to 401");
        setIsAdmin(false);
        setUser(null);
        setLoading(false);
        // Redirect ke 401 karena tidak terautentikasi
        window.location.href = "/401";
        return;
      }

      try {
        const response = await fetchFromBackend("/auth/check-admin");
        if (response.ok) {
          const data = await response.json();
          
          setIsAdmin(data.isAdmin || false);
          setUser(data.user || null);
          
          // Jika bukan admin, redirect ke halaman utama atau 401
          if (!data.isAdmin) {
            window.location.href = "/401";
            return;
          }
        } else {
          setIsAdmin(false);
          setUser(null);
          // Jika check admin gagal, redirect ke 401
          window.location.href = "/401";
          return;
        }
      } catch (error) {
        console.error("useAdminAuth: Error checking admin status:", error);
        setIsAdmin(false);
        setUser(null);
        // Error juga redirect ke 401
        window.location.href = "/401";
        return;
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [isAuthenticated, authLoading]);
  
  // Memoize result untuk stabilitas
  const result = useMemo(() => ({
    isAdmin,
    isAuthenticated,
    user,
    loading: loading || authLoading, // Include auth loading in overall loading state
  }), [isAdmin, isAuthenticated, user, loading, authLoading]);
  
  return result;
}

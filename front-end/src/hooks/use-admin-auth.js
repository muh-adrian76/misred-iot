"use client";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "./use-auth";
import { fetchFromBackend } from "@/lib/helper";

export function useAdminAuth() {
  const isAuthenticated = useAuth();
  const [isAdmin, setIsAdmin] = useState(undefined); // undefined = belum dicek
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!isAuthenticated) {
        setIsAdmin(false);
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const response = await fetchFromBackend("/auth/check-admin");
        
        if (response.ok) {
          const data = await response.json();
          // console.log("useAdminAuth: Admin check result -", { isAdmin: data.isAdmin, user: data.user?.name });
          setIsAdmin(data.isAdmin || false);
          setUser(data.user || null);
        } else {
          // console.log("useAdminAuth: Admin check failed with status:", response.status);
          setIsAdmin(false);
          setUser(null);
        }
      } catch (error) {
        // console.error("useAdminAuth: Error checking admin status:", error);
        setIsAdmin(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [isAuthenticated]);
  
  // Memoize result untuk stabilitas
  const result = useMemo(() => ({
    isAdmin,
    isAuthenticated,
    user,
    loading,
  }), [isAdmin, isAuthenticated, user, loading]);
  
  return result;
}

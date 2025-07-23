"use client";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "./use-auth";
import { fetchFromBackend } from "@/lib/helper";

export function useAdminAuth() {
  const { isAuthenticated, loading: authLoading } = useAuth(true); // Skip redirect to handle it ourselves
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
        console.log("useAdminAuth: Not authenticated");
        setIsAdmin(false);
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        console.log("useAdminAuth: Checking admin status...");
        const response = await fetchFromBackend("/auth/check-admin");
        
        console.log("useAdminAuth: Response status:", response.status);
        console.log("useAdminAuth: Response ok:", response.ok);
        
        if (response.ok) {
          const data = await response.json();
          console.log("useAdminAuth: Admin check result -", { 
            isAdmin: data.isAdmin, 
            user: data.user?.name, 
            fullData: data,
            dataType: typeof data.isAdmin,
            booleanValue: Boolean(data.isAdmin)
          });
          setIsAdmin(data.isAdmin || false);
          setUser(data.user || null);
        } else {
          console.log("useAdminAuth: Admin check failed with status:", response.status);
          const errorText = await response.text();
          console.log("useAdminAuth: Error response:", errorText);
          setIsAdmin(false);
          setUser(null);
        }
      } catch (error) {
        console.error("useAdminAuth: Error checking admin status:", error);
        setIsAdmin(false);
        setUser(null);
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

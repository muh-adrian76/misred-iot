// Hook untuk user authentication - verify token dan handle auto-redirect
// Digunakan di seluruh aplikasi untuk protect routes dan check login status
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchFromBackend } from "@/lib/helper";

// Helper function untuk verify token dengan backend
// Includes error handling dan optional redirect ke 401 page
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
    console.error("useAuth: Network error during token verification:", error);
    // Network error juga dianggap unauthorized
    if (!skipRedirect) {
      router.push("/401");
    }
    return false;
  }
};

// Main useAuth hook - check authentication status dengan auto-redirect
export const useAuth = (skipRedirect = false) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true); // Loading state untuk prevent flash content
  const router = useRouter();

  useEffect(() => {
    const checkToken = async () => {
      try {
        const isValid = await verifyToken(router, skipRedirect);
        setIsAuthenticated(isValid);
        
        // Double-check redirect jika token invalid
        if (!isValid && !skipRedirect) {
          router.push("/401");
        }
      } catch (error) {
        console.error("useAuth: Error in checkToken:", error);
        setIsAuthenticated(false);
        
        // Error handling dengan redirect ke 401
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

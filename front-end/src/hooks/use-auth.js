"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchFromBackend } from "@/lib/helper";

const verifyToken = async (router, skipRedirect = false) => {
  try {
    const res = await fetchFromBackend("/auth/verify-token", {
      method: "GET",
    });

    if (!res.ok) {
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

export const useAuth = (skipRedirect = false) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkToken = async () => {
      try {
        const isValid = await verifyToken(router, skipRedirect);
        setIsAuthenticated(isValid);
        
        // Jika tidak valid dan tidak skip redirect, pastikan redirect terjadi
        if (!isValid && !skipRedirect) {
          router.push("/401");
        }
      } catch (error) {
        console.error("useAuth: Error in checkToken:", error);
        setIsAuthenticated(false);
        
        // Error juga harus redirect ke 401
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

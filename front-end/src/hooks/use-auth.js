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
      console.log(`useAuth: Token verification failed with status ${res.status}`);
      if (!skipRedirect) {
        console.log("useAuth: Redirecting to 401 page");
        router.push("/401");
      }
      return false;
    }

    console.log("useAuth: Token verification successful");
    return true;
  } catch (error) {
    console.error("useAuth: Network error during token verification:", error);
    // Network error juga dianggap unauthorized
    if (!skipRedirect) {
      console.log("useAuth: Network error - redirecting to 401 page");
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
          console.log("useAuth: User not authenticated, ensuring redirect to 401");
          router.push("/401");
        }
      } catch (error) {
        console.error("useAuth: Error in checkToken:", error);
        setIsAuthenticated(false);
        
        // Error juga harus redirect ke 401
        if (!skipRedirect) {
          console.log("useAuth: Error occurred - redirecting to 401 page");
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

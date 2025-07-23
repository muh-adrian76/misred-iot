"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchFromBackend } from "@/lib/helper";

const verifyToken = async (router, skipRedirect = false) => {
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
      } catch (error) {
        console.error("useAuth: Error verifying token:", error);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkToken();
  }, [router, skipRedirect]);
  
  return { isAuthenticated, loading };
};

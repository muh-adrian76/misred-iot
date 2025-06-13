"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchFromBackend } from "@/lib/helper";

const verifyToken = async (router) => {
  const res = await fetchFromBackend("/auth/verify-token", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!res.ok) {
    router.push("/401");
    return false;
  }

  return true;
};

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkToken = async () => {
      const isValid = await verifyToken(router);
      setIsAuthenticated(isValid);
    };

    checkToken();
  }, [router]);
  return isAuthenticated;
};

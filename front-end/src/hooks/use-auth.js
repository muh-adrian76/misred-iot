"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const verifyToken = async (router) => {
  const res = await fetch("http://localhost:7600/auth/verify-token", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!res.ok) {
    router.push("/login");
    return false;
  }

  return true;
};

const useAuth = () => {
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

export default useAuth;

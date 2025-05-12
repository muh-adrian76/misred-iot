"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const verifyToken = async (token, router) => {
  const res = await fetch("http://localhost:7600/user/verify-token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
  });

  const data = await res.json();
  console.log("Otorisasi:", data);
  if (!res.ok) {
    localStorage.removeItem("accessToken");
    router.push("/login");
    return false;
  }

  return true;
};

const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken");
      if (token) {
        const checkToken = async () => {
          const isValid = await verifyToken(token, router);
          setIsAuthenticated(isValid);
        };

        checkToken();
      }
      else {
        setIsAuthenticated(false);
        router.push("/login");
      }
    }
  }, [router]);

  return isAuthenticated;
};

export default useAuth;

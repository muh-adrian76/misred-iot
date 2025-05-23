"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const verifyToken = async (token) => {
  const res = await fetch("http://localhost:7600/auth/verify-token", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) return false;
  return true;
};

const useAuth = () => {
  const [status, setStatus] = useState("loading"); // "loading", "authenticated", "unauthenticated"
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("accessToken");

      if (!token) {
        setStatus("unauthenticated");
        router.push("/login");
        return;
      }

      const valid = await verifyToken(token);

      if (valid) {
        setStatus("authenticated");
      } else {
        localStorage.removeItem("accessToken");
        setStatus("unauthenticated");
        router.push("/login");
      }
    };

    checkAuth();
  }, [router]);

  return status;
};

export default useAuth;

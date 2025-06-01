"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

<<<<<<< HEAD
const verifyToken = async (token) => {
=======
const verifyToken = async (router) => {
>>>>>>> back-end/oop
  const res = await fetch("http://localhost:7600/auth/verify-token", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
<<<<<<< HEAD
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) return false;
=======
    },
    credentials: "include",
  });

  if (!res.ok) {
    router.push("/login");
    return false;
  }

>>>>>>> back-end/oop
  return true;
};

const useAuth = () => {
<<<<<<< HEAD
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
=======
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
>>>>>>> back-end/oop
};

export default useAuth;

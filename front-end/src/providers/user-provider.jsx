"use client";
import { createContext, useContext, useState, useEffect } from "react";

const UserContext = createContext();

// Dummy
export const userType = {
    id: "",
    name: "",
    email: "",
    created_at: "",
    last_login: "",
    phone: "",
    is_admin: false,
  }

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Ambil user dari localStorage
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) setUser(JSON.parse(storedUser));
    } catch (error) {
      console.error("Error accessing localStorage:", error);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Simpan user ke localStorage jika berubah
  useEffect(() => {
    if (isInitialized) {
      if (user && user.id && user.email) {
        localStorage.setItem("user", JSON.stringify(user));
      } else {
        localStorage.removeItem("user");
      }
    }
  }, [user, isInitialized]);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}

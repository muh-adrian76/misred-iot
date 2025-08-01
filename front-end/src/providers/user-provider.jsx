// Directive untuk Next.js - menandakan bahwa komponen ini berjalan di client-side
"use client";
import { createContext, useContext, useState, useEffect } from "react";

// Membuat context untuk menyimpan dan mengakses data user
const UserContext = createContext();

// Type definition untuk struktur data user (untuk dokumentasi)
// Berfungsi sebagai template/dummy untuk struktur user object
export const userType = {
    id: "", // ID unik user
    name: "", // Nama lengkap user
    email: "", // Email user
    created_at: "", // Tanggal pembuatan akun
    last_login: "", // Terakhir login
    phone: "", // Nomor telepon
    is_admin: false, // Status admin
  }

// Provider untuk mengelola state user dan autentikasi
export function UserProvider({ children }) {
  // State untuk menyimpan data user yang sedang login
  const [user, setUser] = useState(null);
  
  // State untuk melacak apakah proses inisialisasi sudah selesai
  // Penting untuk menghindari flash of incorrect state
  const [isInitialized, setIsInitialized] = useState(false);

  // Effect untuk memuat data user dari localStorage saat komponen pertama kali dimount
  useEffect(() => {
    try {
      // Ambil data user yang tersimpan di localStorage
      const storedUser = localStorage.getItem("user");
      if (storedUser) setUser(JSON.parse(storedUser));
    } catch (error) {
      // Handle error jika localStorage tidak accessible atau data corrupt
      console.error("Error accessing localStorage:", error);
    } finally {
      // Tandai bahwa proses inisialisasi sudah selesai
      setIsInitialized(true);
    }
  }, []);

  // Effect untuk menyimpan data user ke localStorage setiap kali user berubah
  // Hanya berjalan setelah inisialisasi selesai untuk menghindari overwrite data awal
  useEffect(() => {
    if (isInitialized) {
      // Cek apakah user memiliki data yang valid (minimal id dan email)
      if (user && user.id && user.email) {
        // Simpan user ke localStorage jika data valid
        localStorage.setItem("user", JSON.stringify(user));
      } else {
        // Hapus dari localStorage jika user null atau data tidak valid (logout)
        localStorage.removeItem("user");
      }
    }
  }, [user, isInitialized]);

  // Return provider dengan value yang berisi user state dan setter
  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

// Custom hook untuk mengakses user context
// Memudahkan komponen lain untuk mengakses dan mengubah data user
export function useUser() {
  return useContext(UserContext);
}

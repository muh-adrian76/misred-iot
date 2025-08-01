"use client";

// Import React dan komponen toast dari library Sonner untuk notifikasi
import React from "react";
import { toast as sonnerToast } from "sonner";
import { CheckCircle, Info, AlertTriangle } from "lucide-react";

/**
 * Fungsi toast kustom
 * 
 * Wrapper untuk sonner toast yang menggunakan komponen Toast kustom.
 * Memungkinkan pembuatan toast dengan styling yang konsisten dengan
 * desain aplikasi IoT MiSREd.
 * 
 * @param {Object} toast - Objek konfigurasi toast
 * @param {string} toast.title - Judul toast
 * @param {string} toast.description - Deskripsi atau pesan detail
 * @param {string} toast.type - Tipe toast (success, info, error)
 */
function toast(toast) {
  return sonnerToast.custom((id) => (
    <Toast
      id={id}
      title={toast.title}
      description={toast.description}
      type={toast.type}
    />
  ));
}

/**
 * Komponen Toast
 * 
 * Komponen toast kustom yang menampilkan notifikasi dengan styling
 * yang konsisten. Mendukung berbagai tipe notifikasi dengan ikon
 * dan warna yang sesuai untuk aplikasi IoT.
 * 
 * @param {Object} props - Props komponen
 * @param {string} props.title - Judul notifikasi
 * @param {string} props.description - Deskripsi notifikasi
 * @param {string} props.type - Tipe notifikasi (success, info, error)
 */
function Toast(props) {
  const { title, description, type } = props;

  // Fungsi untuk mendapatkan konfigurasi visual berdasarkan tipe toast
  // Setiap tipe memiliki ikon, warna background, dan shadow yang berbeda
  const getToastConfig = (type) => {
    switch (type) {
      case "success":
        return {
          icon: <CheckCircle className="h-4 w-4 text-green-500" />,
          iconBg: "bg-green-100 dark:bg-green-900",
          shadowColor: "shadow-sm dark:shadow-green-900",
        };
      case "info":
        return {
          icon: <Info className="h-4 w-4 text-blue-500" />,
          iconBg: "bg-blue-100 dark:bg-blue-900",
          shadowColor: "shadow-sm dark:shadow-blue-900",
        };
      case "error":
        return {
          icon: <AlertTriangle className="h-4 w-4 text-red-500" />,
          iconBg: "bg-red-100 dark:bg-red-900",
          shadowColor: "shadow-sm dark:shadow-red-900",
        };
      default:
        return {
          icon: <Info className="h-4 w-4 text-gray-500" />,
          iconBg: "bg-gray-100 dark:bg-gray-900",
          shadowColor: "shadow-sm dark:shadow-gray-900",
        };
    }
  };

  // Ambil konfigurasi visual berdasarkan tipe toast
  const config = getToastConfig(type);

  return (
    // Container utama toast dengan styling responsif dan tema gelap/terang
    <div
      className={`
      flex justify-center items-center py-3 px-5 w-full md:min-w-[350px]
      bg-white dark:bg-gray-900
      border border-gray-200 dark:border-gray-700
      rounded-lg ${config.shadowColor}
      transition-all duration-200 ease-in-out
      hover:shadow-lg
    `}
    >
      {/* Container ikon dengan background berwarna sesuai tipe toast */}
      <div
        className={`
        flex-shrink-0 w-6 h-6 rounded-full
        ${config.iconBg}
        flex items-center justify-center
        mr-3
      `}
      >
        {/* Ikon yang sesuai dengan tipe notifikasi */}
        {config.icon}
      </div>

      {/* Container konten teks dengan flex yang dapat menyesuaikan ukuran */}
      <div className="flex-1 min-w-0 font-sans">
        {/* Judul toast dengan font yang lebih tebal */}
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </p>
        {/* Deskripsi toast dengan warna yang lebih redup */}
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {description}
        </p>
      </div>
    </div>
  );
}

// Fungsi helper untuk memudahkan pemanggilan toast dengan tipe tertentu
// Setiap fungsi sudah memiliki tipe yang telah ditentukan

/**
 * Toast untuk notifikasi sukses
 * Digunakan ketika operasi IoT berhasil (device terhubung, data tersimpan, dll)
 */
export function successToast(title, description) {
  toast({
    type: "success",
    title,
    description,
  });
}

/**
 * Toast untuk notifikasi informasi
 * Digunakan untuk memberikan informasi umum kepada pengguna
 */
export function infoToast(title, description) {
  toast({
    type: "info",
    title,
    description,
  });
}

/**
 * Toast untuk notifikasi error
 * Digunakan ketika terjadi kesalahan dalam sistem IoT atau operasi gagal
 */
export function errorToast(title, description) {
  toast({
    type: "error",
    title,
    description,
  });
}

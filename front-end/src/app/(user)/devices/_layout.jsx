// Komponen client-side untuk layout halaman devices
"use client";

// Import custom hook untuk logic dan state management devices
import { useDeviceLogic } from "@/components/features/device/device-logic";

// Import komponen untuk konten dan dialog devices
import DeviceContent from "@/components/features/device/device-content";
import DeviceDialogs from "@/components/features/device/device-dialogs";

/**
 * Layout komponen untuk halaman manajemen devices IoT
 * Menggunakan custom hook untuk centralized logic dan state management
 * @returns {JSX.Element|null} Layout devices atau null jika tidak terautentikasi
 */
export default function DeviceLayout() {
  // Hook untuk mendapatkan semua logic dan state devices
  const logic = useDeviceLogic();

  // Guard clause: tidak render jika user belum terautentikasi
  if (!logic.isAuthenticated) return null;

  return (
    <>
      {/* Komponen utama untuk menampilkan konten devices */}
      {/* Menerima semua props dari logic hook menggunakan spread operator */}
      <DeviceContent {...logic} />
      
      {/* Komponen untuk semua dialog dan modal devices */}
      {/* Termasuk dialog tambah, edit, delete, dan detail device */}
      <DeviceDialogs {...logic} />
    </>
  );
}

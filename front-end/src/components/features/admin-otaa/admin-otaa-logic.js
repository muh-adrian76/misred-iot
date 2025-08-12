// Hook kustom untuk Logika Admin OTAA - mengelola seluruh state dan operasi manajemen firmware
// Manajemen state: daftar firmware, status loading, pencarian, filter
// Operasi API: fetchFirmwares, uploadFirmware, deleteFirmware, downloadFirmware
"use client";

import { useState, useEffect } from "react";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { fetchFromBackend } from "@/lib/helper";
import { successToast, errorToast } from "@/components/custom/other/toaster";

export function useAdminOTAALogic() {
  // State autentikasi
  const { isAuthenticated, isAdmin } = useAdminAuth();

  // State data utama
  const [firmwares, setFirmwares] = useState([]); // Semua firmware
  const [globalFirmwares, setGlobalFirmwares] = useState({}); // Firmware global dikelompokkan per tipe board
  const [loading, setLoading] = useState(false); // Status loading untuk fetch
  const [globalLoading, setGlobalLoading] = useState(false); // Status loading untuk firmware global
  const [uploading, setUploading] = useState(false); // Status loading untuk upload

  // State pencarian dan filter
  const [searchTerm, setSearchTerm] = useState(""); // Fitur pencarian
  const [selectedBoardType, setSelectedBoardType] = useState("all"); // Filter berdasarkan tipe board
  const [boardTypes, setBoardTypes] = useState([]); // Daftar tipe board yang tersedia

  // State dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [firmwareToDelete, setFirmwareToDelete] = useState(null);

  // State form upload
  const [uploadForm, setUploadForm] = useState({
    board_type: "",
    firmware_version: "",
    file: null,
    filename: "",
    description: ""
  });

  // ===== OPERASI API =====

  // Ambil firmware dari ADMIN API (semua firmware dari semua pengguna)
  const fetchFirmwares = async () => {
    setLoading(true);
    try {
      const response = await fetchFromBackend("/admin/otaa"); // Admin endpoint
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setFirmwares(data.data);
          // Ambil tipe board unik untuk filter
          const types = [...new Set(data.data.map(fw => fw.board_type))];
          setBoardTypes(types);
        } else {
          setFirmwares([]);
          setBoardTypes([]);
        }
      }
    } catch (error) {
      console.error("Gagal mengambil daftar firmware:", error);
      errorToast("Gagal memuat data firmware");
    } finally {
      setLoading(false);
    }
  };

  // Ambil firmware global yang dikelompokkan per tipe board
  const fetchGlobalFirmwares = async () => {
    setGlobalLoading(true);
    try {
      const response = await fetchFromBackend("/admin/otaa/global");
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setGlobalFirmwares(data.data);
        } else {
          setGlobalFirmwares({});
        }
      }
    } catch (error) {
      console.error("Gagal mengambil firmware global:", error);
      errorToast("Gagal memuat data firmware global");
    } finally {
      setGlobalLoading(false);
    }
  };

  // Validasi saat unggah file
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validasi tipe file
      const allowedTypes = ['.bin', '.hex'];
      const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      
      if (!allowedTypes.includes(fileExt)) {
        errorToast("Hanya file .bin dan .hex yang diizinkan!");
        return;
      }

      // Validasi ukuran file (maks 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB dalam byte
      if (file.size > maxSize) {
        errorToast("Ukuran file maksimal 10MB!");
        return;
      }

      setUploadForm(prev => ({
        ...prev,
        file: file,
        filename: file.name
      }));
    }
  };

  // Admin dapat mengunggah firmware GLOBAL untuk semua pengguna dengan tipe board yang sama
  const handleUploadFirmware = async (e) => {
    e.preventDefault();
    
    if (!uploadForm.file || !uploadForm.board_type || !uploadForm.firmware_version) {
      errorToast("Semua field harus diisi!");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("firmware", uploadForm.file);
      formData.append("board_type", uploadForm.board_type);
      formData.append("firmware_version", uploadForm.firmware_version);
      if (uploadForm.description) {
        formData.append("description", uploadForm.description);
      }

      const response = await fetchFromBackend("/admin/otaa", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        successToast(`Firmware global berhasil diunggah! Akan mempengaruhi ${data.data.affected_users} pengguna dengan board ${data.data.board_type}.`);
        
        // Reset form
        setUploadForm({
          board_type: "",
          firmware_version: "",
          file: null, 
          filename: "",
          description: ""
        });
        
        // Segarkan daftar firmware
        await fetchFirmwares();
        await fetchGlobalFirmwares();
      } else {
        throw new Error(data.message || "Gagal mengunggah firmware global");
      }
    } catch (error) {
      console.error("Kesalahan unggah:", error);
      errorToast(error.message || "Gagal mengunggah firmware global!");
    } finally {
      setUploading(false);
    }
  };

  // Unduh firmware
  const handleDownload = async (boardType, filename) => {
    try {
      const response = await fetchFromBackend(`/otaa/download/${boardType}/${filename}`);
      if (!response.ok) throw new Error("Gagal mengunduh firmware");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
  successToast("Firmware berhasil diunduh!");
    } catch (error) {
  console.error("Kesalahan unduh:", error);
  errorToast("Gagal mengunduh firmware!");
    }
  };

  // Mulai hapus - buka dialog konfirmasi
  const handleDeleteStart = (firmware) => {
    setFirmwareToDelete(firmware);
    setDeleteDialogOpen(true);
  };

  // Konfirmasi hapus - hapus firmware menggunakan ADMIN API
  const handleDeleteConfirm = async () => {
    if (!firmwareToDelete) return;
    
    try {
      const response = await fetchFromBackend(`/admin/otaa/${firmwareToDelete.id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          successToast("Firmware berhasil dihapus!");
          fetchFirmwares(); // Segarkan data
        } else {
          errorToast(result.message || "Gagal menghapus firmware!");
        }
      } else {
        errorToast("Gagal menghapus firmware!");
      }
    } catch (error) {
      console.error("Kesalahan hapus:", error);
      errorToast("Gagal menghapus firmware!");
    } finally {
      setDeleteDialogOpen(false);
      setFirmwareToDelete(null);
    }
  };

  // Batalkan hapus - tutup dialog
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setFirmwareToDelete(null);
  };

  // ===== NILAI TURUNAN (COMPUTED) =====

  // Filter firmware berdasarkan pencarian dan tipe board (mendukung owner_display untuk firmware global vs pengguna)
  const filteredFirmwares = firmwares.filter(firmware => {
    const matchesSearch = firmware.firmware_url.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          firmware.firmware_version.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          firmware.board_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (firmware.owner_name && firmware.owner_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (firmware.owner_email && firmware.owner_email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (firmware.owner_display && firmware.owner_display.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesBoardType = selectedBoardType === "all" || firmware.board_type === selectedBoardType;
    return matchesSearch && matchesBoardType;
  });

  // Muat data saat komponen dipasang
  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchFirmwares();
      fetchGlobalFirmwares();
    }
  }, [isAuthenticated, isAdmin]);

  // Daftar opsi board untuk pilihan di form
  const boardOptions = [
    "ESP32",
    "ESP8266",
    "Arduino",
    "Raspberry Pi",
    "Lainnya",
  ];

  // Kembalikan semua state dan fungsi yang dibutuhkan komponen
  return {
    // Autentikasi
    isAuthenticated,
    isAdmin,
    
    // State data
    firmwares,
    filteredFirmwares,
    globalFirmwares,
    boardTypes,
    boardOptions,
    
    // Status loading
    loading,
    uploading,
    globalLoading,
    
    // Pencarian dan filter
    searchTerm,
    setSearchTerm,
    selectedBoardType,
    setSelectedBoardType,
    
    // Form upload
    uploadForm,
    setUploadForm,
    handleFileUpload,
    handleUploadFirmware,
    
    // Dialog hapus
    deleteDialogOpen,
    setDeleteDialogOpen,
    firmwareToDelete,
    handleDeleteStart,
    handleDeleteConfirm,
    handleDeleteCancel,
    
    // Aksi
    fetchFirmwares,
    fetchGlobalFirmwares,
    handleDownload,
  };
}

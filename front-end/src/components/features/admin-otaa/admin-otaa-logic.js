// Custom hook untuk Admin OTAA Logic - handles all firmware management state and operations
// State management: firmwares list, loading states, search, filters
// API operations: fetchFirmwares, uploadFirmware, deleteFirmware, downloadFirmware
"use client";

import { useState, useEffect } from "react";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { fetchFromBackend } from "@/lib/helper";
import { successToast, errorToast } from "@/components/custom/other/toaster";

export function useAdminOTAALogic() {
  // Authentication state
  const { isAuthenticated, isAdmin } = useAdminAuth();

  // Main data state
  const [firmwares, setFirmwares] = useState([]); // All firmwares
  const [globalFirmwares, setGlobalFirmwares] = useState({}); // Global firmwares grouped by board type
  const [loading, setLoading] = useState(false); // Loading state for fetch
  const [globalLoading, setGlobalLoading] = useState(false); // Loading state for global firmwares
  const [uploading, setUploading] = useState(false); // Loading state for upload

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState(""); // Search functionality
  const [selectedBoardType, setSelectedBoardType] = useState("all"); // Filter by board type
  const [boardTypes, setBoardTypes] = useState([]); // Available board types

  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [firmwareToDelete, setFirmwareToDelete] = useState(null);

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    board_type: "",
    firmware_version: "",
    file: null,
    filename: "",
    description: ""
  });

  // ===== API OPERATIONS =====

  // Fetch firmwares from ADMIN API (semua firmware dari semua user)
  const fetchFirmwares = async () => {
    setLoading(true);
    try {
      const response = await fetchFromBackend("/admin/otaa"); // Admin endpoint
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setFirmwares(data.data);
          // Extract unique board types for filter
          const types = [...new Set(data.data.map(fw => fw.board_type))];
          setBoardTypes(types);
        } else {
          setFirmwares([]);
          setBoardTypes([]);
        }
      }
    } catch (error) {
      console.error("Error fetching firmwares:", error);
      errorToast("Gagal memuat data firmware");
    } finally {
      setLoading(false);
    }
  };

  // Fetch global firmwares grouped by board type
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
      console.error("Error fetching global firmwares:", error);
      errorToast("Gagal memuat data firmware global");
    } finally {
      setGlobalLoading(false);
    }
  };

  // Handle file upload validation
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['.bin', '.hex'];
      const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      
      if (!allowedTypes.includes(fileExt)) {
        errorToast("Hanya file .bin dan .hex yang diizinkan!");
        return;
      }

      // Validate file size (10MB max)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
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

  // Admin dapat mengupload firmware GLOBAL untuk semua user dengan board type yang sama
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
        successToast(`Firmware global berhasil diupload! Akan mempengaruhi ${data.data.affected_users} user dengan board ${data.data.board_type}.`);
        
        // Reset form
        setUploadForm({
          board_type: "",
          firmware_version: "",
          file: null, 
          filename: "",
          description: ""
        });
        
        // Refresh firmware list
        await fetchFirmwares();
        await fetchGlobalFirmwares();
      } else {
        throw new Error(data.message || "Gagal mengupload firmware global");
      }
    } catch (error) {
      console.error("Upload error:", error);
      errorToast(error.message || "Gagal mengupload firmware global!");
    } finally {
      setUploading(false);
    }
  };

  // Handle download firmware
  const handleDownload = async (boardType, filename) => {
    try {
      const response = await fetchFromBackend(`/otaa/download/${boardType}/${filename}`);
      if (!response.ok) throw new Error("Gagal download firmware");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      successToast("Firmware berhasil didownload!");
    } catch (error) {
      console.error("Download error:", error);
      errorToast("Gagal download firmware!");
    }
  };

  // Handle delete start - open confirmation dialog
  const handleDeleteStart = (firmware) => {
    setFirmwareToDelete(firmware);
    setDeleteDialogOpen(true);
  };

  // Handle delete confirm - actually delete the firmware using ADMIN API
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
          fetchFirmwares(); // Refresh data
        } else {
          errorToast(result.message || "Gagal menghapus firmware!");
        }
      } else {
        errorToast("Gagal menghapus firmware!");
      }
    } catch (error) {
      console.error("Delete error:", error);
      errorToast("Gagal menghapus firmware!");
    } finally {
      setDeleteDialogOpen(false);
      setFirmwareToDelete(null);
    }
  };

  // Handle delete cancel - close dialog
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setFirmwareToDelete(null);
  };

  // ===== COMPUTED VALUES =====

  // Filter firmwares based on search and board type (support owner_display untuk global vs user firmware)
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

  // Load data on component mount
  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchFirmwares();
      fetchGlobalFirmwares();
    }
  }, [isAuthenticated, isAdmin]);

  // Daft board options for form select
  const boardOptions = [
    "ESP32",
    "ESP8266",
    "Arduino",
    "Raspberry Pi",
    "Lainnya",
  ];

  // Return all state and functions for components to use
  return {
    // Authentication
    isAuthenticated,
    isAdmin,
    
    // Data state
    firmwares,
    filteredFirmwares,
    globalFirmwares,
    boardTypes,
    boardOptions,
    
    // Loading states
    loading,
    uploading,
    globalLoading,
    
    // Search and filter
    searchTerm,
    setSearchTerm,
    selectedBoardType,
    setSelectedBoardType,
    
    // Upload form
    uploadForm,
    setUploadForm,
    handleFileUpload,
    handleUploadFirmware,
    
    // Delete dialog
    deleteDialogOpen,
    setDeleteDialogOpen,
    firmwareToDelete,
    handleDeleteStart,
    handleDeleteConfirm,
    handleDeleteCancel,
    
    // Actions
    fetchFirmwares,
    fetchGlobalFirmwares,
    handleDownload,
  };
}

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
  const [loading, setLoading] = useState(false); // Loading state for fetch
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
    filename: ""
  });

  // ===== API OPERATIONS =====

  // Fetch firmwares from API
  const fetchFirmwares = async () => {
    setLoading(true);
    try {
      const response = await fetchFromBackend("/otaa");
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

  // Handle upload firmware
  const handleUploadFirmware = async (e) => {
    e.preventDefault();
    
    if (!uploadForm.board_type || !uploadForm.firmware_version || !uploadForm.file) {
      errorToast("Semua field harus diisi!");
      return;
    }

    setUploading(true);
    try {
      // Convert file to base64
      const fileReader = new FileReader();
      fileReader.onload = async () => {
        const base64 = fileReader.result.split(',')[1];
        
        const uploadData = {
          board_type: uploadForm.board_type.trim(),
          firmware_version: uploadForm.firmware_version.trim(),
          filename: uploadForm.filename,
          file_base64: base64
        };

        const response = await fetchFromBackend("/otaa/upload", {
          method: "POST",
          body: JSON.stringify(uploadData)
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            successToast("Firmware berhasil diupload!");
            
            // Reset form
            setUploadForm({
              board_type: "",
              firmware_version: "",
              file: null,
              filename: ""
            });
            
            // Reset file input
            const fileInput = document.querySelector('input[type="file"]');
            if (fileInput) fileInput.value = '';
            
            // Refresh data
            fetchFirmwares();
          } else {
            errorToast(result.message || "Gagal upload firmware!");
          }
        } else {
          errorToast("Gagal upload firmware!");
        }
      };
      fileReader.readAsDataURL(uploadForm.file);
    } catch (error) {
      console.error("Upload error:", error);
      errorToast("Gagal upload firmware!");
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

  // Handle delete confirm - actually delete the firmware
  const handleDeleteConfirm = async () => {
    if (!firmwareToDelete) return;
    
    try {
      const response = await fetchFromBackend(`/otaa/${firmwareToDelete.id}`, {
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

  // Filter firmwares based on search and board type
  const filteredFirmwares = firmwares.filter(firmware => {
    const matchesSearch = firmware.firmware_url.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          firmware.firmware_version.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          firmware.board_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBoardType = selectedBoardType === "all" || firmware.board_type === selectedBoardType;
    return matchesSearch && matchesBoardType;
  });

  // Load data on component mount
  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchFirmwares();
    }
  }, [isAuthenticated, isAdmin]);

  // Return all state and functions for components to use
  return {
    // Authentication
    isAuthenticated,
    isAdmin,
    
    // Data state
    firmwares,
    filteredFirmwares,
    boardTypes,
    
    // Loading states
    loading,
    uploading,
    
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
    handleDownload,
  };
}

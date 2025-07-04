import { useState, useEffect, useCallback } from "react";
import { useUser } from "@/providers/user-provider";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { successToast, errorToast } from "@/components/custom/other/toaster";
import { fetchFromBackend } from "@/lib/helper";

export function useDeviceLogic(initialDevices = []) {
  const [devices, setDevices] = useState(initialDevices);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [addFormOpen, setAddFormOpen] = useState(false);
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [deleteFormOpen, setDeleteFormOpen] = useState(false);
  const [openBoardPopover, setOpenBoardPopover] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState(null);
  const [editDevice, setEditDevice] = useState(null);
  const [deleteChecked, setDeleteChecked] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedRows, setSelectedRows] = useState([]);

  const isAuthenticated = useAuth();
  const isMobile = useIsMobile(650);

  // Fetch devices milik user
  const fetchDevices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchFromBackend("/device");
      if (!res.ok) throw new Error("Gagal fetch device");
      const data = await res.json();
      setDevices(data.result || []);
    } catch (e) {
      errorToast("Gagal mengambil data device");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchDevices();
  }, [isAuthenticated, fetchDevices]);

  // CRUD Handler
  const handleAddDevice = async (payload) => {
    try {
      const res = await fetchFromBackend("/device", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Gagal tambah device");
      successToast("Device berhasil ditambahkan!");
      fetchDevices();
      setAddFormOpen(false);
    } catch {
      errorToast("Gagal tambah device!");
    }
  };

  const handleEditDevice = async (id, payload) => {
    try {
      const res = await fetchFromBackend(`/device/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Gagal update device");
      successToast("Device berhasil diupdate!");
      fetchDevices();
      setEditFormOpen(false);
    } catch {
      errorToast("Gagal update device!");
    }
  };

  const handleDeleteDevice = async (id) => {
    try {
      const res = await fetchFromBackend(`/device/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Gagal hapus device");
      successToast("Device berhasil dihapus!");
      fetchDevices();
      setDeleteFormOpen(false);
    } catch {
      errorToast("Gagal hapus device!");
    }
  };

  const boardOptions = [
    "ESP32",
    "ESP8266",
    "Arduino",
    "Raspberry Pi",
    "Lainnya",
  ];

  return {
    devices,
    loading,
    sidebarOpen,
    setSidebarOpen,
    addFormOpen,
    setAddFormOpen,
    editFormOpen,
    setEditFormOpen,
    deleteFormOpen,
    setDeleteFormOpen,
    openBoardPopover,
    setOpenBoardPopover,
    deviceToDelete,
    setDeviceToDelete,
    editDevice,
    setEditDevice,
    handleAddDevice,
    handleEditDevice,
    handleDeleteDevice,
    isAuthenticated,
    fetchDevices,
    deleteChecked,
    setDeleteChecked,
    search,
    setSearch,
    isMobile,
    selectedRows,
    setSelectedRows,
    boardOptions,
  };
}

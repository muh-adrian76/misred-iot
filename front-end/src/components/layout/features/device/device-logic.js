import { useState, useEffect, useCallback } from "react";
import { useUser } from "@/providers/user-provider";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import showToast from "@/components/custom/other/toaster";
import { fetchFromBackend } from "@/lib/helper";

export function useDeviceLogic() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [addFormOpen, setAddFormOpen] = useState(false);
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [deleteFormOpen, setDeleteFormOpen] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState(null);
  const [editDevice, setEditDevice] = useState(null);
  const [deleteChecked, setDeleteChecked] = useState(false);
  const [search, setSearch] = useState("");

  const isAuthenticated = useAuth();
  const { user } = useUser();
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
      showToast("error", "Gagal mengambil data device");
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
      showToast("success", "Device berhasil ditambahkan!");
      fetchDevices();
      setAddFormOpen(false);
    } catch {
      showToast("error", "Gagal tambah device!");
    }
  };

  const handleEditDevice = async (id, payload) => {
    try {
      const res = await fetchFromBackend(`/device/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Gagal update device");
      showToast("success", "Device berhasil diupdate!");
      fetchDevices();
      setEditFormOpen(false);
    } catch {
      showToast("error", "Gagal update device!");
    }
  };

  const handleDeleteDevice = async (id) => {
    try {
      const res = await fetchFromBackend(`/device/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Gagal hapus device");
      showToast("success", "Device berhasil dihapus!");
      fetchDevices();
      setDeleteFormOpen(false);
    } catch {
      showToast("error", "Gagal hapus device!");
    }
  };

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
    deviceToDelete,
    setDeviceToDelete,
    editDevice,
    setEditDevice,
    handleAddDevice,
    handleEditDevice,
    handleDeleteDevice,
    isAuthenticated,
    user,
    fetchDevices,
    deleteChecked,
    setDeleteChecked,
    search,
    setSearch,
    isMobile,
  };
}

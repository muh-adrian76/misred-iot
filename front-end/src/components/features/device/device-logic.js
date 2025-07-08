import { useState, useEffect, useCallback } from "react";
import { useUser } from "@/providers/user-provider";
import { useAuth } from "@/hooks/use-auth";
import { useBreakpoint } from "@/hooks/use-mobile";
import { successToast, errorToast } from "@/components/custom/other/toaster";
import { fetchFromBackend } from "@/lib/helper";

export function useDeviceLogic() {
  const [devices, setDevices] = useState([]);
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
  const { isMobile, isTablet, isDesktop } = useBreakpoint();

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

  // Update device state
  useEffect(() => {
    const ws = new WebSocket(`${process.env.NEXT_PUBLIC_BACKEND_WS}/ws/user`);
    ws.onopen = () => {
      console.log("WebSocket connected!");
    };
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "status_update") {
        console.log("Status update received:", data);
        setDevices((prev) =>
          prev.map((dev) =>
            String(dev.id) === String(data.device_id)
              ? { ...dev, status: data.status }
              : dev
          )
        );
      }
      // Bisa tambahkan handler untuk sensor_update, dsb
    };

    return () => ws.close();
  }, []);

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

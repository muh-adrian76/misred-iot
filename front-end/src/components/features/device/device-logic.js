import { useState, useEffect, useCallback } from "react";
import { useUser } from "@/providers/user-provider";
import { useAuth } from "@/hooks/use-auth";
import { useWebSocket } from "@/providers/websocket-provider";
import { useBreakpoint } from "@/hooks/use-mobile";
import { successToast, errorToast } from "@/components/custom/other/toaster";
import { fetchFromBackend } from "@/lib/helper";
import { markDeviceCreated } from "@/lib/onboarding-utils";

export function useDeviceLogic() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [addFormOpen, setAddFormOpen] = useState(false);
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [deleteFormOpen, setDeleteFormOpen] = useState(false);
  const [resetFormOpen, setResetFormOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadFirmwareSheetOpen, setUploadFirmwareSheetOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [openBoardPopover, setOpenBoardPopover] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState(null);
  const [deviceToReset, setDeviceToReset] = useState(null);
  const [editDevice, setEditDevice] = useState(null);
  const [deleteChecked, setDeleteChecked] = useState(false);
  const [resetChecked, setResetChecked] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedRows, setSelectedRows] = useState([]);

  const { isAuthenticated } = useAuth();
  const ws = useWebSocket();
  const { isMobile, isTablet, isDesktop } = useBreakpoint();

  // Fetch devices milik user
  const fetchDevices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchFromBackend("/device");
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal fetch device");
      setDevices(data.result || []);
    } catch (error) {
      errorToast("Gagal mengambil data device", error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchDevices();
  }, [isAuthenticated, fetchDevices]);

  // Update device state
  useEffect(() => {
    if (!ws) return;
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // console.log("WebSocket message received:", data);
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
      if (data.type === "device_secret_refreshed") {
        // console.log("Device secret refreshed:", data);
        fetchDevices(); 
      }
    };
  }, [fetchDevices, ws]);

  // CRUD Handler
  const handleAddDevice = async (payload) => {
    try {
      const res = await fetchFromBackend("/device", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal tambah device");
      successToast("Device berhasil ditambahkan!");
      fetchDevices();
      setAddFormOpen(false);
      
      // Trigger onboarding task completion
      markDeviceCreated();
    } catch(error) {
      errorToast("Gagal tambah device!", error.message);
    }
  };

  const handleEditDevice = async (id, payload) => {
    try {
      const res = await fetchFromBackend(`/device/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal update device");
      successToast("Device berhasil diupdate!");
      fetchDevices();
      setEditFormOpen(false);
    } catch(error) {
      errorToast("Gagal update device!", error.message);
    }
  };

  const handleDeleteDevice = async (id) => {
    try {
      const res = await fetchFromBackend(`/device/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal hapus device");
      successToast("Device berhasil dihapus!");
      fetchDevices();
      setDeleteFormOpen(false);
    } catch(error) {
      errorToast("Gagal hapus device!", error.message);
    }
  };

  const handleResetDeviceData = async (id) => {
    try {
      const res = await fetchFromBackend(`/device/${id}/data`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal reset data device");
      // Hilangkan koment ini jika ingin menampilkan jumlah payload yang dihapus
      // successToast(`Data perangkat berhasil direset!`, data.deleted_payload_count, data.deleted_raw_payload_count);
      successToast(`Data perangkat berhasil direset!`);
      setResetFormOpen(false);
    } catch(error) {
      errorToast("Gagal reset data perangkat!", error.message);
    }
  };

  const updateDeviceFirmware = ({ device_id, firmware_version, firmware_url, updated_at }) => {
  setDevices((prev) =>
    prev.map((dev) =>
      dev.id === device_id
        ? {
            ...dev,
            firmware_version,
            firmware_url,
            updated_at,
          }
        : dev
    )
  );
};

  const handleFirmwareUploaded = (data) => {
    successToast("Firmware berhasil diupload!");
    setUploadFirmwareSheetOpen(false);
    // Refresh devices to get updated firmware info if needed
    fetchDevices();
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
    resetFormOpen,
    setResetFormOpen,
    openBoardPopover,
    setOpenBoardPopover,
    deviceToDelete,
    setDeviceToDelete,
    deviceToReset,
    setDeviceToReset,
    editDevice,
    setEditDevice,
    handleAddDevice,
    handleEditDevice,
    handleDeleteDevice,
    handleResetDeviceData,
    isAuthenticated,
    fetchDevices,
    deleteChecked,
    setDeleteChecked,
    resetChecked,
    setResetChecked,
    search,
    setSearch,
    isMobile,
    selectedRows,
    setSelectedRows,
    boardOptions,
    uploadDialogOpen,
    setUploadDialogOpen,
    uploadFirmwareSheetOpen,
    setUploadFirmwareSheetOpen,
    selectedDevice,
    setSelectedDevice,
    handleFirmwareUploaded,
    updateDeviceFirmware,
  };
}

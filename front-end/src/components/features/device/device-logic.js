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

  // Ambil daftar device milik pengguna
  const fetchDevices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchFromBackend("/device");
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal mengambil daftar perangkat");
      setDevices(data.result || []);
    } catch (error) {
      errorToast("Gagal mengambil data perangkat", error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchDevices();
  }, [isAuthenticated, fetchDevices]);

  // Listener pembaruan device via WebSocket
  useEffect(() => {
    if (!ws) return;
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // console.log("Pesan WebSocket diterima:", data);
      if (data.type === "status_update") {
        console.log("Pembaruan status perangkat diterima:", data);
        setDevices((prev) =>
          prev.map((dev) =>
            String(dev.id) === String(data.device_id)
              ? { ...dev, status: data.status }
              : dev
          )
        );
      }
      if (data.type === "device_secret_refreshed") {
        // console.log("Rahasia perangkat diperbarui:", data);
        fetchDevices(); 
      }
    };
  }, [fetchDevices, ws]);

  // Handler CRUD perangkat
  const handleAddDevice = async (payload) => {
    try {
      const res = await fetchFromBackend("/device", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal menambahkan perangkat");
      successToast("Perangkat berhasil ditambahkan!");
      fetchDevices();
      setAddFormOpen(false);
      
      // Tandai penyelesaian tugas onboarding
      markDeviceCreated();
    } catch(error) {
      errorToast("Gagal menambahkan perangkat!", error.message);
    }
  };

  const handleEditDevice = async (id, payload) => {
    try {
      const res = await fetchFromBackend(`/device/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal memperbarui perangkat");
      successToast("Perangkat berhasil diperbarui!");
      fetchDevices();
      setEditFormOpen(false);
    } catch(error) {
      errorToast("Gagal memperbarui perangkat!", error.message);
    }
  };

  const handleDeleteDevice = async (id) => {
    try {
      const res = await fetchFromBackend(`/device/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal menghapus perangkat");
      successToast("Perangkat berhasil dihapus!");
      fetchDevices();
      setDeleteFormOpen(false);
    } catch(error) {
      errorToast("Gagal menghapus perangkat!", error.message);
    }
  };

  const handleResetDeviceData = async (id) => {
    try {
      const res = await fetchFromBackend(`/device/${id}/data`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal mereset data perangkat");
      // Hilangkan komentar di bawah jika ingin menampilkan jumlah payload yang dihapus
      // successToast(`Data perangkat berhasil direset!`, data.deleted_payload_count, data.deleted_raw_payload_count);
      successToast(`Data perangkat berhasil direset!`);
      setResetFormOpen(false);
    } catch(error) {
      errorToast("Gagal mereset data perangkat!", error.message);
    }
  };

  // Perbarui info firmware perangkat di state lokal
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

  // Handler ketika unggah firmware selesai
  const handleFirmwareUploaded = (data) => {
    successToast("Firmware berhasil diunggah!");
    setUploadFirmwareSheetOpen(false);
    // Refresh daftar perangkat untuk mengambil info firmware terbaru bila diperlukan
    fetchDevices();
  };

  // Opsi board yang tersedia
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

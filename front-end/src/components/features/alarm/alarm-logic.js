// Import hooks React untuk state management, lifecycle, dan memoization
import { useState, useEffect, useCallback } from "react";
// Import utility untuk fetch data dari backend
import { fetchFromBackend } from "@/lib/helper";
// Import komponen toast untuk notifikasi
import { successToast, errorToast } from "@/components/custom/other/toaster";
// Import hook autentikasi user
import { useAuth } from "@/hooks/use-auth";
// Import hook untuk deteksi breakpoint layar
import { useBreakpoint } from "@/hooks/use-mobile";
// Import utility untuk menandai alarm sudah dibuat (onboarding)
import { markAlarmCreated } from "@/lib/onboarding-utils";

// Hook kustom untuk logika halaman alarm management
export function useAlarmLogic() {
  // State data alarms
  const [alarms, setAlarms] = useState([]);
  // State loading untuk indikator proses
  const [loading, setLoading] = useState(true);

  // State data untuk form (devices dan datastreams)
  const [devices, setDevices] = useState([]); // Daftar devices milik user
  const [datastreams, setDatastreams] = useState([]); // Daftar datastreams milik user
  const [loadingDevices, setLoadingDevices] = useState(false); // Loading state devices
  const [loadingDatastreams, setLoadingDatastreams] = useState(false); // Loading state datastreams

  // State untuk dialog-dialog modal
  const [addFormOpen, setAddFormOpen] = useState(false); // Dialog tambah alarm
  const [editFormOpen, setEditFormOpen] = useState(false); // Dialog edit alarm
  const [deleteFormOpen, setDeleteFormOpen] = useState(false); // Dialog hapus alarm
  const [editAlarm, setEditAlarm] = useState(null); // Alarm yang akan diedit
  const [alarmToDelete, setAlarmToDelete] = useState(null); // Alarm yang akan dihapus
  const [selectedRows, setSelectedRows] = useState([]); // Baris yang dipilih di tabel

  // Hook untuk autentikasi dan deteksi mobile
  const { isAuthenticated } = useAuth();
  const { isMobile } = useBreakpoint();

  // Fungsi untuk mengambil semua alarm milik user yang sedang login
  const fetchAlarms = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch data alarm dari backend
      const res = await fetchFromBackend("/alarm");
      if (!res.ok) throw new Error("Gagal fetch alarm");
      const data = await res.json();
      // Set data alarms atau array kosong jika tidak ada
      setAlarms(data.alarms || []);
    } catch (e) {
      // Handle error fetch
      errorToast("Gagal mengambil data alarm");
    } finally {
      // Selalu set loading false di akhir
      setLoading(false);
    }
  }, []);

  // Fungsi untuk mengambil devices milik user (untuk dropdown di form)
  const fetchDevices = useCallback(async () => {
    setLoadingDevices(true);
    try {
      // Fetch data devices dari backend
      const res = await fetchFromBackend("/device");
      if (!res.ok) throw new Error("Gagal fetch devices");
      const data = await res.json();
      // Set data devices atau array kosong jika tidak ada
      setDevices(data.result || []);
    } catch (e) {
      console.error("Error fetching devices:", e);
      setDevices([]);
    } finally {
      setLoadingDevices(false);
    }
  }, []);

  // Fetch all datastreams (semua datastream dari semua device)
  const fetchDatastreams = useCallback(async () => {
    setLoadingDatastreams(true);
    try {
      const res = await fetchFromBackend("/datastream");
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal fetch datastreams");
      setDatastreams(data.result || []);
    } catch (e) {
      console.error("Error fetching datastreams:", e);
      errorToast("Gagal mengambil data datastreams", e.message || "Terjadi kesalahan");
      setDatastreams([]);
    } finally {
      setLoadingDatastreams(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAlarms();
      fetchDevices();
      fetchDatastreams();
    }
  }, [isAuthenticated, fetchAlarms, fetchDevices, fetchDatastreams]);

  // CRUD Handler
  const handleAddAlarm = async (payload) => {
    try {
      const res = await fetchFromBackend("/alarm", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal tambah alarm");
      successToast("Alarm berhasil ditambahkan!");
      fetchAlarms();
      setAddFormOpen(false);
      
      // Trigger onboarding task completion
      markAlarmCreated();
    } catch(error) {
      errorToast("Gagal tambah alarm!", error.message || "Terjadi kesalahan saat menambahkan alarm");
    }
  };

  const handleEditAlarm = async (id, payload) => {
    try {
      const res = await fetchFromBackend(`/alarm/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal update alarm");
      successToast("Alarm berhasil diupdate!");
      fetchAlarms();
      setEditFormOpen(false);
    } catch (error) {
      errorToast("Gagal update alarm!", error.message || "Terjadi kesalahan saat mengupdate alarm");
    }
  };

  const handleDeleteAlarm = async (id) => {
    try {
      const res = await fetchFromBackend(`/alarm/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal hapus alarm");
      successToast("Alarm berhasil dihapus!");
      fetchAlarms();
      setDeleteFormOpen(false);
    } catch (error) {
      errorToast("Gagal hapus alarm!", error.message || "Terjadi kesalahan saat menghapus alarm");
    }
  };

  return {
    alarms,
    loading,
    devices,
    datastreams,
    loadingDevices,
    loadingDatastreams,
    addFormOpen,
    setAddFormOpen,
    editFormOpen,
    setEditFormOpen,
    deleteFormOpen,
    setDeleteFormOpen,
    editAlarm,
    setEditAlarm,
    alarmToDelete,
    setAlarmToDelete,
    handleAddAlarm,
    handleEditAlarm,
    handleDeleteAlarm,
    isMobile,
    isAuthenticated,
    selectedRows,
    setSelectedRows,
  };
}
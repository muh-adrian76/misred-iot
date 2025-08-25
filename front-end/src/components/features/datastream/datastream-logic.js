import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useBreakpoint } from "@/hooks/use-mobile";
import { successToast, errorToast } from "@/components/custom/other/toaster";
import { fetchFromBackend } from "@/lib/helper";
import { markDatastreamCreated } from "@/lib/onboarding-utils";
import unitOptions from "./unit.json";

export function useDatastreamLogic() {
  // State datastream
  const [datastreams, setDatastreams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // State device
  const [devices, setDevices] = useState([]);
  const [loadingDevices, setLoadingDevices] = useState(false);

  // State UI
  const [addFormOpen, setAddFormOpen] = useState(false);
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [editDatastream, setEditDatastream] = useState(null);
  const [deleteFormOpen, setDeleteFormOpen] = useState(false);
  const [datastreamToDelete, setDatastreamToDelete] = useState(null);
  const [deleteChecked, setDeleteChecked] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);

  const { isAuthenticated } = useAuth();
  const { isMobile, isTablet, isDesktop } = useBreakpoint();

  // Ambil daftar datastream
  const fetchDatastreams = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchFromBackend(`/datastream`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ||"Gagal mengambil daftar datastream");
      setDatastreams(data.result || []);
    } catch(error) {
      errorToast(error.message || "Gagal mengambil data datastream");
    } finally {
      setLoading(false);
    }
  }, []);

  // Ambil daftar device (untuk referensi saat membuat/mengedit datastream)
  const fetchDevices = useCallback(async () => {
    setLoadingDevices(true);
    try {
      const res = await fetchFromBackend(`/device`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal mengambil daftar perangkat");
      setDevices(data.result || []);
    } catch (error) {
      errorToast(error.message || "Gagal mengambil data perangkat");
    } finally {
      setLoadingDevices(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDatastreams();
      fetchDevices();
    }
  }, [isAuthenticated, fetchDatastreams, fetchDevices]);

  // Handler CRUD
  const handleAddDatastream = async (payload) => {
    try {
      const res = await fetchFromBackend("/datastream", {
        method: "POST",
        body: JSON.stringify({
          ...payload,
          deviceId: String(payload.deviceId),
          minValue: String(payload.minValue),
          maxValue: String(payload.maxValue),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal menambahkan datastream");
      successToast("Datastream berhasil ditambahkan!");
      await fetchDatastreams();
      setAddFormOpen(false);
      
      // Tandai penyelesaian tugas onboarding
      markDatastreamCreated();
    } catch(error) {
      errorToast("Gagal menambahkan datastream!", error.message || "Terjadi kesalahan saat menambahkan datastream");
    }
  };

  const handleEditDatastream = async (id, payload) => {
    try {
      const res = await fetchFromBackend(`/datastream/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          ...payload,
          deviceId: String(payload.deviceId),
          minValue: String(payload.minValue),
          maxValue: String(payload.maxValue),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal memperbarui datastream");
      successToast("Datastream berhasil diperbarui!");
      await fetchDatastreams();
      setEditFormOpen(false);
    } catch (error) {
      errorToast("Gagal memperbarui datastream!", error.message || "Terjadi kesalahan saat memperbarui datastream");
    }
  };

  const handleDeleteDatastream = async (id) => {
    try {
      const ids = Array.isArray(id) ? id : [id];
      let success = 0;
      for (const singleId of ids) {
        const res = await fetchFromBackend(`/datastream/${singleId}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Gagal menghapus datastream");
        success++;
      }
      if (success > 0) successToast(`Datastream berhasil dihapus!`);
      await fetchDatastreams();
      setDeleteFormOpen(false);
      setDeleteChecked(false);
    } catch(error) {
      errorToast("Gagal menghapus datastream!", error.message || "Terjadi kesalahan saat menghapus datastream");
    }
  };

  // Kumpulan pin yang sudah terpakai per device (untuk mencegah duplikasi)
  const usedPinsPerDevice = useMemo(() => {
    const map = {};
    for (const ds of datastreams) {
      if (!map[ds.device_id]) map[ds.device_id] = new Set();
      map[ds.device_id].add(String(ds.pin));
    }
    return map;
  }, [datastreams]);

  // Pilihan format desimal untuk tipe data double
  const decimalOptions = [
    { label: "0.0", value: "0.0" },
    { label: "0.00", value: "0.00" },
    { label: "0.000", value: "0.000" },
    { label: "0.0000", value: "0.0000" },
  ];

  return {
    datastreams,
    devices,
    usedPinsPerDevice,
    decimalOptions,
    loading,
    loadingDevices,
    addFormOpen,
    setAddFormOpen,
    editFormOpen,
    setEditFormOpen,
    editDatastream,
    setEditDatastream,
    deleteFormOpen,
    setDeleteFormOpen,
    datastreamToDelete,
    setDatastreamToDelete,
    deleteChecked,
    setDeleteChecked,
    handleAddDatastream,
    handleEditDatastream,
    handleDeleteDatastream,
    fetchDatastreams,
    isAuthenticated,
    isMobile,
    sidebarOpen,
    setSidebarOpen,
    selectedRows,
    setSelectedRows,
    unitOptions,
  };
}

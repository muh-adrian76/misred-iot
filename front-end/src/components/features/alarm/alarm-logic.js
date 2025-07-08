import { useState, useEffect, useCallback } from "react";
import { fetchFromBackend } from "@/lib/helper";
import { successToast, errorToast } from "@/components/custom/other/toaster";
import { useAuth } from "@/hooks/use-auth";
import { useBreakpoint } from "@/hooks/use-mobile";

export function useAlarmLogic() {
  const [alarms, setAlarms] = useState([]);
  const [loading, setLoading] = useState(true);

  const [addFormOpen, setAddFormOpen] = useState(false);
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [deleteFormOpen, setDeleteFormOpen] = useState(false);
  const [editAlarm, setEditAlarm] = useState(null);
  const [alarmToDelete, setAlarmToDelete] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);

  const isAuthenticated = useAuth();
  const { isMobile } = useBreakpoint();

  // Fetch alarms milik user
  const fetchAlarms = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchFromBackend("/alarm");
      if (!res.ok) throw new Error("Gagal fetch alarm");
      const data = await res.json();
      setAlarms(data.result || []);
    } catch (e) {
      errorToast("Gagal mengambil data alarm");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchAlarms();
  }, [isAuthenticated, fetchAlarms]);

  // CRUD Handler
  const handleAddAlarm = async (payload) => {
    try {
      const res = await fetchFromBackend("/alarm", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Gagal tambah alarm");
      successToast("Alarm berhasil ditambahkan!");
      fetchAlarms();
      setAddFormOpen(false);
    } catch {
      errorToast("Gagal tambah alarm!");
    }
  };

  const handleEditAlarm = async (id, payload) => {
    try {
      const res = await fetchFromBackend(`/alarm/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Gagal update alarm");
      successToast("Alarm berhasil diupdate!");
      fetchAlarms();
      setEditFormOpen(false);
    } catch {
      errorToast("Gagal update alarm!");
    }
  };

  const handleDeleteAlarm = async (id) => {
    try {
      const res = await fetchFromBackend(`/alarm/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Gagal hapus alarm");
      successToast("Alarm berhasil dihapus!");
      fetchAlarms();
      setDeleteFormOpen(false);
    } catch {
      errorToast("Gagal hapus alarm!");
    }
  };

  return {
    alarms,
    loading,
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
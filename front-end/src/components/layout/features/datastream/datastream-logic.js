import { useState, useEffect, useCallback } from "react";
import { useUser } from "@/providers/user-provider";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import showToast from "@/components/custom/other/toaster";
import { fetchFromBackend } from "@/lib/helper";

export function useDatastreamLogic() {
  const [datastreams, setDatastreams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [addFormOpen, setAddFormOpen] = useState(false);
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [deleteFormOpen, setDeleteFormOpen] = useState(false);
  const [editDatastream, setEditDatastream] = useState(null);
  const [datastreamToDelete, setDatastreamToDelete] = useState(null);
  const [deleteChecked, setDeleteChecked] = useState(false);

  const isAuthenticated = useAuth();
  const { user } = useUser();
  const isMobile = useIsMobile(650);

  // Fetch datastreams for device
  const fetchDatastreams = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchFromBackend(`/datastream`);
      if (!res.ok) throw new Error("Gagal fetch datastream");
      const data = await res.json();
      setDatastreams(data.result || []);
    } catch {
      showToast("error", "Gagal mengambil data datastream");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchDatastreams();
  }, [isAuthenticated, fetchDatastreams]);

  // CRUD Handler
  const handleAddDatastream = async (payload) => {
    try {
      const res = await fetchFromBackend("/datastream", {
        method: "POST",
        body: JSON.stringify({
          ...payload,
          defaultValue: String(payload.defaultValue),
          minValue: String(payload.minValue),
          maxValue: String(payload.maxValue),
        }),
      });
      if (!res.ok) throw new Error("Gagal tambah datastream");
      showToast("success", "Datastream berhasil ditambahkan!");
      await fetchDatastreams();
      setAddFormOpen(false);
    } catch {
      showToast("error", "Gagal tambah datastream!");
    }
  };

  const handleEditDatastream = async (id, payload) => {
    try {
      const res = await fetchFromBackend(`/datastream/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          ...payload,
          defaultValue: String(payload.defaultValue),
          minValue: String(payload.minValue),
          maxValue: String(payload.maxValue),
        }),
      });
      if (!res.ok) throw new Error("Gagal update datastream");
      showToast("success", "Datastream berhasil diupdate!");
      await fetchDatastreams();
      setEditFormOpen(false);
    } catch {
      showToast("error", "Gagal update datastream!");
    }
  };

  const handleDeleteDatastream = async (id) => {
    try {
      const res = await fetchFromBackend(`/datastream/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Gagal hapus datastream");
      showToast("success", "Datastream berhasil dihapus!");
      await fetchDatastreams();
      setDeleteFormOpen(false);
      setDeleteChecked(false);
    } catch {
      showToast("error", "Gagal hapus datastream!");
    }
  };

  return {
    datastreams,
    loading,
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
    user,
    isMobile,
    sidebarOpen,
    setSidebarOpen,
  };
}

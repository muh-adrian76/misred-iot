// Import hooks React untuk state management dan lifecycle
import { useState, useEffect } from "react";
// Import hook autentikasi admin
import { useAdminAuth } from "@/hooks/use-admin-auth";
// Import utility untuk fetch data dari backend
import { fetchFromBackend } from "@/lib/helper";
// Import komponen toast untuk notifikasi
import { successToast, errorToast } from "@/components/custom/other/toaster";

// Hook kustom untuk logika halaman admin users
export function useAdminUsersLogic() {
  // State data users
  const [users, setUsers] = useState([]);
  // State loading untuk indikator proses
  const [isLoading, setIsLoading] = useState(true);
  // State untuk pencarian
  const [search, setSearch] = useState("");
  // State untuk baris yang dipilih di tabel
  const [selectedRows, setSelectedRows] = useState([]);
  
  // State untuk dialog-dialog modal
  const [addUserOpen, setAddUserOpen] = useState(false); // Dialog tambah user
  const [editUserOpen, setEditUserOpen] = useState(false); // Dialog edit user
  const [deleteUserOpen, setDeleteUserOpen] = useState(false); // Dialog hapus user
  const [selectedUser, setSelectedUser] = useState(null); // User yang dipilih untuk edit
  const [userToDelete, setUserToDelete] = useState(null); // User yang akan dihapus
  const [deleteChecked, setDeleteChecked] = useState(false); // Konfirmasi hapus

  // State autentikasi admin dari hook use-admin-auth
  const { user, isAdmin, isAuthenticated, loading: adminLoading } = useAdminAuth();

  // Fungsi untuk mengambil semua data users dari backend
  const fetchUsers = async () => {
    try {
      // Set loading state
      setIsLoading(true);
      // Fetch data dari endpoint admin users
      const response = await fetchFromBackend("/admin/users");
      
      // Cek apakah response sukses
      if (!response.ok) {
        console.error("❌ HTTP Error:", response.status, response.statusText);
        errorToast(`HTTP Error: ${response.status}`);
        return;
      }
      
      // Parse response JSON
      const data = await response.json();
      
      // Cek status dari backend
      if (data.status === "success") {
        // Set data users jika berhasil
        setUsers(data.data || []);
      } else {
        console.error("❌ Backend returned error:", data);
        errorToast(data.message || "Gagal memuat data users");
      }
    } catch (error) {
      // Handle error fetch
      console.error("💥 Error fetching users:", error);
      errorToast("Gagal memuat data users");
    } finally {
      // Selalu set loading false di akhir
      setIsLoading(false);
    }
  };

  // Add new user
  const handleAddUser = async (userData) => {
    try {
      const response = await fetchFromBackend("/auth/admin/register", {
        method: "POST",
        body: JSON.stringify(userData)
      });
      
      const data = await response.json();
      
      if (response.ok && (data.status === 201 || data.status === "success")) {
        successToast("User berhasil ditambahkan");
        setAddUserOpen(false);
        fetchUsers(); // Refresh data
        return true;
      } else {
        errorToast(data.message || "Gagal menambahkan user");
        return false;
      }
    } catch (error) {
      console.error("💥 Error adding user:", error);
      errorToast("Gagal menambahkan user");
      return false;
    }
  };

  // Edit user
  const handleEditUser = async (userId, userData) => {
    try {
      const response = await fetchFromBackend(`/user/${userId}`, {
        method: "PUT",
        body: JSON.stringify(userData)
      });
      
      const data = await response.json();
      
      if (response.ok && data.message) {
        successToast("User berhasil diperbarui");
        setEditUserOpen(false);
        setSelectedUser(null);
        fetchUsers(); // Refresh data
        return true;
      } else {
        errorToast(data.message || "Gagal memperbarui user");
        return false;
      }
    } catch (error) {
      console.error("💥 Error editing user:", error);
      errorToast("Gagal memperbarui user");
      return false;
    }
  };

  // Delete user
  const handleDeleteUser = async (userId) => {
    try {
      const response = await fetchFromBackend(`/user/${userId}`, {
        method: "DELETE"
      });
      
      const data = await response.json();
      
      if (response.ok && data.message) {
        successToast("User berhasil dihapus");
        setDeleteUserOpen(false);
        setUserToDelete(null);
        fetchUsers(); // Refresh data
        return true;
      } else {
        errorToast(data.message || "Gagal menghapus user");
        return false;
      }
    } catch (error) {
      console.error("💥 Error deleting user:", error);
      errorToast("Gagal menghapus user");
      return false;
    }
  };

  // Open edit dialog
  const openEditDialog = (user) => {
    setSelectedUser(user);
    setEditUserOpen(true);
  };

  // Open delete dialog
  const openDeleteDialog = (user) => {
    setUserToDelete(user);
    setDeleteUserOpen(true);
  };

  // Filter users based on search only
  const filteredUsers = users.filter(user => {
    // Search filter
    const matchesSearch = user.name?.toLowerCase().includes(search.toLowerCase()) ||
                         user.email?.toLowerCase().includes(search.toLowerCase());
    
    return matchesSearch;
  });

  // Refresh data
  const handleRefresh = async () => {
    await fetchUsers();
    successToast("Data berhasil diperbarui");
  };

  // Initialize data
  useEffect(() => {
    if (!adminLoading && isAuthenticated && isAdmin) {
      fetchUsers();
    }
  }, [adminLoading, isAuthenticated, isAdmin]);

  return {
    // State
    users: filteredUsers,
    isLoading: isLoading || adminLoading,
    search,
    selectedRows,
    user,
    isAdmin,
    isAuthenticated,
    
    // Dialog states
    addUserOpen,
    editUserOpen,
    deleteUserOpen,
    selectedUser,
    userToDelete,
    deleteChecked,
    
    // Actions
    setSearch,
    setSelectedRows,
    setAddUserOpen,
    setEditUserOpen,
    setDeleteUserOpen,
    setDeleteChecked,
    handleRefresh,
    handleAddUser,
    handleEditUser,
    handleDeleteUser,
    openEditDialog,
    openDeleteDialog
  };
}

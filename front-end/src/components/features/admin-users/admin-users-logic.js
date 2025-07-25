import { useState, useEffect } from "react";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { fetchFromBackend } from "@/lib/helper";
import { successToast, errorToast } from "@/components/custom/other/toaster";

export function useAdminUsersLogic() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedRows, setSelectedRows] = useState([]);
  
  // Dialog states
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [deleteUserOpen, setDeleteUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleteChecked, setDeleteChecked] = useState(false);

  // Admin auth state
  const { user, isAdmin, isAuthenticated, loading: adminLoading } = useAdminAuth();

  // Fetch all users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetchFromBackend("/admin/users");
      
      if (!response.ok) {
        console.error("❌ HTTP Error:", response.status, response.statusText);
        errorToast(`HTTP Error: ${response.status}`);
        return;
      }
      
      const data = await response.json();
      
      if (data.status === "success") {
        setUsers(data.data || []);
      } else {
        console.error("❌ Backend returned error:", data);
        errorToast(data.message || "Gagal memuat data users");
      }
    } catch (error) {
      console.error("💥 Error fetching users:", error);
      errorToast("Gagal memuat data users");
    } finally {
      setLoading(false);
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

  // Initialize data
  useEffect(() => {
    if (!adminLoading && isAuthenticated && isAdmin) {
      fetchUsers();
    }
  }, [adminLoading, isAuthenticated, isAdmin]);

  return {
    // State
    users: filteredUsers,
    loading: loading || adminLoading,
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
    fetchUsers,
    handleAddUser,
    handleEditUser,
    handleDeleteUser,
    openEditDialog,
    openDeleteDialog
  };
}

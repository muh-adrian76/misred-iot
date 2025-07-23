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

  // Admin auth state
  const { user, isAdmin, isAuthenticated, loading: adminLoading } = useAdminAuth();

  // Fetch all users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetchFromBackend("/user");
      if (response.status === "success") {
        setUsers(response.data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
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
      
      if (response.status === 201) {
        successToast("User berhasil ditambahkan");
        setAddUserOpen(false);
        fetchUsers(); // Refresh data
      } else {
        errorToast(response.message || "Gagal menambahkan user");
      }
    } catch (error) {
      console.error("Error adding user:", error);
      errorToast("Gagal menambahkan user");
    }
  };

  // Edit user
  const handleEditUser = async (userId, userData) => {
    try {
      const response = await fetchFromBackend(`/user/${userId}`, {
        method: "PUT",
        body: JSON.stringify(userData)
      });
      
      if (response.status === "success") {
        successToast("User berhasil diperbarui");
        setEditUserOpen(false);
        setSelectedUser(null);
        fetchUsers(); // Refresh data
      } else {
        errorToast(response.message || "Gagal memperbarui user");
      }
    } catch (error) {
      console.error("Error editing user:", error);
      errorToast("Gagal memperbarui user");
    }
  };

  // Delete user
  const handleDeleteUser = async (userId) => {
    try {
      const response = await fetchFromBackend(`/user/${userId}`, {
        method: "DELETE"
      });
      
      if (response.status === "success") {
        successToast("User berhasil dihapus");
        setDeleteUserOpen(false);
        setUserToDelete(null);
        fetchUsers(); // Refresh data
      } else {
        errorToast(response.message || "Gagal menghapus user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      errorToast("Gagal menghapus user");
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

  // Filter users based on search
  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(search.toLowerCase()) ||
    user.email?.toLowerCase().includes(search.toLowerCase())
  );

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
    
    // Actions
    setSearch,
    setSelectedRows,
    setAddUserOpen,
    setEditUserOpen,
    setDeleteUserOpen,
    fetchUsers,
    handleAddUser,
    handleEditUser,
    handleDeleteUser,
    openEditDialog,
    openDeleteDialog
  };
}

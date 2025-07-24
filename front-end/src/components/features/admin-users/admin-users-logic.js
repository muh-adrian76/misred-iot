import { useState, useEffect } from "react";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { fetchFromBackend } from "@/lib/helper";
import { successToast, errorToast } from "@/components/custom/other/toaster";

export function useAdminUsersLogic() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedRows, setSelectedRows] = useState([]);
  
  // Filter states
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    role: "all", // all, admin, user
    onboarding: "all", // all, completed, not_completed
    whatsapp: "all", // all, enabled, disabled
  });
  
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
      console.log("🔍 Fetching users from /admin/users...");
      const response = await fetchFromBackend("/admin/users");
      console.log("📡 Raw fetch response:", response);
      console.log("📊 Response status:", response.status);
      console.log("📊 Response ok:", response.ok);
      
      if (!response.ok) {
        console.error("❌ HTTP Error:", response.status, response.statusText);
        errorToast(`HTTP Error: ${response.status}`);
        return;
      }
      
      const data = await response.json();
      console.log("📋 Parsed JSON data:", data);
      
      if (data.status === "success") {
        console.log("✅ Users data received:", data.data);
        console.log("📊 Number of users:", data.data?.length || 0);
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
      console.log("➕ Adding new user:", userData);
      const response = await fetchFromBackend("/auth/admin/register", {
        method: "POST",
        body: JSON.stringify(userData)
      });
      
      console.log("📡 Add user response status:", response.status);
      const data = await response.json();
      console.log("📋 Add user response data:", data);
      
      if (response.ok && (data.status === 201 || data.status === "success")) {
        successToast("User berhasil ditambahkan");
        setAddUserOpen(false);
        fetchUsers(); // Refresh data
      } else {
        errorToast(data.message || "Gagal menambahkan user");
      }
    } catch (error) {
      console.error("💥 Error adding user:", error);
      errorToast("Gagal menambahkan user");
    }
  };

  // Edit user
  const handleEditUser = async (userId, userData) => {
    try {
      console.log("✏️ Editing user:", { userId, userData });
      const response = await fetchFromBackend(`/user/${userId}`, {
        method: "PUT",
        body: JSON.stringify(userData)
      });
      
      const data = await response.json();
      console.log("📋 Edit user response:", data);
      
      if (response.ok && data.status === "success") {
        successToast("User berhasil diperbarui");
        setEditUserOpen(false);
        setSelectedUser(null);
        fetchUsers(); // Refresh data
      } else {
        errorToast(data.message || "Gagal memperbarui user");
      }
    } catch (error) {
      console.error("💥 Error editing user:", error);
      errorToast("Gagal memperbarui user");
    }
  };

  // Delete user
  const handleDeleteUser = async (userId) => {
    try {
      console.log("🗑️ Deleting user:", userId);
      const response = await fetchFromBackend(`/user/${userId}`, {
        method: "DELETE"
      });
      
      const data = await response.json();
      console.log("📋 Delete user response:", data);
      
      if (response.ok && data.status === "success") {
        successToast("User berhasil dihapus");
        setDeleteUserOpen(false);
        setUserToDelete(null);
        fetchUsers(); // Refresh data
      } else {
        errorToast(data.message || "Gagal menghapus user");
      }
    } catch (error) {
      console.error("💥 Error deleting user:", error);
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

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    // Search filter
    const matchesSearch = user.name?.toLowerCase().includes(search.toLowerCase()) ||
                         user.email?.toLowerCase().includes(search.toLowerCase());
    
    // Role filter
    const matchesRole = filters.role === "all" || 
                       (filters.role === "admin" && user.is_admin) ||
                       (filters.role === "user" && !user.is_admin);
    
    // Onboarding filter
    const matchesOnboarding = filters.onboarding === "all" ||
                             (filters.onboarding === "completed" && user.onboarding_completed) ||
                             (filters.onboarding === "not_completed" && !user.onboarding_completed);
    
    // WhatsApp filter
    const matchesWhatsapp = filters.whatsapp === "all" ||
                           (filters.whatsapp === "enabled" && user.whatsapp_notif) ||
                           (filters.whatsapp === "disabled" && !user.whatsapp_notif);
    
    return matchesSearch && matchesRole && matchesOnboarding && matchesWhatsapp;
  });

  // Clear filters
  const clearFilters = () => {
    setFilters({
      role: "all",
      onboarding: "all", 
      whatsapp: "all",
    });
  };

  // Check if any filters are active
  const hasActiveFilters = filters.role !== "all" || 
                          filters.onboarding !== "all" || 
                          filters.whatsapp !== "all";

  // Initialize data
  useEffect(() => {
    if (!adminLoading && isAuthenticated && isAdmin) {
      console.log("🚀 Initializing admin users page...");
      console.log("👤 Current user:", { id: user?.id, isAdmin, isAuthenticated });
      fetchUsers();
    } else {
      console.log("⏳ Waiting for auth...", { adminLoading, isAuthenticated, isAdmin });
    }
  }, [adminLoading, isAuthenticated, isAdmin]);

  // Debug users state
  useEffect(() => {
    console.log("👥 Users state updated:", users);
    console.log("📊 Users count:", users?.length || 0);
    console.log("🔍 Filtered users count:", filteredUsers?.length || 0);
  }, [users, filteredUsers]);

  return {
    // State
    users: filteredUsers,
    loading: loading || adminLoading,
    search,
    selectedRows,
    user,
    isAdmin,
    isAuthenticated,
    
    // Filter states
    filterOpen,
    filters,
    hasActiveFilters,
    
    // Dialog states
    addUserOpen,
    editUserOpen,
    deleteUserOpen,
    selectedUser,
    userToDelete,
    
    // Actions
    setSearch,
    setSelectedRows,
    setFilterOpen,
    setFilters,
    clearFilters,
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

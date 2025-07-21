import { useState, useEffect } from "react";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { fetchFromBackend } from "@/lib/helper";
import { successToast, errorToast } from "@/components/custom/other/toaster";

export function useAdminOverviewsLogic() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDevices: 0,
    totalDashboards: 0,
    activeUsers: 0,
    recentUsers: [],
    systemHealth: "good"
  });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Admin auth state
  const { user, isAdmin, isAuthenticated, loading: adminLoading } = useAdminAuth();

  // Fetch admin statistics
  const fetchStats = async () => {
    try {
      setRefreshing(true);
      
      // You can implement these endpoints later
      // const usersRes = await fetchFromBackend("/api/admin/users/stats");
      // const devicesRes = await fetchFromBackend("/api/admin/devices/stats");
      
      // For now, using mock data
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      setStats({
        totalUsers: 156,
        totalDevices: 42,
        totalDashboards: 28,
        activeUsers: 12,
        recentUsers: [
          { id: 1, name: "John Doe", email: "john@example.com", created_at: "2025-01-20" },
          { id: 2, name: "Jane Smith", email: "jane@example.com", created_at: "2025-01-19" },
          { id: 3, name: "Bob Wilson", email: "bob@example.com", created_at: "2025-01-18" },
        ],
        systemHealth: "good"
      });
      
      setIsLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      errorToast("Gagal memuat statistik admin");
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Refresh data
  const handleRefresh = async () => {
    await fetchStats();
    successToast("Data berhasil diperbarui");
  };

  // Initialize data
  useEffect(() => {
    if (!adminLoading && isAuthenticated && isAdmin) {
      fetchStats();
    }
  }, [adminLoading, isAuthenticated, isAdmin]);

  return {
    // State
    stats,
    isLoading: isLoading || adminLoading,
    refreshing,
    user,
    isAdmin,
    isAuthenticated,
    
    // Actions
    handleRefresh,
    fetchStats
  };
}

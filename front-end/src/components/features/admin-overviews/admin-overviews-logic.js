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
      
      // Fetch overview stats
      const overviewRes = await fetchFromBackend("/admin/stats/overview");
      const overviewData = await overviewRes.json();
      
      // Fetch recent users
      const recentUsersRes = await fetchFromBackend("/admin/stats/recent-users?limit=5");
      const recentUsersData = await recentUsersRes.json();
      
      // Fetch system health
      const healthRes = await fetchFromBackend("/admin/system/health");
      const healthData = await healthRes.json();
      
      if (overviewData.status === "success" && recentUsersData.status === "success" && healthData.status === "success") {
        setStats({
          ...overviewData.data,
          recentUsers: recentUsersData.data,
          systemHealth: healthData.data.status
        });
      } else {
        throw new Error("Failed to fetch admin data");
      }
      
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

// Import hooks React untuk state management dan lifecycle
import { useState, useEffect } from "react";
// Import hook autentikasi admin
import { useAdminAuth } from "@/hooks/use-admin-auth";
// Import utility untuk fetch data dari backend
import { fetchFromBackend } from "@/lib/helper";
// Import komponen toast untuk notifikasi
import { successToast, errorToast } from "@/components/custom/other/toaster";

// Hook kustom untuk logika halaman admin overviews/statistik
export function useAdminOverviewsLogic() {
  // State untuk menyimpan statistik admin
  const [stats, setStats] = useState({
    totalUsers: 0, // Total jumlah user
    totalDevices: 0, // Total jumlah device
    totalDashboards: 0, // Total jumlah dashboard
    activeUsers: 0, // User yang aktif
    recentUsers: [], // User yang baru bergabung
    systemHealth: "good" // Status kesehatan sistem
  });
  // State loading untuk indikator proses
  const [isLoading, setIsLoading] = useState(true);
  // State refreshing untuk indikator refresh
  const [refreshing, setRefreshing] = useState(false);

  // State autentikasi admin dari hook use-admin-auth
  const { user, isAdmin, isAuthenticated, loading: adminLoading } = useAdminAuth();

  // Fungsi untuk mengambil statistik admin dari backend
  const fetchStats = async () => {
    try {
      // Set refreshing state
      setRefreshing(true);
      
      // Fetch statistik overview
      const overviewRes = await fetchFromBackend("/admin/stats/overview");
      const overviewData = await overviewRes.json();
      
      // Fetch user yang baru bergabung
      const recentUsersRes = await fetchFromBackend("/admin/stats/recent-users?limit=5");
      const recentUsersData = await recentUsersRes.json();
      
      // Fetch kesehatan sistem
      const healthRes = await fetchFromBackend("/admin/system/health");
      const healthData = await healthRes.json();
      
      // Cek apakah semua request berhasil
      if (overviewData.status === "success" && recentUsersData.status === "success" && healthData.status === "success") {
        // Gabungkan semua data statistik
        setStats({
          ...overviewData.data, // Spread data overview
          recentUsers: recentUsersData.data, // Data user terbaru
          systemHealth: healthData.data.status // Status kesehatan sistem
        });
      } else {
        throw new Error("Failed to fetch admin data");
      }
      
      // Set loading selesai
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

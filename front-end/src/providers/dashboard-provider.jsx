// Directive untuk Next.js - menandakan bahwa komponen ini berjalan di client-side
"use client";

// Import React hooks dan utilities yang diperlukan
import { createContext, useContext, useState, useEffect, useCallback } from "react";

// Membuat context untuk dashboard yang akan dibagikan ke seluruh komponen anak
const DashboardContext = createContext();

// Komponen provider utama untuk mengelola state dashboard
export function DashboardProvider({ children }) {
  // State utama untuk menyimpan data dashboard
  // tabItems: item-item widget per dashboard
  // tabLayouts: layout/posisi widget per dashboard  
  // activeTab: dashboard yang sedang aktif
  const [dashboardData, setDashboardData] = useState({
    tabItems: {},
    tabLayouts: {},
    activeTab: "",
  });
  
  // State untuk melacak apakah data sudah selesai dimuat dari localStorage
  const [isInitialized, setIsInitialized] = useState(false);

  // Effect untuk memuat data dashboard dari localStorage saat komponen pertama kali dimount
  useEffect(() => {
    try {
      // Mengambil data yang tersimpan di localStorage
      const stored = localStorage.getItem("dashboard-data");
      if (stored) {
        // Parsing JSON data yang tersimpan
        const parsed = JSON.parse(stored);
        // console.log('Loaded dashboard data from localStorage:', parsed);
        
        // Validasi struktur data untuk memastikan data valid
        if (parsed && typeof parsed === 'object' && 
            parsed.tabItems && typeof parsed.tabItems === 'object' &&
            parsed.tabLayouts && typeof parsed.tabLayouts === 'object') {
          
          // Validasi tambahan untuk tabLayouts - memastikan tidak ada nested strings
          const validatedData = {
            ...parsed,
            tabLayouts: {}
          };
          
          // Iterasi setiap dashboard dan validasi layoutnya
          Object.keys(parsed.tabLayouts).forEach(dashboardId => {
            const layout = parsed.tabLayouts[dashboardId];
            // Memastikan layout adalah object yang valid
            if (typeof layout === 'object' && layout !== null) {
              validatedData.tabLayouts[dashboardId] = layout;
            } else {
              console.warn(`Skipping invalid layout for dashboard ${dashboardId}:`, layout);
              // Set layout kosong jika data tidak valid
              validatedData.tabLayouts[dashboardId] = {};
            }
          });
          
          // Update state dengan data yang sudah divalidasi
          setDashboardData(validatedData);
        } else {
          // Jika struktur data tidak valid, hapus dari localStorage
          console.warn('Invalid localStorage data structure, clearing');
          localStorage.removeItem("dashboard-data");
        }
      }
    } catch (error) {
      // Handle error saat parsing atau loading data
      console.warn("Failed to load dashboard data from localStorage:", error);
      localStorage.removeItem("dashboard-data");
    } finally {
      // Tandai bahwa proses inisialisasi sudah selesai
      setIsInitialized(true);
    }
  }, []);

  // Effect untuk menyimpan data dashboard ke localStorage setiap kali data berubah
  // Hanya berjalan setelah inisialisasi selesai untuk menghindari overwrite data awal
  useEffect(() => {
    if (isInitialized) {
      try {
        // Cek apakah ada data yang perlu disimpan
        const hasData = Object.keys(dashboardData.tabItems).length > 0 || 
                       Object.keys(dashboardData.tabLayouts).length > 0 || 
                       dashboardData.activeTab;
        
        if (hasData) {
          // Simpan data ke localStorage jika ada data
          // console.log('Saving dashboard data to localStorage:', dashboardData);
          localStorage.setItem("dashboard-data", JSON.stringify(dashboardData));
        } else {
          // Hapus dari localStorage jika tidak ada data
          localStorage.removeItem("dashboard-data");
        }
      } catch (error) {
        // Handle error saat menyimpan ke localStorage
        console.warn("Failed to save dashboard data to localStorage:", error);
      }
    }
  }, [dashboardData.tabItems, dashboardData.tabLayouts, dashboardData.activeTab, isInitialized]);

  // Fungsi untuk memperbarui item-item widget pada dashboard tertentu
  // Menggunakan useCallback untuk optimasi performa
  const updateTabItems = useCallback((dashboardId, items) => {
    // Debug logging untuk tracking pemanggilan fungsi
    // console.log('DashboardProvider.updateTabItems called:', {
    //   dashboardId,
    //   itemCount: items.length,
    //   items: items.map(item => ({
    //     id: item.id,
    //     description: item.description,
    //     isStaged: item.isStaged,
    //     stagedForRemoval: item.stagedForRemoval
    //   }))
    // });
    
    setDashboardData(prev => {
      // Cek apakah items yang baru benar-benar berbeda dengan yang lama
      const currentItems = prev.tabItems[dashboardId];
      if (JSON.stringify(currentItems) === JSON.stringify(items)) {
        // Jika tidak ada perubahan, skip update untuk menghindari re-render tidak perlu
        // console.log('DashboardProvider.updateTabItems: No change detected, skipping update');
        return prev;
      }
      
      // Update state dengan items baru jika ada perubahan
      // console.log('DashboardProvider.updateTabItems: Changes detected, updating state');
      return {
        ...prev,
        tabItems: {
          ...prev.tabItems,
          [dashboardId]: items
        }
      };
    });
  }, []);

  // Fungsi untuk memperbarui layout widget pada dashboard tertentu
  // Layout menentukan posisi dan ukuran setiap widget
  const updateTabLayouts = useCallback((dashboardId, layouts) => {
    // Debug logging untuk tracking parameter yang diterima
    // console.log('updateTabLayouts called:', { dashboardId, layouts, type: typeof layouts });
    
    // Validasi parameter layouts harus berupa object
    if (typeof layouts !== 'object' || layouts === null) {
      console.warn('Invalid layouts provided to updateTabLayouts:', layouts);
      return;
    }
    
    setDashboardData(prev => {
      // Cek apakah layouts yang baru benar-benar berbeda dengan yang lama
      const currentLayouts = prev.tabLayouts[dashboardId];
      if (JSON.stringify(currentLayouts) === JSON.stringify(layouts)) {
        // Skip update jika tidak ada perubahan
        return prev;
      }
      
      // Update state dengan layouts baru
      return {
        ...prev,
        tabLayouts: {
          ...prev.tabLayouts,
          [dashboardId]: layouts
        }
      };
    });
  }, []);

  // Fungsi untuk mengubah dashboard yang sedang aktif
  // Dashboard aktif menentukan tab mana yang sedang ditampilkan ke user
  const updateActiveTab = useCallback((dashboardId) => {
    // Debug logging untuk tracking perubahan active tab
    // console.log('DashboardProvider: Updating active tab from', dashboardData.activeTab, 'to', dashboardId);
    setDashboardData(prev => {
      // Cek apakah dashboard yang dipilih sama dengan yang sudah aktif
      if (prev.activeTab === dashboardId) {
        // Skip update jika tidak ada perubahan
        // console.log('DashboardProvider: No change in active tab, skipping update');
        return prev;
      }
      
      // Update active tab dengan dashboard yang baru
      // console.log('DashboardProvider: Active tab changed, updating state');
      return {
        ...prev,
        activeTab: dashboardId
      };
    });
  }, [dashboardData.activeTab]);

  // Fungsi untuk mengganti seluruh tabItems sekaligus
  // Berguna untuk bulk update atau reset data
  const setAllTabItems = useCallback((items) => {
    setDashboardData(prev => {
      // Cek apakah items yang baru berbeda dengan yang lama
      if (JSON.stringify(prev.tabItems) === JSON.stringify(items)) {
        // Skip update jika tidak ada perubahan
        return prev;
      }
      
      // Update seluruh tabItems
      return {
        ...prev,
        tabItems: items
      };
    });
  }, []);

  // Fungsi untuk mengganti seluruh tabLayouts sekaligus
  // Berguna untuk bulk update atau reset layout data
  const setAllTabLayouts = useCallback((layouts) => {
    // Debug logging untuk tracking parameter
    // console.log('setAllTabLayouts called with:', { layouts, type: typeof layouts });
    
    // Validasi bahwa layouts adalah object yang valid
    if (typeof layouts !== 'object' || layouts === null) {
      console.warn('Invalid layouts provided to setAllTabLayouts:', layouts);
      return;
    }
    
    // Validasi setiap dashboard layout secara individual
    const validatedLayouts = {};
    Object.keys(layouts).forEach(dashboardId => {
      const dashboardLayout = layouts[dashboardId];
      // Pastikan setiap dashboard layout adalah object yang valid
      if (typeof dashboardLayout === 'object' && dashboardLayout !== null) {
        validatedLayouts[dashboardId] = dashboardLayout;
      } else {
        console.warn(`Invalid layout for dashboard ${dashboardId}:`, dashboardLayout);
        // Set layout kosong untuk dashboard dengan data invalid
        validatedLayouts[dashboardId] = {};
      }
    });
    
    setDashboardData(prev => {
      // Cek apakah layouts yang baru berbeda dengan yang lama
      if (JSON.stringify(prev.tabLayouts) === JSON.stringify(validatedLayouts)) {
        // Skip update jika tidak ada perubahan
        return prev;
      }
      
      // Update seluruh tabLayouts dengan data yang sudah divalidasi
      return {
        ...prev,
        tabLayouts: validatedLayouts
      };
    });
  }, []);

  // Fungsi untuk menghapus semua data dashboard
  // Akan menghapus data dari localStorage dan reset state ke kondisi awal
  const clearDashboardData = useCallback(() => {
    // Hapus data dari localStorage terlebih dahulu
    localStorage.removeItem("dashboard-data");
    // console.log('Cleared dashboard data from localStorage');
    
    // Kemudian bersihkan state - hanya trigger jika state tidak sudah kosong
    setDashboardData(prev => {
      // Cek apakah state sudah kosong
      const isEmpty = Object.keys(prev.tabItems).length === 0 && 
                     Object.keys(prev.tabLayouts).length === 0 && 
                     !prev.activeTab;
      
      if (isEmpty) {
        // Jangan trigger re-render jika sudah kosong
        return prev;
      }
      
      // Reset state ke kondisi awal
      return {
        tabItems: {},
        tabLayouts: {},
        activeTab: "",
      };
    });
  }, []);

  // Fungsi-fungsi baru untuk manajemen backup dashboard berdasarkan ID
  // Fitur backup memungkinkan penyimpanan dan pemulihan layout dashboard

  // Fungsi untuk menyimpan backup layout dashboard tertentu
  const saveDashboardBackup = useCallback((dashboardId, layoutData) => {
    try {
      // Membuat key unik untuk setiap dashboard backup
      const key = `dashboard_backup_${dashboardId}`;
      localStorage.setItem(key, JSON.stringify(layoutData));
    } catch (error) {
      console.warn("Failed to save dashboard backup:", error);
    }
  }, []);

  // Fungsi untuk memuat backup layout dashboard tertentu
  const loadDashboardBackup = useCallback((dashboardId) => {
    try {
      // Mengambil backup berdasarkan dashboard ID
      const key = `dashboard_backup_${dashboardId}`;
      const stored = localStorage.getItem(key);
      // Return data backup atau null jika tidak ada
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.warn("Failed to load dashboard backup:", error);
      return null;
    }
  }, []);

  // Fungsi untuk menghapus backup dashboard tertentu
  const removeDashboardBackup = useCallback((dashboardId) => {
    try {
      const key = `dashboard_backup_${dashboardId}`;
      localStorage.removeItem(key);
    } catch (error) {
      console.warn("Failed to remove dashboard backup:", error);
    }
  }, []);

  // Fungsi untuk menghapus semua backup dashboard
  const clearAllDashboardBackups = useCallback(() => {
    try {
      // Ambil semua keys dari localStorage
      const keys = Object.keys(localStorage);
      // Filter dan hapus hanya keys yang merupakan dashboard backup
      keys.forEach(key => {
        if (key.startsWith('dashboard_backup_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn("Failed to clear dashboard backups:", error);
    }
  }, []);

  // Object value yang akan disediakan ke seluruh komponen anak melalui context
  // Berisi semua state dan fungsi yang dapat diakses oleh komponen consumer
  const value = {
    // State data dashboard
    tabItems: dashboardData.tabItems,           // Item-item widget per dashboard
    tabLayouts: dashboardData.tabLayouts,       // Layout widget per dashboard
    activeTab: dashboardData.activeTab,         // Dashboard yang sedang aktif
    isInitialized,                              // Status inisialisasi data
    
    // Fungsi untuk update data per dashboard
    updateTabItems,                             // Update items dashboard tertentu
    updateTabLayouts,                           // Update layout dashboard tertentu
    updateActiveTab,                            // Update dashboard aktif
    
    // Fungsi untuk update data secara bulk
    setAllTabItems,                             // Set semua tab items sekaligus
    setAllTabLayouts,                           // Set semua tab layouts sekaligus
    
    // Fungsi utility
    clearDashboardData,                         // Hapus semua data dashboard
    
    // Fungsi backup management
    saveDashboardBackup,                        // Simpan backup dashboard
    loadDashboardBackup,                        // Muat backup dashboard
    removeDashboardBackup,                      // Hapus backup dashboard tertentu
    clearAllDashboardBackups,                   // Hapus semua backup dashboard
  };

  // Return provider component yang membungkus children dengan context value
  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

// Custom hook untuk mengakses dashboard context
// Hook ini memudahkan komponen lain untuk menggunakan dashboard context
export function useDashboard() {
  const context = useContext(DashboardContext);
  // Validasi bahwa hook digunakan dalam provider yang benar
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}

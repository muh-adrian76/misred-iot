import { useEffect, useState, useCallback } from "react";
import { useUser } from "@/providers/user-provider";
import { useBreakpoint } from "@/hooks/use-mobile";
import { useDashboard } from "@/providers/dashboard-provider";
import { fetchFromBackend } from "@/lib/helper";
import { successToast, errorToast } from "@/components/custom/other/toaster";
import { markDashboardCreated, markWidgetCreated } from "@/lib/onboarding-utils";
import { getWidgetConstraints } from "@/lib/dashboard-utils"; // Import dari lokasi terpusat

// ===== FUNGSI BANTUAN =====
// Fungsi utilitas untuk mendapatkan deskripsi dashboard berdasarkan ID
const getDashboardDescription = (id, dashboards) => {
  const dashboard = dashboards.find(d => d.id === id);
  return dashboard ? dashboard.description : "";
};

// ===== HOOK LOGIC DASHBOARD UTAMA =====
// Hook kustom utama yang mengelola seluruh logika dashboard
export function useDashboardLogic() {
  // ===== MANAJEMEN STATE INTI =====
  // State utama untuk data dashboard dan widget
  const [dashboards, setDashboards] = useState([]); // Daftar semua dashboard
  const [widgets, setWidgets] = useState({}); // Widget untuk setiap dashboard
  const [currentBreakpoint, setCurrentBreakpoint] = useState("lg"); // Breakpoint responsif saat ini
  
  // ===== STATE DIALOG & MODAL =====
  // State untuk mengelola dialog dan modal
  const [openChartSheet, setOpenChartSheet] = useState(false); // Sheet pemilihan chart
  const [openDashboardDialog, setOpenDashboardDialog] = useState(false); // Dialog tambah dashboard
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false); // Dialog hapus dashboard
  const [showWidgetForm, setShowWidgetForm] = useState(false); // Form tambah widget
  const [showEditWidgetForm, setShowEditWidgetForm] = useState(false); // Form edit widget
  
  // ===== STATE MANAJEMEN WIDGET =====
  // State untuk mengelola widget dan loading
  const [widgetCount, setWidgetCount] = useState(0); // Jumlah widget pada dashboard aktif
  const [isLoadingWidget, setIsLoadingWidget] = useState(false); // Status memuat widget
  const [newWidgetData, setNewWidgetData] = useState(null); // Data widget baru yang akan ditambahkan
  const [editWidgetData, setEditWidgetData] = useState(null); // Data widget yang sedang diedit
  
  // ===== STATE EDIT & HAPUS =====
  // State untuk mode penyuntingan dan operasi hapus
  const [isEditing, setIsEditing] = useState(false); // Status mode penyuntingan dashboard
  const [dashboardToDelete, setDashboardToDelete] = useState(null); // Dashboard yang akan dihapus
  const [editDashboardValue, setEditDashboardValue] = useState(""); // Nilai nama dashboard yang diedit
  const [deleteChecked, setDeleteChecked] = useState(false); // Konfirmasi checkbox untuk hapus
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false); // Tanda ada perubahan yang belum disimpan
  
  // ===== STATE DATA EKSTERNAL =====
  // State untuk data dari API eksternal
  const [devices, setDevices] = useState([]); // Daftar semua perangkat IoT
  const [datastreams, setDatastreams] = useState([]); // Daftar semua datastream
  
  // ===== STATE LAYOUT & RENDER =====
  // State untuk layout dan rendering grid
  const [layoutKey, setLayoutKey] = useState(0); // Key untuk memaksa render ulang grid layout
  
  // ===== STATE FILTER & RENTANG WAKTU =====
  // State untuk penyaringan dan rentang waktu data
  const [currentTimeRange, setCurrentTimeRange] = useState("1h"); // Rentang waktu default 1 jam
  const [currentDataCount, setCurrentDataCount] = useState("10"); // Jumlah data default 10
  const [filterType, setFilterType] = useState("count"); // Tipe filter default berdasarkan jumlah

  // ===== DASHBOARD PROVIDER & HOOKS =====
  // Provider dashboard untuk manajemen state global
  const {
    tabItems, // Item widget untuk setiap tab dashboard
    tabLayouts, // Layout grid untuk setiap tab dashboard
    activeTab, // ID dashboard yang sedang aktif
    updateTabItems, // Fungsi update item untuk tab tertentu
    updateTabLayouts, // Fungsi update layout untuk tab tertentu
    updateActiveTab, // Fungsi mengubah tab aktif
    setAllTabItems, // Set semua tab items sekaligus
    setAllTabLayouts, // Set semua tab layouts sekaligus
    clearDashboardData, // Bersihkan semua data dashboard
  } = useDashboard();

  // ===== HOOK RESPONSIF & USER =====
  // Hook kustom untuk desain responsif dan manajemen user
  const { isMobile, isMedium, isTablet, isDesktop } = useBreakpoint(); // Breakpoints responsif
  const { user } = useUser(); // Data user yang sedang login
  const isAuthenticated = user && user.id; // Status autentikasi user

  // ===== LOGGING DEBUG (PENGEMBANGAN) =====
  // Logging untuk troubleshooting (dimatikan pada produksi)
  // useEffect(() => {
  //   console.log('State Logika Dashboard:', {
  //     isAuthenticated,
  //     user: user?.id,
  //     dashboardsCount: dashboards.length,
  //     activeTab,
  //     widgetCount,
  //     isLoadingWidget,
  //     currentTabItems: activeTab ? Object.keys(tabItems[activeTab] || {}).length : 0,
  //     currentTabLayouts: activeTab ? Object.keys(tabLayouts[activeTab] || {}).length : 0
  //   });
  // }, [isAuthenticated, user, dashboards.length, activeTab, widgetCount, isLoadingWidget, tabItems, tabLayouts]);

  // ===== MONITOR PERUBAHAN NILAI EDIT =====
  // Effect untuk memantau perubahan nilai nama dashboard saat diedit
  useEffect(() => {
    const currentDescription = getDashboardDescription(activeTab, dashboards);
    // Set flag perubahan belum disimpan jika nama dashboard berubah
    if (isEditing && editDashboardValue.trim() && editDashboardValue !== currentDescription) {
      setHasUnsavedChanges(true);
    }
  }, [editDashboardValue, activeTab, dashboards, isEditing]);

  // ===== FUNGSI FETCH - PENGAMBILAN DATA =====
  
  // Ambil semua dashboard dari backend
  const fetchDashboards = useCallback(async () => {
    try {
      const res = await fetchFromBackend("/dashboard", { method: "GET" });
      if (!res.ok) return; // Keluar jika respons tidak ok
      const data = await res.json();
      setDashboards(data.result || []); // Set data dashboard atau array kosong
    } catch (error) {
      console.error('Kesalahan saat mengambil dashboard:', error);
    }
  }, []);

  // Ambil jumlah widget pada dashboard tertentu
  const fetchWidgetCount = useCallback(async (dashboardId) => {
    setIsLoadingWidget(true); // Aktifkan status memuat
    try {
      const res = await fetchFromBackend(`/widget/dashboard/${dashboardId}`, { method: "GET" });
      if (!res.ok) return setWidgetCount(0); // Set 0 jika tidak ok
      const data = await res.json();
      // Set jumlah widget berdasarkan panjang array result
      setWidgetCount(Array.isArray(data.result) ? data.result.length : 0);
    } catch (error) {
      setWidgetCount(0); // Set 0 jika terjadi kesalahan
    } finally {
      setIsLoadingWidget(false); // Matikan status memuat
    }
  }, []);

  // Ambil semua widget pada dashboard tertentu
  const fetchWidgetsByDashboard = useCallback(async (dashboardId) => {
    try {
      const res = await fetchFromBackend(`/widget/dashboard/${dashboardId}`, { method: "GET" });
      if (!res.ok) return []; // Kembalikan array kosong jika tidak ok
      const data = await res.json();
      return data.result || []; // Kembalikan array widget atau array kosong
    } catch (error) {
      return []; // Kembalikan array kosong jika ada kesalahan
    }
  }, []);

  // Ambil semua perangkat IoT
  const fetchDevices = useCallback(async () => {
    try {
      const res = await fetchFromBackend("/device", { method: "GET" });
      if (!res.ok) return; // Keluar jika respons tidak ok
      const data = await res.json();
      setDevices(data.result || []); // Set data perangkat atau array kosong
    } catch (error) {
      console.error('Kesalahan saat mengambil perangkat:', error);
    }
  }, []);

  // Ambil semua datastream
  const fetchDatastreams = useCallback(async () => {
    try {
      const res = await fetchFromBackend("/datastream", { method: "GET" });
      if (!res.ok) return; // Keluar jika respons tidak ok
      const data = await res.json();
      setDatastreams(data.result || []); // Set data datastream atau array kosong
    } catch (error) {
      console.error('Kesalahan saat mengambil datastream:', error);
    }
  }, []);

  // Bersihkan data dashboard ketika user logout
  useEffect(() => {
    if (!isAuthenticated) {
      clearDashboardData(); // Bersihkan semua data dashboard dari provider
      setDashboards([]); // Reset state dashboard
      setWidgets({}); // Reset state widgets
    }
  }, [isAuthenticated, clearDashboardData]);

  // Fetch data saat user sudah terauntentikasi
  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboards(); // Ambil data dashboard
      fetchDevices(); // Ambil data perangkat
      fetchDatastreams(); // Ambil data datastream
    }
  }, [isAuthenticated, fetchDashboards, fetchDevices, fetchDatastreams]);

  // Memuat widget untuk semua dashboard
  useEffect(() => {
    const loadWidgetsForDashboards = async () => {
      if (dashboards.length > 0) {
        const widgetsByDashboard = {};
        for (const dashboard of dashboards) {
          const dashboardWidgets = await fetchWidgetsByDashboard(dashboard.id);
          
          // Proses widget untuk memastikan field inputs terurai dengan benar
          const processedWidgets = dashboardWidgets.map(widget => {
            // Parse inputs jika berupa string (kolom JSON dari database)
            if (widget.inputs && typeof widget.inputs === 'string') {
              try {
                widget.inputs = JSON.parse(widget.inputs);
              } catch (e) {
                console.warn('Gagal menguraikan inputs widget:', widget.inputs, e);
                widget.inputs = [];
              }
            }
            
            // Kompatibilitas lama: jika tidak ada inputs namun ada format lama
            if (!widget.inputs && widget.device_id && widget.datastream_id) {
              widget.inputs = [{ device_id: widget.device_id, datastream_id: widget.datastream_id }];
            }
            
            // Pastikan inputs selalu array
            if (!Array.isArray(widget.inputs)) {
              widget.inputs = [];
            }
            
            return widget;
          });
          
          widgetsByDashboard[dashboard.id] = processedWidgets;
        }
        setWidgets(widgetsByDashboard);
      }
    };
    
    loadWidgetsForDashboards();
  }, [dashboards, fetchWidgetsByDashboard]);

  // Perbarui jumlah widget ketika tab aktif berubah
  useEffect(() => {
    if (activeTab && dashboards.length > 0) {
      const dashboard = dashboards.find(d => d.id === activeTab);
      if (dashboard) {
        fetchWidgetCount(dashboard.id);
      }
    }
  }, [activeTab, dashboards, fetchWidgetCount]);

  // Sinkronkan data dashboard ke state provider (kunci perbaikan untuk perpindahan tab)
  useEffect(() => {
    // console.log('Efek sinkronisasi dashboard dipicu:', { 
    //   dashboardsLength: dashboards.length, 
    //   widgetsKeys: Object.keys(widgets), 
    //   activeTab 
    // });
    
    if (dashboards.length > 0) {
      const items = {};
      let layouts = {}; // Gunakan let untuk memungkinkan reassignment setelah validasi
      
      dashboards.forEach((dashboard) => {
        const dashboardWidgets = widgets[dashboard.id] || [];
        // Gunakan ID dashboard sebagai key untuk items
        items[dashboard.id] = dashboardWidgets;
        
        // Generate atau parse layouts - UTAMAKAN layout dari database
        let dashboardLayouts = {};
        
        if (dashboard.layout) {
          try {
            
            // Parse pertama - mungkin masih string jika double-encoded
            let parsedLayout = typeof dashboard.layout === "string" 
              ? JSON.parse(dashboard.layout) 
              : dashboard.layout;
            
            // Cek jika masih string setelah parse pertama (kasus double-encoded)
            if (typeof parsedLayout === 'string') {
              parsedLayout = JSON.parse(parsedLayout);
            }
            
            // Validasi akhir - pastikan berupa object
            if (typeof parsedLayout === 'object' && parsedLayout !== null) {
              dashboardLayouts = parsedLayout;
            } else {
              console.warn('Layout dashboard tidak valid setelah parsing, akan dibuat baru');
              dashboardLayouts = {};
            }
          } catch (e) {
            console.warn('Gagal menguraikan layout dashboard:', e);
            dashboardLayouts = {};
          }
        }
        
        // Hanya buat layout jika widget ada namun layout kosong/tidak ada
        // Ini untuk mencegah override layout dari database dengan yang otomatis
        const hasValidLayouts = Object.keys(dashboardLayouts).length > 0;
        if (dashboardWidgets.length > 0 && !hasValidLayouts) {
          // Buat layout untuk semua breakpoint
          const breakpoints = ['lg', 'md', 'sm', 'xs', 'xxs'];
          const defaultWidths = { lg: 4, md: 6, sm: 12, xs: 12, xxs: 12 };
          
          breakpoints.forEach(bp => {
            dashboardLayouts[bp] = [];
            
            // Buat item layout untuk setiap widget
            dashboardWidgets.forEach((widget, idx) => {
              const constraints = getWidgetConstraints(widget.type, bp);
              const w = Math.max(constraints.minW, defaultWidths[bp] || constraints.minW);
              const h = Math.max(constraints.minH, 4);
              const cols = 12;
              const x = (idx * w) % cols;
              const y = Math.floor(idx / (cols / w)) * h;
              
              dashboardLayouts[bp].push({
                i: widget.id.toString(),
                x: x,
                y: y,
                w: w,
                h: h,
                minW: constraints.minW,
                minH: constraints.minH,
                maxW: constraints.maxW,
                maxH: constraints.maxH,
                isResizable: constraints.isResizable,
                isDraggable: true,
                static: false,
              });
            });
          });
        } 
        
        layouts[dashboard.id] = dashboardLayouts;
      });

      // Set semua data ke provider - memastikan layout dari database jadi prioritas
      setAllTabItems(items);
      setAllTabLayouts(layouts);
      
      // Set tab aktif bila perlu
      if (activeTab) {
        updateActiveTab(activeTab);
      } else if (dashboards.length > 0 && !activeTab) {
        updateActiveTab(dashboards[0].id);
      }
    } else {
      clearDashboardData(); // Bersihkan semua data dashboard
    }
  }, [dashboards, widgets, activeTab, setAllTabItems, setAllTabLayouts, updateActiveTab]);

  // ===== OPERASI CRUD - MANAJEMEN DASHBOARD =====
  
  // Tambah dashboard baru
  const handleAddDashboard = async (description, widget_count = 0) => {
    // Validasi input - nama dashboard tidak boleh kosong
    if (!description.trim()) {
      errorToast("Nama dashboard tidak boleh kosong");
      return null; // Kembalikan null jika validasi gagal
    }
    
    try {
      // Kirim permintaan POST ke backend untuk membuat dashboard
      const res = await fetchFromBackend("/dashboard", {
        method: "POST",
        body: JSON.stringify({ 
          description, // Nama dashboard
          widget_count // Jumlah widget (default 0 untuk dashboard baru)
        }),
      });
      
      if (!res.ok) throw new Error("Gagal membuat dashboard");
      const { id } = await res.json(); // Ambil ID dashboard yang baru dibuat
      
      successToast("Dashboard berhasil dibuat"); // Notifikasi sukses
      markDashboardCreated(); // Tandai onboarding task untuk user baru
      
      await fetchDashboards(); // Refresh data dashboard
      
      // Set dashboard baru sebagai tab aktif setelah dibuat
      setTimeout(() => {
        updateActiveTab(id); // Pindah ke dashboard baru
        fetchWidgetCount(id); // Muat jumlah widget untuk dashboard baru
      }, 100); // Delay agar data sudah ter-update
      
      return id; // Kembalikan ID dashboard untuk keperluan lain
    } catch (error) {
      console.error('Kesalahan saat menambah dashboard:', error);
      errorToast("Gagal membuat dashboard"); // Notifikasi error
      throw error; // Teruskan error untuk ditangani di level atas
    }
  };

  const handleEditDashboard = async (newDescription) => {
    const dashboard = dashboards.find((d) => d.id === activeTab);
    if (!dashboard) return;
    
    try {
      const dashboardId = activeTab;
      const currentLayout = tabLayouts[dashboardId] || {};
      const currentWidgetCount = (tabItems[dashboardId] || []).filter(item => !item.isStaged).length;
      
      const res = await fetchFromBackend(`/dashboard/${dashboard.id}`, {
        method: "PUT",
        body: JSON.stringify({ 
          description: newDescription,
          widget_count: currentWidgetCount,
          layout: JSON.stringify(currentLayout)
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.text();
        console.error('Kesalahan respons backend:', errorData);
        throw new Error("Gagal mengubah nama dashboard");
      }
      
      await fetchDashboards();
      successToast("Dashboard berhasil diubah");
    } catch (error) {
      console.error('Kesalahan saat mengubah dashboard:', error);
      errorToast("Gagal mengubah nama dashboard");
    }
  };

  const handleDeleteDashboard = async () => {
    if (!dashboardToDelete) return;
    try {
      const res = await fetchFromBackend(`/dashboard/${dashboardToDelete.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      successToast("Dashboard berhasil dihapus");
      setOpenDeleteDialog(false);
      setDashboardToDelete(null);
      
      await fetchDashboards();
      
      // Beralih ke dashboard lain atau kosongkan tab aktif
      setTimeout(() => {
        const remainingDashboards = dashboards.filter(d => d.id !== dashboardToDelete.id);
        if (remainingDashboards.length > 0) {
          updateActiveTab(remainingDashboards[0].id);
        } else {
          updateActiveTab("");
        }
      }, 100);
    } catch (error) {
      console.error('Kesalahan saat menghapus dashboard:', error);
      errorToast("Gagal menghapus dashboard", error.message);
    } finally {
      setIsEditing(false);
      setDeleteChecked(false);
    }
  };

  const handleSaveEditDashboard = async () => {
    try {
      const dashboard = dashboards.find((d) => d.id === activeTab);
      if (!dashboard) {
        errorToast("Dashboard tidak ditemukan");
        return;
      }

      const currentDescription = getDashboardDescription(activeTab, dashboards);
      const finalDescription = (editDashboardValue.trim() && editDashboardValue !== currentDescription) 
        ? editDashboardValue.trim() 
        : dashboard.description;

      const dashboardId = activeTab;
      const currentItems = tabItems[dashboardId] || [];
      
      // Temukan dan simpan widget yang di-staging terlebih dahulu
      const stagedWidgets = currentItems.filter(widget => widget.isStaged);
      // console.log('Widget yang akan disimpan (staging):', stagedWidgets);
      
      // Pemetaan ID widget untuk update layout
      const widgetIdMapping = {};
      let widgetCreatedCount = 0; // Hitung berapa widget dibuat
      
      for (const stagedWidget of stagedWidgets) {
        try {
          const widgetPayload = {
            description: stagedWidget.description,
            dashboard_id: dashboardId,
            inputs: stagedWidget.inputs || stagedWidget.datastream_ids || [{ device_id: stagedWidget.device_id || 1, datastream_id: stagedWidget.datastream_id || 1 }],
            type: stagedWidget.type,
          };
          
          const res = await fetchFromBackend("/widget", {
            method: "POST",
            body: JSON.stringify(widgetPayload),
          });
          
          if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Gagal menambah widget: ${res.status} - ${errorText}`);
          }
          
          const newWidget = await res.json();
          widgetIdMapping[stagedWidget.id] = newWidget.result.id;
          widgetCreatedCount++;
          
          // Tandai onboarding untuk setiap widget yang dibuat
          markWidgetCreated();
          
        } catch (error) {
          console.error('Kesalahan saat menyimpan widget staging:', stagedWidget, error);
          throw error;
        }
      }
      
      // Perbarui layout dengan ID widget sebenarnya
      let finalLayoutData = tabLayouts[dashboardId] || {};
      
      if (Object.keys(widgetIdMapping).length > 0) {
        const updatedLayouts = { ...finalLayoutData };
        
        Object.keys(updatedLayouts).forEach(breakpoint => {
          if (updatedLayouts[breakpoint]) {
            updatedLayouts[breakpoint] = updatedLayouts[breakpoint].map(layoutItem => {
              const realId = widgetIdMapping[layoutItem.i];
              if (realId) {
                return { ...layoutItem, i: realId.toString() };
              }
              return layoutItem;
            });
          }
        });
        
        finalLayoutData = updatedLayouts;
        updateTabLayouts(dashboardId, updatedLayouts);
      }
      
      // Hitung jumlah widget akhir
      const existingWidgetCount = currentItems.filter(item => !item.isStaged).length;
      const finalWidgetCount = existingWidgetCount + Object.keys(widgetIdMapping).length;
      
      // Simpan dashboard dengan layout
      const response = await fetchFromBackend(`/dashboard/${dashboard.id}`, {
        method: "PUT",
        body: JSON.stringify({
          description: finalDescription,
          widget_count: finalWidgetCount,
          layout: JSON.stringify(finalLayoutData),
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Kesalahan respons backend:', errorData);
        throw new Error(`Kesalahan HTTP! status: ${response.status}`);
      }
      
      // Refresh data agar keadaan terbaru termuat
      await fetchDashboards();
      
      // successToast(`Dashboard berhasil disimpan${widgetCreatedCount > 0 ? ` dengan ${widgetCreatedCount} widget baru` : ''}`);
    } catch (error) {
      console.error('Kesalahan saat menyimpan dashboard:', error);
      errorToast("Gagal menyimpan dashboard");
    } finally {
      setIsEditing(false);
      setHasUnsavedChanges(false);
    }
  };

  // Penyimpanan layout yang disederhanakan
  const saveLayoutToDB = async () => {
    const dashboard = dashboards.find((d) => d.id === activeTab);
    if (!dashboard) {
      console.warn('Dashboard tidak ditemukan untuk activeTab:', activeTab);
      return;
    }

    try {
      const dashboardId = activeTab;
      const layoutData = tabLayouts[dashboardId] || {};
      const allItems = tabItems[dashboardId] || [];
      const realWidgetCount = allItems.filter(item => !item.isStaged).length;
      
  // console.log('=== MENYIMPAN LAYOUT KE DB ===');
  // console.log('ID Dashboard:', dashboardId);
  // console.log('Struktur data layout:', Object.keys(layoutData));
  // console.log('Detail data layout:', layoutData);
  // console.log('Jumlah widget:', realWidgetCount);
  // console.log('==============================');
      
      const response = await fetchFromBackend(`/dashboard/${dashboard.id}`, {
        method: "PUT",
        body: JSON.stringify({
          description: dashboard.description,
          widget_count: realWidgetCount,
          layout: JSON.stringify(layoutData),
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Kesalahan respons backend:', errorData);
        throw new Error(`Kesalahan HTTP! status: ${response.status}`);
      }
      
  // console.log('Layout berhasil disimpan ke database');
      successToast("Layout berhasil disimpan");
    } catch (error) {
      console.error('Kesalahan saat menyimpan layout:', error);
      errorToast("Gagal menyimpan layout");
      throw error;
    }
  };

  // Manajemen widget
  const addWidget = async (chartType) => {
    const dashboardId = activeTab;
    
    try {
      const res = await fetchFromBackend("/widget", {
        method: "POST",
        body: JSON.stringify({
          description: `${chartType} chart`,
          dashboard_id: dashboardId,
          inputs: [{ device_id: 1, datastream_id: 1 }],
          type: chartType,
        }),
      });
      if (!res.ok) throw new Error("Gagal menambahkan widget");
      
      markWidgetCreated(); // Tandai onboarding
      await fetchDashboards(); // Segarkan untuk mendapatkan data terbaru
      
    } catch (error) {
      console.error('Kesalahan saat menambah widget:', error);
      errorToast("Gagal menambahkan widget");
    }
  };

  // Handler form widget
  const handleChartDrop = (chartType, layoutItem) => {
    // Saat chart dijatuhkan, tampilkan form widget dengan tipe chart dan data layout
    setNewWidgetData({
      chartType,
      layoutItem
    });
    setShowWidgetForm(true);
  };

  const handleAddChart = (chartType) => {
    // Tambah chart tanpa posisi spesifik - akan ditempatkan otomatis
    setNewWidgetData({
      chartType,
      layoutItem: null
    });
    setShowWidgetForm(true);
  };

  const handleEditWidget = (widget) => {
    // Buka form edit untuk widget yang sudah ada
    setEditWidgetData(widget);
    setShowEditWidgetForm(true);
  };

  const stageWidgetRemoval = (widgetId) => {
    // console.log('=== TANDAI WIDGET UNTUK DIHAPUS (STAGING) ===');
    // console.log('ID Widget yang dihapus:', widgetId);
    
    // Tandai widget untuk dihapus (mode staging)
    const dashboardId = activeTab;
    const currentItems = tabItems[dashboardId] || [];
    
    // console.log('Item saat ini sebelum staging hapus:', currentItems.map(item => ({
    //   id: item.id,
    //   description: item.description,
    //   isStaged: item.isStaged,
    //   stagedForRemoval: item.stagedForRemoval
    // })));
    
    const updatedItems = currentItems.map(item => {
      if (item.id === widgetId) {
        // Jangan ubah isStaged, hanya tandai stagedForRemoval
        return { ...item, stagedForRemoval: true };
      }
      return item;
    });
    
    // console.log('Item setelah staging hapus:', updatedItems.map(item => ({
    //   id: item.id,
    //   description: item.description,
    //   isStaged: item.isStaged,
    //   stagedForRemoval: item.stagedForRemoval
    // })));
    
    updateTabItems(dashboardId, updatedItems);
    setHasUnsavedChanges(true);
    // console.log('Widget berhasil ditandai untuk dihapus');
  };

  const removeWidgetFromDatabase = async (widgetId) => {
    // Hapus widget langsung dari database (mode non-edit)
    try {
      const res = await fetchFromBackend(`/widget/${widgetId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Gagal menghapus widget");

      // Segarkan data dashboard
      await fetchDashboards();
      
      successToast("Widget berhasil dihapus");
    } catch (error) {
      console.error("Kesalahan saat menghapus widget:", error);
      errorToast("Gagal menghapus widget");
    }
  };

  const handleWidgetFormSubmit = async (formData) => {
    // Tangani submit form widget baru
    await stageWidgetAddition(formData);
  };

  const handleEditWidgetFormSubmit = async (formData) => {
    // Tangani submit form edit widget - staging perubahan, bukan langsung simpan
    try {
      // console.log('Staging edit widget dengan data:', formData);
      
      // Validasi field wajib
      if (!formData.id) {
        throw new Error('ID widget wajib diisi');
      }
      
      if (!formData.description?.trim()) {
        throw new Error('Deskripsi widget wajib diisi');
      }
      
      // Dukung format lama (single device/datastream) dan format baru (multi-datastream)
      const hasOldFormat = formData.device_id && formData.datastream_id;
      const hasNewFormat = formData.datastream_ids && Array.isArray(formData.datastream_ids) && formData.datastream_ids.length > 0;
      const hasInputsFormat = formData.inputs && Array.isArray(formData.inputs) && formData.inputs.length > 0;
      
      if (!hasOldFormat && !hasNewFormat && !hasInputsFormat) {
        throw new Error('Pilihan device dan datastream wajib diisi');
      }

      // Staging perubahan widget di state lokal
      const dashboardId = activeTab;
      const currentItems = tabItems[dashboardId] || [];
      const currentWidget = currentItems.find(item => item.id === formData.id);
      
      if (!currentWidget) {
        throw new Error('Widget tidak ditemukan pada dashboard saat ini');
      }
      
      // Perbarui state lokal dengan perubahan yang di-staging
      const updatedItems = currentItems.map(item => 
        item.id === formData.id 
          ? { 
              ...item,
              description: formData.description.trim(),
              inputs: formData.inputs || formData.datastream_ids || [{ device_id: parseInt(formData.device_id || item.device_id || 1), datastream_id: parseInt(formData.datastream_id || item.datastream_id || 1) }],
              // Tandai bahwa ada perubahan yang di-staging
              hasEditedChanges: true,
              originalData: {
                description: item.description,
                inputs: item.inputs || item.datastream_ids || [{ device_id: item.device_id, datastream_id: item.datastream_id }]
              }
            }
          : item
      );
      
      updateTabItems(dashboardId, updatedItems);
      setHasUnsavedChanges(true);
      
      setShowEditWidgetForm(false);
      setEditWidgetData(null);

      // successToast("Perubahan widget disimpan. Klik 'Simpan' untuk menyimpan ke database.");
      // console.log('Perubahan widget berhasil di-staging');
    } catch (error) {
      console.error("Kesalahan saat staging edit widget:", error);
      errorToast(`Gagal menyimpan perubahan widget: ${error.message}`);
    }
  };

  const stageWidgetAddition = async (formData) => {
    const tempId = Date.now().toString();
    const dashboardId = activeTab;
    
    const stagedWidget = {
      id: tempId,
      description: formData.description,
      dashboard_id: dashboardId,
      inputs: formData.inputs || formData.datastream_ids || [{ device_id: formData.device_id || 1, datastream_id: formData.datastream_id || 1 }],
      type: formData.chartType,
      isStaged: true
    };
    
    const currentItems = tabItems[dashboardId] || [];
    const updatedItems = [...currentItems, stagedWidget];
    updateTabItems(dashboardId, updatedItems);
    
    // Tambahkan ke layout - gunakan posisi dari form atau posisikan otomatis
    if (newWidgetData?.layoutItem) {
      await stageLayoutUpdate(tempId, newWidgetData.layoutItem, formData.chartType);
    } else {
      // Posisi otomatis dengan batasan sesuai breakpoint saat ini
      const constraints = getWidgetConstraints(formData.chartType, currentBreakpoint);
      const autoLayoutItem = {
        x: 0,
        y: Infinity, // Tempatkan di bagian bawah
        w: constraints.minW,
        h: constraints.minH
      };
      await stageLayoutUpdate(tempId, autoLayoutItem, formData.chartType);
    }
    
    setHasUnsavedChanges(true);
    setShowWidgetForm(false);
    setNewWidgetData(null);
  };

  const stageLayoutUpdate = async (widgetId, layoutItem, widgetType) => {
    const dashboardId = activeTab;
    const currentLayouts = tabLayouts[dashboardId] || {};
    
    const breakpoints = ['lg', 'md', 'sm', 'xs', 'xxs'];
    const updatedLayouts = { ...currentLayouts };
    
    // Buat layout responsif untuk semua breakpoint
    breakpoints.forEach(breakpoint => {
      const constraints = getWidgetConstraints(widgetType, breakpoint);
      
      // Pastikan dimensi memenuhi batas minimum untuk breakpoint ini
      const finalWidth = Math.max(constraints.minW, layoutItem.w || constraints.minW);
      const finalHeight = Math.max(constraints.minH, layoutItem.h || constraints.minH);
      
      if (!updatedLayouts[breakpoint]) {
        updatedLayouts[breakpoint] = [];
      }
      
      updatedLayouts[breakpoint].push({
        i: widgetId.toString(),
        x: layoutItem.x || 0,
        y: layoutItem.y || 0,
        w: finalWidth,
        h: finalHeight,
        minW: constraints.minW,
        minH: constraints.minH,
        maxW: constraints.maxW,
        maxH: constraints.maxH,
        isResizable: constraints.isResizable
      });
    });
    
    updateTabLayouts(dashboardId, updatedLayouts);
    setHasUnsavedChanges(true);
  };

  // Handler layout dan event
  const setItemsForTab = (items) => {
    updateTabItems(activeTab, items);
  };
  
  const setLayoutsForTab = (layouts) => {
    updateTabLayouts(activeTab, layouts);
  };

  const handleBreakpointChange = useCallback((breakpoint) => {
    setCurrentBreakpoint(breakpoint);
  }, []);

  const handleLayoutChange = useCallback(async (layout, allLayouts) => {
    if (!activeTab) return;
    
    // Validasi sederhana - percayakan validasi detail pada komponen grid-layout
    // Pastikan hanya struktur datanya yang benar
    const validatedAllLayouts = {};
    Object.keys(allLayouts).forEach(breakpoint => {
      if (Array.isArray(allLayouts[breakpoint])) {
        validatedAllLayouts[breakpoint] = allLayouts[breakpoint];
      } else {
        validatedAllLayouts[breakpoint] = [];
      }
    });
    
    updateTabLayouts(activeTab, validatedAllLayouts);
    setHasUnsavedChanges(true);
  }, [activeTab, updateTabLayouts]);

  // Manajemen mode edit
  const startEditMode = useCallback(() => {
    setIsEditing(true);
    setHasUnsavedChanges(false);
    const currentDescription = getDashboardDescription(activeTab, dashboards);
    setEditDashboardValue(currentDescription);
  }, [activeTab, dashboards]);

  const cancelEditMode = useCallback(async () => {
    try {
      // Reset ke keadaan awal dengan memuat ulang dari database
      await fetchDashboards();
      
      // Reset state edit
      setIsEditing(false);
      setHasUnsavedChanges(false);
      setEditDashboardValue("");
      
      // Bersihkan data dashboard di localStorage agar memaksa refresh
      clearDashboardData();
      
      // console.log('Mode edit dibatalkan, data kembali ke keadaan awal');
    } catch (error) {
      console.error('Kesalahan saat membatalkan mode edit:', error);
      // Fallback: hanya reset state UI
      setIsEditing(false);
      setHasUnsavedChanges(false);
      setEditDashboardValue("");
    }
  }, [fetchDashboards, clearDashboardData]);

  // Fungsi utama menyimpan semua perubahan
  const saveAllLayoutChanges = useCallback(async () => {
    try {
      // console.log('=== SIMPAN SEMUA PERUBAHAN LAYOUT (DEBUG) ===');
      
      // Simpan dashboard saat ini dengan perubahan nama dan update layout
      const dashboard = dashboards.find((d) => d.id === activeTab);
      if (!dashboard) {
        errorToast("Dashboard tidak ditemukan");
        return;
      }

      const currentDescription = getDashboardDescription(activeTab, dashboards);
      const finalDescription = (editDashboardValue.trim() && editDashboardValue !== currentDescription) 
        ? editDashboardValue.trim() 
        : dashboard.description;

      const dashboardId = activeTab;
      const currentItems = tabItems[dashboardId] || [];
      
      // console.log('Item saat ini (sebelum kategorisasi):', currentItems.map(item => ({
      //   id: item.id,
      //   description: item.description,
      //   isStaged: item.isStaged,
      //   stagedForRemoval: item.stagedForRemoval
      // })));
      
      // Kategorikan widget
      const widgetsToAdd = currentItems.filter(widget => widget.isStaged && !widget.stagedForRemoval);
      const widgetsToRemove = currentItems.filter(widget => widget.stagedForRemoval);
      const widgetsToEdit = currentItems.filter(widget => widget.hasEditedChanges && !widget.stagedForRemoval);
      const existingWidgets = currentItems.filter(widget => !widget.isStaged && !widget.stagedForRemoval && !widget.hasEditedChanges);
      
      // console.log('Kategori widget:', {
      //   widgetsToAdd: widgetsToAdd.map(w => ({ id: w.id, description: w.description })),
      //   widgetsToRemove: widgetsToRemove.map(w => ({ id: w.id, description: w.description, isStaged: w.isStaged })),
      //   widgetsToEdit: widgetsToEdit.map(w => ({ id: w.id, description: w.description, hasEditedChanges: w.hasEditedChanges })),
      //   existingWidgets: existingWidgets.map(w => ({ id: w.id, description: w.description })),
      //   total: currentItems.length
      // });
      
      // 1) Hapus widget yang ditandai untuk dihapus
      for (const widget of widgetsToRemove) {
        try {
          // Hanya hapus jika bukan widget staging (punya ID DB nyata)
          if (!widget.isStaged) {
            const res = await fetchFromBackend(`/widget/${widget.id}`, {
              method: "DELETE",
            });
            
            if (!res.ok) {
              const errorText = await res.text();
              throw new Error(`Gagal menghapus widget ${widget.id}: ${res.status} - ${errorText}`);
            }
          } else {
            // console.log(`Widget ${widget.id} adalah staging, lewati penghapusan DB`);
          }
        } catch (error) {
          console.error('Kesalahan saat menghapus widget:', widget.id, error);
          throw error;
        }
      }
      
      // 2) Perbarui widget yang diedit
      let widgetEditedCount = 0;
      
      for (const editedWidget of widgetsToEdit) {
        try {
          // console.log(`Memproses pembaruan widget:`, {
          //   id: editedWidget.id,
          //   description: editedWidget.description,
          //   hasEditedChanges: editedWidget.hasEditedChanges
          // });
          
          const updatePayload = {
            description: editedWidget.description,
            dashboard_id: parseInt(editedWidget.dashboard_id || dashboardId),
            inputs: editedWidget.inputs || editedWidget.datastream_ids || [{ device_id: parseInt(editedWidget.device_id || 1), datastream_id: parseInt(editedWidget.datastream_id || 1) }],
            type: editedWidget.type,
          };
          
          // console.log(`Memperbarui widget ${editedWidget.id} di database...`, updatePayload);
          const res = await fetchFromBackend(`/widget/${editedWidget.id}`, {
            method: "PUT",
            body: JSON.stringify(updatePayload),
          });
          
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.message || `Gagal memperbarui widget ${editedWidget.id}: ${res.status}`);
          }
          
          widgetEditedCount++;
          // console.log(`Widget ${editedWidget.id} berhasil diperbarui di database`);
        } catch (error) {
          console.error('Kesalahan saat memperbarui widget:', editedWidget.id, error);
          throw error;
        }
      }
      
      // 3) Tambah widget staging baru
      const widgetIdMapping = {};
      let widgetCreatedCount = 0;
      
      for (const stagedWidget of widgetsToAdd) {
        try {
          const widgetPayload = {
            description: stagedWidget.description,
            dashboard_id: dashboardId,
            inputs: stagedWidget.inputs || stagedWidget.datastream_ids || [{ device_id: stagedWidget.device_id || 1, datastream_id: stagedWidget.datastream_id || 1 }],
            type: stagedWidget.type,
          };
          
          const res = await fetchFromBackend("/widget", {
            method: "POST",
            body: JSON.stringify(widgetPayload),
          });
          
          const newWidget = await res.json();
          if (!res.ok) {
            throw new Error(newWidget.message || `Gagal membuat widget: ${res.status}`);
          }
          
          // console.log('Respon pembuatan widget:', newWidget);
          
          // Pemeriksaan keamanan untuk struktur respons
          const widgetId = newWidget?.result?.id || newWidget?.id || newWidget?.data?.id;
          if (!widgetId) {
            console.error('Struktur respons widget tidak valid:', newWidget);
            throw new Error('ID widget tidak ditemukan dalam respons');
          }
          
          widgetIdMapping[stagedWidget.id] = widgetId;
          widgetCreatedCount++;
          
          // Tandai onboarding untuk setiap widget yang dibuat
          markWidgetCreated();
          
        } catch (error) {
          console.error('Kesalahan saat menyimpan widget staging:', stagedWidget, error);
          throw error;
        }
      }
      
      // Perbarui layout: hapus widget yang dihapus dan ganti ID untuk widget baru
      let finalLayoutData = tabLayouts[dashboardId] || {};
      
      // Pastikan finalLayoutData adalah object, bukan string
      if (typeof finalLayoutData === 'string') {
        try {
          // console.log('Data layout berupa string, parsing...');
          finalLayoutData = JSON.parse(finalLayoutData);
          
          // Cek jika masih string (double-encoded)
          if (typeof finalLayoutData === 'string') {
            // console.log('Data layout double-encoded, parsing lagi...');
            finalLayoutData = JSON.parse(finalLayoutData);
          }
        } catch (e) {
          console.warn('Gagal menguraikan data layout:', e);
          finalLayoutData = {};
        }
      }
      
      // Validasi akhir
      if (typeof finalLayoutData !== 'object' || finalLayoutData === null) {
        console.warn('Data layout tidak valid, di-reset ke kosong');
        finalLayoutData = {};
      }
      
      // Proses layout untuk semua breakpoint
      const updatedLayouts = { ...finalLayoutData };
      const removedWidgetIds = widgetsToRemove.map(w => w.id.toString());
      
      // console.log('Menghapus ID widget dari layout:', removedWidgetIds);
      
      Object.keys(updatedLayouts).forEach(breakpoint => {
        if (updatedLayouts[breakpoint] && Array.isArray(updatedLayouts[breakpoint])) {
          const originalCount = updatedLayouts[breakpoint].length;
          
          // Hapus layout untuk widget yang dihapus
          updatedLayouts[breakpoint] = updatedLayouts[breakpoint].filter(layoutItem => {
            const shouldKeep = !removedWidgetIds.includes(layoutItem.i);
            return shouldKeep;
          });
          
          const afterRemovalCount = updatedLayouts[breakpoint].length;
          // console.log(`Breakpoint ${breakpoint}: ${originalCount} -> ${afterRemovalCount} item`);
          
          // Perbarui ID untuk widget baru
          updatedLayouts[breakpoint] = updatedLayouts[breakpoint].map(layoutItem => {
            const realId = widgetIdMapping[layoutItem.i];
            if (realId) {
              return { ...layoutItem, i: realId.toString() };
            }
            return layoutItem;
          });
        } else {
          console.warn(`Struktur layout tidak valid untuk breakpoint ${breakpoint}:`, updatedLayouts[breakpoint]);
        }
      });
      
      finalLayoutData = updatedLayouts;
      
      // Hitung jumlah widget akhir (eksisting + diedit + baru - dihapus)
      const finalWidgetCount = existingWidgets.length + widgetEditedCount + widgetCreatedCount;
      
      // console.log('=== MENYIMPAN LAYOUT KE DATABASE ===');
      // console.log('ID Dashboard:', dashboard.id);
      // console.log('Data layout final:', finalLayoutData);
      // console.log('Panjang string JSON layout:', JSON.stringify(finalLayoutData).length);
      
      // Simpan dashboard beserta layout
      const response = await fetchFromBackend(`/dashboard/${dashboard.id}`, {
        method: "PUT",
        body: JSON.stringify({
          description: finalDescription,
          widget_count: finalWidgetCount,
          layout: JSON.stringify(finalLayoutData),
        }),
      });
      const responseData = await response.json();
      if (!response.ok) {
        console.error('Kesalahan respons backend:', responseData.message);
        throw new Error(responseData.message || `Kesalahan HTTP! status: ${response.status}`);
      }
      
      // Bersihkan state lokal: hapus widget yang ditandai hapus dan bersihkan flag edit
      const cleanedItems = existingWidgets.concat(
        // Widget yang diedit - hapus flag edit
        widgetsToEdit.map(editedWidget => {
          const { hasEditedChanges, originalData, ...cleanWidget } = editedWidget;
          return cleanWidget;
        }),
        // Widget baru dengan ID nyata
        widgetsToAdd.map(stagedWidget => {
          const realId = widgetIdMapping[stagedWidget.id];
          if (realId) {
            return { ...stagedWidget, id: realId, isStaged: false };
          }
          return stagedWidget;
        })
      );
      
      // Perbarui state lokal
      updateTabItems(dashboardId, cleanedItems);
      updateTabLayouts(dashboardId, finalLayoutData);
      
      // Refresh data agar keadaan terbaru termuat
      await fetchDashboards();
      
      successToast('Dashboard berhasil disimpan');
      setIsEditing(false);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('=== KESALAHAN SAAT OPERASI SIMPAN ===', error);
      errorToast("Gagal menyimpan dashboard", error.message);
    }
  }, [activeTab, dashboards, editDashboardValue, tabItems, tabLayouts, updateTabLayouts, fetchDashboards]);

  // Trigger refresh widgets dengan rentang waktu baru
  const handleTimeRangeChange = useCallback((newTimeRange) => {
    setCurrentTimeRange(newTimeRange);
  }, []);

  // Trigger refresh widgets dengan jumlah data baru
  const handleDataCountChange = useCallback((newDataCount) => {
    setCurrentDataCount(newDataCount);
  }, []);

  // Trigger refresh widgets dengan tipe filter baru
  const handleFilterTypeChange = useCallback((newFilterType) => {
    setFilterType(newFilterType);
  }, []);

  // Kembalikan semua state dan fungsi yang dibutuhkan komponen
  return {
    // State
    dashboards,
    activeTab,
    activeDashboardDescription: getDashboardDescription(activeTab, dashboards),
    setActiveTab: updateActiveTab, // Memicu perpindahan tab dengan benar
    openChartSheet,
    setOpenChartSheet,
    showWidgetForm,
    setShowWidgetForm,
    showEditWidgetForm,
    setShowEditWidgetForm,
    newWidgetData,
    editWidgetData,
    setNewWidgetData,
    setEditWidgetData,
    tabItems,
    setTabItems: setItemsForTab,
    tabLayouts,
    setTabLayouts: setLayoutsForTab,
    // Item dan layout saat ini untuk dashboard aktif
    currentItems: activeTab ? (tabItems[activeTab] || []).filter(item => !item.stagedForRemoval) : [],
    currentLayouts: activeTab ? (tabLayouts[activeTab] || {}) : {},
    openDashboardDialog,
    setOpenDashboardDialog,
    widgetCount,
    setWidgetCount,
    isLoadingWidget,
    setIsLoadingWidget,
    isEditing,
    setIsEditing,
    openDeleteDialog,
    setOpenDeleteDialog,
    dashboardToDelete,
    setDashboardToDelete,
    editDashboardValue,
    setEditDashboardValue,
    devices,
    datastreams,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    isAuthenticated, // Properti yang sebelumnya kurang
    layoutKey,
    currentTimeRange,
    currentDataCount,
    filterType,
    deleteChecked,
    setDeleteChecked,
    
    // Fungsi
    handleAddDashboard,
    handleEditDashboard,
    handleDeleteDashboard,
    handleSaveEditDashboard,
    saveLayoutToDB,
    addWidget,
    handleChartDrop,
    handleAddChart,
    handleEditWidget,
    stageWidgetRemoval,
    removeWidgetFromDatabase,
    handleWidgetFormSubmit,
    handleEditWidgetFormSubmit,
    stageWidgetAddition,
    stageLayoutUpdate,
    handleBreakpointChange,
    handleLayoutChange,
    startEditMode,
    cancelEditMode,
    saveAllLayoutChanges,
    handleTimeRangeChange,
    handleDataCountChange,
    handleFilterTypeChange,
    
    // Responsif
    isMobile,
    isMedium,
    isTablet,
    isDesktop,
    currentBreakpoint,
  };
}

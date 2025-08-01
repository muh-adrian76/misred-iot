// ===== IMPORTS =====
// Import React untuk komponen
import React from "react";
// Import komponen grid layout untuk widget management dan tata letak
import GridLayout from "@/components/custom/widgets/grid-layout";
// Import komponen widget box untuk menampilkan widget individual dan drag & drop
import WidgetBox from "@/components/custom/widgets/widget-box";
// Import Framer Motion untuk animasi smooth dan transisi
import { motion } from "framer-motion";
// Import efek shimmer untuk teks loading yang animatif
import { TextShimmer } from "@/components/ui/text-shimmer";

// ===== DASHBOARD CONTENT COMPONENT =====
// Komponen konten utama dashboard - mengelola widget dan layout grid
// Komponen ini adalah core dari dashboard yang menampilkan semua widget dan mengelola interaksi user
export default function DashboardContent(props) {
  // ===== DESTRUCTURE PROPS =====
  // Ekstrak props untuk mendapatkan data dan fungsi yang diperlukan dari parent component
  const {
    // ===== DATA PROPS =====
    dashboards, // Data semua dashboard yang tersedia
    tabItems, // Items widget untuk setiap tab dashboard
    tabLayouts, // Layout grid untuk setiap tab dashboard
    currentItems, // Items widget yang sedang ditampilkan pada dashboard aktif
    currentLayouts, // Layout grid yang sedang ditampilkan pada dashboard aktif
    devices, // Data semua device IoT (digunakan dalam widget)
    datastreams, // Data semua datastream (digunakan dalam widget)
    
    // ===== STATUS PROPS =====
    isLoadingWidget, // Status loading widget dari API
    activeTab, // ID dashboard yang sedang aktif/dipilih
    widgetCount, // Jumlah widget pada dashboard aktif
    isEditing, // Status mode editing dashboard (enable/disable edit)
    layoutKey, // Key untuk memaksa re-render grid layout
    
    // ===== RESPONSIVE PROPS =====
    isMobile, // Status mobile view (screen < 768px)
    isMedium, // Status medium screen (768px - 1024px)
    isTablet, // Status tablet view (768px - 1024px)
    isDesktop, // Status desktop view (> 1024px)
    currentBreakpoint, // Breakpoint yang sedang aktif (xs, sm, md, lg, xl)
    
    // ===== FILTER & TIME PROPS =====
    currentTimeRange, // Range waktu data yang ditampilkan (1h, 24h, 7d, dll)
    currentDataCount, // Jumlah data yang ditampilkan (10, 50, 100, dll)
    filterType, // Tipe filter data (count, time, dll)
    
    // ===== SETTER FUNCTIONS =====
    setItemsForTab, // Setter items untuk tab tertentu
    setLayoutsForTab, // Setter layout untuk tab tertentu
    
    // ===== EVENT HANDLERS =====
    handleChartDrop, // Handler untuk drop chart/widget dari WidgetBox ke grid
    handleLayoutChange, // Handler untuk perubahan layout grid (resize, move)
    handleBreakpointChange, // Handler untuk perubahan breakpoint responsive
    handleAddChart, // Handler untuk menambah chart/widget baru
    handleEditWidget, // Handler untuk edit widget yang sudah ada
    
    // ===== STAGING FUNCTIONS =====
    // Fungsi staging untuk operasi widget (untuk mode editing)
    stageWidgetRemoval, // Staging penghapusan widget (belum dihapus dari DB)
    removeWidgetFromDatabase, // Hapus widget langsung dari database (non-editing mode)
  } = props;

  // ===== DEBUG LOGGING (DEVELOPMENT) =====
  // Debug logging untuk troubleshooting (dikomentari untuk production)
  // console.log('DashboardContent render:', {
  //   dashboardsLength: dashboards?.length,
  //   isLoadingWidget,
  //   activeTab,
  //   widgetCount,
  //   isEditing,
  //   tabItemsKeys: Object.keys(tabItems || {}),
  //   tabLayoutsKeys: Object.keys(tabLayouts || {}),
  //   currentItemsLength: currentItems?.length,
  //   currentLayoutsKeys: currentLayouts ? Object.keys(currentLayouts) : [],
  //   currentItemsData: currentItems?.map(item => ({ id: item.id, description: item.description })),
  //   currentLayoutsSample: currentLayouts?.lg?.slice(0, 3) // Show first 3 layout items for lg breakpoint
  // });

  // ===== EVENT HANDLERS =====
  
  // Handler untuk menambah widget dari WidgetBox
  // Dipanggil ketika user mengklik tombol "Add" pada widget box
  const handleAddWidgetFromBox = (chartType) => {
    // console.log('Adding widget from widget box:', chartType);
    // Panggil handleChartDrop untuk menampilkan form widget, bukan langsung tambah ke database
    // Ini akan membuka dialog form untuk konfigurasi widget sebelum ditambahkan
    if (handleChartDrop) {
      handleChartDrop(chartType, {
        x: 0, // Posisi X default (kolom pertama)
        y: Infinity, // Posisi Y infinity untuk auto-placement di bawah
        w: 6, // Default width yang lebih besar (setengah layar pada lg breakpoint) 
        h: 4, // Default height yang cukup untuk chart
      });
    }
  };

  // ===== SAFETY FALLBACKS =====
  // Fallback untuk props yang mungkin undefined untuk mencegah error
  const safeDashboards = dashboards || []; // Pastikan selalu array
  const safeTabItems = tabItems || {}; // Pastikan selalu object
  const safeTabLayouts = tabLayouts || {}; // Pastikan selalu object

  // ===== CONDITIONAL RENDERING - EMPTY STATES =====
  
  // Jika tidak ada dashboard sama sekali, tampilkan welcome screen
  if (safeDashboards.length === 0) {
    return (
      <motion.div
        className="flex items-center justify-center h-screen"
        initial={{ opacity: 0, y: 50 }} // Animasi masuk dari bawah dengan fade
        animate={{ opacity: 1, y: 0 }} // Animasi ke posisi normal
        exit={{ opacity: 0, y: 50 }} // Animasi keluar ke bawah dengan fade
        transition={{ duration: 0.5, delay: 1, ease: "easeInOut" }} // Transisi smooth
      >
        <div className="flex flex-col items-center text-sm text-center gap-4 w-xl max-w-md">
          {/* Animated welcome image */}
          <motion.img
            key="dashboard-image"
            src="/widget.svg" // Icon dashboard/widget untuk welcome
            alt="No Dashoards"
            className="w-72 h-auto -mb-5 mt-[-50px]" // Styling ukuran dan posisi
            initial={{ opacity: 0, scale: 0 }} // Mulai dari invisible dan kecil
            animate={{ opacity: 1, scale: 1 }} // Animasi ke ukuran normal
            exit={{ opacity: 0, scale: 0 }} // Keluar dengan mengecil
            transition={{ duration: 0.5, ease: "easeInOut" }} // Transisi smooth
          />
          <h2 className="text-xl font-semibold">Selamat Datang!</h2>
          <span className="text-muted-foreground text-balance">
            Buat atau pilih dashboard untuk memantau atau mengendalikan
            perangkat IoT mu.
          </span>
        </div>
      </motion.div>
    );
  }

  // Jika sedang loading widget, tampilkan loading state dengan shimmer effect
  if (isLoadingWidget) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 50 }} // Animasi masuk dari bawah
        animate={{ opacity: 1, y: 0 }} // Animasi ke posisi normal
        exit={{ opacity: 0, y: 50 }} // Animasi keluar ke bawah
        transition={{ duration: 0.5, delay: 0.5, ease: "easeInOut" }} // Transisi dengan delay
        className="flex items-center justify-center h-screen"
      >
        {/* Shimmer text effect untuk loading yang menarik */}
        <TextShimmer className='text-sm' duration={1}>
          Memuat data widget...
        </TextShimmer>
      </motion.div>
    );
  }

  // Jika tidak ada activeTab tapi ada dashboard, tampilkan pesan untuk memilih dashboard
  if (!activeTab && safeDashboards.length > 0) {
    return (
      <motion.div
        className="flex items-center justify-center h-screen"
        initial={{ opacity: 0, y: 50 }} // Animasi masuk dari bawah
        animate={{ opacity: 1, y: 0 }} // Animasi ke posisi normal
        exit={{ opacity: 0, y: 50 }} // Animasi keluar ke bawah
        transition={{ duration: 0.5, delay: 1, ease: "easeInOut" }} // Transisi smooth
      >
        <div className="flex flex-col items-center text-sm text-center gap-4 w-xl max-w-md">
          {/* Animated dashboard selection image */}
          <motion.img
            key="dashboard-image"
            src="/widget.svg" // Icon untuk instruksi memilih dashboard
            alt="Select Dashboard"
            className="w-72 h-auto -mb-5 mt-[-50px]" // Styling ukuran dan posisi
            initial={{ opacity: 0, scale: 0 }} // Mulai dari invisible dan kecil
            animate={{ opacity: 1, scale: 1 }} // Animasi ke ukuran normal
            exit={{ opacity: 0, scale: 0 }} // Keluar dengan mengecil
            transition={{ duration: 0.5, ease: "easeInOut" }} // Transisi smooth
          />
          <h2 className="text-xl font-semibold">Pilih Dashboard</h2>
          <span className="text-muted-foreground text-balance">
            Pilih salah satu dashboard dari tab di atas untuk mulai memantau atau mengendalikan perangkat IoT Anda.
          </span>
        </div>
      </motion.div>
    );
  }

  // ===== MAIN COMPONENT RENDER =====
  return (
    <>
      {/* ===== EMPTY WIDGET STATE (VIEW MODE) ===== */}
      {/* Tampilkan ketika ada activeTab, tidak sedang editing, dan tidak ada widget */}
      {activeTab && !isEditing && widgetCount === 0 && (
        <motion.div
          initial={{ opacity: 0 }} // Mulai dari transparent
          animate={{ opacity: 1 }} // Animasi fade in
          exit={{ opacity: 0 }} // Keluar dengan fade out
          transition={{ duration: 0.5, delay: 1, ease: "easeInOut" }} // Transisi smooth dengan delay
          className="flex items-center justify-center h-screen"
        >
          <div className="flex flex-col items-center text-center gap-4">
            {/* Animated empty widgets image */}
            <motion.img
              key="widget-image"
              src="/widget.svg" // Icon untuk menunjukkan widget kosong
              alt="No Widgets"
              className="w-72 h-auto -mb-5 mt-[-50px]" // Styling ukuran dan posisi
              initial={{ opacity: 0, scale: 0 }} // Mulai dari invisible dan kecil
              animate={{ opacity: 1, scale: 1 }} // Animasi ke ukuran normal
              exit={{ opacity: 0, scale: 0 }} // Keluar dengan mengecil
              transition={{ duration: 0.5, ease: "easeInOut" }} // Transisi smooth
            />
            <h3 className="text-lg font-semibold mx-10">Widget masih kosong</h3>
            <p>
              Aktifkan mode <i>Edit</i> terlebih dahulu. {/* Instruksi untuk user */}
            </p>
          </div>
        </motion.div>
      )}

      {/* ===== WIDGET CONTENT (VIEW MODE) ===== */}
      {/* Tampilkan isi widget ketika ada activeTab, tidak sedang edit, dan ada widget */}
      {activeTab && !isEditing && widgetCount > 0 && (
        <motion.div
          initial={{ opacity: 0 }} // Mulai dari transparent
          animate={{ opacity: 1 }} // Animasi fade in
          exit={{ opacity: 0 }} // Keluar dengan fade out
          transition={{ duration: 0.5, delay: 1, ease: "easeInOut" }} // Transisi smooth dengan delay
          className="p-4" // Padding untuk konten
        >
          {/* Grid Layout untuk menampilkan widget dalam mode view */}
          <GridLayout
            items={currentItems} // Widget items yang akan ditampilkan
            setItems={setItemsForTab} // Setter untuk update items
            layouts={currentLayouts} // Layout configuration untuk responsive grid
            setLayouts={setLayoutsForTab} // Setter untuk update layouts
            onLayoutChange={handleLayoutChange} // Handler ketika layout berubah
            onBreakpointChange={handleBreakpointChange} // Handler ketika breakpoint berubah
            isEditing={false} // Mode view (tidak bisa edit)
            // Data filtering props untuk widget
            currentTimeRange={currentTimeRange} // Range waktu data
            currentDataCount={currentDataCount} // Jumlah data yang ditampilkan
            filterType={filterType} // Tipe filter
            // Widget management functions
            stageWidgetRemoval={stageWidgetRemoval} // Staging penghapusan widget
            removeWidgetFromDatabase={removeWidgetFromDatabase} // Hapus widget dari DB
            handleEditWidget={handleEditWidget} // Handler edit widget
          />
        </motion.div>
      )}
      
      {/* ===== EDITING MODE ===== */}
      {/* Tampilkan ketika ada activeTab dan sedang dalam mode editing */}
      {activeTab && isEditing && (
        <div className="dashboard-editing-container flex flex-col lg:flex-row gap-4 w-full px-4 lg:pr-5.5 min-h-0">
          {/* ===== MAIN GRID AREA (LEFT SIDE) ===== */}
          {/* Area utama untuk drag & drop widget dan grid layout */}
          <div className="flex-1 min-h-0"> {/* flex-1 untuk mengambil sisa space */}
            <motion.div
              initial={{ opacity: 0 }} // Mulai dari transparent
              animate={{ opacity: 1 }} // Animasi fade in
              exit={{ opacity: 0 }} // Keluar dengan fade out
              transition={{ duration: 0.5, delay: 1, ease: "easeInOut" }} // Transisi smooth
              className="pb-4 lg:pb-0 min-h-0" // Padding bottom untuk mobile, min-height 0 untuk flex
            >
              {/* Grid Layout untuk mode editing dengan drag & drop */}
              <GridLayout
                items={currentItems} // Widget items yang sedang diedit
                setItems={setItemsForTab} // Setter untuk update items
                layouts={currentLayouts} // Layout configuration
                setLayouts={setLayoutsForTab} // Setter untuk update layouts
                onChartDrop={handleChartDrop} // Handler ketika chart di-drop ke grid
                onLayoutChange={handleLayoutChange} // Handler perubahan layout
                onBreakpointChange={handleBreakpointChange} // Handler perubahan breakpoint
                isEditing={true} // Mode editing (bisa drag, resize, delete)
                // Data filtering props
                currentTimeRange={currentTimeRange}
                currentDataCount={currentDataCount}
                filterType={filterType}
                // Widget management functions
                stageWidgetRemoval={stageWidgetRemoval}
                removeWidgetFromDatabase={removeWidgetFromDatabase}
                handleEditWidget={handleEditWidget}
              />
            </motion.div>
          </div>
          
          {/* ===== WIDGET BOX AREA (RIGHT SIDE - RESPONSIVE) ===== */}
          {/* WidgetBox hanya ditampilkan pada breakpoint mobile/tablet, 
              untuk desktop menggunakan fixed positioning di WidgetBox component */}
          {(isMobile || isMedium || isTablet) && (
            <div className="lg:w-80 lg:flex-shrink-0"> {/* Fixed width untuk desktop */}
              <WidgetBox 
                breakpoint={true} // Menggunakan responsive breakpoint positioning
                onChartDrag={handleChartDrop} // Handler untuk drag chart
                onAddWidget={handleAddWidgetFromBox} // Handler untuk add widget via button
              />
            </div>
          )}
          
          {/* ===== WIDGET BOX (DESKTOP FIXED POSITIONING) ===== */}
          {/* Untuk desktop, WidgetBox menggunakan fixed positioning di pojok kanan */}
          {!(isMobile || isMedium || isTablet) && (
            <WidgetBox 
              breakpoint={false} // Menggunakan fixed positioning
              onChartDrag={handleChartDrop} // Handler untuk drag chart
              onAddWidget={handleAddWidgetFromBox} // Handler untuk add widget via button
            />
          )}
        </div>
      )}
    </>
  );
}
// ===== IMPORTS =====
// Import React untuk komponen
import React from "react";
// Import komponen grid layout untuk widget management dan tata letak
import GridLayout from "@/components/custom/widgets/grid-layout";
// Import komponen widget box untuk menampilkan widget individual dan drag & drop
import WidgetBox from "@/components/custom/widgets/widget-box";
// Import Framer Motion untuk animasi halus dan transisi
import { motion } from "framer-motion";
// Import efek shimmer untuk teks loading yang animatif
import { TextShimmer } from "@/components/ui/text-shimmer";

// ===== DASHBOARD CONTENT COMPONENT =====
// Komponen konten utama dashboard - mengelola widget dan layout grid
// Komponen ini adalah inti dari dashboard yang menampilkan semua widget dan mengelola interaksi pengguna
export default function DashboardContent(props) {
  // ===== DESTRUCTURE PROPS =====
  // Ekstrak props untuk mendapatkan data dan fungsi yang diperlukan dari komponen induk
  const {
    // ===== DATA PROPS =====
    dashboards, // Data semua dashboard yang tersedia
    tabItems, // Item widget untuk setiap tab dashboard
    tabLayouts, // Layout grid untuk setiap tab dashboard
    currentItems, // Item widget yang sedang ditampilkan pada dashboard aktif
    currentLayouts, // Layout grid yang sedang ditampilkan pada dashboard aktif
    devices, // Data semua perangkat IoT (digunakan dalam widget)
    datastreams, // Data semua datastream (digunakan dalam widget)
    
    // ===== STATUS PROPS =====
    isLoadingWidget, // Status memuat widget dari API
    activeTab, // ID dashboard yang sedang aktif/dipilih
    widgetCount, // Jumlah widget pada dashboard aktif
    isEditing, // Status mode penyuntingan dashboard (aktif/non-aktif)
    layoutKey, // Key untuk memaksa render ulang grid layout
    
    // ===== RESPONSIVE PROPS =====
    isMobile, // Status tampilan mobile (screen < 768px)
    isMedium, // Status layar medium (768px - 1024px)
    isTablet, // Status tampilan tablet (768px - 1024px)
    isDesktop, // Status tampilan desktop (> 1024px)
    currentBreakpoint, // Breakpoint yang sedang aktif (xs, sm, md, lg, xl)
    
    // ===== FILTER & TIME PROPS =====
    currentTimeRange, // Rentang waktu data yang ditampilkan (1h, 24h, 7d, dll)
    currentDataCount, // Jumlah data yang ditampilkan (10, 50, 100, dll)
    filterType, // Tipe filter data (count, time, dll)
    
    // ===== SETTER FUNCTIONS =====
    setItemsForTab, // Setter item untuk tab tertentu
    setLayoutsForTab, // Setter layout untuk tab tertentu
    
    // ===== EVENT HANDLERS =====
    handleChartDrop, // Handler untuk drop chart/widget dari WidgetBox ke grid
    handleLayoutChange, // Handler untuk perubahan layout grid (resize, pindah)
    handleBreakpointChange, // Handler untuk perubahan breakpoint responsif
    handleAddChart, // Handler untuk menambah chart/widget baru
    handleEditWidget, // Handler untuk mengedit widget yang sudah ada
    
    // ===== STAGING FUNCTIONS =====
    // Fungsi staging untuk operasi widget (untuk mode penyuntingan)
    stageWidgetRemoval, // Staging penghapusan widget (belum dihapus dari DB)
    removeWidgetFromDatabase, // Hapus widget langsung dari database (mode non-edit)
  } = props;

  // ===== DEBUG LOGGING (PENGEMBANGAN) =====
  // Logging debug untuk troubleshooting (dinonaktifkan untuk produksi)
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
  //   currentLayoutsSample: currentLayouts?.lg?.slice(0, 3) // Tampilkan 3 item pertama layout untuk breakpoint lg
  // });

  // ===== EVENT HANDLERS =====
  
  // Handler untuk menambah widget dari WidgetBox
  // Dipanggil ketika pengguna mengklik tombol "Tambah" pada kotak widget
  const handleAddWidgetFromBox = (chartType) => {
    // console.log('Menambahkan widget dari kotak widget:', chartType);
    // Panggil handleChartDrop untuk menampilkan form widget, bukan langsung tambah ke database
    // Ini akan membuka dialog form untuk konfigurasi widget sebelum ditambahkan
    if (handleChartDrop) {
      handleChartDrop(chartType, {
        x: 0, // Posisi X default (kolom pertama)
        y: Infinity, // Posisi Y infinity untuk auto-placement di bawah
        w: 6, // Lebar default yang lebih besar (setengah layar pada breakpoint lg) 
        h: 4, // Tinggi default yang cukup untuk chart
      });
    }
  };

  // ===== SAFETY FALLBACKS =====
  // Fallback untuk props yang mungkin undefined untuk mencegah error
  const safeDashboards = dashboards || []; // Pastikan selalu array
  const safeTabItems = tabItems || {}; // Pastikan selalu object
  const safeTabLayouts = tabLayouts || {}; // Pastikan selalu object

  // ===== CONDITIONAL RENDERING - EMPTY STATES =====
  
  // Jika tidak ada dashboard sama sekali, tampilkan layar sambutan
  if (safeDashboards.length === 0) {
    return (
      <motion.div
        className="flex items-center justify-center h-screen"
        initial={{ opacity: 0, y: 50 }} // Animasi masuk dari bawah dengan fade
        animate={{ opacity: 1, y: 0 }} // Animasi ke posisi normal
        exit={{ opacity: 0, y: 50 }} // Animasi keluar ke bawah dengan fade
        transition={{ duration: 0.5, delay: 1, ease: "easeInOut" }} // Transisi halus
      >
        <div className="flex flex-col items-center text-sm text-center gap-4 w-xl max-w-md">
          {/* Gambar sambutan (animasi) */}
          <motion.img
            key="dashboard-image"
            src="/widget.svg" // Ikon dashboard/widget untuk sambutan
            alt="Tidak ada dashboard"
            className="w-72 h-auto -mb-5 mt-[-50px]" // Styling ukuran dan posisi
            initial={{ opacity: 0, scale: 0 }} // Mulai dari tidak terlihat dan kecil
            animate={{ opacity: 1, scale: 1 }} // Animasi ke ukuran normal
            exit={{ opacity: 0, scale: 0 }} // Keluar dengan mengecil
            transition={{ duration: 0.5, ease: "easeInOut" }} // Transisi halus
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

  // Jika sedang memuat widget, tampilkan loading state dengan efek shimmer
  if (isLoadingWidget) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 50 }} // Animasi masuk dari bawah
        animate={{ opacity: 1, y: 0 }} // Animasi ke posisi normal
        exit={{ opacity: 0, y: 50 }} // Animasi keluar ke bawah
        transition={{ duration: 0.5, delay: 0.5, ease: "easeInOut" }} // Transisi dengan delay
        className="flex items-center justify-center h-screen"
      >
        {/* Efek shimmer teks untuk loading */}
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
        transition={{ duration: 0.5, delay: 1, ease: "easeInOut" }} // Transisi halus
      >
        <div className="flex flex-col items-center text-sm text-center gap-4 w-xl max-w-md">
          {/* Gambar pemilihan dashboard (animasi) */}
          <motion.img
            key="dashboard-image"
            src="/widget.svg" // Ikon untuk instruksi memilih dashboard
            alt="Pilih dashboard"
            className="w-72 h-auto -mb-5 mt-[-50px]" // Styling ukuran dan posisi
            initial={{ opacity: 0, scale: 0 }} // Mulai dari tidak terlihat dan kecil
            animate={{ opacity: 1, scale: 1 }} // Animasi ke ukuran normal
            exit={{ opacity: 0, scale: 0 }} // Keluar dengan mengecil
            transition={{ duration: 0.5, ease: "easeInOut" }} // Transisi halus
          />
          <h2 className="text-xl font-semibold">Pilih Dashboard</h2>
          <span className="text-muted-foreground text-balance">
            Pilih salah satu dashboard dari tab di atas untuk mulai memantau atau mengendalikan perangkat IoT Anda.
          </span>
        </div>
      </motion.div>
    );
  }

  // ===== RENDER UTAMA KOMPONEN =====
  return (
    <>
      {/* ===== EMPTY WIDGET STATE (MODE LIHAT) ===== */}
      {/* Tampilkan ketika ada activeTab, tidak sedang penyuntingan, dan tidak ada widget */}
      {activeTab && !isEditing && widgetCount === 0 && (
        <motion.div
          initial={{ opacity: 0 }} // Mulai dari transparan
          animate={{ opacity: 1 }} // Animasi fade in
          exit={{ opacity: 0 }} // Keluar dengan fade out
          transition={{ duration: 0.5, delay: 1, ease: "easeInOut" }} // Transisi halus dengan delay
          className="flex items-center justify-center h-screen"
        >
          <div className="flex flex-col items-center text-center gap-4">
            {/* Gambar widget kosong (animasi) */}
            <motion.img
              key="widget-image"
              src="/widget.svg" // Ikon untuk menunjukkan keadaan widget kosong
              alt="Tidak ada widget"
              className="w-72 h-auto -mb-5 mt-[-50px]" // Styling ukuran dan posisi
              initial={{ opacity: 0, scale: 0 }} // Mulai dari tidak terlihat dan kecil
              animate={{ opacity: 1, scale: 1 }} // Animasi ke ukuran normal
              exit={{ opacity: 0, scale: 0 }} // Keluar dengan mengecil
              transition={{ duration: 0.5, ease: "easeInOut" }} // Transisi halus
            />
            <h3 className="text-lg font-semibold mx-10">Widget masih kosong</h3>
            <p>
              Aktifkan mode <i>Edit</i> terlebih dahulu. {/* Instruksi untuk pengguna */}
            </p>
          </div>
        </motion.div>
      )}

      {/* ===== KONTEN WIDGET (MODE LIHAT) ===== */}
      {/* Tampilkan isi widget ketika ada activeTab, tidak sedang edit, dan ada widget */}
      {activeTab && !isEditing && widgetCount > 0 && (
        <motion.div
          initial={{ opacity: 0 }} // Mulai dari transparan
          animate={{ opacity: 1 }} // Animasi fade in
          exit={{ opacity: 0 }} // Keluar dengan fade out
          transition={{ duration: 0.5, delay: 1, ease: "easeInOut" }} // Transisi halus dengan delay
          className="p-4" // Padding untuk konten
        >
          {/* Grid Layout untuk menampilkan widget dalam mode lihat */}
          <GridLayout
            items={currentItems} // Item widget yang akan ditampilkan
            setItems={setItemsForTab} // Setter untuk memperbarui item
            layouts={currentLayouts} // Konfigurasi layout untuk grid responsif
            setLayouts={setLayoutsForTab} // Setter untuk memperbarui layout
            onLayoutChange={handleLayoutChange} // Handler ketika layout berubah
            onBreakpointChange={handleBreakpointChange} // Handler ketika breakpoint berubah
            isEditing={false} // Mode lihat (tidak bisa edit)
            // Properti penyaringan data untuk widget
            currentTimeRange={currentTimeRange} // Rentang waktu data
            currentDataCount={currentDataCount} // Jumlah data yang ditampilkan
            filterType={filterType} // Tipe filter
            // Fungsi manajemen widget
            stageWidgetRemoval={stageWidgetRemoval} // Staging penghapusan widget
            removeWidgetFromDatabase={removeWidgetFromDatabase} // Hapus widget dari DB
            handleEditWidget={handleEditWidget} // Handler edit widget
          />
        </motion.div>
      )}
      
      {/* ===== MODE PENYUNTINGAN ===== */}
      {/* Tampilkan ketika ada activeTab dan sedang dalam mode penyuntingan */}
      {activeTab && isEditing && (
        <div className="dashboard-editing-container flex flex-col lg:flex-row gap-4 w-full px-4 lg:pr-5.5 min-h-0">
          {/* ===== AREA GRID UTAMA (KIRI) ===== */}
          {/* Area utama untuk drag & drop widget dan grid layout */}
          <div className="flex-1 min-h-0"> {/* flex-1 untuk mengambil sisa ruang */}
            <motion.div
              initial={{ opacity: 0 }} // Mulai dari transparan
              animate={{ opacity: 1 }} // Animasi fade in
              exit={{ opacity: 0 }} // Keluar dengan fade out
              transition={{ duration: 0.5, delay: 1, ease: "easeInOut" }} // Transisi halus
              className="pb-4 lg:pb-0 min-h-0" // Padding bawah untuk mobile, min-height 0 untuk flex
            >
              {/* Grid Layout untuk mode penyuntingan dengan drag & drop */}
              <GridLayout
                items={currentItems} // Item widget yang sedang diedit
                setItems={setItemsForTab} // Setter untuk memperbarui item
                layouts={currentLayouts} // Konfigurasi layout
                setLayouts={setLayoutsForTab} // Setter untuk memperbarui layout
                onChartDrop={handleChartDrop} // Handler ketika chart di-drop ke grid
                onLayoutChange={handleLayoutChange} // Handler perubahan layout
                onBreakpointChange={handleBreakpointChange} // Handler perubahan breakpoint
                isEditing={true} // Mode penyuntingan (bisa drag, resize, hapus)
                // Properti penyaringan data
                currentTimeRange={currentTimeRange}
                currentDataCount={currentDataCount}
                filterType={filterType}
                // Fungsi manajemen widget
                stageWidgetRemoval={stageWidgetRemoval}
                removeWidgetFromDatabase={removeWidgetFromDatabase}
                handleEditWidget={handleEditWidget}
              />
            </motion.div>
          </div>
          
          {/* ===== AREA WIDGET BOX (KANAN - RESPONSIF) ===== */}
          {/* WidgetBox hanya ditampilkan pada breakpoint mobile/tablet, 
              untuk desktop menggunakan fixed positioning di komponen WidgetBox */}
          {(isMobile || isMedium || isTablet) && (
            <div className="lg:w-80 lg:flex-shrink-0"> {/* Lebar tetap untuk desktop */}
              <WidgetBox 
                breakpoint={true} // Menggunakan penempatan berdasarkan breakpoint responsif
                onChartDrag={handleChartDrop} // Handler untuk drag chart
                onAddWidget={handleAddWidgetFromBox} // Handler untuk tambah widget via tombol
              />
            </div>
          )}
          
          {/* ===== WIDGET BOX (DESKTOP POSISI TETAP) ===== */}
          {/* Untuk desktop, WidgetBox menggunakan posisi tetap di pojok kanan */}
          {!(isMobile || isMedium || isTablet) && (
            <WidgetBox 
              breakpoint={false} // Menggunakan posisi tetap
              onChartDrag={handleChartDrop} // Handler untuk drag chart
              onAddWidget={handleAddWidgetFromBox} // Handler untuk tambah widget via tombol
            />
          )}
        </div>
      )}
    </>
  );
}
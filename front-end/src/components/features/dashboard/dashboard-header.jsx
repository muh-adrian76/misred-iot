// Import komponen select untuk memilih dashboard
import DashboardSelect from "@/components/custom/forms/dashboard/dashboard-select";
// Import komponen Button UI
import { Button } from "@/components/ui/button";
// Import ikon-ikon dari Lucide React
import { Plus, Trash2 } from "lucide-react";
// Import toolbar dashboard untuk kontrol editing
import DashboardToolbar from "@/components/custom/forms/dashboard/dashboard-toolbar";
// Import utility untuk class names
import { cn } from "@/lib/utils";
// Import Framer Motion untuk animasi
import { motion } from "framer-motion";

// Komponen header dashboard dengan kontrol navigasi dan editing
export default function DashboardHeader(props) {
  // Destructure props untuk mendapatkan data dan fungsi yang diperlukan
  const {
    dashboards, // Data dashboard yang tersedia
    activeTab, // Tab dashboard yang sedang aktif
    setActiveTab, // Setter untuk tab aktif
    isMobile, // Status mobile view
    isMedium, // Status medium screen
    isTablet, // Status tablet view
    isDesktop, // Status desktop view
    isEditing, // Status mode editing dashboard
    editDashboardValue, // Nilai dashboard yang sedang diedit
    setEditDashboardValue, // Setter untuk nilai edit dashboard
    setOpenDashboardDialog, // Setter untuk dialog dashboard
    setDashboardToDelete, // Setter untuk dashboard yang akan dihapus
    setOpenDeleteDialog, // Setter untuk dialog delete
    widgetCount, // Jumlah widget dalam dashboard
    setOpenChartSheet, // Setter untuk sheet tambah chart
    handleSaveEditDashboard, // Handler untuk menyimpan edit dashboard
    currentTimeRange, // Range waktu data yang ditampilkan
    currentDataCount, // Jumlah data yang ditampilkan
    filterType, // Tipe filter data
    onTimeRangeChange, // Handler perubahan time range
    onDataCountChange, // Handler perubahan data count
    onFilterTypeChange, // Handler perubahan filter type
    
    // Fungsi staging untuk mode editing
    startEditMode, // Mulai mode editing
    cancelEditMode, // Batalkan mode editing
    saveAllLayoutChanges, // Simpan semua perubahan layout
    hasUnsavedChanges, // Status apakah ada perubahan yang belum disimpan
  } = props;

  return (
    // Container header dengan animasi dan sticky positioning
    <motion.div
      className={cn(
        "flex items-end sticky z-40 top-[64px] w-full rounded-2xl px-3.5 py-3 gap-3 bg-background",
        // Responsive layout: center untuk mobile/tablet, between untuk desktop
        isMobile || isMedium || isTablet ? "justify-center" : "justify-between"
      )}
      // Animasi fade-in dengan delay
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, delay: 1.5, ease: "easeInOut" }}
    >
      <div className="flex items-center gap-3">
        <DashboardSelect
          options={dashboards.map((d) => ({
            value: d.id,
            label: d.description,
          }))}
          value={activeTab}
          onChange={setActiveTab}
          icon="Search"
          placeholder="Pilih dashboard"
          className={isMobile || isMedium ? "w-[308px]" : "w-[430px]"}
          editState={isEditing}
          editValue={editDashboardValue}
          onEditValueChange={setEditDashboardValue}
          noDataText={
          !dashboards || dashboards.length === 0
            ? "Anda belum menambahkan dashboard."
            : "Tidak ada dashboard yang cocok."
        }
        />
        <Button
          size={isMobile || isMedium ? "icon" : "sm"}
          className="flex items-center p-3"
          onClick={
            isEditing
              ? () => {
                  const current = dashboards.find(
                    (d) => d.id === activeTab
                  );
                  setDashboardToDelete(current);
                  setOpenDeleteDialog(true);
                }
              : () => setOpenDashboardDialog(true)
          }
        >
          {isEditing ? (
            <Trash2 className="h-5 w-5" />
          ) : (
            <Plus className="h-5 w-5" />
          )}
          {isMobile || isMedium ? null : <span className="ml-1">Dashboard</span>}
        </Button>
      </div>
      {!isDesktop ? (
        <div className="fixed left-1/2 bottom-3 -translate-x-1/2 flex gap-2 bg-background/80 backdrop-blur-md shadow-lg rounded-xl px-2 py-2 z-50 sm:border max-w-full w-fit">
          <DashboardToolbar
            dashboardState={dashboards.length === 0}
            widgetState={widgetCount === 0}
            editState={isEditing}
            setEditState={startEditMode}
            cancelEdit={cancelEditMode}
            setOpenChartSheet={setOpenChartSheet}
            saveEdit={saveAllLayoutChanges}
            hasUnsavedChanges={hasUnsavedChanges}
            currentTimeRange={currentTimeRange}
            currentDataCount={currentDataCount}
            filterType={filterType}
            onTimeRangeChange={onTimeRangeChange}
            onDataCountChange={onDataCountChange}
            onFilterTypeChange={onFilterTypeChange}
            isMobile={isMobile}
            isMedium={isMedium}
            isTablet={isTablet}
          />
        </div>
      ) : (
        <div>
          <DashboardToolbar
            dashboardState={dashboards.length === 0}
            widgetState={widgetCount === 0}
            editState={isEditing}
            setEditState={startEditMode}
            cancelEdit={cancelEditMode}
            setOpenChartSheet={setOpenChartSheet}
            saveEdit={saveAllLayoutChanges}
            hasUnsavedChanges={hasUnsavedChanges}
            currentTimeRange={currentTimeRange}
            currentDataCount={currentDataCount}
            filterType={filterType}
            onTimeRangeChange={onTimeRangeChange}
            onDataCountChange={onDataCountChange}
            onFilterTypeChange={onFilterTypeChange}
            isMobile={isMobile}
            isMedium={isMedium}
            isTablet={isTablet}
          />
        </div>
      )}
    </motion.div>
  );
}

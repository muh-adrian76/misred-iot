// Import React untuk component creation
import React, { useState } from "react";
// Import UI components
import { Button } from "@/components/ui/button";
// Import icons untuk toolbar actions
import { Move, Download, SaveAll, Undo2, Filter, Database } from "lucide-react";
// Import utility untuk CSS classes
import { cn } from "@/lib/utils";
// Import komponen khusus untuk dashboard functionality
import DashboardTimeFilter from "@/components/custom/other/range-filter";
import ExportDashboardDialog from "@/components/custom/other/export-dashboard";
// Import Popover untuk dropdown menu
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Komponen DashboardToolbar untuk toolbar actions dalam dashboard IoT
export default function DashboardToolbar({
  dashboardState, // State dashboard (loading, etc)
  widgetState, // State widget operations
  editState, // State apakah sedang dalam mode editing
  setEditState, // Setter untuk mengaktifkan edit mode
  cancelEdit, // Handler untuk membatalkan edit
  setOpenChartSheet, // Setter untuk membuka chart configuration sheet
  className, // Additional CSS classes
  saveEdit, // Handler untuk menyimpan edit
  hasUnsavedChanges, // Flag apakah ada perubahan yang belum disimpan
  currentTimeRange, // Range waktu yang dipilih (1h, 12h, 1d, 1w, 1m)
  currentDataCount, // Jumlah data yang dipilih
  filterType, // Tipe filter ("time" atau "count")
  onTimeRangeChange, // Handler untuk perubahan time range
  onDataCountChange, // Handler untuk perubahan data count
  onFilterTypeChange, // Handler untuk perubahan filter type
  isMobile, // Flag untuk mobile device
  isMedium, // Flag untuk medium screen
  isTablet, // Flag untuk tablet device
}) {
  // State untuk export functionality
  const [exportDialogOpen, setExportDialogOpen] = useState(false); // State dialog export
  const [exportMode, setExportMode] = useState("filter"); // Mode export: "filter" atau "all"
  const [exportPopoverOpen, setExportPopoverOpen] = useState(false); // State popover export options

  // Handler untuk memilih mode export dan membuka dialog
  const handleExportModeSelect = (mode) => {
    setExportMode(mode); // Set mode export yang dipilih
    setExportPopoverOpen(false); // Close popover
    setExportDialogOpen(true); // Open export dialog
  };

  // Generate filter description text untuk UI display
  const getFilterDescription = () => {
    if (filterType === "time") {
      // Mapping time range ke text Indonesia dengan dukungan filter bulanan
      const timeRangeText = {
        "1h": "1 jam terakhir",
        "12h": "12 jam terakhir", 
        "1d": "1 hari terakhir",
        "1w": "1 minggu terakhir",
        "1m": "1 bulan terakhir" // Tambahan: Support untuk filter bulanan
      }[currentTimeRange] || `${currentTimeRange} terakhir`; // Fallback untuk custom range
      return `data ${timeRangeText}`;
    } else {
      // Untuk filter berdasarkan count
      return `${currentDataCount} data terakhir`;
    }
  };

  return (
    <div className={cn("flex gap-2 sm:gap-3", className)}>
      {/* Conditional rendering berdasarkan edit state */}
      {editState ? (
        // Edit mode: Save dan Cancel buttons
        <>
          {/* Save button dengan dynamic state */}
          <Button
            className="cursor-pointer"
            variant="outline"
            onClick={saveEdit} // Handler untuk save changes
            disabled={!hasUnsavedChanges} // Disable jika tidak ada perubahan
          >
            <span className="sr-only">Save</span> {/* Screen reader text */}
            <SaveAll className="w-4 h-4 sm:w-5 sm:h-5" /> {/* Save icon dengan responsive size */}
            <span className="ml-1 inline">
              {/* Dynamic text berdasarkan apakah ada unsaved changes */}
              {hasUnsavedChanges ? "Simpan" : "Tersimpan"}
            </span>
          </Button>
          
          {/* Cancel button untuk membatalkan edit */}
          <Button
            className="cursor-pointer"
            variant="outline"
            onClick={cancelEdit} // Handler untuk cancel edit
          >
            <span className="sr-only">Cancel</span> {/* Screen reader text */}
            <Undo2 className="w-4 h-4 sm:w-5 sm:h-5" /> {/* Undo icon dengan responsive size */}
            <span className="ml-1 inline">Batalkan</span>
          </Button>
        </>
      ) : (
        // View mode: Edit, Filter, dan Export buttons
        <>
          {/* Edit button untuk masuk ke edit mode */}
          <Button
            className="cursor-pointer"
            variant="outline"
            onClick={() => setEditState()} // Activate edit mode
            disabled={dashboardState} // Disable jika dashboard dalam state loading
          >
            <span className="sr-only">Edit</span> {/* Screen reader text */}
            <Move className="w-4 h-4 sm:w-5 sm:h-5" /> {/* Move icon untuk edit */}
            <span className="ml-1 inline">Edit</span>
          </Button>
          
          {/* Dashboard Time Filter component untuk filter data */}
          <DashboardTimeFilter
            currentTimeRange={currentTimeRange} // Current time range selection
            currentDataCount={currentDataCount} // Current data count selection
            filterType={filterType} // Current filter type (time/count)
            onTimeRangeChange={onTimeRangeChange} // Handler perubahan time range
            onDataCountChange={onDataCountChange} // Handler perubahan data count
            onFilterTypeChange={onFilterTypeChange} // Handler perubahan filter type
            disabled={widgetState} // Disable saat widget operations
          />
          
          {/* Export button dengan popover options */}
          <Popover open={exportPopoverOpen} onOpenChange={setExportPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                className="cursor-pointer"
                variant="outline"
                disabled={widgetState} // Disable saat widget operations
              >
                <span className="sr-only">Ekspor</span> {/* Screen reader text */}
                <Download className="w-4 h-4 sm:w-5 sm:h-5" /> {/* Download icon */}
                <span className="ml-1 inline">Ekspor</span>
              </Button>
            </PopoverTrigger>
            {/* Popover content dengan export options */}
            <PopoverContent className="w-64 p-2" align={isMedium || isTablet ? "center" : "end"}>
              <div className="space-y-1">
                {/* Export sesuai filter option */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start hover:bg-red-50 hover:text-red-600" // Custom hover styling
                  onClick={() => handleExportModeSelect("filter")} // Export filtered data
                >
                  <Filter className="w-4 h-4 mr-2" /> {/* Filter icon */}
                  <div className="flex flex-col items-start">
                    <span className="text-inherit font-medium">Sesuai Filter</span>
                    <span className="text-xs text-muted-foreground">
                      Ekspor {getFilterDescription()} {/* Dynamic description berdasarkan filter */}
                    </span>
                  </div>
                </Button>
                
                {/* Export semua data option */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start hover:bg-green-50 hover:text-green-600" // Custom hover styling
                  onClick={() => handleExportModeSelect("all")} // Export all data
                >
                  <Database className="w-4 h-4 mr-2" /> {/* Database icon */}
                  <div className="flex flex-col items-start">
                    <span className="text-inherit font-medium">Semua Data</span>
                  </div>
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </>
      )}

      {/* Export Dialog component */}
      <ExportDashboardDialog
        open={exportDialogOpen} // State visibility dialog
        setOpen={setExportDialogOpen} // Setter untuk dialog state
        currentTimeRange={currentTimeRange} // Pass current filter settings
        currentDataCount={currentDataCount} // Pass current filter settings
        filterType={filterType} // Pass current filter type
        exportMode={exportMode} // Pass selected export mode
        isMobile={isMobile} // Pass mobile flag untuk responsive behavior
      />
    </div>
  );
}

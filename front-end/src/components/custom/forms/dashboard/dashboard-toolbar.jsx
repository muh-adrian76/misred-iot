import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Move, Download, SaveAll, Undo2, Filter, Database } from "lucide-react";
import { cn } from "@/lib/utils";
import DashboardTimeFilter from "@/components/custom/other/range-filter";
import ExportDashboardDialog from "@/components/custom/other/export-dashboard";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function DashboardToolbar({
  dashboardState,
  widgetState,
  editState,
  setEditState,
  cancelEdit,
  setOpenChartSheet,
  className,
  saveEdit,
  hasUnsavedChanges,
  currentTimeRange,
  currentDataCount,
  filterType,
  onTimeRangeChange,
  onDataCountChange,
  onFilterTypeChange,
  isMobile,
  isMedium,
  isTablet,
}) {
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportMode, setExportMode] = useState("filter"); // "filter" or "all"
  const [exportPopoverOpen, setExportPopoverOpen] = useState(false);

  const handleExportModeSelect = (mode) => {
    setExportMode(mode);
    setExportPopoverOpen(false);
    setExportDialogOpen(true);
  };

  // Generate filter description text
  const getFilterDescription = () => {
    if (filterType === "time") {
      const timeRangeText = {
        "1h": "1 jam terakhir",
        "12h": "12 jam terakhir", 
        "1d": "1 hari terakhir",
        "1w": "1 minggu terakhir"
      }[currentTimeRange] || `${currentTimeRange} terakhir`;
      return `data ${timeRangeText}`;
    } else {
      return `${currentDataCount} data terakhir`;
    }
  };

  return (
    <div className={cn("flex gap-2 sm:gap-3", className)}>
      {editState ? (
        <>
          <Button
            className="cursor-pointer"
            variant="outline"
            onClick={saveEdit}
            disabled={!hasUnsavedChanges}
          >
            <span className="sr-only">Save</span>
            <SaveAll className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="ml-1 inline">
              {hasUnsavedChanges ? "Simpan" : "Tersimpan"}
            </span>
          </Button>
          <Button
            className="cursor-pointer"
            variant="outline"
            onClick={cancelEdit}
          >
            <span className="sr-only">Cancel</span>
            <Undo2 className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="ml-1 inline">Batalkan</span>
          </Button>
        </>
      ) : (
        <>
          <Button
            className="cursor-pointer"
            variant="outline"
            onClick={() => setEditState()}
            disabled={dashboardState}
          >
            <span className="sr-only">Edit</span>
            <Move className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="ml-1 inline">Edit</span>
          </Button>
          <DashboardTimeFilter
            currentTimeRange={currentTimeRange}
            currentDataCount={currentDataCount}
            filterType={filterType}
            onTimeRangeChange={onTimeRangeChange}
            onDataCountChange={onDataCountChange}
            onFilterTypeChange={onFilterTypeChange}
            disabled={widgetState}
          />
          <Popover open={exportPopoverOpen} onOpenChange={setExportPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                className="cursor-pointer"
                variant="outline"
                disabled={widgetState}
              >
                <span className="sr-only">Ekspor</span>
                <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="ml-1 inline">Ekspor</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2" align={isMedium || isTablet ? "center" : "end"}>
              <div className="space-y-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start hover:bg-red-50 hover:text-red-600"
                  onClick={() => handleExportModeSelect("filter")}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  <div className="flex flex-col items-start">
                    <span className="text-inherit font-medium">Sesuai Filter</span>
                    <span className="text-xs text-muted-foreground">
                      Ekspor {getFilterDescription()}
                    </span>
                  </div>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start hover:bg-green-50 hover:text-green-600"
                  onClick={() => handleExportModeSelect("all")}
                >
                  <Database className="w-4 h-4 mr-2" />
                  <div className="flex flex-col items-start">
                    <span className="text-inherit font-medium">Semua Data</span>
                  </div>
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </>
      )}

      {/* Export Dialog */}
      <ExportDashboardDialog
        open={exportDialogOpen}
        setOpen={setExportDialogOpen}
        currentTimeRange={currentTimeRange}
        currentDataCount={currentDataCount}
        filterType={filterType}
        exportMode={exportMode}
        isMobile={isMobile}
      />
    </div>
  );
}

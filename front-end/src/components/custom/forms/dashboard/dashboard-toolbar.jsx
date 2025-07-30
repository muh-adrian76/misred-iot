import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Move, Download, SaveAll, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";
import DashboardTimeFilter from "@/components/custom/other/range-filter";
import ExportDashboardDialog from "@/components/custom/other/export-dialog";

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
}) {
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

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
          <Button
            className="cursor-pointer"
            variant="outline"
            onClick={() => setExportDialogOpen(true)}
            disabled={widgetState}
          >
            <span className="sr-only">Ekspor</span>
            <Download className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="ml-1 inline ">Ekspor</span>
          </Button>
        </>
      )}

      {/* Export Dialog */}
      <ExportDashboardDialog
        open={exportDialogOpen}
        setOpen={setExportDialogOpen}
        currentTimeRange={currentTimeRange}
        currentDataCount={currentDataCount}
        filterType={filterType}
      />
    </div>
  );
}

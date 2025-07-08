import React from "react";
import { Button } from "@/components/ui/button";
import { Move, CalendarSearch, Download, SaveAll, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DashboardToolbar({
  dashboardState,
  widgetState,
  editState,
  setEditState,
  setOpenChartSheet,
  className,
  saveEdit,
}) {
  return (
    <div className={cn("flex gap-2 sm:gap-3", className)}>
      {editState ? (
        <>
          <Button
            className="cursor-pointer"
            variant="outline"
            onClick={saveEdit}
          >
            <span className="sr-only">Save</span>
            <SaveAll className="w-5 h-5" />
            <span className="ml-1 inline">Simpan</span>
          </Button>
          <Button
            className="cursor-pointer"
            variant="outline"
            onClick={() => setEditState(false)}
          >
            <span className="sr-only">Cancel</span>
            <Undo2 className="w-5 h-5" />
            <span className="ml-1 inline">Batalkan</span>
          </Button>
        </>
      ) : (
        <>
          <Button
            className="cursor-pointer"
            variant="outline"
            onClick={() => setEditState(true)}
            disabled={dashboardState}
          >
            <span className="sr-only">Edit</span>
            <Move className="w-5 h-5" />
            <span className="ml-1 inline">Edit</span>
          </Button>
          <Button
            className="cursor-pointer"
            variant="outline"
            // disabled={widgetState}
            disabled={true}
          >
            <span className="sr-only">Filter</span>
            <CalendarSearch className="w-5 h-5" />
            <span className="ml-1 inline">Filter</span>
          </Button>
          <Button
            className="cursor-pointer"
            variant="outline"
            // disabled={widgetState}
            disabled={true}
          >
            <span className="sr-only">Export</span>
            <Download className="w-5 h-5" />
            <span className="ml-1 inline">Export</span>
          </Button>
        </>
      )}
    </div>
  );
}

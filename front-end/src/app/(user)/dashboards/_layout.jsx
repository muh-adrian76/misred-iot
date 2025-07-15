"use client";
import { useDashboardLogic } from "@/components/features/dashboard/dashboard-logic";
import DashboardHeader from "@/components/features/dashboard/dashboard-header";
import DashboardContent from "@/components/features/dashboard/dashboard-content";
import DashboardDialogs from "@/components/features/dashboard/dashboard-dialogs";

export default function DashboardLayout() {
  const logic = useDashboardLogic();

  if (!logic.isAuthenticated) return null;

  return (
    <>
      <DashboardHeader 
        {...logic}
        startEditMode={logic.startEditMode}
        cancelEditMode={logic.cancelEditMode}
        saveAllLayoutChanges={logic.saveAllLayoutChanges}
        hasUnsavedChanges={logic.hasUnsavedChanges}
      />
      <div className="overflow-x-hidden min-h-screen">
        <DashboardContent 
          {...logic}
          handleLayoutChange={logic.handleLayoutChange}
          handleBreakpointChange={logic.handleBreakpointChange}
          handleAddChart={logic.handleAddChart}
          currentBreakpoint={logic.currentBreakpoint}
          layoutKey={logic.layoutKey}
        />
      </div>
      <DashboardDialogs {...logic} />
    </>
  );
}

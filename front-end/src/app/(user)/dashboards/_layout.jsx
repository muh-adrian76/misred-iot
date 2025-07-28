"use client";
import { useDashboardLogic } from "@/components/features/dashboard/dashboard-logic";
import DashboardHeader from "@/components/features/dashboard/dashboard-header";
import DashboardContent from "@/components/features/dashboard/dashboard-content";
import DashboardDialogs from "@/components/features/dashboard/dashboard-dialogs";
import { useAuth } from "@/hooks/use-auth";
import { useUser } from "@/providers/user-provider";
import { TextShimmer } from "@/components/ui/text-shimmer";
import { motion } from "framer-motion";

export default function DashboardLayout() {
  const logic = useDashboardLogic();
  const { isAuthenticated } = useAuth();
  const { user } = useUser();

  // Show loading if authentication is not yet verified or user data not loaded
  if (!isAuthenticated || !user?.id) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        transition={{ duration: 0.5, delay: 0.5, ease: "easeInOut" }}
        className="flex items-center justify-center h-screen"
      >
        <TextShimmer className='text-sm' duration={1}>
          Memuat halaman dashboard...
        </TextShimmer>
      </motion.div>
    );
  }

  return (
    <>
      <DashboardHeader 
        {...logic}
        startEditMode={logic.startEditMode}
        cancelEditMode={logic.cancelEditMode}
        saveAllLayoutChanges={logic.saveAllLayoutChanges}
        hasUnsavedChanges={logic.hasUnsavedChanges}
        currentTimeRange={logic.currentTimeRange}
        currentDataCount={logic.currentDataCount}
        filterType={logic.filterType}
        onTimeRangeChange={logic.handleTimeRangeChange}
        onDataCountChange={logic.handleDataCountChange}
        onFilterTypeChange={logic.handleFilterTypeChange}
      />
      <div>
        <DashboardContent 
          {...logic}
          handleLayoutChange={logic.handleLayoutChange}
          handleBreakpointChange={logic.handleBreakpointChange}
          handleAddChart={logic.handleAddChart}
          currentBreakpoint={logic.currentBreakpoint}
          layoutKey={logic.layoutKey}
          currentTimeRange={logic.currentTimeRange}
          currentDataCount={logic.currentDataCount}
          filterType={logic.filterType}
        />
      </div>
      <DashboardDialogs {...logic} />
    </>
  );
}

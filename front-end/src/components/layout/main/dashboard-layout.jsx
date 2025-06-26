"use client";

import { useDashboardLogic } from "../features/dashboard/dashboard-logic";
import DashboardHeader from "../features/dashboard/dashboard-header";
import DashboardContent from "../features/dashboard/dashboard-content";
import DashboardDialogs from "../features/dashboard/dashboard-dialogs";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import AppSidebar from "@/components/layout/app-sidebar";
import AppNavbar from "@/components/layout/app-navbar";
import { cn } from "@/lib/utils";

export default function DashboardLayout() {
  const logic = useDashboardLogic();

  if (!logic.isAuthenticated) return null;

  return (
    <SidebarProvider
      open={logic.sidebarOpen}
      onOpenChange={logic.setSidebarOpen}
    >
      <div
        onMouseEnter={() => logic.setSidebarOpen(true)}
        onMouseLeave={() => logic.setSidebarOpen(false)}
        className="relative"
        style={{ height: "100vh" }}
      >
        <AppSidebar />
      </div>
      <SidebarInset>
        <AppNavbar page="Dashboards" />
        <div className={cn("px-4 space-y-4 faded-bottom no-scrollbar overflow-y-auto h-full", logic.isMobile ? "pb-18" : "pb-9")}>
          <DashboardHeader {...logic} />
          <DashboardContent {...logic} noDashboard={logic.dashboards.length === 0}/>
        </div>
        <DashboardDialogs {...logic} />
      </SidebarInset>
    </SidebarProvider>
  );
}

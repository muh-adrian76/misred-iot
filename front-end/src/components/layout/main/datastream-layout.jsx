"use client";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import AppSidebar from "@/components/layout/app-sidebar";
import AppNavbar from "@/components/layout/app-navbar";
import { useDatastreamLogic } from "../features/datastream/datastream-logic";
import DatastreamContent from "../features/datastream/datastream-content";
import DatastreamDialogs from "../features/datastream/datastream-dialogs";

export default function DatastreamLayout({ deviceId }) {
  const logic = useDatastreamLogic(deviceId);

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
        <AppNavbar page="Datastreams" />
        <div className="px-8 py-2 no-scrollbar overflow-y-auto h-full">
          <DatastreamContent {...logic} />
        </div>
        <DatastreamDialogs {...logic} />
      </SidebarInset>
    </SidebarProvider>
  );
}

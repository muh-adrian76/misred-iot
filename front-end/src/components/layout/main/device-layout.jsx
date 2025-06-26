"use client";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import AppSidebar from "@/components/layout/app-sidebar";
import AppNavbar from "@/components/layout/app-navbar";
import { useDeviceLogic } from "../features/device/device-logic";
import DeviceContent from "../features/device/device-content";
import DeviceDialogs from "../features/device/device-dialogs";

export default function DeviceLayout() {
  const logic = useDeviceLogic();

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
        <AppNavbar page="Devices" />
        <div className="px-8 py-2 no-scrollbar overflow-y-auto h-full">
          <DeviceContent
            {...logic}
            noDevice={logic.devices.length === 0}
            search={logic.search}
          />
        </div>
        <DeviceDialogs {...logic} />
      </SidebarInset>
    </SidebarProvider>
  );
}

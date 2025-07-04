"use client";
import { usePathname } from "next/navigation";
import { useSidebarOpen } from "@/providers/sidebar-provider";
import { useIsMobile } from "@/hooks/use-mobile";
import AppSidebar from "@/components/features/app-sidebar";
import AppNavbar from "@/components/features/app-navbar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { LayoutDashboard, Cpu, Siren, CircuitBoard } from "lucide-react";

const menu = [
  {
    title: "Dashboards",
    url: "/dashboards",
    icon: LayoutDashboard,
    disabled: false,
  },
  { title: "Devices", url: "/devices", icon: Cpu, disabled: false },
  {
    title: "Datastreams",
    url: "/datastreams",
    icon: CircuitBoard,
    disabled: false,
  },
  { title: "Alarms", url: "/alarms", icon: Siren, disabled: true },
];

export default function UserLayoutClient({ children }) {
  const { sidebarOpen, setSidebarOpen } = useSidebarOpen();
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const activeMenu = menu.find((item) => pathname.startsWith(item.url)) || {
    title: "Menu",
  };

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
      {isMobile ? (
        <AppSidebar
          sidebarMenu={menu}
          pathname={pathname}
          isMobile={isMobile}
        />
      ) : (
        <div
          onMouseEnter={() => setSidebarOpen(true)}
          onMouseLeave={() => setSidebarOpen(false)}
          className="relative"
          style={{ height: "100vh" }}
        >
          <AppSidebar
            sidebarMenu={menu}
            pathname={pathname}
            isMobile={isMobile}
          />
        </div>
      )}
      <SidebarInset>
        <AppNavbar page={activeMenu.title} />
        <div className="min-h-screen">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}

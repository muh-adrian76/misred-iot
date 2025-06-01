"use client";

import * as React from "react";
import { NavMain } from "./nav-main";
// import { NavDropdown } from "./nav-dropdown"
import { NavUser } from "./nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenuButton,
  SidebarRail,
} from "@/components/ui/sidebar";
import { IconClockEdit, IconCpu, IconDashboard } from "@tabler/icons-react";
import Loader from "./loader-text";
import { googleLogout } from "@react-oauth/google";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

// Nav Data.
const data = {
  user: {
    name: "Test User",
    initial: "TU",
    email: "test@user.com",
    lastLogin: "30 menit yang lalu",
  },
  navMain: [
    {
      title: "Dashboards",
      url: "/dashboards",
      icon: IconDashboard,
    },
    {
      title: "Devices",
      url: "/devices",
      icon: IconCpu,
    },
    {
      title: "Alarms",
      url: "alarms",
      icon: IconClockEdit,
    },
  ],
};

export function AppSidebar({ ...props }) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    googleLogout();
    router.push("/login");
  };

  return (
    <Sidebar collapsible="icon" variant="floating" {...props}>
      <SidebarHeader>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <div className="text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
            <img src="/misred-logo.png" alt="" className="size-6" />
          </div>
          <div className="grid flex-1 text-left text-lg leading-tight">
            <span className="truncate">MiSREd-IoT</span>
          </div>
        </SidebarMenuButton>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
        <Button
          variant="outline"
          className="w-full mt-2"
          onClick={handleLogout}
        >
          Logout
        </Button>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

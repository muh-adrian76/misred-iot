"use client";

import * as React from "react";
import { NavMain } from "./nav-main";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenuButton,
  SidebarRail,
} from "@/components/ui/sidebar";
import { IconClockEdit, IconCpu, IconLayoutDashboard } from "@tabler/icons-react";

// Data menu
const sidebarMenu = [
    {
      title: "Dashboards",
      url: "/dashboards",
      icon: IconLayoutDashboard,
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
  ];

export function AppSidebar({ ...props }) {

  return (
    <Sidebar collapsible="icon" variant="floating" {...props}>
      <SidebarHeader>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <div className="text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
            <img src="/misred-logo.svg" alt="" className="size-6" />
          </div>
          <div className="grid flex-1 text-left text-lg leading-tight">
            <span className="truncate">MiSREd-IoT</span>
          </div>
        </SidebarMenuButton>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={sidebarMenu} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}

"use client";

import * as React from "react";
import { NavElement } from "./nav-element";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { LayoutDashboard, Cpu, Siren, CircuitBoard } from "lucide-react";
import { brandLogo } from "@/lib/helper";

// Data menu
const sidebarMenu = [
    {
      title: "Dashboards",
      url: "/dashboards",
      icon: LayoutDashboard,
      disabled: false,
    },
    {
      title: "Devices",
      url: "/devices",
      icon: Cpu,
      disabled: false,
    },
    {
      title: "Datastreams",
      url: "/datastreams",
      icon: CircuitBoard,
      disabled: false,
    },
    {
      title: "Alarms",
      url: "alarms",
      icon: Siren,
      disabled: true,
    },
  ];

export default function AppSidebar({ ...props }) {

  return (
    <Sidebar collapsible="icon" variant="floating" {...props}>
      <SidebarHeader className="border-b-2">
        <div className="flex gap-3 items-center">
          <div className="text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
            <img src={brandLogo} alt="Logo" className="size-6" />
          </div>
          <div className="grid flex-1 text-left text-lg leading-tight">
            <span className="truncate">MiSREd-IoT</span>
          </div>
          </div>
      </SidebarHeader>
      <SidebarContent>
        <NavElement items={sidebarMenu} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}

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

// This is sample data.
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
  // dropdown: [
  //   {
  //     name: "Design Engineering",
  //     url: "#",
  //     icon: Frame,
  //   },
  //   {
  //     name: "Sales & Marketing",
  //     url: "#",
  //     icon: PieChart,
  //   },
  //   {
  //     name: "Travel",
  //     url: "#",
  //     icon: Map,
  //   },
  // ],
};

export function AppSidebar({ ...props }) {
  return (
    <Sidebar collapsible="icon" variant='floating' {...props}>
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
        {/* <NavDropdown projects={data.projects} /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

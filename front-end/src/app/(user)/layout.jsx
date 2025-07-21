import UserLayoutClient from "./client";
import { SidebarOpenProvider } from "@/providers/sidebar-provider";
import { WebSocketProvider } from "@/providers/websocket-provider";
import { DashboardProvider } from "@/providers/dashboard-provider";

export default function UserLayout({ children }) {
  return (
      <DashboardProvider>
        <WebSocketProvider>
          <SidebarOpenProvider>
            <UserLayoutClient>{children}</UserLayoutClient>
          </SidebarOpenProvider>
        </WebSocketProvider>
      </DashboardProvider>
  );
}

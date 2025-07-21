import AdminLayoutClient from "./client";
import { SidebarOpenProvider } from "@/providers/sidebar-provider";
import { WebSocketProvider } from "@/providers/websocket-provider";

export default function AdminLayout({ children }) {
  return (
    <WebSocketProvider>
      <SidebarOpenProvider>
        <AdminLayoutClient>{children}</AdminLayoutClient>
      </SidebarOpenProvider>
    </WebSocketProvider>
  );
}

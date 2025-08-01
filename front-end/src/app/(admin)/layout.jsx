// Layout utama untuk admin routes - wrapper dengan providers yang diperlukan admin
// Provides: WebSocket connection, sidebar state management untuk admin panel
import AdminLayoutClient from "./client";
import { SidebarOpenProvider } from "@/providers/sidebar-provider";
import { WebSocketProvider } from "@/providers/websocket-provider";

export default function AdminLayout({ children }) {
  return (
    // WebSocket provider untuk real-time admin monitoring
    <WebSocketProvider>
      {/* Sidebar provider untuk admin panel navigation */}
      <SidebarOpenProvider>
        <AdminLayoutClient>{children}</AdminLayoutClient>
      </SidebarOpenProvider>
    </WebSocketProvider>
  );
}

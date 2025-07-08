import UserLayoutClient from "./client";
import { SidebarOpenProvider } from "@/providers/sidebar-provider";

export default function UserLayout({ children }) {
  return (
    <SidebarOpenProvider>
      <UserLayoutClient>{children}</UserLayoutClient>
    </SidebarOpenProvider>
  );
}

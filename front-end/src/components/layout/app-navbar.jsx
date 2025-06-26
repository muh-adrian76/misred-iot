import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import NotificationButton from "../custom/buttons/notification-button";
import ThemeButton from "../custom/buttons/theme-button";
import ProfileButton from "../custom/buttons/profile-button";

export default function AppNavbar({ page }) {
  return (
    <header className="flex h-16 items-center bg-background px-4 py-3 gap-4 justify-between sticky top-0 z-50">
      <div className="flex items-center gap-4 px-4">
        <SidebarTrigger className="min-xl:hidden" />

        {/* Lokasi */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="max-md:hidden">
              <span className="text-muted-foreground">Menu</span>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="max-md:hidden" />
            <BreadcrumbItem>
              <BreadcrumbPage>{page}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center gap-4 px-4">
        {/* Notifikasi */}
        <NotificationButton />

        {/* Tema */}
        <ThemeButton />

        {/* Profil */}
        <ProfileButton />
      </div>
    </header>
  );
}

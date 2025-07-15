import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

import NotificationButton from "../custom/buttons/notification-button";
import ThemeButton from "../custom/buttons/theme-button";
import ProfileButton from "../custom/buttons/profile-button";

export default function AppNavbar({ page }) {
  const pathname = usePathname();

  return (
    <header className="flex h-16 items-center bg-background px-4 py-3 gap-4 justify-between sticky top-0 z-50">
      <motion.div
        key={pathname}
        className="flex items-center gap-4 px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1, delay: 1, ease: "easeInOut" }}
      >
        <SidebarTrigger className="min-lg:hidden" />

        {/* Lokasi */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="max-md:hidden">
              <span className="text-muted-foreground">Menu</span>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="max-md:hidden" />
            <BreadcrumbItem>
              <BreadcrumbPage>
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 2, delay: 0.5 }}
                  className="font-bold"
                >
                  {page}
                </motion.span>
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </motion.div>

      <motion.div
        className="flex items-center gap-4 px-4"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 50 }}
        transition={{ duration: 1, delay: 1.5, ease: "easeInOut" }}
      >
        {/* Notifikasi */}
        <NotificationButton />
        {/* Tema */}
        <ThemeButton />
        {/* Profil */}
        <ProfileButton />
      </motion.div>
    </header>
  );
}

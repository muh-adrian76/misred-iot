// Import komponen UI untuk sidebar dan breadcrumb navigation
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// Import Framer Motion untuk animasi
import { motion } from "framer-motion";

// Import Next.js hook untuk mendapatkan path saat ini
import { usePathname } from "next/navigation";

// Import custom button components
import NotificationButton from "../custom/buttons/notification-button"; // Tombol notifikasi/alarm
import ThemeButton from "../custom/buttons/theme-button"; // Toggle dark/light theme
import ProfileButton from "../custom/buttons/profile-button"; // Dropdown profil user

/**
 * Komponen Navbar aplikasi yang sticky di bagian atas
 * Menampilkan breadcrumb, sidebar trigger, dan action buttons
 * @param {Object} props - Props komponen
 * @param {string} props.page - Nama halaman saat ini untuk breadcrumb
 * @returns {JSX.Element} Navigation bar dengan animasi dan responsive layout
 */
export default function AppNavbar({ page }) {
  // Hook untuk mendapatkan pathname saat ini
  const pathname = usePathname();

  return (
    // Header container dengan sticky positioning dan z-index tinggi
    <header className="flex h-16 items-center bg-background px-4 py-3 gap-4 justify-between sticky top-0 z-50">
      
      {/* Left Section - Sidebar trigger dan breadcrumb */}
      <motion.div
        key={pathname} // Key berubah saat route berubah untuk re-trigger animasi
        className="flex items-center gap-4 px-4"
        // Animasi fade in dari kiri
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1, delay: 1, ease: "easeInOut" }}
      >
        {/* Sidebar Toggle Button - Hanya tampil di mobile/tablet */}
        <SidebarTrigger className="min-lg:hidden" />

        {/* Breadcrumb Navigation - Menampilkan lokasi saat ini */}
        <Breadcrumb>
          <BreadcrumbList>
            {/* Breadcrumb Root - Hidden pada mobile */}
            <BreadcrumbItem className="max-md:hidden">
              <span className="text-muted-foreground">Menu</span>
            </BreadcrumbItem>
            
            {/* Separator - Hidden pada mobile */}
            <BreadcrumbSeparator className="max-md:hidden" />
            
            {/* Current Page Breadcrumb */}
            <BreadcrumbItem>
              <BreadcrumbPage>
                {/* Animated page title */}
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 2, delay: 0.5 }}
                  className="font-bold"
                >
                  {page} {/* Nama halaman dari props */}
                </motion.span>
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </motion.div>

      {/* Right Section - Action buttons dengan animasi slide dari kanan */}
      <motion.div
        className="flex items-center gap-4 px-4"
        // Animasi slide in dari kanan
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 50 }}
        transition={{ duration: 1, delay: 1.5, ease: "easeInOut" }}
      >
        {/* Notification Button - Menampilkan badge untuk alarm/notifikasi */}
        <NotificationButton />
        
        {/* Theme Toggle Button - Switch antara dark/light mode */}
        <ThemeButton />
        
        {/* Profile Dropdown Button - Menu user dan logout */}
        <ProfileButton />
      </motion.div>
    </header>
  );
}

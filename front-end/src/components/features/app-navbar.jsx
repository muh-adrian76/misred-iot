// Import komponen UI untuk sidebar dan navigasi breadcrumb
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

// Import hook Next.js untuk mendapatkan path saat ini
import { usePathname } from "next/navigation";

// Import komponen tombol kustom
import NotificationButton from "../custom/buttons/notification-button"; // Tombol notifikasi/alarm
import ThemeButton from "../custom/buttons/theme-button"; // Tombol toggle tema gelap/terang
import ProfileButton from "../custom/buttons/profile-button"; // Tombol dropdown profil pengguna

/**
 * Komponen Navbar aplikasi yang menempel (sticky) di bagian atas.
 * Menampilkan breadcrumb, pemicu sidebar, dan tombol aksi.
 * @param {Object} props - Properti komponen
 * @param {string} props.page - Nama halaman saat ini untuk breadcrumb
 * @returns {JSX.Element} Bilah navigasi dengan animasi dan tata letak responsif
 */
export default function AppNavbar({ page }) {
  // Hook untuk mendapatkan pathname saat ini
  const pathname = usePathname();

  return (
    // Kontainer header dengan posisi sticky dan z-index tinggi
    <header className="flex h-16 items-center bg-background px-4 py-3 gap-4 justify-between sticky top-0 z-50">
      
      {/* Bagian kiri - pemicu sidebar dan breadcrumb */}
      <motion.div
        key={pathname} // Key berubah saat rute berubah untuk memicu ulang animasi
        className="flex items-center gap-4 px-4"
        // Animasi fade-in dari kiri
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1, delay: 1, ease: "easeInOut" }}
      >
        {/* Tombol toggle Sidebar - hanya tampil di mobile/tablet */}
        <SidebarTrigger className="min-lg:hidden" />

        {/* Navigasi breadcrumb - menampilkan lokasi saat ini */}
        <Breadcrumb>
          <BreadcrumbList>
            {/* Root breadcrumb - disembunyikan pada mobile */}
            <BreadcrumbItem className="max-md:hidden">
              <span className="text-muted-foreground">Menu</span>
            </BreadcrumbItem>
            
            {/* Separator - disembunyikan pada mobile */}
            <BreadcrumbSeparator className="max-md:hidden" />
            
            {/* Breadcrumb halaman saat ini */}
            <BreadcrumbItem>
              <BreadcrumbPage>
                {/* Judul halaman dengan animasi */}
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

      {/* Bagian kanan - tombol aksi dengan animasi slide dari kanan */}
      <motion.div
        className="flex items-center gap-4 px-4"
        // Animasi slide masuk dari kanan
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 50 }}
        transition={{ duration: 1, delay: 1.5, ease: "easeInOut" }}
      >
        {/* Tombol Notifikasi - menampilkan badge untuk alarm/notifikasi */}
        <NotificationButton />
        
        {/* Tombol Toggle Tema - ganti antara mode gelap/terang */}
        <ThemeButton />
        
        {/* Tombol Dropdown Profil - menu pengguna dan logout */}
        <ProfileButton />
      </motion.div>
    </header>
  );
}

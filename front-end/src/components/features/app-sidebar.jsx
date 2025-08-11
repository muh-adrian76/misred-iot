// Import komponen UI sidebar dari library
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

// Import utilitas helper dan navigasi
import { brandLogo } from "@/lib/helper"; // Helper untuk logo brand
import { Link } from "next-view-transitions"; // Link dengan view transitions
import { motion } from "framer-motion"; // Library untuk animasi

/**
 * Komponen Sidebar aplikasi dengan menu navigasi.
 * Mendukung mode dapat-diciutkan (collapsible) dan desain responsif.
 * @param {Object} props - Properti komponen
 * @param {Array} props.sidebarMenu - Daftar item menu dengan ikon, judul, url
 * @param {string} props.pathname - Path saat ini untuk menyorot menu aktif
 * @param {boolean} props.isMobile - Penanda untuk deteksi perangkat mobile
 * @param {string} props.logoFont - Kelas font untuk teks brand
 * @returns {JSX.Element} Sidebar dengan menu navigasi dan animasi
 */
export default function AppSidebar({ sidebarMenu = [], pathname, isMobile, logoFont, ...props }) {
  // Konten utama sidebar yang dapat digunakan dengan/tanpa pembungkus animasi
  const sidebarContent = (
    // Sidebar dengan konfigurasi dapat-diciutkan (collapsible) dan varian mengambang (floating)
    <Sidebar collapsible="icon" variant="floating" {...props}>
      
      {/* Header Sidebar - Logo dan brand */}
      <SidebarHeader className="border-b-2">
        <div className="flex gap-3 items-center">
          {/* Gambar logo */}
          <div className="text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
            <img src={brandLogo} alt="Logo" className="size-6" />
          </div>
          
          {/* Teks brand dengan font kustom */}
          <div className="grid flex-1 text-left text-lg leading-tight">
            <h1 className={`truncate text-2xl font-bold tracking-wide ${logoFont}`}>
              MiSREd-IoT
            </h1>
          </div>
        </div>
      </SidebarHeader>
      
      {/* Konten Sidebar - Menu navigasi */}
      <SidebarContent>
        <SidebarGroup>
          {/* Label grup */}
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          
          {/* Item menu */}
          <SidebarMenu>
            {sidebarMenu.map((item) => {
              // Cek apakah item menu sedang aktif berdasarkan pathname
              const isActive = pathname === item.url;

              return (
                <SidebarMenuItem key={item.title}>
                  {/* Tombol menu dengan pembungkus Link */}
                  <SidebarMenuButton
                    asChild // Menggunakan komponen anak sebagai tombol
                    isActive={isActive} // Sorot jika menu aktif
                    className="transition-all font-semibold duration-200" // Transisi halus
                  >
                    {/* Link dengan view transitions */}
                    <Link href={item.url} aria-disabled={item.disabled}>
                      {/* Ikon menu */}
                      {item.icon && <item.icon />}
                      {/* Judul menu */}
                      <span className="ml-2">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      
      {/* Sidebar Rail - pengendali untuk mengubah ukuran */}
      <SidebarRail />
    </Sidebar>
  );

  // Render kondisional berdasarkan jenis perangkat
  if (isMobile) {
    // Untuk mobile: kembalikan konten langsung tanpa pembungkus animasi
    return <>{sidebarContent}</>;
  }

  // Untuk desktop: bungkus dengan motion.div untuk animasi slide
  return (
    <motion.div
      // Animasi slide masuk dari kiri dengan fade
      initial={{ opacity: 0, x: -50 }} // Keadaan awal: tidak terlihat dan di kiri
      animate={{ opacity: 1, x: 0 }} // Keadaan akhir: terlihat dan posisi normal
      exit={{ opacity: 0, x: -50 }} // Keadaan keluar: fade out dan slide ke kiri
      transition={{ duration: 1, delay: 1, ease: "easeInOut" }} // Konfigurasi waktu
    >
      {sidebarContent}
    </motion.div>
  );
}

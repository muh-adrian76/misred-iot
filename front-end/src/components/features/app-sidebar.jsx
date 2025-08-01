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

// Import utility helper dan navigation
import { brandLogo } from "@/lib/helper"; // Helper untuk logo brand
import { Link } from "next-view-transitions"; // Link dengan view transitions
import { motion } from "framer-motion"; // Library untuk animasi

/**
 * Komponen Sidebar aplikasi dengan menu navigasi
 * Mendukung mode collapsible dan responsive design
 * @param {Object} props - Props komponen
 * @param {Array} props.sidebarMenu - Array menu items dengan icon, title, url
 * @param {string} props.pathname - Path saat ini untuk highlight menu aktif
 * @param {boolean} props.isMobile - Flag untuk deteksi mobile device
 * @param {string} props.logoFont - Class font untuk brand text
 * @returns {JSX.Element} Sidebar dengan menu navigasi dan animasi
 */
export default function AppSidebar({ sidebarMenu = [], pathname, isMobile, logoFont, ...props }) {
  // Konten utama sidebar yang dapat digunakan dengan/tanpa wrapper animasi
  // Konten utama sidebar yang dapat digunakan dengan/tanpa wrapper animasi
  const sidebarContent = (
    // Sidebar dengan konfigurasi collapsible dan floating variant
    <Sidebar collapsible="icon" variant="floating" {...props}>
      
      {/* Sidebar Header - Logo dan brand */}
      <SidebarHeader className="border-b-2">
        <div className="flex gap-3 items-center">
          {/* Logo Image */}
          <div className="text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
            <img src={brandLogo} alt="Logo" className="size-6" />
          </div>
          
          {/* Brand Text dengan custom font */}
          <div className="grid flex-1 text-left text-lg leading-tight">
            <h1 className={`truncate text-2xl font-bold tracking-wide ${logoFont}`}>
              MiSREd-IoT
            </h1>
          </div>
        </div>
      </SidebarHeader>
      
      {/* Sidebar Content - Menu navigasi */}
      <SidebarContent>
        <SidebarGroup>
          {/* Group Label */}
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          
          {/* Menu Items */}
          <SidebarMenu>
            {sidebarMenu.map((item) => {
              // Check apakah menu item sedang aktif berdasarkan pathname
              const isActive = pathname === item.url;

              return (
                <SidebarMenuItem key={item.title}>
                  {/* Menu Button dengan Link wrapper */}
                  <SidebarMenuButton
                    asChild // Menggunakan child component sebagai button
                    isActive={isActive} // Highlight jika menu aktif
                    className="transition-all font-semibold duration-200" // Smooth transitions
                  >
                    {/* Link dengan view transitions */}
                    <Link href={item.url} aria-disabled={item.disabled}>
                      {/* Menu Icon */}
                      {item.icon && <item.icon />}
                      {/* Menu Title */}
                      <span className="ml-2">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      
      {/* Sidebar Rail - Handler untuk resize */}
      <SidebarRail />
    </Sidebar>
  );

  // Conditional rendering berdasarkan device type
  if (isMobile) {
    // Untuk mobile: return konten langsung tanpa animasi wrapper
    return <>{sidebarContent}</>;
  }

  // Untuk desktop: wrap dengan motion.div untuk animasi slide
  return (
    <motion.div
      // Animasi slide in dari kiri dengan fade
      initial={{ opacity: 0, x: -50 }} // State awal: tidak terlihat dan di kiri
      animate={{ opacity: 1, x: 0 }} // State akhir: terlihat dan posisi normal
      exit={{ opacity: 0, x: -50 }} // State keluar: fade out dan slide ke kiri
      transition={{ duration: 1, delay: 1, ease: "easeInOut" }} // Konfigurasi timing
    >
      {sidebarContent}
    </motion.div>
  );
}

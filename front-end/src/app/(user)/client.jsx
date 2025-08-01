// Komponen client-side untuk layout halaman user
"use client";

// Import hooks dan utilities Next.js
import { usePathname } from "next/navigation"; // Hook untuk mendapatkan path URL saat ini
import { useState, useEffect } from "react"; // React hooks untuk state dan effect

// Import custom providers dan hooks
import { useSidebarOpen } from "@/providers/sidebar-provider"; // Provider untuk kontrol buka/tutup sidebar
import { useBreakpoint } from "@/hooks/use-mobile"; // Hook untuk deteksi breakpoint responsive
import { useAuth } from "@/hooks/use-auth"; // Hook untuk status autentikasi user
import { useUser } from "@/providers/user-provider"; // Provider untuk data user

// Import komponen UI
import AppSidebar from "@/components/features/app-sidebar"; // Komponen sidebar aplikasi
import AppNavbar from "@/components/features/app-navbar"; // Komponen navbar aplikasi
import ToDoList from "@/components/custom/other/to-do-list"; // Komponen checklist onboarding

// Import komponen UI library
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"; // Provider dan container sidebar

// Import icons dari Lucide React
import { LayoutDashboard, Cpu, Siren, CircuitBoard, ArrowLeftRight } from "lucide-react";

// Import utility functions
import { fetchFromBackend } from "@/lib/helper"; // Fungsi untuk API calls
import localFont from "next/font/local"; // Font loader Next.js

// Konfigurasi font lokal untuk logo
const logoFont = localFont({
  src: "../../../public/logo-font.ttf", // Path ke file font TTF logo
});

/**
 * Fungsi untuk generate menu navigasi berdasarkan role user
 * @param {boolean} isAdmin - Apakah user memiliki akses admin
 * @returns {Array} Array objek menu dengan title, url, icon, dan status
 */
const getMenu = (isAdmin = false) => {
  // Menu dasar yang tersedia untuk semua user
  const baseMenu = [
    {
      title: "Dashboards", // Menu untuk dashboard IoT
      url: "/dashboards",
      icon: LayoutDashboard,
      disabled: false,
    },
    { 
      title: "Devices", // Menu untuk manajemen device IoT
      url: "/devices", 
      icon: Cpu, 
      disabled: false 
    },
    {
      title: "Datastreams", // Menu untuk monitoring data stream
      url: "/datastreams",
      icon: CircuitBoard,
      disabled: false,
    },
    { 
      title: "Alarms", // Menu untuk sistem alarm dan notifikasi
      url: "/alarms", 
      icon: Siren, 
      disabled: false 
    },
  ];
  
  // Jika user adalah admin, tambahkan menu switch ke mode admin
  if (isAdmin) {
    baseMenu.unshift({
      title: "Mode Admin", // Menu untuk beralih ke panel admin
      url: "/overviews",
      icon: ArrowLeftRight,
      disabled: false,
      isSpecial: true, // Flag khusus untuk styling berbeda
    });
  }

  return baseMenu;
};

/**
 * Komponen layout client-side untuk halaman user
 * Mengatur sidebar, navbar, dan konten utama dengan responsive design
 * @param {Object} props - Props komponen
 * @param {ReactNode} props.children - Konten yang akan dirender di dalam layout
 */
export default function UserLayoutClient({ children }) {
  // Hooks untuk mengakses context dan state global
  const { sidebarOpen, setSidebarOpen } = useSidebarOpen(); // State buka/tutup sidebar
  const { isAuthenticated } = useAuth(); // Status autentikasi user
  const { user } = useUser(); // Data user dari context
  const pathname = usePathname(); // Path URL saat ini
  const { isMobile, isTablet, isDesktop } = useBreakpoint(); // Deteksi device breakpoint
  
  // Local state untuk kontrol onboarding dan admin access
  const [showOnboarding, setShowOnboarding] = useState(false); // Tampilkan checklist onboarding
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true); // Loading state untuk check onboarding
  const [isAdmin, setIsAdmin] = useState(false); // Status apakah user adalah admin
  
  // Effect untuk check status admin user dan menampilkan menu admin jika diperlukan
  useEffect(() => {
    // Skip pengecekan admin jika sedang di halaman admin untuk menghindari konflik
    if (pathname.startsWith('/admin/') || pathname.startsWith('/overviews') || pathname.startsWith('/users') || pathname.startsWith('/maps')) {
      return;
    }
    
    /**
     * Fungsi async untuk mengecek apakah user memiliki privilege admin
     * Memanggil API backend untuk validasi role user
     */
    const checkAdminStatus = async () => {
      // Jika user belum terautentikasi, set admin status false
      if (!isAuthenticated) {
        setIsAdmin(false);
        return;
      }

      try {
        // Call API untuk check admin privilege
        const response = await fetchFromBackend("/auth/check-admin");
        // console.log("User sidebar admin check raw response:", response);
        
        if (response.ok) {
          const data = await response.json();
          // console.log("User sidebar admin check parsed data:", data);
          // console.log("Setting admin status in user sidebar:", data.isAdmin);
          
          // Set status admin berdasarkan response dari backend
          setIsAdmin(data.isAdmin || false);
        } else {
          // console.log("User sidebar admin check failed:", response.status);
          setIsAdmin(false); // Default ke false jika request gagal
        }
      } catch (error) {
        // console.log("Admin check error in user sidebar:", error);
        setIsAdmin(false); // Default ke false jika terjadi error
      }
    };

    // Jalankan pengecekan admin status
    checkAdminStatus();
  }, [isAuthenticated, pathname]); // Re-run ketika auth status atau pathname berubah
  
  // Generate menu berdasarkan status admin user
  const menu = getMenu(isAdmin);
  
  // Cari menu yang aktif berdasarkan pathname saat ini
  // Digunakan untuk highlight menu aktif dan menampilkan title di navbar
  const activeMenu = menu.find((item) => pathname.startsWith(item.url)) || {
    title: "Menu", // Fallback title jika tidak ada menu yang cocok
  };

  // Effect untuk check dan menampilkan onboarding checklist untuk user baru
  useEffect(() => {
    /**
     * Fungsi async untuk mengecek progress onboarding user
     * Menampilkan to-do list jika masih ada task yang belum selesai
     */
    const checkOnboardingStatus = async () => {
      // Skip jika user belum terautentikasi atau tidak ada user ID
      if (!isAuthenticated || !user?.id) {
        setIsCheckingOnboarding(false);
        return;
      }
      
      try {
        // Call API untuk mendapatkan progress onboarding user
        const response = await fetchFromBackend(`/user/onboarding-progress/${user.id}`);
        
        if (response.ok) {
          const responseData = await response.json();
          const completedTasks = responseData.data?.completedTasks || []; // Array task yang sudah selesai
          
          // Check apakah semua task onboarding sudah selesai (task 1-5)
          const allTasksCompleted = [1, 2, 3, 4, 5].every(taskId => 
            completedTasks.includes(taskId)
          );
          
          // Debug logging untuk tracking onboarding progress
          // console.log('Onboarding check:', { 
          //   userId: user.id, 
          //   completedTasks, 
          //   allTasksCompleted,
          //   shouldShow: !allTasksCompleted 
          // });
          
          // Tampilkan onboarding jika masih ada task yang belum selesai
          setShowOnboarding(!allTasksCompleted);
        }
      } catch (error) {
        // console.error('Error checking onboarding status:', error);
        setShowOnboarding(true); // Tampilkan onboarding by default jika error
      } finally {
        setIsCheckingOnboarding(false); // Set loading selesai
      }
    };

    // Jalankan pengecekan onboarding status
    checkOnboardingStatus();
  }, [isAuthenticated, user?.id]); // Re-run ketika auth status atau user ID berubah

  // Render layout dengan SidebarProvider sebagai wrapper utama
  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
      {/* Conditional rendering berdasarkan device type */}
      {isMobile ? (
        // Layout untuk mobile: sidebar dengan behavior standar
        <AppSidebar
          sidebarMenu={menu} // Menu navigasi yang sudah di-generate
          pathname={pathname} // Path saat ini untuk highlight menu aktif
          isMobile={isMobile} // Flag mobile untuk responsive behavior
          logoFont={logoFont.className} // Font class untuk logo
        />
      ) : (
        // Layout untuk desktop: sidebar dengan hover effect
        <div
          onMouseEnter={() => setSidebarOpen(true)} // Buka sidebar saat hover
          onMouseLeave={() => setSidebarOpen(false)} // Tutup sidebar saat mouse leave
          className="relative"
          style={{ height: "100vh" }} // Full viewport height
        >
          <AppSidebar
            sidebarMenu={menu} // Menu navigasi yang sudah di-generate
            pathname={pathname} // Path saat ini untuk highlight menu aktif
            isMobile={isMobile} // Flag mobile (false untuk desktop)
            logoFont={logoFont.className} // Font class untuk logo
          />
        </div>
      )}
        {/* Container utama untuk konten dengan responsive width */}
        <SidebarInset className="flex flex-col w-[80vw]">
          {/* Navbar dengan title menu aktif */}
          <AppNavbar page={activeMenu.title} />
          
          {/* Container konten utama dengan min height full screen */}
          <div className="min-h-screen relative">
            {/* Debug component - temporary untuk development */}
            {/* <OnboardingDebug /> */}
            
            {/* Conditional rendering untuk onboarding checklist */}
            {/* Tampilkan to-do list untuk user baru yang belum menyelesaikan onboarding */}
            {!isCheckingOnboarding && showOnboarding && (
              <div className="fixed top-4 right-4 z-50">
                {/* Komponen ToDoList dengan callback untuk hide saat selesai */}
                <ToDoList onComplete={() => setShowOnboarding(false)} />
              </div>
            )}
            
            {/* Render konten utama dari children props */}
            {children}
          </div>
        </SidebarInset>
    </SidebarProvider>
  );
}

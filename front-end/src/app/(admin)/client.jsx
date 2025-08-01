// Client component untuk admin layout - handles admin authentication dan UI rendering
// Features: admin privilege checking, responsive sidebar, access control dengan error states
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { useUser } from "@/providers/user-provider";
import { useSidebarOpen } from "@/providers/sidebar-provider";
import { useBreakpoint } from "@/hooks/use-mobile";
import {
  Shield,
  AlertTriangle,
  Loader2,
  Users,
  MapPin,
  BarChart3,
  CloudCog,
  ArrowLeftRight,
} from "lucide-react";
import AppSidebar from "@/components/features/app-sidebar";
import AppNavbar from "@/components/features/app-navbar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import localFont from "next/font/local";

// Local font untuk logo branding
const logoFont = localFont({
  src: "../../../public/logo-font.ttf",
});

// Menu navigation untuk admin panel
const adminMenu = [
  {
    title: "Mode User",
    url: "/dashboards",
    icon: ArrowLeftRight,
    disabled: false,
    isSpecial: true, // Special styling untuk switch mode
  },
  {
    title: "Overviews",
    url: "/overviews",
    icon: BarChart3,
    disabled: false,
  },
  {
    title: "Users",
    url: "/users",
    icon: Users,
    disabled: false,
  },
  {
    title: "Maps",
    url: "/maps",
    icon: MapPin,
    disabled: false,
  },
  {
    title: "Over-The-Air",
    url: "/otaa",
    icon: CloudCog,
    disabled: false,
  },
];

export default function AdminLayoutClient({ children }) {
  const { sidebarOpen, setSidebarOpen } = useSidebarOpen();
  const { isAdmin, isAuthenticated, loading: adminLoading } = useAdminAuth();
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const { isMobile, isTablet, isDesktop } = useBreakpoint();
  const [isLoading, setIsLoading] = useState(true); // Local loading state

  // Debug logging untuk development (commented out untuk production)
  // console.log("Admin client render:", {
  //   isAdmin,
  //   isAuthenticated,
  //   adminLoading,
  //   isLoading,
  //   pathname,
  // });

  // Determine active menu berdasarkan current pathname
  const activeMenu = adminMenu.find((item) =>
    pathname.startsWith(item.url)
  ) || {
    title: "Admin Panel", // Fallback title
  };

  // Effect untuk handle loading state setelah auth checks selesai
  useEffect(() => {
    // Wait sampai semua auth checks selesai
    if (!adminLoading && isAuthenticated !== undefined && isAdmin !== undefined) {
      // const timer = setTimeout(() => {
        setIsLoading(false);
      // }, 100000); // Timer untuk smooth transition (commented out)
      // return () => clearTimeout(timer);
    }
  }, [adminLoading, isAuthenticated, isAdmin]);

  // Loading state - tampil saat masih mengecek admin privileges
  if (isLoading || adminLoading) {
    // console.log("Admin client: Showing loading state", {
    //   isLoading,
    //   adminLoading,
    // });
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Memverifikasi Akses Admin...
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Mohon tunggu sebentar
          </p>
        </div>
      </div>
    );
  }

  // Access denied state - user belum login
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Akses Ditolak
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Anda harus login terlebih dahulu untuk mengakses halaman admin.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => router.push("/auth")}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
            >
              Ke Halaman Login
            </button>
            <button
              onClick={() => router.push("/")}
              className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
            >
              Kembali ke Beranda
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Admin privilege required state - user login tapi bukan admin
  if (isAuthenticated && isAdmin === false) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <Shield className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Akses Admin Diperlukan
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            Halo, <span className="font-semibold">{user?.name}</span>!
          </p>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Anda tidak memiliki izin admin untuk mengakses halaman ini.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => router.push("/dashboards")}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
            >
              Ke Dashboard User
            </button>
            <button
              onClick={() => router.back()}
              className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
            >
              Kembali
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main admin layout - render sidebar dan content area
  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
      {/* Mobile: show/hide sidebar berdasarkan state */}
      {isMobile ? (
        <AppSidebar
          sidebarMenu={adminMenu}
          pathname={pathname}
          isMobile={isMobile}
          logoFont={logoFont.className}
        />
      ) : (
        /* Desktop: hover behavior untuk sidebar auto show/hide */
        <div
          onMouseEnter={() => setSidebarOpen(true)}
          onMouseLeave={() => setSidebarOpen(false)}
          className="relative"
          style={{ height: "100vh" }}
        >
          <AppSidebar
            sidebarMenu={adminMenu}
            pathname={pathname}
            isMobile={isMobile}
            logoFont={logoFont.className}
          />
        </div>
      )}
      {/* Main content area dengan navbar dan children */}
      <SidebarInset className="flex flex-col w-[80vw]">
        <AppNavbar page={activeMenu.title} />
        <div className="min-h-screen relative">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}

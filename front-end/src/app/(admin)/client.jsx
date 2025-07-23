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
  ArrowLeftRight,
} from "lucide-react";
import AppSidebar from "@/components/features/app-sidebar";
import AppNavbar from "@/components/features/app-navbar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import localFont from "next/font/local";

const logoFont = localFont({
  src: "../../../public/logo-font.ttf",
});

const adminMenu = [
  {
    title: "Mode User",
    url: "/dashboards",
    icon: ArrowLeftRight,
    disabled: false,
    isSpecial: true,
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
];

export default function AdminLayoutClient({ children }) {
  const { sidebarOpen, setSidebarOpen } = useSidebarOpen();
  const { isAdmin, isAuthenticated, loading: adminLoading } = useAdminAuth();
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const { isMobile, isTablet, isDesktop } = useBreakpoint();
  const [isLoading, setIsLoading] = useState(true);

  // Debug logging
  console.log("Admin client render:", {
    isAdmin,
    isAuthenticated,
    adminLoading,
    isLoading,
    pathname,
  });

  const activeMenu = adminMenu.find((item) =>
    pathname.startsWith(item.url)
  ) || {
    title: "Admin Panel",
  };

  useEffect(() => {
    // Wait for auth to be determined and admin check to complete
    if (!adminLoading && isAuthenticated !== undefined && isAdmin !== undefined) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 50); // Lebih cepat
      return () => clearTimeout(timer);
    }
  }, [adminLoading, isAuthenticated, isAdmin]);

  useEffect(() => {
    // Hanya redirect jika sudah selesai loading dan definitif bukan admin
    if (!isLoading && !adminLoading && isAuthenticated !== undefined && isAdmin !== undefined) {
      console.log("Admin client: Making routing decision", {
        isAuthenticated,
        isAdmin,
        willRedirect: !isAuthenticated || (isAuthenticated && isAdmin === false)
      });
      
      if (!isAuthenticated) {
        console.log("Admin client: Not authenticated, redirecting to auth");
        router.push("/auth");
      } else if (isAuthenticated && isAdmin === false) {
        console.log("Admin client: Authenticated but definitely not admin, redirecting to dashboards");
        router.push("/dashboards");
      } else if (isAuthenticated && isAdmin === true) {
        console.log("Admin client: Authenticated and is admin - staying on admin page");
      }
    }
  }, [isAuthenticated, isAdmin, isLoading, adminLoading, router]);

  // Show loading state
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

  // Show access denied if not authenticated
  if (!isAuthenticated) {
    // console.log("Admin client: Not authenticated, showing login screen");
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
          <button
            onClick={() => router.push("/auth")}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
          >
            Ke Halaman Login
          </button>
        </div>
      </div>
    );
  }

  // Show access denied if authenticated but not admin
  if (isAuthenticated && isAdmin === false) {
    // console.log(
    //   "Admin client: Authenticated but definitely not admin, showing access denied"
    // );
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
          <button
            onClick={() => router.push("/dashboards")}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
          >
            Ke Dashboard User
          </button>
        </div>
      </div>
    );
  }

  // Render admin content if all checks pass
  // console.log("Admin client: All checks passed, rendering admin content");
  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
      {isMobile ? (
        <AppSidebar
          sidebarMenu={adminMenu}
          pathname={pathname}
          isMobile={isMobile}
          logoFont={logoFont.className}
        />
      ) : (
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
      <SidebarInset className="flex flex-col w-[80vw]">
        <AppNavbar page={activeMenu.title} />
        <div className="min-h-screen relative">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}

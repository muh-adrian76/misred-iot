"use client";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useSidebarOpen } from "@/providers/sidebar-provider";
import { useBreakpoint } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/use-auth";
import { useUser } from "@/providers/user-provider";
import AppSidebar from "@/components/features/app-sidebar";
import AppNavbar from "@/components/features/app-navbar";
import ToDoList from "@/components/custom/other/to-do-list";
import OnboardingDebug from "@/components/custom/other/onboarding-debug";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { LayoutDashboard, Cpu, Siren, CircuitBoard, ArrowLeftRight } from "lucide-react";
import { fetchFromBackend } from "@/lib/helper";
import localFont from "next/font/local";

const logoFont = localFont({
  src: "../../../public/logo-font.ttf",
});

const getMenu = (isAdmin = false) => {
  const baseMenu = [
    {
      title: "Dashboards",
      url: "/dashboards",
      icon: LayoutDashboard,
      disabled: false,
    },
    { title: "Devices", url: "/devices", icon: Cpu, disabled: false },
    {
      title: "Datastreams",
      url: "/datastreams",
      icon: CircuitBoard,
      disabled: false,
    },
    { title: "Alarms", url: "/alarms", icon: Siren, disabled: false },
  ];
  
  if (isAdmin) {
    baseMenu.unshift({
      title: "Switch to Admin",
      url: "/overviews",
      icon: ArrowLeftRight,
      disabled: false,
      isSpecial: true,
    });
  }

  return baseMenu;
};

export default function UserLayoutClient({ children }) {
  const { sidebarOpen, setSidebarOpen } = useSidebarOpen();
  const isAuthenticated = useAuth();
  const { user } = useUser();
  const pathname = usePathname();
  const { isMobile, isTablet, isDesktop } = useBreakpoint();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Check if user is admin to show admin switch menu
  useEffect(() => {
    // Skip admin check if we're on admin pages to avoid conflicts
    if (pathname.startsWith('/admin/') || pathname.startsWith('/overviews') || pathname.startsWith('/users') || pathname.startsWith('/maps')) {
      return;
    }
    
    const checkAdminStatus = async () => {
      if (!isAuthenticated) {
        setIsAdmin(false);
        return;
      }

      try {
        const response = await fetchFromBackend("/auth/check-admin");
        console.log("User sidebar admin check raw response:", response);
        if (response.ok) {
          const data = await response.json();
          console.log("User sidebar admin check parsed data:", data);
          console.log("Setting admin status in user sidebar:", data.isAdmin);
          setIsAdmin(data.isAdmin || false);
        } else {
          console.log("User sidebar admin check failed:", response.status);
          setIsAdmin(false);
        }
      } catch (error) {
        console.log("Admin check error in user sidebar:", error);
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, [isAuthenticated, pathname]);
  
  const menu = getMenu(isAdmin);
  
  const activeMenu = menu.find((item) => pathname.startsWith(item.url)) || {
    title: "Menu",
  };

  // Check onboarding status
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!isAuthenticated || !user?.id) {
        setIsCheckingOnboarding(false);
        return;
      }
      
      try {
        const response = await fetchFromBackend(`/user/onboarding-progress/${user.id}`);
        if (response.ok) {
          const responseData = await response.json();
          const completedTasks = responseData.data?.completedTasks || [];
          
          // Check if all tasks are completed (tasks 1-5)
          const allTasksCompleted = [1, 2, 3, 4, 5].every(taskId => 
            completedTasks.includes(taskId)
          );
          
          // console.log('Onboarding check:', { 
          //   userId: user.id, 
          //   completedTasks, 
          //   allTasksCompleted,
          //   shouldShow: !allTasksCompleted 
          // });
          setShowOnboarding(!allTasksCompleted);
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        setShowOnboarding(true); // Show onboarding by default on error
      } finally {
        setIsCheckingOnboarding(false);
      }
    };

    checkOnboardingStatus();
  }, [isAuthenticated, user?.id]);

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
      {isMobile ? (
        <AppSidebar
          sidebarMenu={menu}
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
            sidebarMenu={menu}
            pathname={pathname}
            isMobile={isMobile}
            logoFont={logoFont.className}
          />
        </div>
      )}
        <SidebarInset className="flex flex-col w-[80vw]">
          <AppNavbar page={activeMenu.title} />
          <div className="min-h-screen relative">
            {/* Debug component - temporary */}
            {/* <OnboardingDebug /> */}
            
            {/* Show onboarding to-do list for new users */}
            {!isCheckingOnboarding && showOnboarding && (
              <div className="fixed top-4 right-4 z-50">
                <ToDoList onComplete={() => setShowOnboarding(false)} />
              </div>
            )}
            {children}
          </div>
        </SidebarInset>
    </SidebarProvider>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { AppSidebar } from "@/components/features/app-sidebar";
import { SwapyDragArea } from "@/components/features/swapy";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddChartDialog } from "@/components/forms/add-chart-form";
import { SettingsDialog } from "@/components/forms/settings-form";
import LogoutButton from "@/components/buttons/logout-button";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import {
  CalendarSearch,
  Download,
  RefreshCw,
  Bell,
  Sun,
  Moon,
  Plus,
  Laptop,
} from "lucide-react";
import { useTheme } from "next-themes";

export default function Page() {
  const [tabs, setTabs] = useState([]);
  const [activeTab, setActiveTab] = useState("");
  const [openSheet, setOpenSheet] = useState(false);
  const [tabItems, setTabItems] = useState({});
  const [tabLayouts, setTabLayouts] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openSettings, setOpenSettings] = useState(false);

  const isAuthenticated = useAuth();
  const router = useRouter();
  const { setTheme, theme } = useTheme();

  useEffect(() => {
    if (tabs.length > 0 && !tabs.includes(activeTab)) {
      setActiveTab(tabs[0]);
    }
  }, [tabs, activeTab]);

  const handleAddChart = (tab, chartType) => {
    const id = `${chartType}-${Date.now()}`;
    const defaultLayoutItem = {
      i: id,
      x: 0,
      y: Infinity,
      w: 3,
      h: 2,
    };

    if (!tabs.includes(tab)) {
      setTabs((prev) => [...prev, tab]);
    }
    setActiveTab(tab);
    setTabItems((prev) => ({
      ...prev,
      [tab]: [...(prev[tab] || []), { id, type: chartType }],
    }));
    setTabLayouts((prev) => ({
      ...prev,
      [tab]: [...(prev[tab] || []), defaultLayoutItem],
    }));
    toast.success(
      `${chartType.toUpperCase()} chart successfully added to "${tab}" tab`
    );
  };

  const handleRemoveTab = (tabToRemove) => {
    const newTabs = tabs.filter((t) => t !== tabToRemove);
    setTabs(newTabs);

    const newTabItems = { ...tabItems };
    delete newTabItems[tabToRemove];
    setTabItems(newTabItems);

    const newTabLayouts = { ...tabLayouts };
    delete newTabLayouts[tabToRemove];
    setTabLayouts(newTabLayouts);

    if (activeTab === tabToRemove) {
      setActiveTab(newTabs[0] || "");
    }
  };

  const setItemsForTab = (items) => {
    setTabItems((prev) => ({ ...prev, [activeTab]: items }));
  };

  const setLayoutsForTab = (layouts) => {
    setTabLayouts((prev) => ({ ...prev, [activeTab]: layouts }));
  };

  // Check Authorization
  if (!isAuthenticated) {
    return null;
  }

  // Data user, bisa dari context/auth
  const user = {
    name: "Test User",
    email: "test@user.com",
    avatar: "/avatars/shadcn.jpg", // ganti sesuai data user Anda
  };

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <div
        onMouseEnter={() => setSidebarOpen(true)}
        onMouseLeave={() => setSidebarOpen(false)}
        className="relative"
        style={{ height: "100vh" }} // pastikan area hover cukup tinggi
      >
        <AppSidebar />
      </div>
      <SidebarInset>
        <header className="flex h-16 items-center border-b bg-background px-4 gap-4 justify-between sticky top-0">
          <div className="flex items-center gap-4 px-4">
            <SidebarTrigger className="md:hidden" />
            {/* <Separator orientation="vertical" className="h-6" /> */}

            {/* Breadcrumb */}
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <span className="text-muted-foreground">Menu</span>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Dashboard</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          {/* Kanan: Action Buttons */}
          <div className="flex items-center gap-4 px-4">
            {/* Notifikasi */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="relative rounded-full"
                >
                  <Bell className="w-5 h-5" />
                  {/* Notif */}
                  {/* <span className="absolute top-0 right-0 inline-block w-2 h-2 bg-red-500 rounded-full" /> */}
                  <span className="sr-only">Notifikasi</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <div className="px-3 py-2 font-medium">Notifikasi Terbaru</div>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <span className="text-sm">Alarm pH tinggi di Device1</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <span className="text-sm">Alarm TSS rendah di Device2</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {/* Tema */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full">
                  {theme === "dark" ? (
                    <Moon className="w-5 h-5" />
                  ) : theme === "light" ? (
                    <Sun className="w-5 h-5" />
                  ) : (
                    <Laptop className="w-5 h-5" />
                  )}
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme("light")}>
                  <Sun className="mr-2 w-4 h-4" /> Cerah
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                  <Moon className="mr-2 w-4 h-4" /> Gelap
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                  <Laptop className="mr-2 w-4 h-4" /> Sistem
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {/* Profil */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="cursor-pointer">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback>{user.name[0]}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="px-3 py-2">
                  <div className="font-medium">{user.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {user.email}
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setOpenSettings(true)}>
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <LogoutButton />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className="p-4 space-y-4">
          {tabs.length === 0 && !activeTab ? (
            <div className="flex items-center justify-center h-screen">
              <span className="text-muted-foreground text-lg">
                Dashboard masih kosong. Tambahkan widget untuk memulai.
              </span>
            </div>
          ) : (
            <>
              <div className="flex items-center px-3.5 gap-4 justify-between">
                {tabs.length > 0 && (
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                      {tabs.map((tab) => (
                        <TabsTrigger
                          key={tab}
                          value={tab}
                          className="flex items-center space-x-1 group"
                        >
                          <span>{tab}</span>
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveTab(tab);
                            }}
                            role="button"
                            title="Delete Tab"
                            className="text-red-500 ml-2 invisible group-hover:visible cursor-pointer"
                          >
                            ×
                          </span>
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                )}
              </div>

              {activeTab && (
                <SwapyDragArea
                  items={tabItems[activeTab] || []}
                  setItems={setItemsForTab}
                  layouts={{ lg: tabLayouts[activeTab] || [] }}
                  setLayouts={(layouts) => setLayoutsForTab(layouts.lg || [])}
                  openSheet={false}
                  setOpenSheet={() => {}}
                  activeTab={activeTab}
                />
              )}
            </>
          )}
        </div>

        <div
          className="
            fixed left-1/2 bottom-4 -translate-x-1/2
            flex gap-2
            bg-background/80 backdrop-blur-md shadow-lg rounded-xl
            px-6 py-2
            z-50
            border
            max-w-full
            w-fit
            sm:gap-3
          "
        >
          {/* Filter */}
          <Button variant="outline">
            <span className="sr-only">Filter</span>
            <CalendarSearch className="w-5 h-5" />
            <span className="ml-2 hidden sm:inline">Filter</span>
          </Button>
          {/* Export */}
          <Button variant="outline">
            <span className="sr-only">Export</span>
            <Download className="w-5 h-5" />
            <span className="ml-2 hidden sm:inline">Export</span>
          </Button>
          {/* Refresh */}
          <Button variant="outline">
            <span className="sr-only">Refresh</span>
            <RefreshCw className="w-5 h-5" />
            <span className="ml-2 hidden sm:inline">Refresh</span>
          </Button>
          {/* Add Chart */}
          <Button onClick={() => setOpenSheet(true)}>
            <Plus className="w-5 h-5" />
            <span className="ml-2 hidden sm:inline">Widget</span>
          </Button>
        </div>

        <AddChartDialog
          open={openSheet}
          setOpen={setOpenSheet}
          existingTabs={tabs}
          onAddChart={handleAddChart}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}

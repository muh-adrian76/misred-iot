"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/features/app-sidebar";
import { SwapyDragArea } from "@/components/features/swapy";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddChartForm } from "@/components/forms/add-chart-form";
import AppNavbar from "@/components/features/app-navbar";
import { CalendarSearch, Download, Search, Plus, Move } from "lucide-react";
import { toast } from "sonner";

import { useUser } from "@/providers/user-provider";
import { useAuth } from "@/hooks/use-auth";
import { useDashboard } from "@/hooks/use-dashboard";
import { fetchFromBackend } from "@/lib/helper";

export default function Page() {
  const [tabs, setTabs] = useState([]);
  const [activeTab, setActiveTab] = useState("");
  const [openChartSheet, setOpenChartSheet] = useState(false);
  const [tabItems, setTabItems] = useState({});
  const [tabLayouts, setTabLayouts] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAuthenticated = useAuth();
  const { user } = useUser();
  const { dashboards, widgets, setDashboards } = useDashboard();

  useEffect(() => {
    if (dashboards.length > 0) {
      setTabs(dashboards.map((dashboard) => dashboard.name));

      const items = {};
      const layouts = {};

      dashboards.forEach((dashboard) => {
        const dashboardWidgets = widgets[dashboard.id] || [];
        items[dashboard.name] = dashboardWidgets.map((widget) => ({
          id: widget.id,
          type: widget.sensor_type,
        }));

        layouts[dashboard.name] = dashboardWidgets.map((widget, index) => ({
          i: widget.id,
          x: index % 3,
          y: Math.floor(index / 3),
          w: 3,
          h: 2,
        }));
      });

      setTabItems(items);
      setTabLayouts(layouts);
      setActiveTab(dashboards[0].name); // Set tab aktif ke dashboard pertama
    }
  }, [dashboards, widgets]);

  const createDashboard = async (description) => {
    if (!description.trim()) {
      toast.error("Nama dashboard tidak boleh kosong");
      return null;
    }

    try {
      const res = await fetchFromBackend("/dashboard", {
        method: "POST",
        body: JSON.stringify({ description }),
      });

      if (!res.ok) {
        throw new Error("Gagal membuat dashboard");
      }

      const { id } = await res.json();
      setDashboards((prev) => [...prev, { id, name }]);

      return id; 
    } catch (error) {
      console.error(error);
      toast.error("Gagal membuat dashboard");
      throw error;
    }
  };

  const handleAddChart = async (tab, chartType, dashboardId) => {
    const id = `${chartType}-${Date.now()}`;
    const defaultLayoutItem = {
      i: id,
      x: 0,
      y: Infinity,
      w: 3,
      h: 2,
    };

    try {
      // Cari dashboard ID berdasarkan nama tab
      const res = await fetchFromBackend("/widget", {
        method: "POST",
        body: JSON.stringify({
          description: `${chartType} chart`,
          device_id: null,
          sensor_type: chartType,
          dashboard_id: dashboardId,
        }),
      });

      if (!res.ok) {
        throw new Error("Gagal menambahkan widget");
      }

      const { id: widgetId } = await res.json();

      if (!tabs.includes(tab)) {
        setTabs((prev) => [...prev, tab]);
      }
      setActiveTab(tab);
      setTabItems((prev) => ({
        ...prev,
        [tab]: [...(prev[tab] || []), { id: widgetId, type: chartType }],
      }));
      setTabLayouts((prev) => ({
        ...prev,
        [tab]: [...(prev[tab] || []), defaultLayoutItem],
      }));
      toast.success(
        `${chartType.toUpperCase()} chart successfully added to "${tab}" tab`
      );
    } catch (error) {
      console.error(error);
      toast.error("Gagal menambahkan chart");
    }
  };

  const handleRemoveTab = async (tabToRemove) => {
    try {
      const dashboard = dashboards.find((d) => d.name === tabToRemove);
      if (!dashboard) {
        throw new Error("Dashboard tidak ditemukan");
      }

      // Hapus dashboard dari backend
      const res = await fetchFromBackend(`/dashboard/${dashboard.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Gagal menghapus dashboard");
      }

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

      toast.success("Dashboard berhasil dihapus");
    } catch (error) {
      console.error(error);
      toast.error("Gagal menghapus dashboard");
    }
  };

  const setItemsForTab = (items) => {
    setTabItems((prev) => ({ ...prev, [activeTab]: items }));
  };

  const setLayoutsForTab = (layouts) => {
    setTabLayouts((prev) => ({ ...prev, [activeTab]: layouts }));
  };

  // Check JWT
  if (!isAuthenticated) {
    return null;
  }

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <div
        onMouseEnter={() => setSidebarOpen(true)}
        onMouseLeave={() => setSidebarOpen(false)}
        className="relative"
        style={{ height: "100vh" }}
      >
        <AppSidebar />
      </div>
      <SidebarInset>
        <AppNavbar page="Dashboards" profile={user} />

        <div className="p-4 space-y-4 faded-bottom no-scrollbar overflow-y-auto h-full">
          {dashboards.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <span className="text-muted-foreground text-lg text-center">
                Dashboard masih kosong. Tambahkan widget untuk memulainya.
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
                  openChartSheet={false}
                  setOpenChartSheet={() => {}}
                  activeTab={activeTab}
                />
              )}
            </>
          )}
        </div>

        <div
          className="
            dashboard-toolbar
            fixed left-1/2 bottom-4 -translate-x-1/2
            flex gap-2
            bg-background/80 backdrop-blur-md shadow-lg rounded-xl
            px-2 py-2
            z-10
            border
            max-w-full
            w-fit
            sm:gap-3
          "
        >
          <Button
            className="cursor-pointer"
            variant="outline"
            onClick={() => setOpenChartSheet(true)}
          >
            <Plus className="w-5 h-5" />
            <span className="ml-1 hidden sm:inline">Widget</span>
          </Button>
          <Button className="cursor-pointer" variant="outline">
            <span className="sr-only">Edit</span>
            <Move className="w-5 h-5" />
            <span className="ml-1 hidden sm:inline">Edit</span>
          </Button>
          <Button className="cursor-pointer">
            <span className="sr-only">Search</span>
            <Search className="w-5 h-5" />
            <span className="ml-1 hidden sm:inline">Tab</span>
          </Button>
          <Button className="cursor-pointer" variant="outline">
            <span className="sr-only">Filter</span>
            <CalendarSearch className="w-5 h-5" />
            <span className="ml-1 hidden sm:inline">Filter</span>
          </Button>
          <Button className="cursor-pointer" variant="outline">
            <span className="sr-only">Export</span>
            <Download className="w-5 h-5" />
            <span className="ml-1 hidden sm:inline">Export</span>
          </Button>
        </div>

        <AddChartForm
          open={openChartSheet}
          setOpen={setOpenChartSheet}
          existingTabs={tabs}
          onAddChart={handleAddChart}
          createDashboard={createDashboard}
          dashboards={dashboards}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}

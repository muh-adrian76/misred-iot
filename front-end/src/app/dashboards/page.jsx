"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/features/app-sidebar";
import { SwapyDragArea } from "@/components/features/swapy";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddChartForm } from "@/components/forms/add-chart-form";
import AppNavbar from "@/components/features/app-navbar";
import {
  CalendarSearch,
  Download,
  Search,
  Plus,
  Move
} from "lucide-react";
import { toast } from "sonner";

import { useUser } from "@/providers/user-provider";
import { useAuth } from "@/hooks/use-auth";

export default function Page() {
  const [tabs, setTabs] = useState([]);
  const [activeTab, setActiveTab] = useState("");
  const [openChartSheet, setOpenChartSheet] = useState(false);
  const [tabItems, setTabItems] = useState({});
  const [tabLayouts, setTabLayouts] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAuthenticated = useAuth();
  const { user } = useUser();

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
        style={{ height: "100vh" }} // pastikan area hover cukup tinggi
      >
        <AppSidebar />
      </div>
      <SidebarInset>
        <AppNavbar page="Dashboards" profile={user} />

        <div className="p-4 space-y-4">
          {tabs.length === 0 && !activeTab ? (
            <div className="flex items-center justify-center h-screen">
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
          <Button className="cursor-pointer" variant="outline" onClick={() => setOpenChartSheet(true)}>
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
        />
      </SidebarInset>
    </SidebarProvider>
  );
}

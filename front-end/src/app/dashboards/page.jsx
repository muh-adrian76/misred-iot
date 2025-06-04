"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { AppSidebar } from "@/components/features/app-sidebar"
import { SwapyDragArea } from "@/components/features/swapy"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AddChartDialog } from "@/components/features/add-chart"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"

export default function Page() {
  const [tabs, setTabs] = useState([])
  const [activeTab, setActiveTab] = useState("")
  const [openSheet, setOpenSheet] = useState(false)
  const [tabItems, setTabItems] = useState({})
  const [tabLayouts, setTabLayouts] = useState({})

  useEffect(() => {
    if (tabs.length > 0 && !tabs.includes(activeTab)) {
      setActiveTab(tabs[0])
    }
  }, [tabs, activeTab])

  const handleAddChart = (tab, chartType) => {
    const id = `${chartType}-${Date.now()}`
    const defaultLayoutItem = {
      i: id,
      x: 0,
      y: Infinity,
      w: 3,
      h: 2,
    }

    if (!tabs.includes(tab)) {
      setTabs((prev) => [...prev, tab])
    }
    setActiveTab(tab)
    setTabItems((prev) => ({
      ...prev,
      [tab]: [...(prev[tab] || []), { id, type: chartType }],
    }))
    setTabLayouts((prev) => ({
      ...prev,
      [tab]: [...(prev[tab] || []), defaultLayoutItem],
    }))
    toast.success(`${chartType.toUpperCase()} chart successfully added to "${tab}" tab`)
  }

  const handleRemoveTab = (tabToRemove) => {
  const newTabs = tabs.filter((t) => t !== tabToRemove)
  setTabs(newTabs)

  const newTabItems = { ...tabItems }
  delete newTabItems[tabToRemove]
  setTabItems(newTabItems)

  const newTabLayouts = { ...tabLayouts }
  delete newTabLayouts[tabToRemove]
  setTabLayouts(newTabLayouts)

  if (activeTab === tabToRemove) {
    setActiveTab(newTabs[0] || "")
  }
  }


  const setItemsForTab = (items) => {
    setTabItems((prev) => ({ ...prev, [activeTab]: items }))
  }

  const setLayoutsForTab = (layouts) => {
    setTabLayouts((prev) => ({ ...prev, [activeTab]: layouts }))
  }

  // Check Authorization
  const isAuthenticated = useAuth();
  if (!isAuthenticated) {
    return null;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 items-center gap-2 transition-all">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
              <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Dashboard</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="p-4 space-y-4">
          <div className="flex items-center gap-4">
            {tabs.length > 0 ? (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  {tabs.map((tab) => (
                    <TabsTrigger key={tab} value={tab} className="flex items-center space-x-1 group">
                      <span>{tab}</span>
                      <span
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemoveTab(tab)
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
            ) : (
              <span className="text-muted-foreground italic">there are no tabs yet</span>
            )}

            <Button className="ml-auto" onClick={() => setOpenSheet(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Chart
            </Button>
          </div>

          {activeTab && (
            <SwapyDragArea
              items={tabItems[activeTab] || []}
              setItems={setItemsForTab}
              layouts={{ lg: tabLayouts[activeTab] || [] }}
              setLayouts={(layouts) =>
                setLayoutsForTab(layouts.lg || [])
              }
              openSheet={false}
              setOpenSheet={() => {}}
              activeTab={activeTab}
            />
          )}
        </div>

        <AddChartDialog
          open={openSheet}
          setOpen={setOpenSheet}
          existingTabs={tabs}
          onAddChart={handleAddChart}
        />
      </SidebarInset>
    </SidebarProvider>
  )
}
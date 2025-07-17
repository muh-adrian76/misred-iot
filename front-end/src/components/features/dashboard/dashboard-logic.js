import { useEffect, useState, useCallback } from "react";
import { useUser } from "@/providers/user-provider";
import { useBreakpoint } from "@/hooks/use-mobile";
import { useDashboard } from "@/providers/dashboard-provider";
import { fetchFromBackend } from "@/lib/helper";
import { successToast, errorToast } from "@/components/custom/other/toaster";
import { markDashboardCreated, markWidgetCreated } from "@/lib/onboarding-utils";

// Helper function to get dashboard description from ID
const getDashboardDescription = (id, dashboards) => {
  const dashboard = dashboards.find(d => d.id === id);
  return dashboard ? dashboard.description : "";
};

// Widget constraints helper
const getWidgetConstraints = (widgetType) => {
  const constraints = {
    line: { minW: 3, minH: 4, maxW: 12, maxH: 8 },
    bar: { minW: 3, minH: 4, maxW: 12, maxH: 8 },
    pie: { minW: 3, minH: 4, maxW: 6, maxH: 6 },
    gauge: { minW: 2, minH: 3, maxW: 4, maxH: 4 },
    number: { minW: 2, minH: 2, maxW: 4, maxH: 3 },
    switch: { minW: 2, minH: 1, maxW: 3, maxH: 1, h: 1 },
    button: { minW: 2, minH: 1, maxW: 3, maxH: 1, h: 1 },
    slider: { minW: 3, minH: 1, maxW: 6, maxH: 1, h: 1 },
  };
  
  return constraints[widgetType] || { minW: 2, minH: 2, maxW: 12, maxH: 8 };
};

export function useDashboardLogic() {
  // Core state
  const [dashboards, setDashboards] = useState([]);
  const [widgets, setWidgets] = useState({});
  const [currentBreakpoint, setCurrentBreakpoint] = useState("lg");
  const [openChartSheet, setOpenChartSheet] = useState(false);
  const [openDashboardDialog, setOpenDashboardDialog] = useState(false);
  const [widgetCount, setWidgetCount] = useState(0);
  const [isLoadingWidget, setIsLoadingWidget] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [dashboardToDelete, setDashboardToDelete] = useState(null);
  const [editDashboardValue, setEditDashboardValue] = useState("");
  const [showWidgetForm, setShowWidgetForm] = useState(false);
  const [showEditWidgetForm, setShowEditWidgetForm] = useState(false);
  const [newWidgetData, setNewWidgetData] = useState(null);
  const [editWidgetData, setEditWidgetData] = useState(null);
  const [devices, setDevices] = useState([]);
  const [datastreams, setDatastreams] = useState([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Dashboard provider
  const {
    tabItems,
    tabLayouts,
    activeTab,
    updateTabItems,
    updateTabLayouts,
    updateActiveTab,
    setAllTabItems,
    setAllTabLayouts,
    clearDashboardData,
  } = useDashboard();

  // Hooks
  const { isMobile, isMedium, isTablet, isDesktop } = useBreakpoint();
  const { user } = useUser();
  const isAuthenticated = user && user.id;

  // Monitor edit value changes for dashboard name
  useEffect(() => {
    const currentDescription = getDashboardDescription(activeTab, dashboards);
    if (isEditing && editDashboardValue.trim() && editDashboardValue !== currentDescription) {
      setHasUnsavedChanges(true);
    }
  }, [editDashboardValue, activeTab, dashboards, isEditing]);

  // Fetch functions
  const fetchDashboards = useCallback(async () => {
    try {
      const res = await fetchFromBackend("/dashboard", { method: "GET" });
      if (!res.ok) return;
      const data = await res.json();
      setDashboards(data.result || []);
    } catch (error) {
      console.error('Error fetching dashboards:', error);
    }
  }, []);

  const fetchWidgetCount = useCallback(async (dashboardId) => {
    setIsLoadingWidget(true);
    try {
      const res = await fetchFromBackend(`/widget/dashboard/${dashboardId}`, { method: "GET" });
      if (!res.ok) return setWidgetCount(0);
      const data = await res.json();
      setWidgetCount(Array.isArray(data.result) ? data.result.length : 0);
    } catch (error) {
      setWidgetCount(0);
    } finally {
      setIsLoadingWidget(false);
    }
  }, []);

  const fetchWidgetsByDashboard = useCallback(async (dashboardId) => {
    try {
      const res = await fetchFromBackend(`/widget/dashboard/${dashboardId}`, { method: "GET" });
      if (!res.ok) return [];
      const data = await res.json();
      return data.result || [];
    } catch (error) {
      return [];
    }
  }, []);

  const fetchDevices = useCallback(async () => {
    try {
      const res = await fetchFromBackend("/device", { method: "GET" });
      if (!res.ok) return;
      const data = await res.json();
      setDevices(data.result || []);
    } catch (error) {
      console.error('Error fetching devices:', error);
    }
  }, []);

  const fetchDatastreams = useCallback(async () => {
    try {
      const res = await fetchFromBackend("/datastream", { method: "GET" });
      if (!res.ok) return;
      const data = await res.json();
      setDatastreams(data.result || []);
    } catch (error) {
      console.error('Error fetching datastreams:', error);
    }
  }, []);

  // Clear dashboard data when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      clearDashboardData();
      setDashboards([]);
      setWidgets({});
    }
  }, [isAuthenticated, clearDashboardData]);

  // Fetch data when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboards();
      fetchDevices();
      fetchDatastreams();
    }
  }, [isAuthenticated, fetchDashboards, fetchDevices, fetchDatastreams]);

  // Load widgets for all dashboards
  useEffect(() => {
    const loadWidgetsForDashboards = async () => {
      if (dashboards.length > 0) {
        const widgetsByDashboard = {};
        for (const dashboard of dashboards) {
          const dashboardWidgets = await fetchWidgetsByDashboard(dashboard.id);
          widgetsByDashboard[dashboard.id] = dashboardWidgets;
        }
        setWidgets(widgetsByDashboard);
      }
    };
    
    loadWidgetsForDashboards();
  }, [dashboards, fetchWidgetsByDashboard]);

  // Update widget count when active tab changes
  useEffect(() => {
    if (activeTab && dashboards.length > 0) {
      const dashboard = dashboards.find(d => d.id === activeTab);
      if (dashboard) {
        fetchWidgetCount(dashboard.id);
      }
    }
  }, [activeTab, dashboards, fetchWidgetCount]);

  // Sync dashboard data to provider state (this is the key fix for tab switching)
  useEffect(() => {
    console.log('Dashboard sync effect triggered:', { 
      dashboardsLength: dashboards.length, 
      widgetsKeys: Object.keys(widgets), 
      activeTab 
    });
    
    if (dashboards.length > 0) {
      const items = {};
      const layouts = {};
      
      dashboards.forEach((dashboard) => {
        const dashboardWidgets = widgets[dashboard.id] || [];
        console.log(`Dashboard ${dashboard.id} (${dashboard.description}):`, dashboardWidgets.length, 'widgets');
        
        // Use dashboard ID as key for items
        items[dashboard.id] = dashboardWidgets;
        
        // Generate or parse layouts
        let dashboardLayouts = {};
        
        if (dashboard.layout) {
          try {
            dashboardLayouts = typeof dashboard.layout === "string" 
              ? JSON.parse(dashboard.layout) 
              : dashboard.layout;
          } catch (e) {
            console.warn('Failed to parse dashboard layout:', e);
            dashboardLayouts = {};
          }
        }
        
        // Ensure all breakpoints exist and generate missing layouts
        const breakpoints = ['lg', 'md', 'sm', 'xs', 'xxs'];
        const defaultWidths = { lg: 3, md: 4, sm: 6, xs: 12, xxs: 12 };
        
        breakpoints.forEach(bp => {
          if (!dashboardLayouts[bp]) {
            dashboardLayouts[bp] = [];
          }
          
          // Add missing widgets to layout (only if there are widgets)
          dashboardWidgets.forEach((widget, idx) => {
            const existingLayout = dashboardLayouts[bp].find(item => item.i === widget.id.toString());
            if (!existingLayout) {
              const constraints = getWidgetConstraints(widget.type);
              const w = Math.max(constraints.minW, defaultWidths[bp]);
              const h = constraints.h || 4;
              const cols = 12;
              const x = (idx * w) % cols;
              const y = Math.floor(idx / (cols / w)) * h;
              
              dashboardLayouts[bp].push({
                i: widget.id.toString(),
                x,
                y,
                w,
                h,
                minW: constraints.minW,
                minH: constraints.minH,
                maxW: constraints.maxW,
                maxH: constraints.maxH,
              });
            } else {
              // Apply current constraints
              const constraints = getWidgetConstraints(widget.type);
              existingLayout.minW = constraints.minW;
              existingLayout.minH = constraints.minH;
              existingLayout.maxW = constraints.maxW;
              existingLayout.maxH = constraints.maxH;
              
              if (constraints.h) {
                existingLayout.h = constraints.h;
              }
            }
          });
          
          // Remove layouts for non-existent widgets
          dashboardLayouts[bp] = dashboardLayouts[bp].filter(layoutItem => 
            dashboardWidgets.some(widget => widget.id.toString() === layoutItem.i)
          );
        });
        
        layouts[dashboard.id] = dashboardLayouts;
      });
      
      setAllTabItems(items);
      setAllTabLayouts(layouts);
      
      console.log('Setting tab items and layouts:', { items, layouts });
      
      // Set active tab to first dashboard if current activeTab doesn't exist
      if (!dashboards.some(d => d.id === activeTab)) {
        const newActiveTab = dashboards[0]?.id || "";
        console.log('Setting new active tab:', newActiveTab);
        updateActiveTab(newActiveTab);
      }
    } else {
      console.log('No dashboards, clearing active tab');
      updateActiveTab("");
    }
  }, [dashboards, widgets, activeTab, setAllTabItems, setAllTabLayouts, updateActiveTab]);

  // CRUD Operations
  const handleAddDashboard = async (description, widget_count = 0) => {
    if (!description.trim()) {
      errorToast("Nama dashboard tidak boleh kosong");
      return null;
    }
    try {
      const res = await fetchFromBackend("/dashboard", {
        method: "POST",
        body: JSON.stringify({ description, widget_count }),
      });
      if (!res.ok) throw new Error("Gagal membuat dashboard");
      const { id } = await res.json();
      
      successToast("Dashboard berhasil dibuat");
      markDashboardCreated(); // Trigger onboarding task
      
      await fetchDashboards();
      
      // Set as active tab after creation
      setTimeout(() => {
        updateActiveTab(id);
        fetchWidgetCount(id);
      }, 100);
      
      return id;
    } catch (error) {
      console.error('Error adding dashboard:', error);
      errorToast("Gagal membuat dashboard");
      throw error;
    }
  };

  const handleEditDashboard = async (newDescription) => {
    const dashboard = dashboards.find((d) => d.id === activeTab);
    if (!dashboard) return;
    
    try {
      const dashboardId = activeTab;
      const currentLayout = tabLayouts[dashboardId] || {};
      const currentWidgetCount = (tabItems[dashboardId] || []).filter(item => !item.isStaged).length;
      
      const res = await fetchFromBackend(`/dashboard/${dashboard.id}`, {
        method: "PUT",
        body: JSON.stringify({ 
          description: newDescription,
          widget_count: currentWidgetCount,
          layout: JSON.stringify(currentLayout)
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.text();
        console.error('Backend response error:', errorData);
        throw new Error("Gagal mengubah nama dashboard");
      }
      
      await fetchDashboards();
      successToast("Dashboard berhasil diubah");
    } catch (error) {
      console.error('Error editing dashboard:', error);
      errorToast("Gagal mengubah nama dashboard");
    }
  };

  const handleDeleteDashboard = async () => {
    if (!dashboardToDelete) return;
    try {
      const res = await fetchFromBackend(`/dashboard/${dashboardToDelete.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Gagal menghapus dashboard");
      
      successToast("Dashboard berhasil dihapus");
      setOpenDeleteDialog(false);
      setDashboardToDelete(null);
      
      await fetchDashboards();
      
      // Switch to another dashboard or clear active tab
      setTimeout(() => {
        const remainingDashboards = dashboards.filter(d => d.id !== dashboardToDelete.id);
        if (remainingDashboards.length > 0) {
          updateActiveTab(remainingDashboards[0].id);
        } else {
          updateActiveTab("");
        }
      }, 100);
    } catch (error) {
      console.error('Error deleting dashboard:', error);
      errorToast("Gagal menghapus dashboard");
    } finally {
      setIsEditing(false);
    }
  };

  const handleSaveEditDashboard = async () => {
    try {
      const dashboard = dashboards.find((d) => d.id === activeTab);
      if (!dashboard) {
        errorToast("Dashboard tidak ditemukan");
        return;
      }

      const currentDescription = getDashboardDescription(activeTab, dashboards);
      const finalDescription = (editDashboardValue.trim() && editDashboardValue !== currentDescription) 
        ? editDashboardValue.trim() 
        : dashboard.description;

      const dashboardId = activeTab;
      const currentItems = tabItems[dashboardId] || [];
      
      // Find and save all staged widgets first
      const stagedWidgets = currentItems.filter(widget => widget.isStaged);
      console.log('Found staged widgets to save:', stagedWidgets);
      
      // Track widget ID mapping for layout updates
      const widgetIdMapping = {};
      let widgetCreatedCount = 0; // Track how many widgets we created
      
      for (const stagedWidget of stagedWidgets) {
        try {
          const widgetPayload = {
            description: stagedWidget.description,
            dashboard_id: dashboardId,
            device_id: stagedWidget.device_id,
            datastream_id: stagedWidget.datastream_id,
            type: stagedWidget.type,
          };
          
          const res = await fetchFromBackend("/widget", {
            method: "POST",
            body: JSON.stringify(widgetPayload),
          });
          
          if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Failed to add widget: ${res.status} - ${errorText}`);
          }
          
          const newWidget = await res.json();
          widgetIdMapping[stagedWidget.id] = newWidget.result.id;
          widgetCreatedCount++;
          
          // Trigger onboarding task completion for each widget created
          markWidgetCreated();
          
        } catch (error) {
          console.error('Error saving staged widget:', stagedWidget, error);
          throw error;
        }
      }
      
      // Update layout with real widget IDs
      let finalLayoutData = tabLayouts[dashboardId] || {};
      
      if (Object.keys(widgetIdMapping).length > 0) {
        const updatedLayouts = { ...finalLayoutData };
        
        Object.keys(updatedLayouts).forEach(breakpoint => {
          if (updatedLayouts[breakpoint]) {
            updatedLayouts[breakpoint] = updatedLayouts[breakpoint].map(layoutItem => {
              const realId = widgetIdMapping[layoutItem.i];
              if (realId) {
                return { ...layoutItem, i: realId.toString() };
              }
              return layoutItem;
            });
          }
        });
        
        finalLayoutData = updatedLayouts;
        updateTabLayouts(dashboardId, updatedLayouts);
      }
      
      // Calculate final widget count
      const existingWidgetCount = currentItems.filter(item => !item.isStaged).length;
      const finalWidgetCount = existingWidgetCount + Object.keys(widgetIdMapping).length;
      
      // Save dashboard with layout
      const response = await fetchFromBackend(`/dashboard/${dashboard.id}`, {
        method: "PUT",
        body: JSON.stringify({
          description: finalDescription,
          widget_count: finalWidgetCount,
          layout: JSON.stringify(finalLayoutData),
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Backend response error:', errorData);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Refresh data to get latest state
      await fetchDashboards();
      
      successToast(`Dashboard berhasil disimpan${widgetCreatedCount > 0 ? ` dengan ${widgetCreatedCount} widget baru` : ''}`);
      
    } catch (error) {
      console.error('Error saving dashboard:', error);
      errorToast("Gagal menyimpan dashboard");
    } finally {
      setIsEditing(false);
      setHasUnsavedChanges(false);
    }
  };

  // Simplified layout saving
  const saveLayoutToDB = async () => {
    const dashboard = dashboards.find((d) => d.id === activeTab);
    if (!dashboard) {
      console.warn('Dashboard not found for activeTab:', activeTab);
      return;
    }

    try {
      const dashboardId = activeTab;
      const layoutData = tabLayouts[dashboardId] || {};
      const allItems = tabItems[dashboardId] || [];
      const realWidgetCount = allItems.filter(item => !item.isStaged).length;
      
      const response = await fetchFromBackend(`/dashboard/${dashboard.id}`, {
        method: "PUT",
        body: JSON.stringify({
          description: dashboard.description,
          widget_count: realWidgetCount,
          layout: JSON.stringify(layoutData),
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Backend response error:', errorData);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      console.log('Layout saved successfully');
    } catch (error) {
      console.error('Error saving layout:', error);
      errorToast("Gagal menyimpan layout");
      throw error;
    }
  };

  // Widget management
  const addWidget = async (chartType) => {
    const dashboardId = activeTab;
    
    try {
      const res = await fetchFromBackend("/widget", {
        method: "POST",
        body: JSON.stringify({
          description: `${chartType} chart`,
          dashboard_id: dashboardId,
          device_id: 1,
          datastream_id: 1,
          type: chartType,
        }),
      });
      if (!res.ok) throw new Error("Gagal menambahkan widget");
      
      markWidgetCreated(); // Trigger onboarding task
      await fetchDashboards(); // Refresh to get updated data
      
    } catch (error) {
      console.error('Error adding widget:', error);
      errorToast("Gagal menambahkan widget");
    }
  };

  // Widget form handlers
  const stageWidgetAddition = async (formData) => {
    const tempId = Date.now().toString();
    const dashboardId = activeTab;
    
    const stagedWidget = {
      id: tempId,
      description: formData.description,
      dashboard_id: dashboardId,
      device_id: formData.device_id,
      datastream_id: formData.datastream_id,
      type: formData.chartType,
      isStaged: true
    };
    
    const currentItems = tabItems[dashboardId] || [];
    const updatedItems = [...currentItems, stagedWidget];
    updateTabItems(dashboardId, updatedItems);
    
    // Add to layout if position provided
    if (newWidgetData?.layoutItem) {
      await stageLayoutUpdate(tempId, newWidgetData.layoutItem, formData.chartType);
    }
    
    setHasUnsavedChanges(true);
    setShowWidgetForm(false);
    setNewWidgetData(null);
  };

  const stageLayoutUpdate = async (widgetId, layoutItem, widgetType) => {
    const dashboardId = activeTab;
    const currentLayouts = tabLayouts[dashboardId] || {};
    const constraints = getWidgetConstraints(widgetType);
    
    const breakpoints = ['lg', 'md', 'sm', 'xs', 'xxs'];
    const updatedLayouts = { ...currentLayouts };
    
    breakpoints.forEach(bp => {
      if (!updatedLayouts[bp]) {
        updatedLayouts[bp] = [];
      }
      
      updatedLayouts[bp].push({
        i: widgetId.toString(),
        x: layoutItem.x,
        y: layoutItem.y,
        w: layoutItem.w,
        h: layoutItem.h,
        minW: constraints.minW,
        minH: constraints.minH,
        maxW: constraints.maxW,
        maxH: constraints.maxH,
      });
    });
    
    updateTabLayouts(dashboardId, updatedLayouts);
    setHasUnsavedChanges(true);
  };

  // Layout and event handlers
  const setItemsForTab = (items) => {
    updateTabItems(activeTab, items);
  };
  
  const setLayoutsForTab = (layouts) => {
    updateTabLayouts(activeTab, layouts);
  };

  const handleBreakpointChange = useCallback((breakpoint) => {
    setCurrentBreakpoint(breakpoint);
  }, []);

  const handleLayoutChange = useCallback(async (layout, allLayouts) => {
    if (!activeTab) return;
    
    console.log('Layout changed, updating state...');
    updateTabLayouts(activeTab, allLayouts);
    setHasUnsavedChanges(true);
  }, [activeTab, updateTabLayouts]);

  // Edit mode management
  const startEditMode = useCallback(() => {
    setIsEditing(true);
    setHasUnsavedChanges(false);
    const currentDescription = getDashboardDescription(activeTab, dashboards);
    setEditDashboardValue(currentDescription);
  }, [activeTab, dashboards]);

  const cancelEditMode = useCallback(() => {
    setIsEditing(false);
    setHasUnsavedChanges(false);
    setEditDashboardValue("");
  }, []);

  // Main save function for all changes
  const saveAllLayoutChanges = useCallback(async () => {
    try {
      // Save the current dashboard with any name changes and layout updates
      const dashboard = dashboards.find((d) => d.id === activeTab);
      if (!dashboard) {
        errorToast("Dashboard tidak ditemukan");
        return;
      }

      const currentDescription = getDashboardDescription(activeTab, dashboards);
      const finalDescription = (editDashboardValue.trim() && editDashboardValue !== currentDescription) 
        ? editDashboardValue.trim() 
        : dashboard.description;

      const dashboardId = activeTab;
      const currentItems = tabItems[dashboardId] || [];
      
      // Find and save all staged widgets first
      const stagedWidgets = currentItems.filter(widget => widget.isStaged);
      console.log('Found staged widgets to save:', stagedWidgets);
      
      // Track widget ID mapping for layout updates
      const widgetIdMapping = {};
      let widgetCreatedCount = 0; // Track how many widgets we created
      
      for (const stagedWidget of stagedWidgets) {
        try {
          const widgetPayload = {
            description: stagedWidget.description,
            dashboard_id: dashboardId,
            device_id: stagedWidget.device_id,
            datastream_id: stagedWidget.datastream_id,
            type: stagedWidget.type,
          };
          
          const res = await fetchFromBackend("/widget", {
            method: "POST",
            body: JSON.stringify(widgetPayload),
          });
          
          if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Failed to add widget: ${res.status} - ${errorText}`);
          }
          
          const newWidget = await res.json();
          widgetIdMapping[stagedWidget.id] = newWidget.result.id;
          widgetCreatedCount++;
          
          // Trigger onboarding task completion for each widget created
          markWidgetCreated();
          
        } catch (error) {
          console.error('Error saving staged widget:', stagedWidget, error);
          throw error;
        }
      }
      
      // Update layout with real widget IDs
      let finalLayoutData = tabLayouts[dashboardId] || {};
      
      if (Object.keys(widgetIdMapping).length > 0) {
        const updatedLayouts = { ...finalLayoutData };
        
        Object.keys(updatedLayouts).forEach(breakpoint => {
          if (updatedLayouts[breakpoint]) {
            updatedLayouts[breakpoint] = updatedLayouts[breakpoint].map(layoutItem => {
              const realId = widgetIdMapping[layoutItem.i];
              if (realId) {
                return { ...layoutItem, i: realId.toString() };
              }
              return layoutItem;
            });
          }
        });
        
        finalLayoutData = updatedLayouts;
        updateTabLayouts(dashboardId, updatedLayouts);
      }
      
      // Calculate final widget count
      const existingWidgetCount = currentItems.filter(item => !item.isStaged).length;
      const finalWidgetCount = existingWidgetCount + Object.keys(widgetIdMapping).length;
      
      // Save dashboard with layout
      const response = await fetchFromBackend(`/dashboard/${dashboard.id}`, {
        method: "PUT",
        body: JSON.stringify({
          description: finalDescription,
          widget_count: finalWidgetCount,
          layout: JSON.stringify(finalLayoutData),
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Backend response error:', errorData);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Refresh data to get latest state
      await fetchDashboards();
      
      successToast(`Dashboard berhasil disimpan${widgetCreatedCount > 0 ? ` dengan ${widgetCreatedCount} widget baru` : ''}`);
      
      setIsEditing(false);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error saving all changes:', error);
      errorToast("Gagal menyimpan dashboard");
    }
  }, [activeTab, dashboards, editDashboardValue, tabItems, tabLayouts, updateTabLayouts, fetchDashboards]);

  // Return all the required state and functions
  return {
    // State
    dashboards,
    activeTab,
    activeDashboardDescription: getDashboardDescription(activeTab, dashboards),
    setActiveTab: updateActiveTab,
    openChartSheet,
    setOpenChartSheet,
    showWidgetForm,
    setShowWidgetForm,
    showEditWidgetForm,
    setShowEditWidgetForm,
    newWidgetData,
    editWidgetData,
    setNewWidgetData,
    setEditWidgetData,
    tabItems,
    setTabItems: setItemsForTab,
    tabLayouts,
    setTabLayouts: setLayoutsForTab,
    openDashboardDialog,
    setOpenDashboardDialog,
    widgetCount,
    setWidgetCount,
    isLoadingWidget,
    setIsLoadingWidget,
    isEditing,
    setIsEditing,
    openDeleteDialog,
    setOpenDeleteDialog,
    dashboardToDelete,
    setDashboardToDelete,
    editDashboardValue,
    setEditDashboardValue,
    devices,
    datastreams,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    
    // Functions
    handleAddDashboard,
    handleEditDashboard,
    handleDeleteDashboard,
    handleSaveEditDashboard,
    saveLayoutToDB,
    addWidget,
    stageWidgetAddition,
    stageLayoutUpdate,
    handleBreakpointChange,
    handleLayoutChange,
    startEditMode,
    cancelEditMode,
    saveAllLayoutChanges,
    
    // Responsive
    isMobile,
    isMedium,
    isTablet,
    isDesktop,
    currentBreakpoint,
  };
}

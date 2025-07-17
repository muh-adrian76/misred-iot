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
  const chartTypes = ['area', 'bar', 'line', 'pie'];
  const controlTypes = ['switch', 'slider'];
  
  if (chartTypes.includes(widgetType)) {
    return {
      minW: 6,    // Minimum 6 columns for charts
      minH: 6,    // Minimum 6 rows for charts  
      maxW: 12,   // Maximum full width
      maxH: 12,   // Maximum height
      isResizable: true
    };
  } else if (controlTypes.includes(widgetType)) {
    return {
      minW: 3,    // Minimum 3 columns for controls
      minH: 3,    // Minimum 3 rows for controls
      maxW: 6,    // Maximum 6 columns for controls
      maxH: 4,    // Maximum 4 rows for controls
      isResizable: true
    };
  }
  
  // Default constraints
  return {
    minW: 4,
    minH: 4,
    maxW: 12,
    maxH: 10,
    isResizable: true
  };
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
  const [layoutKey, setLayoutKey] = useState(0); // For forcing grid re-render

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

  // Debug logging
  // useEffect(() => {
  //   console.log('Dashboard Logic State:', {
  //     isAuthenticated,
  //     user: user?.id,
  //     dashboardsCount: dashboards.length,
  //     activeTab,
  //     widgetCount,
  //     isLoadingWidget,
  //     currentTabItems: activeTab ? Object.keys(tabItems[activeTab] || {}).length : 0,
  //     currentTabLayouts: activeTab ? Object.keys(tabLayouts[activeTab] || {}).length : 0
  //   });
  // }, [isAuthenticated, user, dashboards.length, activeTab, widgetCount, isLoadingWidget, tabItems, tabLayouts]);

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
    // console.log('Dashboard sync effect triggered:', { 
    //   dashboardsLength: dashboards.length, 
    //   widgetsKeys: Object.keys(widgets), 
    //   activeTab 
    // });
    
    if (dashboards.length > 0) {
      const items = {};
      let layouts = {}; // Use let instead of const to allow reassignment safety check
      
      dashboards.forEach((dashboard) => {
        const dashboardWidgets = widgets[dashboard.id] || [];
        // console.log(`Dashboard ${dashboard.id} (${dashboard.description}):`, dashboardWidgets.length, 'widgets');
        
        // Use dashboard ID as key for items
        items[dashboard.id] = dashboardWidgets;
        
        // Generate or parse layouts
        let dashboardLayouts = {};
        
        if (dashboard.layout) {
          try {
            // First parse - might still be a string if double-encoded
            let parsedLayout = typeof dashboard.layout === "string" 
              ? JSON.parse(dashboard.layout) 
              : dashboard.layout;
            
            // Check if it's still a string after first parse (double-encoded case)
            if (typeof parsedLayout === 'string') {
              // console.log('Layout is double-encoded, parsing again');
              parsedLayout = JSON.parse(parsedLayout);
            }
            
            // Final validation - ensure it's an object
            if (typeof parsedLayout === 'object' && parsedLayout !== null) {
              dashboardLayouts = parsedLayout;
            } else {
              console.warn('Dashboard layout is not a valid object after parsing, resetting to empty');
              dashboardLayouts = {};
            }
          } catch (e) {
            console.warn('Failed to parse dashboard layout:', e);
            dashboardLayouts = {};
          }
        }
        
        // Ensure all breakpoints exist and generate missing layouts
        const breakpoints = ['lg', 'md', 'sm', 'xs', 'xxs'];
        const defaultWidths = { lg: 3, md: 4, sm: 6, xs: 12, xxs: 12 };
        
        breakpoints.forEach(bp => {
          // Ensure this breakpoint exists and is an array
          if (!dashboardLayouts[bp] || !Array.isArray(dashboardLayouts[bp])) {
            // If it's a string, try to parse it
            if (typeof dashboardLayouts[bp] === 'string') {
              try {
                dashboardLayouts[bp] = JSON.parse(dashboardLayouts[bp]);
              } catch (e) {
                console.warn(`Failed to parse layout for breakpoint ${bp}:`, e);
                dashboardLayouts[bp] = [];
              }
            } else {
              dashboardLayouts[bp] = [];
            }
          }
          
          // Add missing widgets to layout (only if there are widgets)
          dashboardWidgets.forEach((widget, idx) => {
            const existingLayout = dashboardLayouts[bp].find(item => item.i === widget.id.toString());
            if (!existingLayout) {
              const constraints = getWidgetConstraints(widget.type);
              const w = Math.max(constraints.minW, defaultWidths[bp] || constraints.minW);
              const h = Math.max(constraints.minH, 4);
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
                isResizable: constraints.isResizable
              });
            } else {
              // Apply current constraints and ensure minimum dimensions
              const constraints = getWidgetConstraints(widget.type);
              existingLayout.minW = constraints.minW;
              existingLayout.minH = constraints.minH;
              existingLayout.maxW = constraints.maxW;
              existingLayout.maxH = constraints.maxH;
              existingLayout.isResizable = constraints.isResizable;
              
              // Ensure current dimensions meet minimum requirements
              existingLayout.w = Math.max(constraints.minW, existingLayout.w || constraints.minW);
              existingLayout.h = Math.max(constraints.minH, existingLayout.h || constraints.minH);
            }
          });
          
          // Remove layouts for non-existent widgets
          dashboardLayouts[bp] = dashboardLayouts[bp].filter(layoutItem => 
            dashboardWidgets.some(widget => widget.id.toString() === layoutItem.i)
          );
        });
        
        console.log(`Dashboard ${dashboard.id} processed layouts:`, {
          type: typeof dashboardLayouts,
          breakpoints: Object.keys(dashboardLayouts),
          structure: dashboardLayouts
        });
        
        // Ensure layouts is an object before assignment
        if (typeof layouts !== 'object' || layouts === null) {
          console.error('Layouts object is not valid, resetting');
          layouts = {};
        }
        
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
      // console.log('No dashboards, clearing active tab');
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
      // console.log('Found staged widgets to save:', stagedWidgets);
      
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
      
      // Console simpan widget
      // successToast(`Dashboard berhasil disimpan${widgetCreatedCount > 0 ? ` dengan ${widgetCreatedCount} widget baru` : ''}`);
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
  const handleChartDrop = (chartType, layoutItem) => {
    // When a chart is dropped, show the widget form with the chart type and layout data
    setNewWidgetData({
      chartType,
      layoutItem
    });
    setShowWidgetForm(true);
  };

  const handleAddChart = (chartType) => {
    // Add chart without specific layout - will be placed automatically
    setNewWidgetData({
      chartType,
      layoutItem: null
    });
    setShowWidgetForm(true);
  };

  const handleEditWidget = (widget) => {
    // Open edit form for existing widget
    setEditWidgetData(widget);
    setShowEditWidgetForm(true);
  };

  const stageWidgetRemoval = (widgetId) => {
    // console.log('=== STAGE WIDGET REMOVAL ===');
    // console.log('Widget ID to remove:', widgetId);
    
    // Mark widget for removal (staging mode)
    const dashboardId = activeTab;
    const currentItems = tabItems[dashboardId] || [];
    
    // console.log('Current items before staging removal:', currentItems.map(item => ({
    //   id: item.id,
    //   description: item.description,
    //   isStaged: item.isStaged,
    //   stagedForRemoval: item.stagedForRemoval
    // })));
    
    const updatedItems = currentItems.map(item => {
      if (item.id === widgetId) {
        // console.log(`Marking widget ${widgetId} for removal:`, {
        //   before: { isStaged: item.isStaged, stagedForRemoval: item.stagedForRemoval },
        //   after: { isStaged: item.isStaged || false, stagedForRemoval: true } // Don't change isStaged, only set stagedForRemoval
        // });
        // Only mark for removal, don't change isStaged status
        return { ...item, stagedForRemoval: true };
      }
      return item;
    });
    
    // console.log('Updated items after staging removal:', updatedItems.map(item => ({
    //   id: item.id,
    //   description: item.description,
    //   isStaged: item.isStaged,
    //   stagedForRemoval: item.stagedForRemoval
    // })));
    
    updateTabItems(dashboardId, updatedItems);
    setHasUnsavedChanges(true);
    // console.log('Widget staged for removal successfully');
  };

  const removeWidgetFromDatabase = async (widgetId) => {
    // Remove widget directly from database (non-editing mode)
    try {
      const res = await fetchFromBackend(`/widget/${widgetId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete widget");

      // Refresh dashboard data
      await fetchDashboards();
      
      successToast("Widget berhasil dihapus");
    } catch (error) {
      console.error("Error removing widget:", error);
      errorToast("Gagal menghapus widget");
    }
  };

  const handleWidgetFormSubmit = async (formData) => {
    // Handle new widget form submission
    await stageWidgetAddition(formData);
  };

  const handleEditWidgetFormSubmit = async (formData) => {
    // Handle edit widget form submission - stage changes instead of immediate save
    try {
      // console.log('Staging widget edit with data:', formData);
      
      // Validate required fields
      if (!formData.id) {
        throw new Error('Widget ID is required');
      }
      
      if (!formData.description?.trim()) {
        throw new Error('Widget description is required');
      }
      
      if (!formData.device_id) {
        throw new Error('Device ID is required');
      }
      
      if (!formData.datastream_id) {
        throw new Error('Datastream ID is required');
      }

      // Stage the widget changes in local state
      const dashboardId = activeTab;
      const currentItems = tabItems[dashboardId] || [];
      const currentWidget = currentItems.find(item => item.id === formData.id);
      
      if (!currentWidget) {
        throw new Error('Widget not found in current dashboard');
      }
      
      // Update local state with staged changes
      const updatedItems = currentItems.map(item => 
        item.id === formData.id 
          ? { 
              ...item,
              description: formData.description.trim(),
              device_id: parseInt(formData.device_id),
              datastream_id: parseInt(formData.datastream_id),
              // Mark as having staged edits
              hasEditedChanges: true,
              originalData: {
                description: item.description,
                device_id: item.device_id,
                datastream_id: item.datastream_id
              }
            }
          : item
      );
      
      updateTabItems(dashboardId, updatedItems);
      setHasUnsavedChanges(true);
      
      setShowEditWidgetForm(false);
      setEditWidgetData(null);

      // Toast staging widget sebelum simpan
      // successToast("Perubahan widget disimpan. Klik 'Simpan' untuk menyimpan ke database.");
      
      // console.log('Widget changes staged successfully');
    } catch (error) {
      console.error("Error staging widget edit:", error);
      errorToast(`Gagal menyimpan perubahan widget: ${error.message}`);
    }
  };

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
    
    // Add to layout - either with provided position or auto-positioned
    if (newWidgetData?.layoutItem) {
      await stageLayoutUpdate(tempId, newWidgetData.layoutItem, formData.chartType);
    } else {
      // Auto-position widget with proper constraints
      const constraints = getWidgetConstraints(formData.chartType);
      const autoLayoutItem = {
        x: 0,
        y: Infinity, // Place at bottom
        w: constraints.minW,
        h: constraints.minH
      };
      await stageLayoutUpdate(tempId, autoLayoutItem, formData.chartType);
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
    
    // Ensure dimensions meet minimum requirements
    const finalWidth = Math.max(constraints.minW, layoutItem.w || constraints.minW);
    const finalHeight = Math.max(constraints.minH, layoutItem.h || constraints.minH);
    
    // console.log('Staging layout update:', {
    //   widgetType,
    //   constraints,
    //   originalLayout: layoutItem,
    //   finalDimensions: { w: finalWidth, h: finalHeight }
    // });
    
    breakpoints.forEach(bp => {
      if (!updatedLayouts[bp]) {
        updatedLayouts[bp] = [];
      }
      
      updatedLayouts[bp].push({
        i: widgetId.toString(),
        x: layoutItem.x || 0,
        y: layoutItem.y || 0,
        w: finalWidth,
        h: finalHeight,
        minW: constraints.minW,
        minH: constraints.minH,
        maxW: constraints.maxW,
        maxH: constraints.maxH,
        isResizable: constraints.isResizable
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
    
    // console.log('Layout changed, updating state...');
    
    // Validate and fix layout items to prevent NaN values
    const validatedLayout = layout.map(item => ({
      ...item,
      x: Number.isFinite(item.x) ? item.x : 0,
      y: Number.isFinite(item.y) ? item.y : 0,
      w: Number.isFinite(item.w) && item.w > 0 ? item.w : 6,
      h: Number.isFinite(item.h) && item.h > 0 ? item.h : 4,
      minW: Number.isFinite(item.minW) && item.minW > 0 ? item.minW : 3,
      minH: Number.isFinite(item.minH) && item.minH > 0 ? item.minH : 3,
      maxW: Number.isFinite(item.maxW) && item.maxW > 0 ? item.maxW : 12,
      maxH: Number.isFinite(item.maxH) && item.maxH > 0 ? item.maxH : 12,
    }));

    // Also validate allLayouts
    const validatedAllLayouts = {};
    Object.keys(allLayouts).forEach(breakpoint => {
      validatedAllLayouts[breakpoint] = allLayouts[breakpoint].map(item => ({
        ...item,
        x: Number.isFinite(item.x) ? item.x : 0,
        y: Number.isFinite(item.y) ? item.y : 0,
        w: Number.isFinite(item.w) && item.w > 0 ? item.w : 6,
        h: Number.isFinite(item.h) && item.h > 0 ? item.h : 4,
        minW: Number.isFinite(item.minW) && item.minW > 0 ? item.minW : 3,
        minH: Number.isFinite(item.minH) && item.minH > 0 ? item.minH : 3,
        maxW: Number.isFinite(item.maxW) && item.maxW > 0 ? item.maxW : 12,
        maxH: Number.isFinite(item.maxH) && item.maxH > 0 ? item.maxH : 12,
      }));
    });
    
    updateTabLayouts(activeTab, validatedAllLayouts);
    setHasUnsavedChanges(true);
  }, [activeTab, updateTabLayouts]);

  // Edit mode management
  const startEditMode = useCallback(() => {
    setIsEditing(true);
    setHasUnsavedChanges(false);
    const currentDescription = getDashboardDescription(activeTab, dashboards);
    setEditDashboardValue(currentDescription);
  }, [activeTab, dashboards]);

  const cancelEditMode = useCallback(async () => {
    try {
      // Reset to original state by re-fetching from database
      await fetchDashboards();
      
      // Reset edit state
      setIsEditing(false);
      setHasUnsavedChanges(false);
      setEditDashboardValue("");
      
      // Clear any localStorage dashboard data to force refresh
      clearDashboardData();
      
      // console.log('Edit mode cancelled, data reset to original state');
    } catch (error) {
      console.error('Error cancelling edit mode:', error);
      // Fallback: just reset UI state
      setIsEditing(false);
      setHasUnsavedChanges(false);
      setEditDashboardValue("");
    }
  }, [fetchDashboards, clearDashboardData]);

  // Main save function for all changes
  const saveAllLayoutChanges = useCallback(async () => {
    try {
      // console.log('=== SAVE ALL LAYOUT CHANGES DEBUG ===');
      
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
      
      // console.log('Current items before categorization:', currentItems.map(item => ({
      //   id: item.id,
      //   description: item.description,
      //   isStaged: item.isStaged,
      //   stagedForRemoval: item.stagedForRemoval
      // })));
      
      // Separate widgets into different categories
      const widgetsToAdd = currentItems.filter(widget => widget.isStaged && !widget.stagedForRemoval);
      const widgetsToRemove = currentItems.filter(widget => widget.stagedForRemoval);
      const widgetsToEdit = currentItems.filter(widget => widget.hasEditedChanges && !widget.stagedForRemoval);
      const existingWidgets = currentItems.filter(widget => !widget.isStaged && !widget.stagedForRemoval && !widget.hasEditedChanges);
      
      // console.log('Widget categorization:', {
      //   widgetsToAdd: widgetsToAdd.map(w => ({ id: w.id, description: w.description })),
      //   widgetsToRemove: widgetsToRemove.map(w => ({ id: w.id, description: w.description, isStaged: w.isStaged })),
      //   widgetsToEdit: widgetsToEdit.map(w => ({ id: w.id, description: w.description, hasEditedChanges: w.hasEditedChanges })),
      //   existingWidgets: existingWidgets.map(w => ({ id: w.id, description: w.description })),
      //   total: currentItems.length
      // });
      
      // First: Remove widgets marked for removal
      for (const widget of widgetsToRemove) {
        try {
          // console.log(`Processing widget for removal:`, {
          //   id: widget.id,
          //   isStaged: widget.isStaged,
          //   description: widget.description
          // });
          
          // Only delete if it's not a staged widget (has real database ID)
          if (!widget.isStaged) {
            // console.log(`Deleting widget ${widget.id} from database...`);
            const res = await fetchFromBackend(`/widget/${widget.id}`, {
              method: "DELETE",
            });
            
            if (!res.ok) {
              const errorText = await res.text();
              throw new Error(`Failed to delete widget ${widget.id}: ${res.status} - ${errorText}`);
            }
            // console.log(`Widget ${widget.id} deleted successfully from database`);
          } else {
            // console.log(`Widget ${widget.id} is staged, skipping database deletion`);
          }
        } catch (error) {
          console.error('Error deleting widget:', widget.id, error);
          throw error;
        }
      }
      
      // Second: Update edited widgets
      let widgetEditedCount = 0;
      
      for (const editedWidget of widgetsToEdit) {
        try {
          // console.log(`Processing widget for update:`, {
          //   id: editedWidget.id,
          //   description: editedWidget.description,
          //   hasEditedChanges: editedWidget.hasEditedChanges
          // });
          
          const updatePayload = {
            description: editedWidget.description,
            dashboard_id: parseInt(editedWidget.dashboard_id || dashboardId),
            device_id: parseInt(editedWidget.device_id),
            datastream_id: parseInt(editedWidget.datastream_id),
            type: editedWidget.type,
          };
          
          // console.log(`Updating widget ${editedWidget.id} in database...`, updatePayload);
          const res = await fetchFromBackend(`/widget/${editedWidget.id}`, {
            method: "PUT",
            body: JSON.stringify(updatePayload),
          });
          
          if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Failed to update widget ${editedWidget.id}: ${res.status} - ${errorText}`);
          }
          
          widgetEditedCount++;
          // console.log(`Widget ${editedWidget.id} updated successfully in database`);
        } catch (error) {
          console.error('Error updating widget:', editedWidget.id, error);
          throw error;
        }
      }
      
      // Third: Add new staged widgets
      const widgetIdMapping = {};
      let widgetCreatedCount = 0;
      
      for (const stagedWidget of widgetsToAdd) {
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
          // console.log('Response for widget creation:', newWidget);
          
          // Safety check untuk response structure
          const widgetId = newWidget?.result?.id || newWidget?.id || newWidget?.data?.id;
          if (!widgetId) {
            console.error('Invalid widget response structure:', newWidget);
            throw new Error('Widget ID not found in response');
          }
          
          widgetIdMapping[stagedWidget.id] = widgetId;
          widgetCreatedCount++;
          
          // Trigger onboarding task completion for each widget created
          markWidgetCreated();
          
        } catch (error) {
          console.error('Error saving staged widget:', stagedWidget, error);
          throw error;
        }
      }
      
      // Update layout: remove deleted widgets and update IDs for new widgets
      let finalLayoutData = tabLayouts[dashboardId] || {};
      
      // console.log('Layout data before processing:', {
      //   type: typeof finalLayoutData,
      //   keys: Object.keys(finalLayoutData),
      //   structure: finalLayoutData
      // });
      
      // Ensure finalLayoutData is an object, not a string
      if (typeof finalLayoutData === 'string') {
        try {
          // console.log('Layout data is string, parsing...');
          finalLayoutData = JSON.parse(finalLayoutData);
          
          // Check if it's still a string (double-encoded)
          if (typeof finalLayoutData === 'string') {
            // console.log('Layout data is double-encoded, parsing again...');
            finalLayoutData = JSON.parse(finalLayoutData);
          }
        } catch (e) {
          console.warn('Failed to parse layout data:', e);
          finalLayoutData = {};
        }
      }
      
      // Final validation
      if (typeof finalLayoutData !== 'object' || finalLayoutData === null) {
        console.warn('Layout data is not valid object, resetting to empty');
        finalLayoutData = {};
      }
      
      // Process layouts for all breakpoints
      const updatedLayouts = { ...finalLayoutData };
      const removedWidgetIds = widgetsToRemove.map(w => w.id.toString());
      
      // console.log('Removing widget IDs from layout:', removedWidgetIds);
      
      Object.keys(updatedLayouts).forEach(breakpoint => {
        if (updatedLayouts[breakpoint] && Array.isArray(updatedLayouts[breakpoint])) {
          const originalCount = updatedLayouts[breakpoint].length;
          
          // Remove layouts for deleted widgets
          updatedLayouts[breakpoint] = updatedLayouts[breakpoint].filter(layoutItem => {
            const shouldKeep = !removedWidgetIds.includes(layoutItem.i);
            if (!shouldKeep) {
              // console.log(`Removing layout item for widget ${layoutItem.i} from breakpoint ${breakpoint}`);
            }
            return shouldKeep;
          });
          
          const afterRemovalCount = updatedLayouts[breakpoint].length;
          // console.log(`Breakpoint ${breakpoint}: ${originalCount} -> ${afterRemovalCount} items`);
          
          // Update IDs for new widgets
          updatedLayouts[breakpoint] = updatedLayouts[breakpoint].map(layoutItem => {
            const realId = widgetIdMapping[layoutItem.i];
            if (realId) {
              // console.log(`Updating layout ID: ${layoutItem.i} -> ${realId}`);
              return { ...layoutItem, i: realId.toString() };
            }
            return layoutItem;
          });
        } else {
          console.warn(`Invalid layout structure for breakpoint ${breakpoint}:`, updatedLayouts[breakpoint]);
        }
      });
      
      finalLayoutData = updatedLayouts;
      // console.log('Final layout data after processing:', {
      //   structure: finalLayoutData,
      //   breakpointCounts: Object.keys(finalLayoutData).map(bp => ({
      //     breakpoint: bp,
      //     count: finalLayoutData[bp]?.length || 0
      //   }))
      // });
      
      // Calculate final widget count (existing + edited + new - removed)
      const finalWidgetCount = existingWidgets.length + widgetEditedCount + widgetCreatedCount;
      
      // console.log('Saving dashboard with:', {
      //   description: finalDescription,
      //   widget_count: finalWidgetCount,
      //   layout_string_length: JSON.stringify(finalLayoutData).length
      // });
      
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
      
      // console.log('Dashboard saved successfully to database');
      
      // Clean up local state: remove widgets marked for removal and clean edit flags
      const cleanedItems = existingWidgets.concat(
        // Clean edited widgets - remove edit flags
        widgetsToEdit.map(editedWidget => {
          const { hasEditedChanges, originalData, ...cleanWidget } = editedWidget;
          return cleanWidget;
        }),
        // Process new widgets with real IDs
        widgetsToAdd.map(stagedWidget => {
          const realId = widgetIdMapping[stagedWidget.id];
          if (realId) {
            return { ...stagedWidget, id: realId, isStaged: false };
          }
          return stagedWidget;
        })
      );
      
      // console.log('Cleaned items for local state:', cleanedItems.map(item => ({
      //   id: item.id,
      //   description: item.description,
      //   isStaged: item.isStaged || false,
      //   hasEditedChanges: item.hasEditedChanges || false
      // })));
      
      // Update local state with cleaned data
      // console.log('Updating local state...');
      updateTabItems(dashboardId, cleanedItems);
      updateTabLayouts(dashboardId, finalLayoutData);
      
      // console.log('Local state updated successfully');
      
      // Refresh data to get latest state
      // console.log('Refreshing dashboard data from server...');
      await fetchDashboards();
      
      // console.log('=== SAVE COMPLETED SUCCESSFULLY ===');
      
      // Toast spesifik
      // const actions = [];
      // if (widgetCreatedCount > 0) actions.push(`${widgetCreatedCount} widget baru`);
      // if (widgetEditedCount > 0) actions.push(`${widgetEditedCount} widget diupdate`);
      // if (widgetsToRemove.length > 0) actions.push(`${widgetsToRemove.length} widget dihapus`);
      
      // const message = actions.length > 0 
      //   ? `Dashboard berhasil disimpan dengan ${actions.join(', ')}`
      //   : 'Dashboard berhasil disimpan';
      
      // successToast(message);
      
      successToast('Dashboard berhasil disimpan');
      setIsEditing(false);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('=== ERROR IN SAVE OPERATION ===', error);
      errorToast("Gagal menyimpan dashboard");
    }
  }, [activeTab, dashboards, editDashboardValue, tabItems, tabLayouts, updateTabLayouts, fetchDashboards]);

  // Return all the required state and functions
  return {
    // State
    dashboards,
    activeTab,
    activeDashboardDescription: getDashboardDescription(activeTab, dashboards),
    setActiveTab: updateActiveTab, // This should trigger tab switching correctly
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
    // Current items and layouts for active dashboard
    currentItems: activeTab ? (tabItems[activeTab] || []).filter(item => !item.stagedForRemoval) : [],
    currentLayouts: activeTab ? (tabLayouts[activeTab] || {}) : {},
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
    isAuthenticated, // Add this missing property!
    layoutKey,
    
    // Functions
    handleAddDashboard,
    handleEditDashboard,
    handleDeleteDashboard,
    handleSaveEditDashboard,
    saveLayoutToDB,
    addWidget,
    handleChartDrop,
    handleAddChart,
    handleEditWidget,
    stageWidgetRemoval,
    removeWidgetFromDatabase,
    handleWidgetFormSubmit,
    handleEditWidgetFormSubmit,
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

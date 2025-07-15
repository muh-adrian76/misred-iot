import { useEffect, useState, useCallback } from "react";
import { useUser } from "@/providers/user-provider";
import { useBreakpoint } from "@/hooks/use-mobile";
import { useDashboard } from "@/providers/dashboard-provider";
import { fetchFromBackend } from "@/lib/helper";
import { successToast, errorToast } from "@/components/custom/other/toaster";
import { bootstrapWidths } from "@/lib/dashboard-utils";

// Helper function to get dashboard ID from description
const getDashboardId = (description, dashboards) => {
  const dashboard = dashboards.find(d => d.description === description);
  return dashboard ? dashboard.id : description;
};

// Helper function to get dashboard description from ID
const getDashboardDescription = (id, dashboards) => {
  const dashboard = dashboards.find(d => d.id === id);
  return dashboard ? dashboard.description : id;
};

export function useDashboardLogic() {
  // State
  const [dashboards, setDashboards] = useState([]);
  const [widgets, setWidgets] = useState([]);
  const [tabs, setTabs] = useState([]);
  const [currentBreakpoint, setCurrentBreakpoint] = useState("lg");
  const [layoutKey, setLayoutKey] = useState(0);
  const [openChartSheet, setOpenChartSheet] = useState(false);
  const [openDashboardDialog, setOpenDashboardDialog] = useState(false);
  const [widgetCount, setWidgetCount] = useState(0);
  const [isLoadingWidget, setIsLoadingWidget] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [dashboardToDelete, setDashboardToDelete] = useState(null);
  const [deleteChecked, setDeleteChecked] = useState(false);
  const [editDashboardValue, setEditDashboardValue] = useState("");
  const [showWidgetForm, setShowWidgetForm] = useState(false);
  const [showEditWidgetForm, setShowEditWidgetForm] = useState(false);
  const [newWidgetData, setNewWidgetData] = useState(null);
  const [editWidgetData, setEditWidgetData] = useState(null);
  const [devices, setDevices] = useState([]);
  const [datastreams, setDatastreams] = useState([]);

  // State untuk staging layout changes
  const [originalLayouts, setOriginalLayouts] = useState({});
  const [originalItems, setOriginalItems] = useState({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Dashboard provider
  const {
    tabItems,
    tabLayouts,
    activeTab,
    isInitialized: dashboardProviderInitialized,
    updateTabItems,
    updateTabLayouts,
    updateActiveTab,
    setAllTabItems,
    setAllTabLayouts,
    clearDashboardData,
    saveDashboardBackup,
    loadDashboardBackup,
    removeDashboardBackup,
    clearAllDashboardBackups,
  } = useDashboard();

  // Hooks
  const { isMobile, isMedium, isTablet, isDesktop } = useBreakpoint();
  const { user } = useUser();
  const isAuthenticated = user && user.id; // User dianggap authenticated jika ada user.id

  // Detect dashboard name changes and set unsaved changes flag
  useEffect(() => {
    const currentDescription = getDashboardDescription(activeTab, dashboards);
    if (isEditing && editDashboardValue.trim() && editDashboardValue !== currentDescription) {
      setHasUnsavedChanges(true);
    }
  }, [editDashboardValue, activeTab, dashboards, isEditing]);

  // Fetch dashboards
  const fetchDashboards = useCallback(async () => {
    try {
      const res = await fetchFromBackend("/dashboard", {
        method: "GET",
      });
      if (!res.ok) return;
      const data = await res.json();
      setDashboards(data.result || []);
    } catch {}
  }, [setDashboards]);

  // Fetch widget
  const fetchWidgetCount = useCallback(async (dashboardId) => {
    setIsLoadingWidget(true);
    try {
      const res = await fetchFromBackend(`/widget/dashboard/${dashboardId}`, {
        method: "GET",
      });
      if (!res.ok) return setWidgetCount(0);
      const data = await res.json();
      setWidgetCount(Array.isArray(data.result) ? data.result.length : 0);
    } catch {
      setWidgetCount(0);
    } finally {
      setIsLoadingWidget(false);
    }
  }, []);

  // Fetch widgets by dashboard ID
  const fetchWidgetsByDashboard = useCallback(async (dashboardId) => {
    try {
      const res = await fetchFromBackend(`/widget/dashboard/${dashboardId}`, {
        method: "GET",
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.result || [];
    } catch {
      return [];
    }
  }, []);

  // Fetch device
  const fetchDevices = useCallback(async () => {
    try {
      const res = await fetchFromBackend("/device", { method: "GET" });
      if (!res.ok) return;
      const data = await res.json();
      setDevices(data.result || []);
    } catch {}
  }, []);

  // Fetch datastream
  const fetchDatastreams = useCallback(async () => {
    try {
      const res = await fetchFromBackend("/datastream", { method: "GET" });
      if (!res.ok) return;
      const data = await res.json();
      setDatastreams(data.result || []);
    } catch {}
  }, []);

  // Clear dashboard data saat logout
  useEffect(() => {
    if (!isAuthenticated) {
      clearDashboardData();
      setDashboards([]);
      setWidgets([]);
      setTabs([]);
    }
  }, [isAuthenticated, clearDashboardData, user]);

  // Fetch dashboards dan widgets hanya saat login
  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboards();
      fetchDevices();
      fetchDatastreams();
    }
  }, [isAuthenticated, fetchDashboards, fetchDevices, fetchDatastreams]);

  // Fetch widgets saat dashboard berubah
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

  // Fetch widget count hanya saat tab aktif berubah atau dashboards berubah
  useEffect(() => {
    const dashboard = dashboards.find(
      (d) => d.id === activeTab
    );
    if (dashboard) {
      fetchWidgetCount(dashboard.id);
    }
  }, [activeTab, dashboards, fetchWidgetCount]);

  // Effect: Sync tabs, items, layouts (prioritas data dari database)
  useEffect(() => {
    if (dashboards.length > 0 && Object.keys(widgets).length > 0) {
      setTabs(dashboards.map((d) => d.description)); // Still show description in UI
      const items = {};
      const layouts = {};
      
      dashboards.forEach((dashboard) => {
        const dashboardWidgets = widgets[dashboard.id] || [];
        
        // Set items: list widget untuk dashboard ini (using dashboard ID as key)
        items[dashboard.id] = dashboardWidgets;
        
        // Set layouts: ambil dari dashboard.layout atau generate default
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
        
        // Ensure all breakpoints exist
        const breakpoints = ['lg', 'md', 'sm', 'xs', 'xxs'];
        const bootstrapWidths = { lg: 3, md: 4, sm: 6, xs: 12, xxs: 12 };
        
        breakpoints.forEach(bp => {
          if (!dashboardLayouts[bp]) {
            dashboardLayouts[bp] = [];
          }
          
          // Add missing widgets to layout
          dashboardWidgets.forEach((widget, idx) => {
            const existingLayout = dashboardLayouts[bp].find(item => item.i === widget.id.toString());
            if (!existingLayout) {
              // Get constraints for this widget type
              const constraints = getWidgetConstraints(widget.type);
              
              // Generate default position for missing widget
              const w = Math.max(constraints.minW, bootstrapWidths[bp]);
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
              // Apply constraints to existing layout
              const constraints = getWidgetConstraints(widget.type);
              
              // Ensure existing layout has proper constraints
              existingLayout.minW = constraints.minW;
              existingLayout.minH = constraints.minH;
              existingLayout.maxW = constraints.maxW;
              existingLayout.maxH = constraints.maxH;
              
              // For control widgets, enforce fixed height
              if (constraints.h) {
                existingLayout.h = constraints.h;
              }
            }
          });
          
          // Remove layouts for widgets that no longer exist
          dashboardLayouts[bp] = dashboardLayouts[bp].filter(layoutItem => 
            dashboardWidgets.some(widget => widget.id.toString() === layoutItem.i)
          );
        });
        
        layouts[dashboard.id] = dashboardLayouts; // Use dashboard ID as key
      });
      
      setAllTabItems(items);
      setAllTabLayouts(layouts);
      
      // Check if current activeTab (dashboard ID) still exists
      if (!dashboards.some((d) => d.id === activeTab)) {
        updateActiveTab(dashboards[0].id); // Use dashboard ID
      }
    } else {
      updateActiveTab("");
    }
  }, [dashboards, widgets]); // Hapus function dependencies yang tidak stabil

  // Effect: Fix missing layouts when widgets exist but layouts are empty
  useEffect(() => {
    if (activeTab && tabItems[activeTab] && tabLayouts[activeTab]) {
      const currentItems = tabItems[activeTab];
      const currentLayouts = tabLayouts[activeTab];
      
      // Check if we have widgets but empty layouts
      const hasWidgets = currentItems.length > 0;
      const hasEmptyLayouts = Object.values(currentLayouts).every(layout => layout.length === 0);
      
      if (hasWidgets && hasEmptyLayouts) {
        // Generate layouts for existing widgets
        const breakpoints = ['lg', 'md', 'sm', 'xs', 'xxs'];
        const bootstrapWidths = { lg: 3, md: 4, sm: 6, xs: 12, xxs: 12 };
        const newLayouts = {};
        
        breakpoints.forEach(bp => {
          newLayouts[bp] = [];
          
          currentItems.forEach((widget, idx) => {
            const w = bootstrapWidths[bp];
            const cols = 12;
            const x = (idx * w) % cols;
            const y = Math.floor(idx / (cols / w)) * 4;
            
            newLayouts[bp].push({
              i: widget.id.toString(),
              x,
              y,
              w,
              h: 4,
              resizeHandles: ['sw', 'nw', 'se', 'ne']
            });
          });
        });
        
        // Update layouts
        updateTabLayouts(activeTab, newLayouts);
      }
    }
  }, [activeTab, tabItems, tabLayouts]); // Hapus updateTabLayouts function dependency

  // CRUD Handlers
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
      setDashboards((prev) => [...prev, { id, name: description }]);
      successToast("Dashboard berhasil dibuat");
      await fetchDashboards();
      setTimeout(() => {
        const newDashboard = dashboards.find(
          (d) => d.id === id || d.description === description
        );
        if (newDashboard) {
          updateActiveTab(newDashboard.id); // Use dashboard ID
          fetchWidgetCount(newDashboard.id);
        } else {
          updateActiveTab(""); // Empty if not found
        }
      }, 100);
      return id;
    } catch (error) {
      errorToast("Gagal membuat dashboard");
      throw error;
    }
  };

  const handleEditDashboard = async (newDescription) => {
    const dashboard = dashboards.find((d) => d.id === activeTab); // activeTab is now dashboard ID
    if (!dashboard) return;
    try {
      // Get dashboard ID for data access
      const dashboardId = activeTab; // activeTab is already dashboard ID
      
      const res = await fetchFromBackend(`/dashboard/${dashboard.id}`, {
        method: "PUT",
        body: JSON.stringify({ 
          description: newDescription,
          widget_count: (tabItems[dashboardId] || []).length,
          layout: JSON.stringify(tabLayouts[dashboardId] || {})
        }),
      });
      if (!res.ok) {
        const errorData = await res.text();
        console.error('Backend response error:', errorData);
        throw new Error("Gagal mengubah nama dashboard");
      }
      await fetchDashboards();
      // Keep activeTab as dashboard ID, don't change it
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
      setTimeout(() => {
        if (dashboards.length > 1) {
          const next = dashboards.find((d) => d.id !== dashboardToDelete.id);
          updateActiveTab(next?.id || ""); // Use dashboard ID
        } else {
          updateActiveTab("");
        }
      }, 100);
    } catch (error) {
      errorToast("Gagal menghapus dashboard");
    } finally {
      setIsEditing(false);
    }
  };

  const handleSaveEditDashboard = async () => {
    try {
      const dashboard = dashboards.find((d) => d.id === activeTab); // activeTab is now dashboard ID
      if (!dashboard) {
        errorToast("Dashboard tidak ditemukan");
        return;
      }

      // Tentukan nama dashboard yang akan digunakan
      const currentDescription = getDashboardDescription(activeTab, dashboards);
      const finalDescription = (editDashboardValue.trim() && editDashboardValue !== currentDescription) 
        ? editDashboardValue.trim() 
        : dashboard.description;

      // Simpan layout dan nama dashboard sekaligus dalam satu request
      await saveLayoutToDB(finalDescription);
      
      // activeTab remains the same (dashboard ID), no need to update
      
      // Refresh data dashboard
      await fetchDashboards();
      
      successToast("Dashboard berhasil disimpan");
    } catch (error) {
      console.error('Error saving dashboard:', error);
      errorToast("Gagal menyimpan dashboard");
    } finally {
      setIsEditing(false);
    }
  };

  // Save layout to database
  const saveLayoutToDB = async (customDescription = null) => {
    const dashboard = dashboards.find((d) => d.id === activeTab); // activeTab is now dashboard ID
    if (!dashboard) {
      console.warn('Dashboard not found for activeTab:', activeTab);
      return;
    }

    try {
      const dashboardId = activeTab; // activeTab is dashboard ID
      const layoutData = tabLayouts[dashboardId] || {};
      const description = customDescription || dashboard.description;
      
      console.log('Saving layout to database:', {
        dashboardId: dashboard.id,
        activeTab,
        description,
        layoutData,
        widgetCount: (tabItems[dashboardId] || []).length
      });
      
      const response = await fetchFromBackend(`/dashboard/${dashboard.id}`, {
        method: "PUT",
        body: JSON.stringify({
          description: description,
          widget_count: (tabItems[dashboardId] || []).length,
          layout: JSON.stringify(layoutData),
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Backend response error:', errorData);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error saving layout:', error);
      errorToast("Gagal menyimpan layout");
      throw error; // Re-throw untuk error handling di parent
    }
  };

  const handleAddChart = async (tab, chartType, dashboardId) => {
    try {
      const res = await fetchFromBackend("/widget", {
        method: "POST",
        body: JSON.stringify({
          description: `${chartType} chart`,
          dashboard_id: dashboardId,
          device_id: 1, // Default device
          datastream_id: 1, // Default datastream
          type: chartType,
        }),
      });
      if (!res.ok) throw new Error("Gagal menambahkan widget");
      
      // Refresh dashboards and widgets to get updated data
      await fetchDashboards();
    } catch (error) {
      console.error('Error adding widget:', error);
      errorToast("Gagal menambahkan widget");
    }
  };

  const setItemsForTab = (items) => {
    const dashboardId = getDashboardId(activeTab, dashboards);
    updateTabItems(dashboardId, items);
  };
  
  const setLayoutsForTab = (layouts) => {
    const dashboardId = getDashboardId(activeTab, dashboards);
    updateTabLayouts(dashboardId, layouts);
  };

  // Handle breakpoint change
  const handleBreakpointChange = useCallback((breakpoint) => {
    setCurrentBreakpoint(breakpoint);
  }, []);

  // Handle layout change with staging (save to localStorage only)
  const handleLayoutChange = useCallback(async (layout, allLayouts) => {
    if (!activeTab) return;
    
    console.log('Layout changed, saving to localStorage staging...');
    
    // Update local state immediately for responsiveness
    updateTabLayouts(activeTab, allLayouts);
    
    // Mark as having unsaved changes
    setHasUnsavedChanges(true);
    
    // Save to localStorage staging area (not database yet)
    // Database save will happen when user clicks "Simpan"
    console.log('Layout changes staged in localStorage');
  }, [activeTab, updateTabLayouts]);

  // Function to save both layout changes and dashboard name to database
  const saveAllLayoutChanges = useCallback(async () => {
    console.log('Saving all layout changes and dashboard name to database...');
    
    try {
      // Get all dashboards that need to be updated
      const dashboardsToUpdate = [];
      
      for (const tabName of Object.keys(tabLayouts)) {
        const dashboard = dashboards.find(d => d.description === tabName);
        if (dashboard) {
          const newLayout = tabLayouts[tabName];
          
          // Validate layout data
          if (!newLayout || typeof newLayout !== 'object') {
            console.warn(`Invalid layout for dashboard ${dashboard.id}:`, newLayout);
            continue;
          }
          
          // Clean and validate layout structure
          const cleanLayout = {};
          Object.keys(newLayout).forEach(breakpoint => {
            if (Array.isArray(newLayout[breakpoint])) {
              cleanLayout[breakpoint] = newLayout[breakpoint].map(item => ({
                i: item.i,
                x: Number(item.x) || 0,
                y: Number(item.y) || 0,
                w: Number(item.w) || 4,
                h: Number(item.h) || 4,
                minW: Number(item.minW) || undefined,
                minH: Number(item.minH) || undefined,
                maxW: Number(item.maxW) || undefined,
                maxH: Number(item.maxH) || undefined,
              }));
            }
          });
          
          // Determine the dashboard name - use editDashboardValue if it's the active tab and has been changed
          const finalDescription = (tabName === activeTab && editDashboardValue.trim() && editDashboardValue !== activeTab) 
            ? editDashboardValue.trim() 
            : dashboard.description;
          
          dashboardsToUpdate.push({
            id: dashboard.id,
            originalDescription: dashboard.description,
            description: finalDescription,
            widget_count: (tabItems[tabName] || []).length,
            layout: JSON.stringify(cleanLayout)
          });
        }
      }
      
      console.log('Dashboards to update:', dashboardsToUpdate);
      
      // Check if any dashboard name has changed
      let dashboardNameChanged = false;
      let newActiveTabName = activeTab;
      
      // Update each dashboard layout in database
      const updatePromises = dashboardsToUpdate.map(async (dashboard) => {
        console.log(`Updating dashboard ${dashboard.id} with layout and name:`, {
          oldName: dashboard.originalDescription,
          newName: dashboard.description,
          layout: dashboard.layout
        });
        
        const res = await fetchFromBackend(`/dashboard/${dashboard.id}`, {
          method: "PUT",
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            description: dashboard.description,
            widget_count: dashboard.widget_count,
            layout: dashboard.layout
          }),
        });
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error(`Failed to update dashboard ${dashboard.id}:`, {
            status: res.status,
            statusText: res.statusText,
            errorText
          });
          throw new Error(`Failed to update dashboard ${dashboard.id}: ${res.status} ${res.statusText} - ${errorText}`);
        }
        
        // Check if this is the active dashboard and its name changed
        if (dashboard.originalDescription === activeTab && dashboard.description !== dashboard.originalDescription) {
          dashboardNameChanged = true;
          newActiveTabName = dashboard.description;
        }
        
        console.log(`Successfully updated dashboard ${dashboard.id}`);
        return res;
      });
      
      await Promise.all(updatePromises);
      
      console.log('All layouts and dashboard names saved to database successfully');
      
      // Now save all widget changes to database
      await saveAllWidgetChanges();
      
      // Update active tab if dashboard name changed
      if (dashboardNameChanged) {
        updateActiveTab(newActiveTabName);
      }
      
      // Refresh dashboards to get updated data
      await fetchDashboards();
      
      // Clear backup and unsaved changes
      const dashboard = dashboards.find((d) => d.description === activeTab);
      if (dashboard) {
        removeDashboardBackup(dashboard.id);
      }
      setHasUnsavedChanges(false);
      setOriginalLayouts({});
      setOriginalItems({});
      setIsEditing(false);
      
      successToast("Dashboard berhasil disimpan");
      
    } catch (error) {
      console.error('Error saving layouts and dashboard names:', error);
      
      // Show more detailed error message
      const errorMessage = error.message || "Gagal menyimpan dashboard";
      errorToast(errorMessage);
      
      // Don't exit edit mode if save failed
      // User can try again or cancel
    }
  }, [activeTab, editDashboardValue, tabLayouts, dashboards, tabItems, setHasUnsavedChanges, setOriginalLayouts, setIsEditing, updateActiveTab, fetchDashboards]);

  // Function to save all widget changes to database
  const saveAllWidgetChanges = useCallback(async () => {
    console.log('Saving all widget changes to database...');
    
    try {
      // Compare current items with original items to find changes
      const originalItemsData = originalItems[activeTab] || [];
      const currentItemsData = tabItems[activeTab] || [];
      
      // Find widgets to add (exist in current but not in original)
      const widgetsToAdd = currentItemsData.filter(currentWidget => 
        !originalItemsData.some(originalWidget => originalWidget.id === currentWidget.id)
      );
      
      // Find widgets to delete (exist in original but not in current)
      const widgetsToDelete = originalItemsData.filter(originalWidget => 
        !currentItemsData.some(currentWidget => currentWidget.id === originalWidget.id)
      );
      
      // Find widgets to update (exist in both but different data)
      const widgetsToUpdate = currentItemsData.filter(currentWidget => {
        const originalWidget = originalItemsData.find(orig => orig.id === currentWidget.id);
        if (!originalWidget) return false;
        
        // Compare relevant properties
        return JSON.stringify(originalWidget) !== JSON.stringify(currentWidget);
      });
      
      console.log('Widget changes detected:', {
        toAdd: widgetsToAdd.length,
        toDelete: widgetsToDelete.length,
        toUpdate: widgetsToUpdate.length
      });
      
      // Add new widgets
      for (const widget of widgetsToAdd) {
        console.log('Adding widget to database:', widget);
        const res = await fetchFromBackend('/widget', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(widget),
        });
        
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Failed to add widget: ${res.status} - ${errorText}`);
        }
      }
      
      // Delete removed widgets  
      for (const widget of widgetsToDelete) {
        console.log('Deleting widget from database:', widget.id);
        const res = await fetchFromBackend(`/widget/${widget.id}`, {
          method: 'DELETE',
        });
        
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Failed to delete widget ${widget.id}: ${res.status} - ${errorText}`);
        }
      }
      
      // Update modified widgets
      for (const widget of widgetsToUpdate) {
        console.log('Updating widget in database:', widget.id);
        const res = await fetchFromBackend(`/widget/${widget.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(widget),
        });
        
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Failed to update widget ${widget.id}: ${res.status} - ${errorText}`);
        }
      }
      
      console.log('All widget changes saved to database successfully');
      
    } catch (error) {
      console.error('Error saving widget changes:', error);
      throw error; // Re-throw to be handled by calling function
    }
  }, [activeTab, originalItems, tabItems]);

  // Function to find available position for new widget
  const findAvailablePositionForWidget = (chartType) => {
    console.log('Finding available position for widget type:', chartType);
    
    const constraints = getWidgetConstraints(chartType);
    const currentLayouts = tabLayouts[activeTab] || {};
    
    // Use current breakpoint from the grid layout or default to lg
    const currentBreakpoint = 'lg'; // We'll use lg as reference for positioning
    const existingItems = currentLayouts[currentBreakpoint] || [];
    
    const gridCols = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };
    const maxCols = gridCols[currentBreakpoint];
    
    // Widget dimensions based on constraints and breakpoint
    const widgetWidth = Math.min(constraints.minW || 4, maxCols);
    const widgetHeight = constraints.h || constraints.minH || 4;
    
    console.log('Widget dimensions:', { width: widgetWidth, height: widgetHeight });
    console.log('Existing items:', existingItems);
    console.log('Max columns for', currentBreakpoint, ':', maxCols);
    
    // Try to find position row by row
    for (let y = 0; y < 50; y++) { // Max 50 rows to prevent infinite loop
      for (let x = 0; x <= maxCols - widgetWidth; x++) {
        const candidatePosition = {
          x: x,
          y: y,
          w: widgetWidth,
          h: widgetHeight
        };
        
        // Check if this position collides with any existing widget
        const hasCollision = existingItems.some(item => {
          return (
            candidatePosition.x < item.x + item.w &&
            candidatePosition.x + candidatePosition.w > item.x &&
            candidatePosition.y < item.y + item.h &&
            candidatePosition.y + candidatePosition.h > item.y
          );
        });
        
        if (!hasCollision) {
          console.log('Found available position:', candidatePosition);
          return candidatePosition;
        }
      }
    }
    
    // If no position found, place at bottom
    const maxY = existingItems.length > 0 
      ? Math.max(...existingItems.map(item => item.y + item.h))
      : 0;
    
    const fallbackPosition = {
      x: 0,
      y: maxY,
      w: widgetWidth,
      h: widgetHeight
    };
    
    console.log('No available position found, using fallback:', fallbackPosition);
    return fallbackPosition;
  };

  // Function to get widget constraints based on type
  const getWidgetConstraints = (widgetType) => {
    const chartTypes = ['area', 'bar', 'line', 'pie'];
    const controlTypes = ['switch', 'slider'];
    
    if (chartTypes.includes(widgetType)) {
      return {
        minW: 6,
        minH: 6,
        maxW: 12,
        maxH: 12,
        isResizable: true
      };
    } else if (controlTypes.includes(widgetType)) {
      return {
        h: 4,        // Fixed height
        minW: 4,     // Minimum width
        minH: 4,     // Fixed minimum height  
        maxW: 12,    // Maximum width
        maxH: 4,     // Fixed maximum height (same as minH for fixed height)
        isResizable: true
      };
    }
    
    // Default constraints
    return {
      minW: 3,
      minH: 3,
      maxW: 12,
      maxH: 10,
      isResizable: true
    };
  };

  // Function to update dashboard layout with new widget position
  const updateDashboardLayoutWithNewWidget = async (dashboardId, widgetId, layoutItem, widgetType) => {
    try {
      console.log('=== updateDashboardLayoutWithNewWidget ===');
      console.log('dashboardId:', dashboardId);
      console.log('widgetId:', widgetId);
      console.log('layoutItem received:', layoutItem);
      console.log('widgetType:', widgetType);
      
      // Get widget constraints
      const constraints = getWidgetConstraints(widgetType);
      console.log('Widget constraints:', constraints);
      
      // Get current dashboard
      const dashboard = dashboards.find(d => d.id === dashboardId);
      if (!dashboard) {
        console.error('Dashboard not found:', dashboardId);
        return;
      }
      
      // Parse current layout
      let currentLayout = {};
      if (dashboard.layout) {
        try {
          currentLayout = typeof dashboard.layout === "string" 
            ? JSON.parse(dashboard.layout) 
            : dashboard.layout;
        } catch (e) {
          console.warn('Failed to parse current layout:', e);
          currentLayout = {};
        }
      }
      
      // Apply widget constraints to layout item
      const cleanLayoutItem = {
        x: Math.max(0, Math.floor(layoutItem.x || 0)),
        y: Math.max(0, Math.floor(layoutItem.y || 0)),
        w: Math.max(constraints.minW, Math.min(constraints.maxW, layoutItem.w || constraints.minW)),
        h: constraints.h || Math.max(constraints.minH, Math.min(constraints.maxH, layoutItem.h || constraints.minH))
      };
      
      console.log('Cleaned layout item with constraints:', cleanLayoutItem);
      
      // Create layout item for new widget following official documentation
      const newLayoutItem = {
        i: widgetId.toString(),
        ...cleanLayoutItem,
        minW: constraints.minW,
        minH: constraints.minH,
        maxW: constraints.maxW,
        maxH: constraints.maxH,
      };
      
      console.log('Final newLayoutItem:', newLayoutItem);
      
      // Add to all breakpoints with responsive widths
      const breakpoints = ['lg', 'md', 'sm', 'xs', 'xxs'];
      const bootstrapWidths = { lg: 3, md: 4, sm: 6, xs: 12, xxs: 12 };
      
      breakpoints.forEach(bp => {
        if (!currentLayout[bp]) {
          currentLayout[bp] = [];
        }
        
        // Create layout item for this breakpoint - keep position but adjust width
        const bpLayoutItem = {
          ...newLayoutItem,
          w: Math.min(bootstrapWidths[bp], newLayoutItem.w) // Responsif tapi tidak lebih besar dari bootstrap width
        };
        
        // Pastikan x position tidak melebihi kolom yang tersedia
        const maxCols = { lg: 12, md: 12, sm: 12, xs: 12, xxs: 12 }[bp];
        if (bpLayoutItem.x + bpLayoutItem.w > maxCols) {
          bpLayoutItem.x = Math.max(0, maxCols - bpLayoutItem.w);
        }
        
        console.log(`Adding to ${bp}:`, bpLayoutItem);
        currentLayout[bp].push(bpLayoutItem);
      });
      
      console.log('Updated complete layout:', currentLayout);
      
      // Save updated layout to database
      const res = await fetchFromBackend(`/dashboard/${dashboardId}`, {
        method: "PUT",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: dashboard.description,
          widget_count: (tabItems[dashboard.description] || []).length,
          layout: JSON.stringify(currentLayout)
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.text();
        throw new Error(`Failed to update dashboard layout: ${errorData}`);
      }
      
      console.log('Dashboard layout updated successfully');
      
    } catch (error) {
      console.error('Error updating dashboard layout:', error);
    }
  };

  // Handler untuk drag and drop dari widget box
  const handleChartDrop = (chartType, layoutItem) => {
    console.log('=== handleChartDrop called ===');
    console.log('chartType:', chartType);
    console.log('layoutItem received:', layoutItem);
    
    const dashboard = dashboards.find((d) => d.description === activeTab);
    
    setNewWidgetData({
      chartType,
      layoutItem, // Posisi drop dari react-grid-layout
      dashboard_id: dashboard?.id || "",
    });
    setShowWidgetForm(true);
    
    console.log('newWidgetData will be set to:', {
      chartType,
      layoutItem,
      dashboard_id: dashboard?.id || "",
    });
  };

  // Handler submit form
  const handleWidgetFormSubmit = async (formData) => {
    setShowWidgetForm(false);
    
    console.log('=== handleWidgetFormSubmit ===');
    console.log('formData:', formData);
    console.log('newWidgetData:', newWidgetData);
    console.log('isEditing:', isEditing);

    try {
      if (isEditing) {
        // In edit mode: Stage the widget creation (don't save to database yet)
        await stageWidgetCreation(formData);
      } else {
        // Not in edit mode: Save directly to database (original behavior)
        await createWidgetInDatabase(formData);
      }
    } catch (error) {
      console.error('Error in handleWidgetFormSubmit:', error);
      errorToast("Gagal menambahkan widget");
    } finally {
      setNewWidgetData(null);
    }
  };

  // Function to stage widget creation (edit mode)
  const stageWidgetCreation = async (formData) => {
    console.log('Staging widget creation...');
    
    // Generate temporary ID for staging
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Get widget constraints for default positioning
    const constraints = getWidgetConstraints(formData.chartType);
    
    // Create staged widget object
    const stagedWidget = {
      id: tempId,
      description: formData.description,
      dashboard_id: formData.dashboard_id,
      device_id: formData.device_id,
      datastream_id: formData.datastream_id,
      type: formData.chartType,
      isStaged: true, // Mark as staged
    };
    
    console.log('Staged widget:', stagedWidget);
    
    // Get dashboard ID from activeTab (which is description)
    const dashboardId = getDashboardId(activeTab, dashboards);
    
    // Add to current tab items
    const currentItems = tabItems[dashboardId] || [];
    const updatedItems = [...currentItems, stagedWidget];
    updateTabItems(dashboardId, updatedItems);
    
    // If there's layout position, add to layout too
    if (newWidgetData?.layoutItem) {
      await stageLayoutUpdate(tempId, newWidgetData.layoutItem, formData.chartType);
    } else {
      // If no specific position, find available position
      console.log('No layout position specified, finding available position');
      const availablePosition = findAvailablePositionForWidget(formData.chartType);
      await stageLayoutUpdate(tempId, availablePosition, formData.chartType);
    }
    
    // Mark as having unsaved changes
    setHasUnsavedChanges(true);
  };

  // Function to create widget in database (non-edit mode) 
  const createWidgetInDatabase = async (formData) => {
    console.log('Creating widget in database...');
    
    // Buat widget baru dengan informasi posisi
    const widgetPayload = {
      description: formData.description,
      dashboard_id: formData.dashboard_id,
      device_id: formData.device_id,
      datastream_id: formData.datastream_id,
      type: formData.chartType,
    };
    
    console.log('Creating widget with payload:', widgetPayload);
    
    const res = await fetchFromBackend("/widget", {
      method: "POST",
      body: JSON.stringify(widgetPayload),
    });
    if (!res.ok) throw new Error("Gagal menambahkan widget");

    const newWidget = await res.json();
    console.log('Widget created:', newWidget);
    
    // Jika ada layoutItem (posisi drop), update layout dashboard
    if (newWidgetData?.layoutItem && newWidget.result?.id) {
      await updateDashboardLayoutWithNewWidget(
        formData.dashboard_id, 
        newWidget.result.id, 
        newWidgetData.layoutItem,
        formData.chartType // Pass chart type for constraints
      );
    }

    // Refresh data setelah menambah widget
    await Promise.all([
      fetchDashboards(),
      fetchWidgetsByDashboard(formData.dashboard_id)
    ]);
  };

  // Function to stage layout update
  const stageLayoutUpdate = async (widgetId, layoutItem, chartType) => {
    console.log('Staging layout update for widget:', widgetId);
    
    const constraints = getWidgetConstraints(chartType);
    
    // Apply widget constraints to layout item
    const cleanLayoutItem = {
      i: widgetId.toString(),
      x: Math.max(0, Math.floor(layoutItem.x || 0)),
      y: Math.max(0, Math.floor(layoutItem.y || 0)),
      w: Math.max(constraints.minW, Math.min(constraints.maxW, layoutItem.w || constraints.minW)),
      h: constraints.h || Math.max(constraints.minH, Math.min(constraints.maxH, layoutItem.h || constraints.minH)),
      minW: constraints.minW,
      minH: constraints.minH,
      maxW: constraints.maxW,
      maxH: constraints.maxH,
    };
    
    // Get dashboard ID from activeTab (which is description)
    const dashboardId = getDashboardId(activeTab, dashboards);
    
    // Update layouts for all breakpoints
    const currentLayouts = tabLayouts[dashboardId] || {};
    const updatedLayouts = { ...currentLayouts };
    
    Object.keys(bootstrapWidths).forEach(breakpoint => {
      if (!updatedLayouts[breakpoint]) {
        updatedLayouts[breakpoint] = [];
      }
      updatedLayouts[breakpoint] = [...updatedLayouts[breakpoint], cleanLayoutItem];
    });
    
    updateTabLayouts(dashboardId, updatedLayouts);
    console.log('Layout staged for widget:', widgetId);
  };

  // Handler untuk membuka form edit widget
  const handleEditWidget = (widget) => {
    console.log('Opening edit widget form for:', widget);
    setEditWidgetData(widget);
    setShowEditWidgetForm(true);
  };

  // Handler submit form edit widget
  const handleEditWidgetFormSubmit = async (formData) => {
    setShowEditWidgetForm(false);
    
    console.log('=== handleEditWidgetFormSubmit ===');
    console.log('formData:', formData);
    console.log('editWidgetData:', editWidgetData);
    console.log('isEditing:', isEditing);

    try {
      if (isEditing) {
        // In edit mode: Stage the widget update (don't save to database yet)
        await stageWidgetUpdate(formData);
      } else {
        // Not in edit mode: Update directly to database (original behavior)
        await updateWidgetInDatabase(formData);
      }
    } catch (error) {
      console.error('Error in handleEditWidgetFormSubmit:', error);
      errorToast("Gagal mengubah widget");
    } finally {
      setEditWidgetData(null);
    }
  };

  // Function to stage widget update (edit mode)
  const stageWidgetUpdate = async (formData) => {
    console.log('Staging widget update...');
    
    const updatedWidget = {
      ...editWidgetData,
      description: formData.description,
      device_id: formData.device_id,
      datastream_id: formData.datastream_id,
      // Note: type cannot be changed in edit mode
      isStaged: true, // Mark as staged
    };
    
    console.log('Updated widget:', updatedWidget);
    
    // Get dashboard ID from activeTab (which is description)
    const dashboardId = getDashboardId(activeTab, dashboards);
    
    // Update in current tab items
    const currentItems = tabItems[dashboardId] || [];
    const updatedItems = currentItems.map(item => 
      item.id === editWidgetData.id ? updatedWidget : item
    );
    updateTabItems(dashboardId, updatedItems);
    
    // Mark as having unsaved changes
    setHasUnsavedChanges(true);
    
    successToast("Widget diubah (belum tersimpan)");
  };

  // Function to update widget in database (non-edit mode)
  const updateWidgetInDatabase = async (formData) => {
    console.log('Updating widget in database...');
    
    const widgetPayload = {
      description: formData.description,
      device_id: formData.device_id,
      datastream_id: formData.datastream_id,
      // Note: type cannot be changed in edit mode
    };
    
    console.log('Updating widget with payload:', widgetPayload);
    
    const res = await fetchFromBackend(`/widget/${editWidgetData.id}`, {
      method: "PUT",
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(widgetPayload),
    });
    
    if (!res.ok) throw new Error("Gagal mengubah widget");

    // Refresh data setelah mengubah widget
    await Promise.all([
      fetchDashboards(),
      fetchWidgetsByDashboard(editWidgetData.dashboard_id)
    ]);
  };

  // Function to start edit mode and backup current state
  const startEditMode = useCallback(() => {
    console.log('Starting edit mode...');
    
    // Create backup of current state using dashboard ID
    const dashboard = dashboards.find((d) => d.id === activeTab); // activeTab is now dashboard ID
    if (dashboard) {
      const backupData = {
        layouts: tabLayouts,
        items: tabItems,
        timestamp: Date.now(),
      };
      saveDashboardBackup(dashboard.id, backupData);
      console.log(`Backup saved for dashboard ID: ${dashboard.id}`);
    }
    
    // Store original state for comparison
    setOriginalLayouts(tabLayouts);
    setOriginalItems(tabItems);
    setIsEditing(true);
    setHasUnsavedChanges(false);
  }, [activeTab, dashboards, tabLayouts, tabItems, saveDashboardBackup, setOriginalLayouts, setOriginalItems, setIsEditing, setHasUnsavedChanges]);

  // Function to cancel edit mode and restore from backup
  const cancelEditMode = useCallback(() => {
    console.log('Canceling edit mode...');
    
    // Restore from backup using dashboard ID
    const dashboard = dashboards.find((d) => d.id === activeTab); // activeTab is now dashboard ID
    if (dashboard) {
      const backupData = loadDashboardBackup(dashboard.id);
      if (backupData) {
        console.log('Restoring from backup:', backupData);
        setAllTabLayouts(backupData.layouts || {});
        setAllTabItems(backupData.items || {});
        removeDashboardBackup(dashboard.id);
        console.log(`Backup restored and removed for dashboard ID: ${dashboard.id}`);
      }
    }
    
    // Reset edit state
    setIsEditing(false);
    setHasUnsavedChanges(false);
    setOriginalLayouts({});
    setOriginalItems({});
    
    successToast("Perubahan dibatalkan");
  }, [activeTab, dashboards, loadDashboardBackup, removeDashboardBackup, setAllTabLayouts, setAllTabItems, setIsEditing, setHasUnsavedChanges, setOriginalLayouts, setOriginalItems]);

  // Function to stage widget removal (edit mode)
  const stageWidgetRemoval = useCallback((widgetId) => {
    console.log('Staging widget removal:', widgetId);
    
    // Get dashboard ID from activeTab (which is description)
    const dashboardId = getDashboardId(activeTab, dashboards);
    
    // Remove from current tab items
    const currentItems = tabItems[dashboardId] || [];
    const updatedItems = currentItems.filter(item => item.id !== widgetId);
    updateTabItems(dashboardId, updatedItems);
    
    // Remove from current tab layouts
    const currentLayouts = tabLayouts[dashboardId] || {};
    const updatedLayouts = { ...currentLayouts };
    Object.keys(updatedLayouts).forEach((bp) => {
      updatedLayouts[bp] = updatedLayouts[bp].filter(
        (item) => item.i !== widgetId.toString()
      );
    });
    updateTabLayouts(dashboardId, updatedLayouts);
    
    // Mark as having unsaved changes
    setHasUnsavedChanges(true);
    
    successToast("Widget dihapus (belum tersimpan)");
  }, [activeTab, dashboards, tabItems, tabLayouts, updateTabItems, updateTabLayouts, setHasUnsavedChanges]);

  // Function to remove widget from database (non-edit mode)
  const removeWidgetFromDatabase = useCallback(async (widgetId) => {
    console.log('Removing widget from database:', widgetId);
    
    try {
      const res = await fetchFromBackend(`/widget/${widgetId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete widget");

      // Get dashboard ID from activeTab (which is description)
      const dashboardId = getDashboardId(activeTab, dashboards);

      // Remove from current tab items
      const currentItems = tabItems[dashboardId] || [];
      const updatedItems = currentItems.filter(item => item.id !== widgetId);
      updateTabItems(dashboardId, updatedItems);

      // Remove from current tab layouts
      const currentLayouts = tabLayouts[dashboardId] || {};
      const updatedLayouts = { ...currentLayouts };
      Object.keys(updatedLayouts).forEach((bp) => {
        updatedLayouts[bp] = updatedLayouts[bp].filter(
          (item) => item.i !== widgetId.toString()
        );
      });
      updateTabLayouts(dashboardId, updatedLayouts);
      
      successToast("Widget berhasil dihapus");
    } catch (error) {
      console.error("Error removing widget:", error);
      errorToast("Gagal menghapus widget");
    }
  }, [activeTab, dashboards, tabItems, tabLayouts, updateTabItems, updateTabLayouts]);

  // Return all state & handler
  return {
    // state
    tabs,
    setTabs,
    activeTab, // This is now dashboard ID
    activeDashboardDescription: getDashboardDescription(activeTab, dashboards), // Helper for UI
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
    tabItems,
    setTabItems: setAllTabItems,
    tabLayouts,
    setTabLayouts: setAllTabLayouts,
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
    deleteChecked,
    setDeleteChecked,
    editDashboardValue,
    setEditDashboardValue,
    isMobile,
    isMedium,
    isTablet,
    isDesktop,
    isAuthenticated,
    dashboards,
    setDashboards,
    widgets,
    devices,
    datastreams,
    currentBreakpoint,
    setCurrentBreakpoint,
    layoutKey,
    setLayoutKey,

    // handler
    handleAddDashboard,
    handleEditDashboard,
    handleDeleteDashboard,
    handleSaveEditDashboard,
    handleChartDrop,
    handleWidgetFormSubmit,
    handleAddChart,
    handleBreakpointChange,
    handleLayoutChange,
    saveLayoutToDB,
    setItemsForTab,
    setLayoutsForTab,
    
    // New staging functions
    startEditMode,
    cancelEditMode,
    saveAllLayoutChanges,
    saveAllWidgetChanges,
    hasUnsavedChanges,
    stageWidgetRemoval,
    removeWidgetFromDatabase,
    handleEditWidget,
    handleEditWidgetFormSubmit,
  };
}

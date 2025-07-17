"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

const DashboardContext = createContext();

export function DashboardProvider({ children }) {
  const [dashboardData, setDashboardData] = useState({
    tabItems: {},
    tabLayouts: {},
    activeTab: "",
  });
  
  // Tambahkan state untuk melacak apakah sudah initialized
  const [isInitialized, setIsInitialized] = useState(false);

  // Load dashboard data from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("dashboard-data");
      if (stored) {
        const parsed = JSON.parse(stored);
        // console.log('Loaded dashboard data from localStorage:', parsed);
        
        // Validate the structure
        if (parsed && typeof parsed === 'object' && 
            parsed.tabItems && typeof parsed.tabItems === 'object' &&
            parsed.tabLayouts && typeof parsed.tabLayouts === 'object') {
          
          // Additional validation for tabLayouts - ensure no nested strings
          const validatedData = {
            ...parsed,
            tabLayouts: {}
          };
          
          Object.keys(parsed.tabLayouts).forEach(dashboardId => {
            const layout = parsed.tabLayouts[dashboardId];
            if (typeof layout === 'object' && layout !== null) {
              validatedData.tabLayouts[dashboardId] = layout;
            } else {
              console.warn(`Skipping invalid layout for dashboard ${dashboardId}:`, layout);
              validatedData.tabLayouts[dashboardId] = {};
            }
          });
          
          setDashboardData(validatedData);
        } else {
          console.warn('Invalid localStorage data structure, clearing');
          localStorage.removeItem("dashboard-data");
        }
      }
    } catch (error) {
      console.warn("Failed to load dashboard data from localStorage:", error);
      localStorage.removeItem("dashboard-data");
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Save dashboard data to localStorage whenever it changes (hanya setelah initialized)
  useEffect(() => {
    if (isInitialized) {
      try {
        // Only save if data is not empty or if we're clearing it
        const hasData = Object.keys(dashboardData.tabItems).length > 0 || 
                       Object.keys(dashboardData.tabLayouts).length > 0 || 
                       dashboardData.activeTab;
        
        if (hasData) {
          // console.log('Saving dashboard data to localStorage:', dashboardData);
          localStorage.setItem("dashboard-data", JSON.stringify(dashboardData));
        } else {
          // Remove from localStorage if no data
          localStorage.removeItem("dashboard-data");
        }
      } catch (error) {
        console.warn("Failed to save dashboard data to localStorage:", error);
      }
    }
  }, [dashboardData.tabItems, dashboardData.tabLayouts, dashboardData.activeTab, isInitialized]);

  const updateTabItems = useCallback((dashboardId, items) => {
    // console.log('DashboardProvider.updateTabItems called:', {
    //   dashboardId,
    //   itemCount: items.length,
    //   items: items.map(item => ({
    //     id: item.id,
    //     description: item.description,
    //     isStaged: item.isStaged,
    //     stagedForRemoval: item.stagedForRemoval
    //   }))
    // });
    
    setDashboardData(prev => {
      // Check if the items are actually different
      const currentItems = prev.tabItems[dashboardId];
      if (JSON.stringify(currentItems) === JSON.stringify(items)) {
        // console.log('DashboardProvider.updateTabItems: No change detected, skipping update');
        return prev; // No change, don't trigger re-render
      }
      
      // console.log('DashboardProvider.updateTabItems: Changes detected, updating state');
      return {
        ...prev,
        tabItems: {
          ...prev.tabItems,
          [dashboardId]: items
        }
      };
    });
  }, []);

  const updateTabLayouts = useCallback((dashboardId, layouts) => {
    // console.log('updateTabLayouts called:', { dashboardId, layouts, type: typeof layouts });
    
    // Validate layouts parameter
    if (typeof layouts !== 'object' || layouts === null) {
      console.warn('Invalid layouts provided to updateTabLayouts:', layouts);
      return;
    }
    
    setDashboardData(prev => {
      // Check if the layouts are actually different
      const currentLayouts = prev.tabLayouts[dashboardId];
      if (JSON.stringify(currentLayouts) === JSON.stringify(layouts)) {
        return prev; // No change, don't trigger re-render
      }
      
      return {
        ...prev,
        tabLayouts: {
          ...prev.tabLayouts,
          [dashboardId]: layouts
        }
      };
    });
  }, []);

  const updateActiveTab = useCallback((dashboardId) => {
    // console.log('DashboardProvider: Updating active tab from', dashboardData.activeTab, 'to', dashboardId);
    setDashboardData(prev => {
      if (prev.activeTab === dashboardId) {
        // console.log('DashboardProvider: No change in active tab, skipping update');
        return prev; // No change, don't trigger re-render
      }
      
      // console.log('DashboardProvider: Active tab changed, updating state');
      return {
        ...prev,
        activeTab: dashboardId
      };
    });
  }, [dashboardData.activeTab]);

  const setAllTabItems = useCallback((items) => {
    setDashboardData(prev => {
      // Check if the items are actually different
      if (JSON.stringify(prev.tabItems) === JSON.stringify(items)) {
        return prev; // No change, don't trigger re-render
      }
      
      return {
        ...prev,
        tabItems: items
      };
    });
  }, []);

  const setAllTabLayouts = useCallback((layouts) => {
    // console.log('setAllTabLayouts called with:', { layouts, type: typeof layouts });
    
    // Ensure layouts is a valid object
    if (typeof layouts !== 'object' || layouts === null) {
      console.warn('Invalid layouts provided to setAllTabLayouts:', layouts);
      return;
    }
    
    // Validate each dashboard layout
    const validatedLayouts = {};
    Object.keys(layouts).forEach(dashboardId => {
      const dashboardLayout = layouts[dashboardId];
      if (typeof dashboardLayout === 'object' && dashboardLayout !== null) {
        validatedLayouts[dashboardId] = dashboardLayout;
      } else {
        console.warn(`Invalid layout for dashboard ${dashboardId}:`, dashboardLayout);
        validatedLayouts[dashboardId] = {};
      }
    });
    
    setDashboardData(prev => {
      // Check if the layouts are actually different
      if (JSON.stringify(prev.tabLayouts) === JSON.stringify(validatedLayouts)) {
        return prev; // No change, don't trigger re-render
      }
      
      return {
        ...prev,
        tabLayouts: validatedLayouts
      };
    });
  }, []);

  const clearDashboardData = useCallback(() => {
    // Remove from localStorage first
    localStorage.removeItem("dashboard-data");
    // console.log('Cleared dashboard data from localStorage');
    
    // Then clear the state - this should only trigger if state is not already empty
    setDashboardData(prev => {
      const isEmpty = Object.keys(prev.tabItems).length === 0 && 
                     Object.keys(prev.tabLayouts).length === 0 && 
                     !prev.activeTab;
      
      if (isEmpty) {
        return prev; // Don't trigger re-render if already empty
      }
      
      return {
        tabItems: {},
        tabLayouts: {},
        activeTab: "",
      };
    });
  }, []);

  // New functions for dashboard ID-based localStorage management
  const saveDashboardBackup = useCallback((dashboardId, layoutData) => {
    try {
      const key = `dashboard_backup_${dashboardId}`;
      localStorage.setItem(key, JSON.stringify(layoutData));
    } catch (error) {
      console.warn("Failed to save dashboard backup:", error);
    }
  }, []);

  const loadDashboardBackup = useCallback((dashboardId) => {
    try {
      const key = `dashboard_backup_${dashboardId}`;
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.warn("Failed to load dashboard backup:", error);
      return null;
    }
  }, []);

  const removeDashboardBackup = useCallback((dashboardId) => {
    try {
      const key = `dashboard_backup_${dashboardId}`;
      localStorage.removeItem(key);
    } catch (error) {
      console.warn("Failed to remove dashboard backup:", error);
    }
  }, []);

  const clearAllDashboardBackups = useCallback(() => {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('dashboard_backup_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn("Failed to clear dashboard backups:", error);
    }
  }, []);

  const value = {
    tabItems: dashboardData.tabItems,
    tabLayouts: dashboardData.tabLayouts,
    activeTab: dashboardData.activeTab,
    isInitialized,
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
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}

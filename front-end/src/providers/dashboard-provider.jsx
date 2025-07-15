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
        setDashboardData(parsed);
      }
    } catch (error) {
      console.warn("Failed to load dashboard data from localStorage:", error);
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
    setDashboardData(prev => {
      // Check if the items are actually different
      const currentItems = prev.tabItems[dashboardId];
      if (JSON.stringify(currentItems) === JSON.stringify(items)) {
        return prev; // No change, don't trigger re-render
      }
      
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
    setDashboardData(prev => {
      if (prev.activeTab === dashboardId) {
        return prev; // No change, don't trigger re-render
      }
      
      return {
        ...prev,
        activeTab: dashboardId
      };
    });
  }, []);

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
    setDashboardData(prev => {
      // Check if the layouts are actually different
      if (JSON.stringify(prev.tabLayouts) === JSON.stringify(layouts)) {
        return prev; // No change, don't trigger re-render
      }
      
      return {
        ...prev,
        tabLayouts: layouts
      };
    });
  }, []);

  const clearDashboardData = useCallback(() => {
    // Remove from localStorage first
    localStorage.removeItem("dashboard-data");
    
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

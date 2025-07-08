import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useBreakpoint } from "@/hooks/use-mobile";
import { fetchFromBackend } from "@/lib/helper";
import { successToast, errorToast } from "@/components/custom/other/toaster";

export function useDashboardLogic() {
  // State
  const [dashboards, setDashboards] = useState([]);
  const [widgets, setWidgets] = useState({});
  const [tabs, setTabs] = useState([]);
  const [activeTab, setActiveTab] = useState("");
  const [openChartSheet, setOpenChartSheet] = useState(false);
  const [tabItems, setTabItems] = useState({});
  const [tabLayouts, setTabLayouts] = useState({});
  const [openDashboardDialog, setOpenDashboardDialog] = useState(false);
  const [widgetCount, setWidgetCount] = useState(0);
  const [isLoadingWidget, setIsLoadingWidget] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [dashboardToDelete, setDashboardToDelete] = useState(null);
  const [deleteChecked, setDeleteChecked] = useState(false);
  const [editDashboardValue, setEditDashboardValue] = useState("");
  const [showWidgetForm, setShowWidgetForm] = useState(false);
  const [newWidgetData, setNewWidgetData] = useState(null);
  const [devices, setDevices] = useState([]);
  const [datastreams, setDatastreams] = useState([]);

  // Hooks
  const { isMobile, isTablet, isDesktop } = useBreakpoint();
  const isAuthenticated = useAuth();

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

  // Fetch dashboards hanya saat login
  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboards();
      fetchDevices();
      fetchDatastreams();
    }
  }, [isAuthenticated, fetchDashboards, fetchDevices, fetchDatastreams]);

  // Fetch widget count hanya saat tab aktif berubah atau dashboards berubah
  useEffect(() => {
    const dashboard = dashboards.find(
      (d) => d.description === activeTab || d.name === activeTab
    );
    if (dashboard) {
      fetchWidgetCount(dashboard.id);
    }
  }, [activeTab, dashboards, fetchWidgetCount]);

  // Effect: Sync tabs, items, layouts
  useEffect(() => {
    if (dashboards.length > 0) {
      setTabs(dashboards.map((d) => d.description));
      const items = {};
      const layouts = {};
      dashboards.forEach((dashboard) => {
        const dashboardWidgets = widgets[dashboard.id] || [];
        items[dashboard.description] = dashboardWidgets.map((widget) => ({
          id: widget.id,
          type: widget.chart_type,
          description: widget.description,
        }));
        layouts[dashboard.description] = dashboardWidgets.map((widget, idx) => {
          // Ambil w dan h dari layout jika ada, fallback ke default
          let w = 6,
            h = 4,
            x = idx % 3,
            y = Math.floor(idx / 3);
          if (widget.layout) {
            try {
              const layoutObj =
                typeof widget.layout === "string"
                  ? JSON.parse(widget.layout)
                  : widget.layout;
              w = layoutObj.w || w;
              h = layoutObj.h || h;
              x = layoutObj.x ?? x;
              y = layoutObj.y ?? y;
            } catch {}
          }
          return {
            i: widget.id,
            x,
            y,
            w,
            h,
          };
        });
      });
      setTabItems(items);
      setTabLayouts(layouts);
      if (!dashboards.some((d) => d.description === activeTab)) {
        setActiveTab(dashboards[0].description);
      }
    } else {
      setActiveTab("");
    }
  }, [dashboards, widgets]);

  // CRUD Handlers
  const createDashboard = async (description) => {
    if (!description.trim()) {
      errorToast("Nama dashboard tidak boleh kosong");
      return null;
    }
    try {
      const res = await fetchFromBackend("/dashboard", {
        method: "POST",
        body: JSON.stringify({ description }),
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
          setActiveTab(newDashboard.description);
          fetchWidgetCount(newDashboard.id);
        } else {
          setActiveTab(description);
        }
      }, 100);
      return id;
    } catch (error) {
      errorToast("Gagal membuat dashboard");
      throw error;
    }
  };

  const handleEditDashboard = async (newDescription) => {
    const dashboard = dashboards.find((d) => d.description === activeTab);
    if (!dashboard) return;
    try {
      const res = await fetchFromBackend(`/dashboard/${dashboard.id}`, {
        method: "PUT",
        body: JSON.stringify({ description: newDescription }),
      });
      if (!res.ok) throw new Error("Gagal mengubah nama dashboard");
      await fetchDashboards();
      setActiveTab(newDescription);
    } catch (error) {
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
          setActiveTab(next?.description || "");
        } else {
          setActiveTab("");
        }
      }, 100);
    } catch (error) {
      errorToast("Gagal menghapus dashboard");
    } finally {
      setIsEditing(false);
    }
  };

  const handleSaveEditDashboard = async () => {
    if (!editDashboardValue.trim() || editDashboardValue === activeTab) {
      setIsEditing(false);
      return;
    }
    await handleEditDashboard(editDashboardValue);
    setIsEditing(false);
    successToast("Berhasil mengubah dashboard");
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
      const res = await fetchFromBackend("/widget", {
        method: "POST",
        body: JSON.stringify({
          description: `${chartType} chart`,
          device_id: null,
          sensor_type: chartType,
          dashboard_id: dashboardId,
        }),
      });
      if (!res.ok) throw new Error("Gagal menambahkan widget");
      const { id: widgetId } = await res.json();
      if (!tabs.includes(tab)) setTabs((prev) => [...prev, tab]);
      setActiveTab(tab);
      setTabItems((prev) => ({
        ...prev,
        [tab]: [...(prev[tab] || []), { id: widgetId, type: chartType }],
      }));
      setTabLayouts((prev) => ({
        ...prev,
        [tab]: [...(prev[tab] || []), defaultLayoutItem],
      }));
      successToast(
        `${chartType.toUpperCase()} Berhasil menambahkan chart ke "${tab}" tab`
      );
      fetchWidgetCount(dashboardId);
    } catch (error) {
      errorToast("Gagal menambahkan chart");
    }
  };

  const setItemsForTab = (items) => {
    setTabItems((prev) => ({ ...prev, [activeTab]: items }));
  };
  const setLayoutsForTab = (layouts) => {
    setTabLayouts((prev) => ({ ...prev, [activeTab]: layouts }));
  };

  // Handler untuk SwapyDragArea
  const handleChartDrop = (chartType, layoutItem) => {
    const dashboard = dashboards.find((d) => d.description === activeTab);
    setNewWidgetData({
      chartType,
      layoutItem,
      dashboard_id: dashboard?.id || "",
    });
    setShowWidgetForm(true);
  };

  // Handler submit form
  const handleWidgetFormSubmit = async (formData) => {
    setShowWidgetForm(false);
    setNewWidgetData(null);

    try {
      const res = await fetchFromBackend("/widget", {
        method: "POST",
        body: JSON.stringify({
          description: formData.description,
          dashboard_id: formData.dashboard_id,
          device_id: formData.device_id,
          datastream_id: formData.datastream_id,
          chart_type: formData.chartType,
          layout: formData.layout,
        }),
      });
      if (!res.ok) throw new Error("Gagal menambahkan widget");
      const { id: widgetId } = await res.json();

      // Update state frontend
      const tab = activeTab;
      const chartType = formData.chartType;
      const defaultLayoutItem = formData.layout || {
        i: widgetId,
        x: 0,
        y: Infinity,
        w: 3,
        h: 2,
      };

      setTabItems((prev) => ({
        ...prev,
        [tab]: [...(prev[tab] || []), { id: widgetId, type: chartType }],
      }));
      setTabLayouts((prev) => ({
        ...prev,
        [tab]: [...(prev[tab] || []), defaultLayoutItem],
      }));

      fetchWidgetCount(formData.dashboard_id);
    } catch (error) {
      errorToast("Gagal menambahkan widget");
    }
  };

  // Return all state & handler
  return {
    // state
    tabs,
    setTabs,
    activeTab,
    setActiveTab,
    openChartSheet,
    setOpenChartSheet,
    showWidgetForm,
    setShowWidgetForm,
    newWidgetData,
    setNewWidgetData,
    tabItems,
    setTabItems,
    tabLayouts,
    setTabLayouts,
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
    isAuthenticated,
    dashboards,
    setDashboards,
    widgets,
    devices,
    datastreams,

    // handler
    createDashboard,
    handleEditDashboard,
    handleDeleteDashboard,
    handleSaveEditDashboard,
    handleChartDrop,
    handleWidgetFormSubmit,
    handleAddChart,
    setItemsForTab,
    setLayoutsForTab,
  };
}

"use client";
import { fetchFromBackend } from "@/lib/helper";
import { useState, useEffect } from "react";

export function useDashboard() {
  const [dashboards, setDashboards] = useState([]);
  const [widgets, setWidgets] = useState({});

  useEffect(() => {
    const fetchDashboardsAndWidgets = async () => {
      try {
        const dashboardRes = await fetchFromBackend("/dashboard", {
          method: "GET",
          credentials: "include",
        });
        const dashboardData = await dashboardRes.json();

        const widgetData = {};
        for (const dashboard of dashboardData.result) {
          const widgetRes = await fetchFromBackend(`/widget/dashboard/${dashboard.id}`, {
            method: "GET",
            credentials: "include",
          });
          const widgetResData = await widgetRes.json();
          widgetData[dashboard.id] = widgetResData.result;
        }

        setDashboards(dashboardData.result);
        setWidgets(widgetData);
      } catch (error) {
        console.error("Error fetching dashboards and widgets:", error);
      }
    };

    fetchDashboardsAndWidgets();
  }, []);

  return { dashboards, widgets, setDashboards };
}
import React from "react";
import { useWidgetData } from "@/hooks/use-widget-data";
import { Loader2, WifiOff, AlertCircle } from "lucide-react";
import StatusGaugeChart from "./gauge";

// Wrapper component untuk StatusGaugeChart yang terintegrasi dengan dashboard system
export const GaugeWidget = ({
  widget,
  timeRange = "1h",
  dataCount = 100,
  filterType = "latest",
  className = "",
  ...props
}) => {
  // Get pairs dari widget inputs
  const pairs = widget?.inputs?.map(input => ({
    device_id: input.device_id,
    datastream_id: input.datastream_id
  })) || [];

  // Hook untuk mengambil data widget dari server
  const { 
    data, 
    isLoading, 
    error, 
    isConnected 
  } = useWidgetData(widget, timeRange, dataCount, filterType, pairs);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[200px]">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-sm">Loading sensor data...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-full min-h-[200px]">
        <div className="flex flex-col items-center gap-2 text-red-500">
          <AlertCircle className="h-6 w-6" />
          <span className="text-sm text-center">
            Error loading data: {error.message}
          </span>
        </div>
      </div>
    );
  }

  // No connection state
  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-full min-h-[200px]">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <WifiOff className="h-6 w-6" />
          <span className="text-sm">No connection</span>
        </div>
      </div>
    );
  }

  // No data state
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[200px]">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <AlertCircle className="h-6 w-6" />
          <span className="text-sm">No data available</span>
        </div>
      </div>
    );
  }

  // Get the latest value from the data
  const latestData = data[data.length - 1];
  const value = latestData ? parseFloat(latestData.value) || 0 : 0;

  // Get widget configuration
  const config = widget.config || {};
  
  // Default ranges if not configured
  const defaultRanges = [
    { min: 0, max: 25, label: "Low", color: "#ef4444", status: "critical" },
    { min: 25, max: 50, label: "Medium", color: "#f97316", status: "warning" },
    { min: 50, max: 75, label: "High", color: "#eab308", status: "ok" },
    { min: 75, max: 100, label: "Very High", color: "#22c55e", status: "excellent" },
  ];

  // Get sensor information for title
  const sensorInfo = pairs[0];
  const title = widget.description || "Sensor Reading";

  return (
    <StatusGaugeChart
      value={value}
      total={config.maxValue || 100}
      title={title}
      unit={config.unit || ""}
      size={config.size || 240}
      strokeWidth={config.strokeWidth || 12}
      ranges={config.ranges || defaultRanges}
      animated={config.animated !== undefined ? config.animated : true}
      animationDuration={config.animationDuration || 2000}
      glowEffect={config.glowEffect !== undefined ? config.glowEffect : true}
      className={className}
      {...props}
    />
  );
};

export default GaugeWidget;

import React from "react";
import { useWidgetData } from "@/hooks/use-widget-data";
import { Loader2, WifiOff, AlertCircle } from "lucide-react";
import TextWidget from "./text";

// Wrapper component untuk TextWidget yang terintegrasi dengan dashboard system
export const TextWidgetWrapper = ({
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
      <div className="flex items-center justify-center h-full min-h-[120px]">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-xs">Loading...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-full min-h-[120px]">
        <div className="flex flex-col items-center gap-2 text-red-500">
          <AlertCircle className="h-5 w-5" />
          <span className="text-xs text-center">
            Error: {error.message}
          </span>
        </div>
      </div>
    );
  }

  // No connection state
  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-full min-h-[120px]">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <WifiOff className="h-5 w-5" />
          <span className="text-xs">No connection</span>
        </div>
      </div>
    );
  }

  // No data state
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[120px]">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <AlertCircle className="h-5 w-5" />
          <span className="text-xs">No data</span>
        </div>
      </div>
    );
  }

  // Get the latest value from the data
  const latestData = data[data.length - 1];
  const value = latestData ? parseFloat(latestData.value) || 0 : 0;

  // Get widget configuration
  const config = widget.config || {};

  // Get sensor information for title
  const sensorInfo = pairs[0];
  const title = widget.description || "Sensor Value";

  return (
    <TextWidget
      value={value}
      title={title}
      unit={config.unit || ""}
      threshold={config.threshold}
      accentColor={config.accentColor || "#3b82f6"}
      size={config.size || "medium"}
      animated={config.animated !== undefined ? config.animated : true}
      className={className}
      {...props}
    />
  );
};

export default TextWidgetWrapper;

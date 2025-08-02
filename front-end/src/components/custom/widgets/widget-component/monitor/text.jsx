import React, { useState, useEffect } from "react";
import { useWidgetData } from "@/hooks/use-widget-data";
import { Loader2, WifiOff, AlertCircle, Activity, TrendingUp, TrendingDown, Minus } from "lucide-react";

// Text Widget UI Component (merged from /components/ui/text-widget.jsx)
const TextWidget = ({
  title = "Sensor Reading",
  value = "0",
  unit = "",
  icon: CustomIcon = Activity,
  maxValue = 100,
  thresholds = [25, 50, 75, 100],
  precision = 0,
  trend = null,
  className = "",
  accentColor = "blue"
}) => {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  const formatValue = (val) => {
    const numVal = parseFloat(val);
    return isNaN(numVal) ? val : numVal.toFixed(precision);
  };

  const getProgress = () => {
    return Math.min((parseFloat(value) / maxValue) * 100, 100);
  };

  const getTrendIcon = () => {
    switch (trend) {
      case "up": 
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case "down": 
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      case "stable": 
        return <Minus className="w-4 h-4 text-gray-500" />;
      default: 
        return null;
    }
  };

  const getActiveThresholds = () => {
    const currentValue = parseFloat(value);
    return thresholds.map(threshold => currentValue >= threshold);
  };

  const activeThresholds = getActiveThresholds();

  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'bg-blue-100 text-blue-600',
      progress: 'stroke-blue-500',
      active: 'bg-blue-500',
      inactive: 'bg-gray-200'
    },
    green: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: 'bg-green-100 text-green-600',
      progress: 'stroke-green-500',
      active: 'bg-green-500',
      inactive: 'bg-gray-200'
    },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      icon: 'bg-purple-100 text-purple-600',
      progress: 'stroke-purple-500',
      active: 'bg-purple-500',
      inactive: 'bg-gray-200'
    },
    orange: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      icon: 'bg-orange-100 text-orange-600',
      progress: 'stroke-orange-500',
      active: 'bg-orange-500',
      inactive: 'bg-gray-200'
    }
  };

  const colors = colorClasses[accentColor] || colorClasses.blue;

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${colors.icon}`}>
            <CustomIcon className="w-5 h-5" />
          </div>
          <span className="text-gray-700 font-medium text-base">{title}</span>
        </div>
        {trend && (
          <div className="flex items-center">
            {getTrendIcon()}
          </div>
        )}
      </div>

      {/* Main Value */}
      <div className="flex-1 flex flex-col justify-center items-center mb-6">
        <div className="text-center mb-4">
          <div className="text-gray-500 text-xs mb-2 uppercase tracking-wider font-medium">
            Current Reading
          </div>
          <div className="text-gray-900 font-bold text-5xl">
            {formatValue(displayValue)}
          </div>
          {unit && (
            <div className="text-gray-600 text-lg font-medium mt-1">
              {unit}
            </div>
          )}
        </div>
      </div>

      {/* Threshold Indicators */}
      <div className="space-y-2">
        <div className="flex justify-between text-gray-500 text-xs font-medium">
          {thresholds.map((threshold, index) => (
            <span key={index}>{threshold}</span>
          ))}
        </div>
        <div className="flex gap-1">
          {thresholds.map((threshold, index) => (
            <div
              key={index}
              className={`
                flex-1 h-2 rounded-full transition-all duration-300
                ${activeThresholds[index] ? colors.active : colors.inactive}
              `}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// Wrapper component untuk TextWidget yang terintegrasi dengan dashboard system
export const TextWidgetWrapper = ({
  previewMode = false,
  widget,
  timeRange = "1h",
  dataCount = 100,
  filterType = "latest",
  className = "",
  ...props
}) => {
  // Preview mode dengan data dummy
  if (previewMode) {
    // Return hanya konten teks sederhana untuk preview
    return (
      <div className="flex flex-col items-center justify-center h-full w-full p-4">
        <div className="text-center">
          <div className="text-3xl font-bold text-gray-900 mb-1">
            25.6
          </div>
          <div className="text-sm text-gray-600 mb-2">
            °C
          </div>
          <div className="text-xs text-gray-500">
            Temperature
          </div>
        </div>
      </div>
    );
  }

  // Safety check
  if (!widget) {
    return (
      <div className="h-full w-full min-h-[120px] flex items-center justify-center bg-muted/30 rounded-lg">
        <div className="text-center space-y-2">
          <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">Widget tidak tersedia</p>
        </div>
      </div>
    );
  }
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

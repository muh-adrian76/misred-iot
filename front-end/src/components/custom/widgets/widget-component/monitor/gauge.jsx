import React, { useState, useEffect } from "react";
import { useWidgetData } from "@/hooks/use-widget-data";
import { Loader2, WifiOff, AlertCircle } from "lucide-react";

// Gauge UI Component (merged from /components/ui/gauge.jsx)
const StatusGaugeChart = ({
  // Data props
  value = 0,
  total = 100,
  title = "Sensor Reading",
  unit = "",
  
  // Visual props
  size = 240,
  strokeWidth = 12,
  ranges = [
    { min: 0, max: 25, label: "Low", color: "#ef4444", status: "critical" },
    { min: 25, max: 50, label: "Medium", color: "#f97316", status: "warning" },
    { min: 50, max: 75, label: "High", color: "#eab308", status: "ok" },
    { min: 75, max: 100, label: "Very High", color: "#22c55e", status: "excellent" },
  ],
  
  // Animation props
  animated = true,
  animationDuration = 2000,
  glowEffect = true,
  
  // Widget props for integration
  className = "",
}) => {
  const [animatedValue, setAnimatedValue] = useState(0);
  const [currentRange, setCurrentRange] = useState(null);

  useEffect(() => {
    // Find current range based on percentage
    const percentage = Math.min((parseFloat(value) / total) * 100, 100);
    const range = ranges.find((r) => percentage >= r.min && percentage <= r.max);
    setCurrentRange(range);

    if (animated) {
      const startTime = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / animationDuration, 1);

        // Smooth easing animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentValue = value * easeOutQuart;

        setAnimatedValue(currentValue);

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      requestAnimationFrame(animate);
    } else {
      setAnimatedValue(value);
    }
  }, [value, animated, animationDuration, ranges, total]);

  const center = size / 2;
  const radius = (size - strokeWidth - 40) / 2;
  const circumference = 2 * Math.PI * radius;
  const startAngle = -140; // Start from top-left
  const endAngle = 140; // End at top-right
  const totalAngle = endAngle - startAngle;
  const progress = Math.min(animatedValue / total, 1);

  // Calculate stroke dash array for progress
  const progressLength = (totalAngle / 360) * circumference * progress;
  const totalLength = (totalAngle / 360) * circumference;

  // Create gradient stops based on ranges
  const createGradientStops = () => {
    return ranges.map((range, index) => {
      const position = ((range.min + range.max) / 2) * 0.8; // Adjust for better gradient
      return (
        <stop key={index} offset={`${position}%`} stopColor={range.color} />
      );
    });
  };

  // Convert angle to coordinates
  const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  // Create SVG path for the arc
  const createArcPath = (centerX, centerY, radius, startAngle, endAngle) => {
    const start = polarToCartesian(centerX, centerY, radius, endAngle);
    const end = polarToCartesian(centerX, centerY, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    return [
      "M",
      start.x,
      start.y,
      "A",
      radius,
      radius,
      0,
      largeArcFlag,
      0,
      end.x,
      end.y,
    ].join(" ");
  };

  const backgroundPath = createArcPath(
    center,
    center,
    radius,
    startAngle,
    endAngle
  );

  const gradientId = `gradient-${Math.random().toString(36).substr(2, 9)}`;
  const glowId = `glow-${Math.random().toString(36).substr(2, 9)}`;

  // Get status info
  const getStatusInfo = () => {
    if (!currentRange) return { label: "Unknown", color: "#64748b" };
    return {
      label: currentRange.label,
      color: currentRange.color,
      status: currentRange.status,
    };
  };

  const statusInfo = getStatusInfo();

  // Format value display
  const formatValue = (val) => {
    const numVal = parseFloat(val);
    return isNaN(numVal) ? "0" : numVal.toFixed(1);
  };

  return (
    <div className="relative flex items-center justify-center w-full h-full">
      <svg
        width={size}
        height={size}
        className="absolute inset-0"
        style={{ transform: "rotate(-90deg)" }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            {createGradientStops()}
          </linearGradient>
          {glowEffect && (
            <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          )}
        </defs>

        {/* Background track */}
        <path
          d={backgroundPath}
          fill="none"
          stroke="rgba(148, 163, 184, 0.2)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          transform={`translate(10, 10)`}
        />

        {/* Progress arc */}
        <path
          d={backgroundPath}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${progressLength} ${totalLength}`}
          filter={glowEffect ? `url(#${glowId})` : undefined}
          transform={`translate(10, 10)`}
          style={{
            transition: animated ? "none" : "stroke-dasharray 0.5s ease",
          }}
        />

        {/* Value indicator dot */}
        {progress > 0 && (
          <circle
            cx={
              polarToCartesian(
                center,
                center,
                radius,
                startAngle + totalAngle * progress
              ).x
            }
            cy={
              polarToCartesian(
                center,
                center,
                radius,
                startAngle + totalAngle * progress
              ).y
            }
            r="6"
            fill="white"
            stroke={statusInfo.color}
            strokeWidth="2"
            filter={glowEffect ? `url(#${glowId})` : undefined}
          />
        )}
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
        <div className="text-2xl md:text-3xl font-bold mb-1">
          {formatValue(animatedValue)}
          {unit && <span className="text-sm md:text-lg ml-1">{unit}</span>}
        </div>
        <div className="text-xs mb-2 text-center px-2">{title}</div>
        <div
          className="px-2 py-1 rounded-full text-xs font-medium"
          style={{
            backgroundColor: `${statusInfo.color}20`,
            color: statusInfo.color,
            border: `1px solid ${statusInfo.color}40`,
          }}
        >
          {statusInfo.label}
        </div>
      </div>
    </div>
  );
};

// Wrapper component untuk StatusGaugeChart yang terintegrasi dengan dashboard system
export const GaugeWidget = ({
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
    const previewConfig = {
      maxValue: 100,
      unit: "°C",
      size: 200,
      strokeWidth: 10,
      ranges: [
        { min: 0, max: 25, label: "Low", color: "#ef4444", status: "critical" },
        { min: 25, max: 50, label: "Medium", color: "#f97316", status: "warning" },
        { min: 50, max: 75, label: "High", color: "#eab308", status: "ok" },
        { min: 75, max: 100, label: "Very High", color: "#22c55e", status: "excellent" },
      ],
      animated: true,
      animationDuration: 1500,
      glowEffect: true,
    };

    // Return hanya gauge component tanpa wrapper tambahan
    return (
      <StatusGaugeChart
        value={87}
        total={previewConfig.maxValue}
        title="Temperature"
        unit={previewConfig.unit}
        size={previewConfig.size}
        strokeWidth={previewConfig.strokeWidth}
        ranges={previewConfig.ranges}
        animated={previewConfig.animated}
        animationDuration={previewConfig.animationDuration}
        glowEffect={previewConfig.glowEffect}
        className={className}
        {...props}
      />
    );
  }

  // Safety check
  if (!widget) {
    return (
      <div className="h-full w-full min-h-[200px] flex items-center justify-center bg-muted/30 rounded-lg">
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

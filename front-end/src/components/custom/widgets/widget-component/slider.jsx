"use client";
import { cn } from "@/lib/utils";
import { SlidingNumber } from "@/components/ui/sliding-number";
import { useWidgetData } from "@/hooks/use-widget-data";
import { Loader2, WifiOff, AlertCircle } from "lucide-react";
import { useState } from "react";
import { Slider } from "@/components/ui/slider";

export function SliderWidget({ className, previewMode = false, widget, timeRange = "1h", ...props }) {
  const [dummyValue, setDummyValue] = useState([50]);

  // Use real-time data hook
  const {
    latestValue,
    isLoading,
    error,
    isValidWidget,
    isRealTimeConnected,
  } = useWidgetData(widget, timeRange);

  // Preview mode dengan data dummy
  if (previewMode) {
    return (
      <div className="flex w-full h-full items-center gap-4 px-4">
        <Slider
          value={dummyValue}
          onValueChange={setDummyValue}
          min={0}
          max={100}
          step={0.1}
          className={cn("flex-1", className)}
          {...props}
        />
        <SlidingNumber value={dummyValue[0]} />
      </div>
    );
  }

  // Validasi widget
  if (!isValidWidget) {
    return (
      <div className="flex w-full h-full items-center justify-center px-4 bg-muted/30 rounded-lg">
        <div className="text-center space-y-2">
          <AlertCircle className="h-6 w-6 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">Widget tidak valid</p>
          <p className="text-xs text-muted-foreground">Device atau datastream tidak ditemukan</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex w-full h-full items-center justify-center px-4">
        <div className="text-center space-y-2">
          <Loader2 className="h-5 w-5 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Memuat data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex w-full h-full items-center justify-center px-4 bg-destructive/10 rounded-lg">
        <div className="text-center space-y-2">
          <AlertCircle className="h-6 w-6 text-destructive mx-auto" />
          <p className="text-sm text-destructive">Gagal memuat data</p>
          <p className="text-xs text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  // Get current sensor value
  const currentValue = latestValue?.value || 0;
  
  // Determine slider range based on datastream configuration or use default 0-100
  const minValue = 0;
  const maxValue = 100;
  
  // Ensure value is within range
  const clampedValue = Math.max(minValue, Math.min(maxValue, currentValue));

  return (
    <div className="flex w-full h-full flex-col justify-center gap-3 px-4">
      {/* Header dengan info sensor */}
      <div className="text-center">
        <h4 className="text-sm font-medium">{latestValue?.sensor_name || 'Sensor'}</h4>
        <p className="text-xs text-muted-foreground">{latestValue?.device_name}</p>
        {latestValue?.timeAgo && (
          <p className="text-xs text-muted-foreground">Updated {latestValue.timeAgo}</p>
        )}
      </div>

      {/* Slider (read-only for monitoring) */}
      <div className="flex items-center gap-4">
        <Slider
          value={[clampedValue]}
          min={minValue}
          max={maxValue}
          step={0.1}
          disabled={true} // Read-only for monitoring
          className={cn("flex-1 opacity-80", className)}
          {...props}
        />
        <div className="min-w-[60px] text-right">
          <SlidingNumber value={clampedValue} />
          {latestValue?.unit && (
            <p className="text-xs text-muted-foreground">{latestValue.unit}</p>
          )}
        </div>
      </div>

      {/* Status indicators */}
      <div className="text-center">
        {isRealTimeConnected && (
          <div className="flex items-center justify-center gap-1 text-xs text-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Live
          </div>
        )}
        {!isRealTimeConnected && latestValue && (
          <p className="text-xs text-orange-500">⚠️ Real-time disconnected</p>
        )}
        {!latestValue && (
          <p className="text-xs text-muted-foreground">Tidak ada data terbaru</p>
        )}
      </div>
    </div>
  );
}

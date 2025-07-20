import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useWidgetData } from "@/hooks/use-widget-data";
import { Loader2, WifiOff, AlertCircle } from "lucide-react";
import { useState } from "react";

export function SwitchWidget({ previewMode = false, widget, timeRange = "1h" }) {
  const [dummyChecked, setDummyChecked] = useState(false);
  
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
      <div className="w-full h-full flex flex-col justify-center items-center min-h-[100px] bg-transparent">
        <div className="flex items-center space-x-4">
          <Switch 
            id="switch-widget-preview" 
            checked={dummyChecked} 
            onCheckedChange={setDummyChecked}
            className="data-[state=checked]:bg-primary"
          />
          <Label htmlFor="switch-widget-preview" className="text-lg font-medium text-foreground">
            {dummyChecked ? "On" : "Off"}
          </Label>
        </div>
      </div>
    );
  }

  // Validasi widget
  if (!isValidWidget) {
    return (
      <div className="w-full h-full flex flex-col justify-center items-center min-h-[100px] bg-muted/30 rounded-lg">
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
      <div className="w-full h-full flex flex-col justify-center items-center min-h-[100px]">
        <div className="text-center space-y-2">
          <Loader2 className="h-5 w-5 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Memuat status...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="w-full h-full flex flex-col justify-center items-center min-h-[100px] bg-destructive/10 rounded-lg">
        <div className="text-center space-y-2">
          <AlertCircle className="h-6 w-6 text-destructive mx-auto" />
          <p className="text-sm text-destructive">Gagal memuat data</p>
          <p className="text-xs text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  // Determine switch status from sensor value
  // Assume 0 = OFF, 1 = ON, or any truthy value = ON
  const isOn = latestValue?.value > 0;
  const statusText = isOn ? "On" : "Off";

  return (
    <div className="w-full h-full flex flex-col justify-center items-center min-h-[100px] bg-transparent">
      <div className="space-y-3">
        {/* Device and sensor info */}
        <div className="text-center">
          <h4 className="text-sm font-medium">{latestValue?.sensor_name || 'Status'}</h4>
          <p className="text-xs text-muted-foreground">{latestValue?.device_name}</p>
          {latestValue?.timeAgo && (
            <p className="text-xs text-muted-foreground">Updated {latestValue.timeAgo}</p>
          )}
        </div>

        {/* Switch display (read-only for monitoring) */}
        <div className="flex items-center space-x-4">
          <Switch 
            id="switch-widget-status" 
            checked={isOn}
            disabled={true} // Read-only for monitoring
            className="data-[state=checked]:bg-primary opacity-80"
          />
          <Label htmlFor="switch-widget-status" className="text-lg font-medium text-foreground">
            {statusText}
          </Label>
        </div>

        {/* Current value display */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Nilai: {latestValue?.value?.toFixed(2) || '--'} {latestValue?.unit}
          </p>
          {isRealTimeConnected && (
            <div className="flex items-center justify-center gap-1 text-xs text-green-600 mt-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Live
            </div>
          )}
          {!isRealTimeConnected && latestValue && (
            <p className="text-xs text-orange-500 mt-1">⚠️ Real-time disconnected</p>
          )}
        </div>
      </div>
    </div>
  );
}

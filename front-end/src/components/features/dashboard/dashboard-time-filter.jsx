"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarSearch, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const timeRangeOptions = [
  { value: "1h", label: "1 Jam Terakhir", description: "Data dalam 1 jam terakhir" },
  { value: "6h", label: "6 Jam Terakhir", description: "Data dalam 6 jam terakhir" },
  { value: "12h", label: "12 Jam Terakhir", description: "Data dalam 12 jam terakhir" },
  { value: "24h", label: "24 Jam Terakhir", description: "Data dalam 24 jam terakhir" },
  { value: "7d", label: "7 Hari Terakhir", description: "Data dalam 7 hari terakhir" },
  { value: "30d", label: "30 Hari Terakhir", description: "Data dalam 30 hari terakhir" },
];

export default function DashboardTimeFilter({ 
  currentTimeRange = "24h", 
  onTimeRangeChange,
  disabled = false 
}) {
  const [open, setOpen] = useState(false);

  const currentOption = timeRangeOptions.find(option => option.value === currentTimeRange);

  const handleSelect = (value) => {
    onTimeRangeChange(value);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-between cursor-pointer",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          disabled={disabled}
        >
          <div className="flex items-center gap-2">
            <CalendarSearch className="w-4 h-4" />
            <span className="hidden sm:inline">Filter</span>
            <span className="text-xs text-muted-foreground">
              ({currentOption?.label || "24 Jam Terakhir"})
            </span>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4">
          <h4 className="font-medium mb-3">Rentang Waktu Data</h4>
          <div className="space-y-1">
            {timeRangeOptions.map((option) => (
              <div
                key={option.value}
                className={cn(
                  "flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-muted transition-colors",
                  currentTimeRange === option.value && "bg-muted"
                )}
                onClick={() => handleSelect(option.value)}
              >
                <div className="flex-1">
                  <div className="font-medium text-sm">{option.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {option.description}
                  </div>
                </div>
                {currentTimeRange === option.value && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

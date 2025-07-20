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
import { useBreakpoint } from "@/hooks/use-mobile";

const timeRangeOptions = [
  { value: "1m", label: "1 Menit Terakhir", description: "Data dalam 1 menit terakhir" },
  { value: "1h", label: "1 Jam Terakhir", description: "Data dalam 1 jam terakhir" },
  { value: "12h", label: "12 Jam Terakhir", description: "Data dalam 12 jam terakhir" },
  { value: "1d", label: "1 Hari Terakhir", description: "Data dalam 1 hari terakhir" },
  { value: "1w", label: "1 Minggu Terakhir", description: "Data dalam 1 minggu terakhir" },
  { value: "1M", label: "1 Bulan Terakhir", description: "Data dalam 1 bulan terakhir" },
  { value: "1y", label: "1 Tahun Terakhir", description: "Data dalam 1 tahun terakhir" },
  { value: "all", label: "Semua Waktu", description: "Semua data yang tersedia" },
];

export default function DashboardTimeFilter({ 
  currentTimeRange = "1m", 
  onTimeRangeChange,
  disabled = false 
}) {
  const [open, setOpen] = useState(false);
  const { isMobile, isMedium } = useBreakpoint();

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
            <span className="inline">Filter</span>
            <span className="text-xs text-muted-foreground">
              {isMobile || isMedium ? ("(" + currentOption?.value + ")" || "(1m)") : "(" + (currentOption?.description || "Data dalam 1 menit terakhir") + ")"}
            </span>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align={isMobile || isMedium ? "center" : "end"}>
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
                  <Check className="w-5 h-5" />
                )}
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

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
import { TransitionPanel } from "@/components/ui/transition-panel";

const timeRangeOptions = [
  { value: "1m", label: "1 Menit Terakhir", description: "Data dalam 1 menit terakhir" },
  { value: "1h", label: "1 Jam Terakhir", description: "Data dalam 1 jam terakhir" },
  { value: "12h", label: "12 Jam Terakhir", description: "Data dalam 12 jam terakhir" },
  { value: "1d", label: "1 Hari Terakhir", description: "Data dalam 1 hari terakhir" },
  { value: "1w", label: "1 Minggu Terakhir", description: "Data dalam 1 minggu terakhir" },
  { value: "1M", label: "1 Bulan Terakhir", description: "Data dalam 1 bulan terakhir" },
  { value: "1y", label: "1 Tahun Terakhir", description: "Data dalam 1 tahun terakhir" },
  { value: "allTime", label: "Semua Waktu", description: "Semua data yang tersedia" },
];

const dataCountOptions = [
  { value: "10", label: "10 Data Terakhir", description: "10 data terakhir" },
  { value: "50", label: "50 Data Terakhir", description: "50 data terakhir" },
  { value: "100", label: "100 Data Terakhir", description: "100 data terakhir" },
  { value: "500", label: "500 Data Terakhir", description: "500 data terakhir" },
  { value: "1000", label: "1000 Data Terakhir", description: "1000 data terakhir" },
  { value: "5000", label: "5000 Data Terakhir", description: "5000 data terakhir" },
  { value: "allCount", label: "Semua Data", description: "Semua data yang tersedia" },
];

export default function DashboardTimeFilter({ 
  currentTimeRange = "1m", 
  currentDataCount = "100",
  filterType = "time", // "time" atau "count"
  onTimeRangeChange,
  onDataCountChange,
  onFilterTypeChange,
  disabled = false 
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(filterType === "time" ? 0 : 1);
  const { isMobile, isMedium } = useBreakpoint();

  const currentTimeOption = timeRangeOptions.find(option => option.value === currentTimeRange);
  const currentCountOption = dataCountOptions.find(option => option.value === currentDataCount);
  
  // Tentukan option yang sedang aktif berdasarkan filter type
  const currentOption = filterType === "time" ? currentTimeOption : currentCountOption;

  const handleTimeSelect = (value) => {
    onTimeRangeChange && onTimeRangeChange(value);
    onFilterTypeChange && onFilterTypeChange("time");
    setOpen(false);
  };

  const handleCountSelect = (value) => {
    onDataCountChange && onDataCountChange(value);
    onFilterTypeChange && onFilterTypeChange("count");
    setOpen(false);
  };

  const handleTabChange = (index) => {
    setActiveIndex(index);
    const newFilterType = index === 0 ? "time" : "count";
    onFilterTypeChange && onFilterTypeChange(newFilterType);
  };

  // Komponen untuk render time range options
  const TimeRangePanel = () => (
    <div className="space-y-1">
      {timeRangeOptions.map((option) => (
        <div
          key={option.value}
          className={cn(
            "flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-muted transition-colors",
            filterType === "time" && currentTimeRange === option.value && "bg-muted"
          )}
          onClick={() => handleTimeSelect(option.value)}
        >
          <div className="flex-1">
            <div className="font-medium text-sm">{option.label}</div>
            <div className="text-xs text-muted-foreground">
              {option.description}
            </div>
          </div>
          {filterType === "time" && currentTimeRange === option.value && (
            <Check className="w-5 h-5" />
          )}
        </div>
      ))}
    </div>
  );

  // Komponen untuk render data count options
  const DataCountPanel = () => (
    <div className="space-y-1">
      {dataCountOptions.map((option) => (
        <div
          key={option.value}
          className={cn(
            "flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-muted transition-colors",
            filterType === "count" && currentDataCount === option.value && "bg-muted"
          )}
          onClick={() => handleCountSelect(option.value)}
        >
          <div className="flex-1">
            <div className="font-medium text-sm">{option.label}</div>
            <div className="text-xs text-muted-foreground">
              {option.description}
            </div>
          </div>
          {filterType === "count" && currentDataCount === option.value && (
            <Check className="w-5 h-5" />
          )}
        </div>
      ))}
    </div>
  );

  const FILTER_TABS = [
    {
      title: "Waktu",
      content: <TimeRangePanel />
    },
    {
      title: "Jumlah",
      content: <DataCountPanel />
    },
  ];

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
              {isMobile || isMedium 
                ? `(${filterType === "time" ? currentOption?.value : currentOption?.value + " data"})`
                : `(${currentOption?.description || "Data dalam 1 menit terakhir"})`
              }
            </span>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align={isMobile || isMedium ? "center" : "end"}>
        <div className="p-4">
          {/* Tab Navigation */}
          <div className="flex space-x-2 mb-4 justify-center">
            {FILTER_TABS.map((tab, index) => (
              <button
                key={index}
                onClick={() => handleTabChange(index)}
                className={cn(
                  "rounded-md px-3 py-1 text-sm font-medium transition-colors",
                  activeIndex === index
                    ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                    : "bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400 hover:bg-zinc-150 dark:hover:bg-zinc-650"
                )}
              >
                {tab.title}
              </button>
            ))}
          </div>

          {/* Tab Content dengan TransitionPanel */}
          <div className="overflow-hidden">
            <TransitionPanel
              activeIndex={activeIndex}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              variants={{
                enter: { opacity: 0, y: -20, filter: "blur(4px)" },
                center: { opacity: 1, y: 0, filter: "blur(0px)" },
                exit: { opacity: 0, y: 20, filter: "blur(4px)" },
              }}
            >
              {FILTER_TABS.map((tab, index) => (
                <div key={index}>
                  {tab.content}
                </div>
              ))}
            </TransitionPanel>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

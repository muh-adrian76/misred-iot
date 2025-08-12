/**
 * KOMPONEN DASHBOARD TIME FILTER
 * 
 * DashboardTimeFilter adalah komponen untuk mengatur filter waktu dan jumlah data
 * yang ditampilkan dalam dashboard IoT. Komponen ini menyediakan:
 * 
 * Fitur utama:
 * - Time-based filtering (1 jam, 12 jam, 1 hari, 1 minggu)
 * - Count-based filtering (10, 20, 50, 100 data terakhir)
 * - Switch antara mode time dan count filtering
 * - Responsive design dengan adaptasi mobile/desktop
 * - Smooth transitions dengan TransitionPanel
 * - Integrated popover interface
 * 
 * Props yang diterima:
 * @param {string} currentTimeRange - Range waktu yang sedang aktif (1h, 12h, 1d, 1w)
 * @param {string} currentDataCount - Jumlah data yang sedang aktif (10, 20, 50, 100)
 * @param {string} filterType - Tipe filter aktif ("time" | "count")
 * @param {Function} onTimeRangeChange - Handler untuk perubahan time range
 * @param {Function} onDataCountChange - Handler untuk perubahan data count
 * @param {Function} onFilterTypeChange - Handler untuk perubahan filter type
 * @param {boolean} disabled - Status disabled komponen
 * 
 * State management:
 * - open: Status popover terbuka/tertutup
 * - activeIndex: Index tab yang sedang aktif (0=count, 1=time)
 * - Responsive breakpoints untuk adaptasi tampilan
 */

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

/**
 * KONFIGURASI OPSI FILTER WAKTU
 * Array yang berisi opsi-opsi untuk filtering berdasarkan rentang waktu
 * dengan label dan deskripsi yang user-friendly dalam bahasa Indonesia
 */
const timeRangeOptions = [
  { value: "1h", label: "1 Jam Terakhir", description: "Data dalam 1 jam terakhir" },
  { value: "12h", label: "12 Jam Terakhir", description: "Data dalam 12 jam terakhir" },
  { value: "1d", label: "1 Hari Terakhir", description: "Data dalam 1 hari terakhir" },
  { value: "1w", label: "1 Minggu Terakhir", description: "Data dalam 1 minggu terakhir" },
  // Tambahan: Filter untuk periode bulanan yang lebih panjang
  { value: "1m", label: "1 Bulan Terakhir", description: "Data dalam 1 bulan terakhir" },
];

/**
 * KONFIGURASI OPSI FILTER JUMLAH DATA
 * Array yang berisi opsi-opsi untuk limiting jumlah data yang ditampilkan
 * dengan deskripsi yang jelas untuk setiap opsi
 */
const dataCountOptions = [
  { value: "10", label: "10 Data Terakhir", description: "Menampilkan 10 data terakhir" },
  { value: "20", label: "20 Data Terakhir", description: "Menampilkan 20 data terakhir" },
  { value: "50", label: "50 Data Terakhir", description: "Menampilkan 50 data terakhir" },
  { value: "100", label: "100 Data Terakhir", description: "Menampilkan 100 data terakhir" },
];

export default function DashboardTimeFilter({ 
  currentTimeRange = "1h", 
  currentDataCount = "10",
  filterType = "count", // Default ke "count" untuk performa yang lebih baik
  onTimeRangeChange,
  onDataCountChange,
  onFilterTypeChange,
  disabled = false 
}) {
  // ===== STATE MANAGEMENT =====
  // State untuk mengontrol popover visibility
  const [open, setOpen] = useState(false);
  
  // State untuk tab yang aktif (0=count, 1=time)
  const [activeIndex, setActiveIndex] = useState(filterType === "count" ? 0 : 1);
  
  // Responsive breakpoints untuk adaptasi tampilan
  const { isMobile, isMedium, isTablet } = useBreakpoint();

  // ===== DERIVED STATE =====
  // Cari opsi yang sedang aktif berdasarkan current values
  const currentTimeOption = timeRangeOptions.find(option => option.value === currentTimeRange);
  const currentCountOption = dataCountOptions.find(option => option.value === currentDataCount);
  
  // Tentukan opsi yang akan ditampilkan berdasarkan filter type
  const currentOption = filterType === "time" ? currentTimeOption : currentCountOption;

  // ===== EVENT HANDLERS =====
  /**
   * Handler untuk pemilihan time range filter
   * Mengupdate filter type ke "time" dan menutup popover
   */
  const handleTimeSelect = (value) => {
    onTimeRangeChange && onTimeRangeChange(value);
    onFilterTypeChange && onFilterTypeChange("time");
    setOpen(false);
  };

  /**
   * Handler untuk pemilihan data count filter
   * Mengupdate filter type ke "count" dan menutup popover
   */
  const handleCountSelect = (value) => {
    onDataCountChange && onDataCountChange(value);
    onFilterTypeChange && onFilterTypeChange("count");
    setOpen(false);
  };

  /**
   * Handler untuk perubahan tab antara count dan time filtering
   * Index 0 = count mode, Index 1 = time mode
   */
  const handleTabChange = (index) => {
    setActiveIndex(index);
    const newFilterType = index === 0 ? "count" : "time";
    onFilterTypeChange && onFilterTypeChange(newFilterType);
  };

  // ===== RENDER COMPONENTS =====
  /**
   * Komponen untuk menampilkan opsi time range filtering
   * Dengan list interaktif dan visual feedback untuk selection
   */
  const TimeRangePanel = () => (
    <div className="space-y-1">
      {timeRangeOptions.map((option) => (
        <div
          key={option.value}
          className={cn(
            "flex items-center justify-between px-4 py-2 rounded-md cursor-pointer hover:bg-accent transition-colors",
            filterType === "time" && currentTimeRange === option.value && "bg-accent"
          )}
          onClick={() => handleTimeSelect(option.value)}
        >
          {/* Konten opsi dengan label dan deskripsi */}
          <div className="flex-1">
            <div className="font-medium text-sm">{option.label}</div>
            <div className="text-xs text-muted-foreground">
              {option.description}
            </div>
          </div>
          {/* Check icon untuk opsi yang sedang aktif */}
          {filterType === "time" && currentTimeRange === option.value && (
            <Check className="w-5 h-5 dark:text-primary" />
          )}
        </div>
      ))}
    </div>
  );

  /**
   * Komponen untuk menampilkan opsi data count filtering
   * Dengan layout yang konsisten dengan TimeRangePanel
   */
  const DataCountPanel = () => (
    <div className="space-y-1">
      {dataCountOptions.map((option) => (
        <div
          key={option.value}
          className={cn(
            "flex items-center justify-between px-4 py-2 rounded-md cursor-pointer hover:bg-accent transition-colors",
            filterType === "count" && currentDataCount === option.value && "bg-accent"
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
            <Check className="w-5 h-5 dark:text-primary" />
          )}
        </div>
      ))}
    </div>
  );

  // ===== TAB CONFIGURATION =====
  /**
   * Konfigurasi tab untuk TransitionPanel
   * Tab 0 = Data Count filtering, Tab 1 = Time Range filtering
   */
  const FILTER_TABS = [
    {
      title: "Jumlah",
      content: <DataCountPanel />
    },
    {
      title: "Waktu", 
      content: <TimeRangePanel />
    },
  ];

  // ===== MAIN RENDER =====
  return (
    <Popover open={open} onOpenChange={setOpen}>
      {/* Trigger button dengan styling yang responsive */}
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
            <span className="inline">Filter Data</span>
            <span className="text-xs text-muted-foreground">
              {isMobile || isMedium 
                // Format tampilan yang berbeda untuk mobile dan desktop
                ? `(${filterType === "time" ? currentOption?.value : currentOption?.value + " data"})`
                : `(${currentOption?.description || "Data dalam 1 menit terakhir"})`
              }
            </span>
          </div>
        </Button>
      </PopoverTrigger>
      
      {/* Popover content dengan adaptive alignment */}
      <PopoverContent className="w-80 p-0" align={isMobile || isMedium || isTablet ? "center" : "end"}>
        <div className="p-4">
          {/* Tab Navigation untuk switching antara Count dan Time */}
          <div className="flex space-x-2 mb-4 justify-center">
            {FILTER_TABS.map((tab, index) => (
              <button
                key={index}
                onClick={() => handleTabChange(index)}
                className={cn(
                  "rounded-md px-3 py-1 text-sm font-medium transition-colors",
                  // Styling untuk tab yang aktif vs tidak aktif
                  activeIndex === index
                    ? "bg-red-500 text-white"
                    : "bg-accent text-foreground hover:bg-gray-200 dark:hover:bg-gray-700"
                )}
              >
                {tab.title}
              </button>
            ))}
          </div>

          {/* Tab Content dengan smooth transitions menggunakan TransitionPanel */}
          <div className="overflow-hidden">
            <TransitionPanel
              activeIndex={activeIndex}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              variants={{
                // Animasi masuk dari atas dengan blur effect
                enter: { opacity: 0, y: -20, filter: "blur(4px)" },
                // State tengah (aktif) dengan full opacity dan no blur
                center: { opacity: 1, y: 0, filter: "blur(0px)" },
                // Animasi keluar ke bawah dengan blur effect
                exit: { opacity: 0, y: 20, filter: "blur(4px)" },
              }}
            >
              {/* Render setiap tab content */}
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

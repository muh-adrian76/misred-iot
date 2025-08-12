// Import hooks React untuk state management, memoization, dan callback
import { useRef, useState, useMemo, useCallback } from "react";
// Import React Grid Layout untuk drag-drop grid system
import { WidthProvider, Responsive } from "react-grid-layout";
// Import CSS untuk styling grid layout dan resizable elements
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

// Import komponen widget untuk berbagai tipe chart
import { AreaChartWidget } from "@/components/custom/widgets/widget-component/monitor/area";
import { BarChartWidget } from "@/components/custom/widgets/widget-component/monitor/bar";
import { LineChartWidget } from "@/components/custom/widgets/widget-component/monitor/line";
import { PieChartWidget } from "./widget-component/monitor/pie";
import GaugeWidget from "./widget-component/monitor/gauge";
import TextWidgetWrapper from "./widget-component/monitor/text";
// Import komponen widget untuk kontrol IoT
import { SwitchWidget } from "@/components/custom/widgets/widget-component/control/switch";
import { SliderWidget } from "@/components/custom/widgets/widget-component/control/slider";
// Import komponen UI dan ikon
import { Button } from "@/components/ui/button";
import { Trash2, Move, Settings2 } from "lucide-react";
// Import utility dan helper functions
import { errorToast } from "../other/toaster";
import { fetchFromBackend } from "@/lib/helper";
import {
  bootstrapWidths, // Konfigurasi lebar responsive
  cols, // Konfigurasi kolom untuk setiap breakpoint
  availableHandles, // Handle untuk resize widget
  findAvailablePosition, // Helper untuk mencari posisi kosong
  generateWidgetLayout, // Generator layout widget
  getWidgetConstraints, // Constraint ukuran untuk setiap tipe widget
} from "@/lib/dashboard-utils";
import { cn } from "@/lib/utils";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import DescriptionTooltip from "@/components/custom/other/description-tooltip";

// ResponsiveGridLayout dengan WidthProvider untuk auto-sizing
// ResponsiveGridLayout dengan WidthProvider untuk auto-sizing
const ResponsiveGridLayout = WidthProvider(Responsive);

// Konfigurasi margin responsif untuk optimasi performa (dari notes.txt)
const responsiveMargins = {
  lg: [10, 10], // Margin lebih besar untuk desktop
  md: [8, 8], // Margin sedang untuk tablet
  sm: [6, 6], // Margin kecil untuk mobile
  xs: [5, 5], // Margin minimal untuk mobile kecil
  xxs: [5, 5], // Margin minimal untuk layar sangat kecil
};

// Styling grid dengan background pattern untuk mode editing
const gridStyle = `
  bg-background border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg 
  relative overflow-visible min-h-screen
  bg-[linear-gradient(to_right,rgba(156,163,175,0.15)_1px,transparent_1px),linear-gradient(to_bottom,rgba(156,163,175,0.15)_1px,transparent_1px)]
  dark:bg-[linear-gradient(to_right,rgba(75,85,99,0.2)_1px,transparent_1px),linear-gradient(to_bottom,rgba(75,85,99,0.2)_1px,transparent_1px)]
`;

// Mapping tipe widget ke komponen React yang sesuai
const widgetComponents = {
  slider: SliderWidget, // Widget slider untuk kontrol nilai
  switch: SwitchWidget, // Widget switch untuk kontrol on/off
  area: AreaChartWidget, // Chart area untuk data time-series
  bar: BarChartWidget, // Chart bar untuk data kategorikal
  line: LineChartWidget, // Chart line untuk tren data
  pie: PieChartWidget, // Chart pie untuk data proporsi
  gauge: GaugeWidget, // Widget gauge untuk monitoring status
  text: TextWidgetWrapper, // Widget text untuk display nilai tunggal
};

// Generator layout responsif yang dioptimasi dengan memoization
const generateResponsiveLayouts = (items, existingLayouts = {}) => {
  const widths = bootstrapWidths; // Lebar standar untuk setiap breakpoint
  const cols = { lg: 12, md: 12, sm: 12, xs: 12, xxs: 12 }; // Jumlah kolom grid

  // Generate layout untuk setiap breakpoint
  // Generate layout untuk setiap breakpoint
  return Object.keys(widths).reduce((memo, breakpoint) => {
    const defaultWidth = widths[breakpoint]; // Lebar default untuk breakpoint ini
    const colCount = cols[breakpoint]; // Jumlah kolom untuk breakpoint ini
    const existingLayoutForBreakpoint = existingLayouts[breakpoint] || []; // Layout yang sudah ada

    // Generate layout untuk setiap widget
    memo[breakpoint] = items.map((widget, i) => {
      // Dapatkan constraint ukuran untuk tipe widget ini
      const constraints = getWidgetConstraints(widget.type, breakpoint);
      // Cari layout item yang sudah ada untuk widget ini
      const existingItem = existingLayoutForBreakpoint.find(
        (item) => item.i === widget.id.toString()
      );

      // Ukuran responsif berdasarkan constraint
      const responsiveWidth = constraints.minW;
      const responsiveHeight = constraints.minH;

      // Jika sudah ada layout, gunakan dengan validasi constraint
      if (existingItem) {
        return {
          ...existingItem,
          // Pastikan ukuran tidak kurang dari minimum constraint
          w: Math.max(constraints.minW, existingItem.w || responsiveWidth),
          h: Math.max(constraints.minH, existingItem.h || responsiveHeight),
          minW: constraints.minW,
          minH: constraints.minH,
          maxW: constraints.maxW,
          maxH: constraints.maxH,
          isResizable: constraints.isResizable,
        };
      }

      // Jika belum ada layout, buat layout baru dengan posisi otomatis
      const x = (i * responsiveWidth) % colCount; // Posisi X berdasarkan index
      const y = 0; // Mulai dari atas

      return {
        i: widget.id.toString(), // ID widget sebagai string
        x,
        y,
        w: responsiveWidth, // Lebar widget
        h: responsiveHeight, // Tinggi widget
        minW: constraints.minW, // Lebar minimum
        minH: constraints.minH, // Tinggi minimum
        maxW: constraints.maxW, // Lebar maksimum
        maxH: constraints.maxH, // Tinggi maksimum
        isResizable: constraints.isResizable, // Apakah bisa diresize
      };
    });

    return memo;
  }, {});
};

// Komponen utama GridLayout yang dioptimasi untuk performa dan responsivitas
// Komponen utama GridLayout yang dioptimasi untuk performa dan responsivitas
export default function GridLayoutOptimized({
  items, // Array widget yang akan ditampilkan
  setItems, // Setter untuk mengubah items
  layouts, // Konfigurasi layout untuk setiap breakpoint
  setLayouts, // Setter untuk mengubah layouts
  onChartDrop, // Handler ketika chart di-drop ke grid
  onLayoutChange, // Handler ketika layout berubah
  onBreakpointChange, // Handler ketika breakpoint berubah
  isEditing = true, // Mode editing (drag, resize, delete)
  currentTimeRange = "1h", // Range waktu data untuk widget
  currentDataCount = "100", // Jumlah data point untuk widget
  filterType = "count", // Tipe filter data
  stageWidgetRemoval, // Handler untuk staging penghapusan widget
  removeWidgetFromDatabase, // Handler untuk menghapus widget dari database
  handleEditWidget, // Handler untuk mengedit konfigurasi widget
}) {
  // State untuk breakpoint saat ini dan pengaturan widget
  const [currentBreakpoint, setCurrentBreakpoint] = useState("lg");
  const [openWidgetSetting, setOpenWidgetSetting] = useState(null);
  const [forceRegenerate, setForceRegenerate] = useState(0); // Force re-render trigger

  // Memoize layout efektif untuk mencegah recalculation yang tidak perlu (optimasi performa)
  const effectiveLayouts = useMemo(() => {
    // Cek apakah ada layout valid dari database
    const hasValidLayouts =
      layouts && typeof layouts === "object" && Object.keys(layouts).length > 0;

    if (items.length > 0) {
      // Untuk mode static (non-editing), selalu gunakan layout dari database jika tersedia
      // Ini mencegah regenerasi layout otomatis yang menyebabkan masalah tampilan setelah login
      if (!isEditing && hasValidLayouts) {
        // Debug layout dari DB
        // console.log('Database layouts:', layouts);

        // Validasi layouts memiliki semua breakpoint dan widget yang diperlukan
        const validatedLayouts = {};
        const breakpoints = ["lg", "md", "sm", "xs", "xxs"];

        breakpoints.forEach((bp) => {
          validatedLayouts[bp] = layouts[bp] || [];

          // Pastikan semua item saat ini ada dalam layout
          const layoutItemIds = validatedLayouts[bp].map((item) => item.i);
          const missingItems = items.filter(
            (item) => !layoutItemIds.includes(item.id.toString())
          );

          // Jika ada item yang hilang, tambahkan ke layout
          if (missingItems.length > 0) {
            // console.log(`Adding missing items to ${bp} layout:`, missingItems.map(i => i.id));
            // Hanya tambahkan item yang hilang, jangan regenerasi yang sudah ada
            missingItems.forEach((widget, idx) => {
              const constraints = getWidgetConstraints(widget.type, bp);
              const existingItemsCount = validatedLayouts[bp].length;
              validatedLayouts[bp].push({
                i: widget.id.toString(),
                x: 0,
                y: existingItemsCount * 6, // Stack item yang hilang di bawah
                w: constraints.minW,
                h: constraints.minH,
                minW: constraints.minW,
                minH: constraints.minH,
                maxW: constraints.maxW,
                maxH: constraints.maxH,
                isResizable: false, // Static di mode non-editing
                isDraggable: false,
                static: true,
              });
            });
          }
        });

        // console.log('Final validated layouts for static mode:', validatedLayouts);
        return validatedLayouts;
      }

      // Untuk mode editing, gunakan generator layout responsif
      const responsiveLayouts = generateResponsiveLayouts(
        items,
        hasValidLayouts ? layouts : {}
      );
      return responsiveLayouts;
    }

    return {}; // Return empty jika tidak ada items
  }, [items, layouts, forceRegenerate, isEditing]);

  // Memoize responsive margins dan padding berdasarkan breakpoint saat ini
  const currentMargin = useMemo(
    () => responsiveMargins[currentBreakpoint] || responsiveMargins.lg,
    [currentBreakpoint]
  );

  // Event handlers yang dioptimasi dengan useCallback (optimasi performa)
  // Handler ketika layout berubah (drag, resize, atau perubahan breakpoint)
  const handleLayoutChange = useCallback(
    (layout, allLayouts) => {
      // Debug log untuk memantau perubahan layout
      console.log('🔄 Layout Change Triggered:', {
        layoutLength: layout.length,
        isEditing,
        maxY: layout.length > 0 ? Math.max(...layout.map(item => item.y + item.h)) : 0,
        layout: layout.map(item => ({ id: item.i, x: item.x, y: item.y, w: item.w, h: item.h }))
      });
      
      if (onLayoutChange) {
        // Validasi dan constraint layout untuk setiap widget
        const constrainedLayout = layout.map((item) => {
          const widget = items.find((w) => w.id.toString() === item.i);
          if (!widget) return item;

          // Dapatkan constraints untuk widget type di breakpoint saat ini
          const constraints = getWidgetConstraints(
            widget.type,
            currentBreakpoint
          );

          // Validasi dan apply constraints ke setiap property layout
          const validatedItem = {
            ...item,
            x: Number.isFinite(item.x) ? Math.max(0, item.x) : 0, // Pastikan x >= 0
            y: Number.isFinite(item.y) ? Math.max(0, item.y) : 0, // Pastikan y >= 0
            w: Number.isFinite(item.w)
              ? Math.max(constraints.minW, Math.min(constraints.maxW, item.w))
              : constraints.minW, // Constraint width dalam batas min/max
            h: Number.isFinite(item.h)
              ? Math.max(constraints.minH, Math.min(constraints.maxH, item.h))
              : constraints.minH, // Constraint height dalam batas min/max
            minW: constraints.minW, // Set minimum width
            minH: constraints.minH, // Set minimum height
            maxW: constraints.maxW, // Set maximum width
            maxH: constraints.maxH, // Set maximum height
            isResizable: isEditing && constraints.isResizable, // Resizable hanya di mode editing
            isDraggable: isEditing, // Draggable hanya di mode editing
            static: !isEditing, // Static di mode non-editing
          };

          return validatedItem;
        });

        // Validasi semua layouts untuk semua breakpoint
        const validatedAllLayouts = {};
        Object.keys(allLayouts).forEach((breakpoint) => {
          if (allLayouts[breakpoint] && Array.isArray(allLayouts[breakpoint])) {
            validatedAllLayouts[breakpoint] = allLayouts[breakpoint].map(
              (item) => {
                const widget = items.find((w) => w.id.toString() === item.i);
                const constraints = widget
                  ? getWidgetConstraints(widget.type, breakpoint)
                  : {
                      minW: 4,
                      minH: 4,
                      maxW: 12,
                      maxH: 12,
                    };

                return {
                  ...item,
                  x: Number.isFinite(item.x) ? Math.max(0, item.x) : 0,
                  // Validasi posisi dan ukuran untuk breakpoint ini
                  y: Number.isFinite(item.y) ? Math.max(0, item.y) : 0,
                  w: Number.isFinite(item.w)
                    ? Math.max(
                        constraints.minW,
                        Math.min(constraints.maxW, item.w)
                      )
                    : constraints.minW,
                  h: Number.isFinite(item.h)
                    ? Math.max(
                        constraints.minH,
                        Math.min(constraints.maxH, item.h)
                      )
                    : constraints.minH,
                };
              }
            );
          } else {
            validatedAllLayouts[breakpoint] = []; // Breakpoint kosong jika tidak ada data
          }
        });

        // Set layout untuk breakpoint saat ini
        validatedAllLayouts[currentBreakpoint] = constrainedLayout;
        onLayoutChange(constrainedLayout, validatedAllLayouts);
      }
    },
    [items, currentBreakpoint, isEditing, onLayoutChange]
  );

  // Handler ketika breakpoint berubah (responsive behavior)
  const handleBreakpointChange = useCallback(
    (breakpoint) => {
      // Debug lebar responsive
      // console.log('Bootstrap widths:', bootstrapWidths);

      setCurrentBreakpoint(breakpoint);
      setForceRegenerate((prev) => prev + 1); // Trigger re-render

      if (onBreakpointChange) {
        onBreakpointChange(breakpoint);
      }
    },
    [onBreakpointChange]
  );

  // Handler drop yang dioptimasi untuk chart baru
  const handleDrop = useCallback(
    (layout, layoutItem, e) => {
      e.preventDefault();
      e.stopPropagation();

      // Ambil tipe chart dari drag data
      const chartType = e.dataTransfer.getData("type");

      if (layoutItem && chartType) {
        // Dapatkan constraints untuk chart type di breakpoint saat ini
        const constraints = getWidgetConstraints(chartType, currentBreakpoint);

        // Validasi dan round posisi/ukuran layout item
        const validatedLayoutItem = {
          ...layoutItem,
          x: Math.max(0, Math.round(layoutItem.x || 0)), // Round dan pastikan x >= 0
          y: Math.max(0, Math.round(layoutItem.y || 0)), // Round dan pastikan y >= 0
          w: Math.max(
            constraints.minW,
            Math.round(layoutItem.w || constraints.minW)
          ), // Width dalam batas minimum
          h: Math.max(
            constraints.minH,
            Math.round(layoutItem.h || constraints.minH)
          ), // Height dalam batas minimum
          minW: constraints.minW, // Set constraint minimum width
          minH: constraints.minH, // Set constraint minimum height
          maxW: constraints.maxW, // Set constraint maximum width
          maxH: constraints.maxH, // Set constraint maximum height
          isResizable: constraints.isResizable, // Apakah bisa di-resize
          isDraggable: true, // Widget baru selalu draggable
          static: false, // Widget baru tidak static
        };

        // Panggil handler parent untuk menambah widget
        if (onChartDrop) {
          onChartDrop(chartType, validatedLayoutItem);
        }
      }
    },
    [currentBreakpoint, onChartDrop]
  );

  // Handler untuk drop widget ke area kosong (tambah widget baru)
  const handleAddWidgetDrop = useCallback(
    (e) => {
      e.preventDefault();
      const chartType = e.dataTransfer.getData("type");
      if (chartType && onChartDrop) {
        // Dapatkan constraints default untuk widget baru
        const constraints = getWidgetConstraints(chartType, currentBreakpoint);

        // Tambah widget di posisi default (bawah grid)
        onChartDrop(chartType, {
          x: 0, // Posisi horizontal awal
          y: Infinity, // Grid akan auto-position ke bawah
          w: constraints.minW, // Width default
          h: constraints.minH, // Height default
          minW: constraints.minW,
          minH: constraints.minH,
          maxW: constraints.maxW,
          maxH: constraints.maxH,
          isResizable: constraints.isResizable,
          isDraggable: true,
          static: false,
          resizeHandles: availableHandles, // Handle resize yang tersedia
        });
      }
    },
    [currentBreakpoint, onChartDrop]
  );

  // Handler penghapusan widget yang dioptimasi dengan useCallback
  const handleRemoveWidget = useCallback(
    async (widgetId) => {
      if (isEditing && stageWidgetRemoval) {
        // Mode staging - widget akan dihapus nanti
        stageWidgetRemoval(widgetId);
      } else if (removeWidgetFromDatabase) {
        // Hapus langsung dari database
        await removeWidgetFromDatabase(widgetId);
      } else {
        // Fallback - hapus dari state lokal
        try {
          // Hapus dari items array
          const updatedItems = items.filter((item) => item.id !== widgetId);
          setItems(updatedItems);

          // Hapus dari semua layouts
          const updatedLayouts = { ...effectiveLayouts };
          Object.keys(updatedLayouts).forEach((bp) => {
            if (updatedLayouts[bp]) {
              updatedLayouts[bp] = updatedLayouts[bp].filter(
                (layoutItem) => layoutItem.i !== widgetId.toString()
              );
            }
          });
          setLayouts(updatedLayouts);
        } catch (error) {
          console.error("Error removing widget:", error);
          errorToast("Gagal menghapus widget");
        }
      }
    },
    [
      isEditing,
      stageWidgetRemoval,
      removeWidgetFromDatabase,
      items,
      effectiveLayouts,
      setItems,
      setLayouts,
    ]
  );

  // Memoize grid items untuk optimasi performa (dari catatan optimasi)
  const gridItems = useMemo(() => {
    return (effectiveLayouts[currentBreakpoint] || [])
      .map((layoutItem) => {
        // Cari widget data berdasarkan layout item ID
        const widget = items.find((w) => w.id.toString() === layoutItem.i);
        if (!widget) return null; // Skip jika widget tidak ditemukan

        // Dapatkan komponen widget berdasarkan tipe
        const WidgetComponent = widgetComponents[widget.type];
        
        // Tampilkan error jika tipe widget tidak dikenali
        if (!WidgetComponent) {
          return (
            <div key={layoutItem.i}>
              <div className="text-red-500 p-4">
                Tipe widget "{widget.type}" tidak ditemukan
              </div>
            </div>
          );
        }

        // Dapatkan constraint untuk tipe widget di breakpoint saat ini
        const widgetConstraints = getWidgetConstraints(
          widget.type,
          currentBreakpoint
        );
        const constrainedLayoutItem = {
          i: layoutItem.i,
          minW: widgetConstraints.minW,
          minH: widgetConstraints.minH,
          maxW: widgetConstraints.maxW,
          maxH: widgetConstraints.maxH,
          w: Math.max(
            widgetConstraints.minW,
            Number.isFinite(layoutItem.w) && layoutItem.w > 0
              ? layoutItem.w
              : widgetConstraints.minW
          ),
          h: Math.max(
            widgetConstraints.minH,
            Number.isFinite(layoutItem.h) && layoutItem.h > 0
              ? layoutItem.h
              : widgetConstraints.minH
          ),
          x:
            Number.isFinite(layoutItem.x) && layoutItem.x >= 0
              ? layoutItem.x
              : 0,
          y:
            Number.isFinite(layoutItem.y) && layoutItem.y >= 0
              ? layoutItem.y
              : 0,
          isResizable: isEditing && widgetConstraints.isResizable,
          isDraggable: isEditing,
          static: !isEditing, // Force static mode for non-editing
        };

        return (
          <div
            key={layoutItem.i}
            className="relative border rounded-xl group"
            data-grid={constrainedLayoutItem}
          >
            <GlowingEffect
              spread={90}
              glow={true}
              disabled={false}
              proximity={90}
              inactiveZone={0.1}
            />
            <div
              className={`h-full w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm flex flex-col overflow-hidden relative group ${
                isEditing ? "border-2 border-dashed border-red-300" : ""
              }`}
            >
              {isEditing && (
                <div className="drag-handle cursor-move absolute inset-0 bg-background/80 flex flex-col font-semibold gap-3 items-center justify-center opacity-0 max-lg:opacity-100 group-hover:opacity-100 transition-opacity z-5 pointer-events-none group-hover:pointer-events-auto">
                  <Move className="w-10 h-10 text-foreground drop-shadow-lg" />
                  <span>Tekan dan tahan</span>
                </div>
              )}

              {isEditing && (
                <div className="absolute top-1/2 -translate-y-1/2 right-3 flex flex-col gap-3 opacity-0 max-lg:opacity-100 group-hover:opacity-100 transition-opacity z-10">
                  <DescriptionTooltip content="Edit" side="left">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (handleEditWidget) {
                          handleEditWidget(widget);
                        } else {
                          setOpenWidgetSetting(widget.id);
                        }
                      }}
                    >
                      <Settings2 className="w-5 h-5" />
                    </Button>
                  </DescriptionTooltip>
                  <DescriptionTooltip content="Hapus" side="left" className="bg-primary fill-primary text-white">
                    <Button
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveWidget(widget.id);
                      }}
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </DescriptionTooltip>
                </div>
              )}

              <div className="flex-1 p-2 flex justify-center items-center overflow-hidden min-h-0 min-w-0">
                <div className="w-full h-full min-h-[180px] min-w-[180px]">
                  <WidgetComponent
                    widget={widget}
                    timeRange={currentTimeRange}
                    dataCount={currentDataCount}
                    filterType={filterType}
                    isEditing={isEditing}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })
      .filter(Boolean);
  }, [
    effectiveLayouts,
    currentBreakpoint,
    items,
    isEditing,
    currentTimeRange,
    currentDataCount,
    filterType,
    handleEditWidget,
    handleRemoveWidget,
  ]);

  return (
    <div
      className="space-y-4 w-full h-auto min-h-0"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleAddWidgetDrop}
    >
      <ResponsiveGridLayout
        className={cn("layout", isEditing ? gridStyle : "")}
        style={
          isEditing
            ? {
                backgroundSize: `${100 / 12}% 50px`,
                backgroundPosition: "0 0",
              }
            : {}
        }
        layouts={effectiveLayouts}
        onLayoutChange={isEditing ? handleLayoutChange : undefined} // Disable layout change in static mode
        onBreakpointChange={handleBreakpointChange}
        onDrop={isEditing ? handleDrop : undefined}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 12, sm: 12, xs: 12, xxs: 12 }}
        rowHeight={40}
        margin={currentMargin} // Responsive margins based on breakpoint
        containerPadding={isEditing ? [5, 5] : [0, 0]} // Responsive padding
        measureBeforeMount={false}
        useCSSTransforms={true}
        isBounded={false}
        isResizable={isEditing}
        isDroppable={isEditing}
        isDraggable={isEditing}
        resizeHandles={availableHandles}
        droppingItem={{
          i: "__dropping-elem__",
          w: 4,
          h: 6,
          isResizable: true,
          isDraggable: true,
        }}
        draggableHandle=".drag-handle"
        preventCollision={!isEditing} 
        compactType={isEditing ? "vertical" : null}
        autoSize={true}
        allowOverlap={!isEditing}
      >
        {items.length === 0 && (
          <div
            key="empty"
            className="widget-info absolute top-1/2 text-center left-1/2 min-w-lg transform -translate-x-1/2 -translate-y-1/2 inset-0 flex flex-col items-center pointer-events-none select-none"
          >
            <h2 className="text-2xl font-bold mb-2 text-muted-foreground">
              Tambah widget baru
            </h2>
            <p className="text-muted-foreground text-balance">
              <b>Klik tombol +</b> atau <b>tarik</b> ke dalam kanvas.
            </p>
          </div>
        )}

        {/* Tampilkan widget static */}
        {gridItems}
      </ResponsiveGridLayout>
    </div>
  );
}

import { useRef, useState, useMemo, useCallback } from "react";
import { WidthProvider, Responsive } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

import { AreaChartWidget } from "@/components/custom/widgets/widget-component/charts/area";
import { BarChartWidget } from "@/components/custom/widgets/widget-component/charts/bar";
import { LineChartWidget } from "@/components/custom/widgets/widget-component/charts/line";
import { SwitchWidget } from "@/components/custom/widgets/widget-component/switch";
import { SliderWidget } from "@/components/custom/widgets/widget-component/slider";
import { Button } from "@/components/ui/button";
import { Trash2, Move, Settings2 } from "lucide-react";
import { errorToast } from "../other/toaster";
import { fetchFromBackend } from "@/lib/helper";
import {
  bootstrapWidths,
  cols,
  availableHandles,
  findAvailablePosition,
  generateWidgetLayout,
  getWidgetConstraints,
} from "@/lib/dashboard-utils";
import { cn } from "@/lib/utils";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import DescriptionTooltip from "@/components/custom/other/description-tooltip";
import { Pie } from "recharts";
import { PieChartWidget } from "./widget-component/charts/pie";

const ResponsiveGridLayout = WidthProvider(Responsive);

// Responsive margins configuration (Performance optimization from notes.txt)
const responsiveMargins = {
  lg: [10, 10], // Larger margins for desktop
  md: [8, 8], // Medium margins for tablet
  sm: [6, 6], // Smaller margins for mobile
  xs: [5, 5], // Minimal margins for small mobile
  xxs: [5, 5], // Minimal margins for very small screens
};

const gridStyle = `
  bg-background border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg min-h-[350px]
  relative overflow-hidden
  bg-[linear-gradient(to_right,rgba(156,163,175,0.15)_1px,transparent_1px),linear-gradient(to_bottom,rgba(156,163,175,0.15)_1px,transparent_1px)]
  dark:bg-[linear-gradient(to_right,rgba(75,85,99,0.2)_1px,transparent_1px),linear-gradient(to_bottom,rgba(75,85,99,0.2)_1px,transparent_1px)]
`;

const widgetComponents = {
  slider: SliderWidget,
  switch: SwitchWidget,
  area: AreaChartWidget,
  bar: BarChartWidget,
  line: LineChartWidget,
  pie: PieChartWidget,
};

// Optimized layout generation with memoization
const generateResponsiveLayouts = (items, existingLayouts = {}) => {
  const widths = bootstrapWidths;
  const cols = { lg: 12, md: 12, sm: 12, xs: 12, xxs: 12 };

  return Object.keys(widths).reduce((memo, breakpoint) => {
    const defaultWidth = widths[breakpoint];
    const colCount = cols[breakpoint];
    const existingLayoutForBreakpoint = existingLayouts[breakpoint] || [];

    memo[breakpoint] = items.map((widget, i) => {
      const constraints = getWidgetConstraints(widget.type, breakpoint);
      const existingItem = existingLayoutForBreakpoint.find(
        (item) => item.i === widget.id.toString()
      );

      const responsiveWidth = constraints.minW;
      const responsiveHeight = constraints.minH;

      if (existingItem) {
        return {
          ...existingItem,
          w: Math.max(constraints.minW, existingItem.w || responsiveWidth),
          h: Math.max(constraints.minH, existingItem.h || responsiveHeight),
          minW: constraints.minW,
          minH: constraints.minH,
          maxW: constraints.maxW,
          maxH: constraints.maxH,
          isResizable: constraints.isResizable,
        };
      }

      const x = (i * responsiveWidth) % colCount;
      const y = 0;

      return {
        i: widget.id.toString(),
        x,
        y,
        w: responsiveWidth,
        h: responsiveHeight,
        minW: constraints.minW,
        minH: constraints.minH,
        maxW: constraints.maxW,
        maxH: constraints.maxH,
        isResizable: constraints.isResizable,
      };
    });

    return memo;
  }, {});
};

export default function GridLayoutOptimized({
  items,
  setItems,
  layouts,
  setLayouts,
  onChartDrop,
  onLayoutChange,
  onBreakpointChange,
  isEditing = true,
  currentTimeRange = "1h",
  stageWidgetRemoval,
  removeWidgetFromDatabase,
  handleEditWidget,
}) {
  const [currentBreakpoint, setCurrentBreakpoint] = useState("lg");
  const [openWidgetSetting, setOpenWidgetSetting] = useState(null);
  const [forceRegenerate, setForceRegenerate] = useState(0);

  // Memoize effective layouts to prevent unnecessary recalculations (Performance optimization from notes.txt)
  const effectiveLayouts = useMemo(() => {
    const hasValidLayouts =
      layouts && typeof layouts === "object" && Object.keys(layouts).length > 0;

    if (items.length > 0) {
      // For static mode (non-editing), always use existing layouts from database if available
      // This prevents automatic layout regeneration that causes display issues after login
      if (!isEditing && hasValidLayouts) {
        // Debug layout dari DB
        // console.log('Database layouts:', layouts);

        // Validate layouts have all required breakpoints and widgets
        const validatedLayouts = {};
        const breakpoints = ["lg", "md", "sm", "xs", "xxs"];

        breakpoints.forEach((bp) => {
          validatedLayouts[bp] = layouts[bp] || [];

          // Ensure all current items exist in layout
          const layoutItemIds = validatedLayouts[bp].map((item) => item.i);
          const missingItems = items.filter(
            (item) => !layoutItemIds.includes(item.id.toString())
          );

          if (missingItems.length > 0) {
            // console.log(`Adding missing items to ${bp} layout:`, missingItems.map(i => i.id));
            // Only add missing items, don't regenerate existing ones
            missingItems.forEach((widget, idx) => {
              const constraints = getWidgetConstraints(widget.type, bp);
              const existingItemsCount = validatedLayouts[bp].length;
              validatedLayouts[bp].push({
                i: widget.id.toString(),
                x: 0,
                y: existingItemsCount * 6, // Stack missing items at bottom
                w: constraints.minW,
                h: constraints.minH,
                minW: constraints.minW,
                minH: constraints.minH,
                maxW: constraints.maxW,
                maxH: constraints.maxH,
                isResizable: false, // Static in non-editing mode
                isDraggable: false,
                static: true,
              });
            });
          }
        });

        // console.log('Final validated layouts for static mode:', validatedLayouts);
        return validatedLayouts;
      }

      // For editing mode, use responsive layout generation
      const responsiveLayouts = generateResponsiveLayouts(
        items,
        hasValidLayouts ? layouts : {}
      );
      return responsiveLayouts;
    }

    return {};
  }, [items, layouts, forceRegenerate, isEditing]);

  // Memoize responsive margins and padding based on current breakpoint
  const currentMargin = useMemo(
    () => responsiveMargins[currentBreakpoint] || responsiveMargins.lg,
    [currentBreakpoint]
  );

  // Optimized event handlers with useCallback (Performance optimization from notes.txt)
  const handleLayoutChange = useCallback(
    (layout, allLayouts) => {
      if (onLayoutChange) {
        const constrainedLayout = layout.map((item) => {
          const widget = items.find((w) => w.id.toString() === item.i);
          if (!widget) return item;

          const constraints = getWidgetConstraints(
            widget.type,
            currentBreakpoint
          );

          const validatedItem = {
            ...item,
            x: Number.isFinite(item.x) ? Math.max(0, item.x) : 0,
            y: Number.isFinite(item.y) ? Math.max(0, item.y) : 0,
            w: Number.isFinite(item.w)
              ? Math.max(constraints.minW, Math.min(constraints.maxW, item.w))
              : constraints.minW,
            h: Number.isFinite(item.h)
              ? Math.max(constraints.minH, Math.min(constraints.maxH, item.h))
              : constraints.minH,
            minW: constraints.minW,
            minH: constraints.minH,
            maxW: constraints.maxW,
            maxH: constraints.maxH,
            isResizable: isEditing && constraints.isResizable,
            isDraggable: isEditing,
            static: !isEditing,
          };

          return validatedItem;
        });

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
            validatedAllLayouts[breakpoint] = [];
          }
        });

        validatedAllLayouts[currentBreakpoint] = constrainedLayout;
        onLayoutChange(constrainedLayout, validatedAllLayouts);
      }
    },
    [items, currentBreakpoint, isEditing, onLayoutChange]
  );

  const handleBreakpointChange = useCallback(
    (breakpoint) => {
      // Debug lebar responsive
      // console.log('Bootstrap widths:', bootstrapWidths);

      setCurrentBreakpoint(breakpoint);
      setForceRegenerate((prev) => prev + 1);

      if (onBreakpointChange) {
        onBreakpointChange(breakpoint);
      }
    },
    [onBreakpointChange]
  );

  // Optimized drop handlers
  const handleDrop = useCallback(
    (layout, layoutItem, e) => {
      e.preventDefault();
      e.stopPropagation();

      const chartType = e.dataTransfer.getData("type");

      if (layoutItem && chartType) {
        const constraints = getWidgetConstraints(chartType, currentBreakpoint);

        const validatedLayoutItem = {
          ...layoutItem,
          x: Math.max(0, Math.round(layoutItem.x || 0)),
          y: Math.max(0, Math.round(layoutItem.y || 0)),
          w: Math.max(
            constraints.minW,
            Math.round(layoutItem.w || constraints.minW)
          ),
          h: Math.max(
            constraints.minH,
            Math.round(layoutItem.h || constraints.minH)
          ),
          minW: constraints.minW,
          minH: constraints.minH,
          maxW: constraints.maxW,
          maxH: constraints.maxH,
          isResizable: constraints.isResizable,
          isDraggable: true,
          static: false,
        };

        if (onChartDrop) {
          onChartDrop(chartType, validatedLayoutItem);
        }
      }
    },
    [currentBreakpoint, onChartDrop]
  );

  const handleAddWidgetDrop = useCallback(
    (e) => {
      e.preventDefault();
      const chartType = e.dataTransfer.getData("type");
      if (chartType && onChartDrop) {
        const constraints = getWidgetConstraints(chartType, currentBreakpoint);

        onChartDrop(chartType, {
          x: 0,
          y: Infinity,
          w: constraints.minW,
          h: constraints.minH,
          minW: constraints.minW,
          minH: constraints.minH,
          maxW: constraints.maxW,
          maxH: constraints.maxH,
          isResizable: constraints.isResizable,
          isDraggable: true,
          static: false,
          resizeHandles: availableHandles,
        });
      }
    },
    [currentBreakpoint, onChartDrop]
  );

  // Optimized remove widget handler with useCallback
  const handleRemoveWidget = useCallback(
    async (widgetId) => {
      if (isEditing && stageWidgetRemoval) {
        stageWidgetRemoval(widgetId);
      } else if (removeWidgetFromDatabase) {
        await removeWidgetFromDatabase(widgetId);
      } else {
        try {
          const updatedItems = items.filter((item) => item.id !== widgetId);
          setItems(updatedItems);

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

  // Memoize grid items for performance optimization (from notes.txt)
  const gridItems = useMemo(() => {
    return (effectiveLayouts[currentBreakpoint] || [])
      .map((layoutItem) => {
        const widget = items.find((w) => w.id.toString() === layoutItem.i);
        if (!widget) return null;

        const WidgetComponent = widgetComponents[widget.type];
        if (!WidgetComponent) {
          return (
            <div key={layoutItem.i}>
              <div className="text-red-500 p-4">
                Tipe widget "{widget.type}" tidak ditemukan
              </div>
            </div>
          );
        }

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
    handleEditWidget,
    handleRemoveWidget,
  ]);

  return (
    <div
      className="space-y-4"
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
        onDrop={isEditing ? handleDrop : undefined} // Disable drop in static mode
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 12, sm: 12, xs: 12, xxs: 12 }}
        rowHeight={40}
        margin={currentMargin} // Responsive margins based on breakpoint
        containerPadding={isEditing ? [5, 5] : [0, 0]} // Responsive padding
        measureBeforeMount={false}
        useCSSTransforms={true}
        isBounded={true}
        isResizable={isEditing}
        isDroppable={isEditing}
        isDraggable={isEditing}
        resizeHandles={availableHandles}
        droppingItem={{
          i: "__dropping-elem__",
          w: 4,
          h: 6,
        }}
        draggableHandle=".drag-handle"
        preventCollision={!isEditing} // Prevent collision in static mode for exact positioning
        compactType={isEditing ? "vertical" : null} // No compacting in static mode
        autoSize={false}
        allowOverlap={!isEditing} // Allow overlap in static mode to preserve exact positions
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
              <b>Klik tombol +</b> atau <b>tarik</b> kedalam kanvas.
            </p>
          </div>
        )}

        {/* Tampilkan widget static */}
        {gridItems}
      </ResponsiveGridLayout>
    </div>
  );
}

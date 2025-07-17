import { useRef, useState } from "react";
import { WidthProvider, Responsive } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

import { AreaChartWidget } from "@/components/custom/widgets/widget-component/charts/area";
import { BarChartWidget } from "@/components/custom/widgets/widget-component/charts/bar";
import { LineChartWidget } from "@/components/custom/widgets/widget-component/charts/line";
import { SwitchWidget } from "@/components/custom/widgets/widget-component/switch";
import { SliderWidget } from "@/components/custom/widgets/widget-component/slider";
// import { PieChartWidget } from "@/components/custom/widgets/widget-component/charts/pie";
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
} from "@/lib/dashboard-utils";
import { cn } from "@/lib/utils";

const ResponsiveGridLayout = WidthProvider(Responsive);

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
  // pie: PieChartWidget,
};

// Function to get widget constraints based on type
const getWidgetConstraints = (widgetType) => {
  const chartTypes = ['area', 'bar', 'line', 'pie'];
  const controlTypes = ['switch', 'slider'];
  
  if (chartTypes.includes(widgetType)) {
    return {
      minW: 6,    // Minimum 6 columns for charts
      minH: 6,    // Minimum 6 rows for charts  
      maxW: 12,   // Maximum full width
      maxH: 12,   // Maximum height
      isResizable: true
    };
  } else if (controlTypes.includes(widgetType)) {
    return {
      minW: 3,    // Minimum 3 columns for controls
      minH: 3,    // Minimum 3 rows for controls
      maxW: 6,    // Maximum 6 columns for controls
      maxH: 4,    // Maximum 4 rows for controls
      isResizable: true
    };
  }
  
  // Default constraints
  return {
    minW: 4,
    minH: 4,
    maxW: 12,
    maxH: 10,
    isResizable: true
  };
};

export default function GridLayout({
  items,
  setItems,
  layouts,
  setLayouts,
  onChartDrop,
  onLayoutChange,
  onBreakpointChange,
  isEditing = true,
  // Staging functions
  stageWidgetRemoval,
  removeWidgetFromDatabase,
  handleEditWidget,
}) {
  const [currentBreakpoint, setCurrentBreakpoint] = useState("lg");
  const [openWidgetSetting, setOpenWidgetSetting] = useState(null);

  // Handle layout change
  const handleLayoutChange = (layout, allLayouts) => {
    console.log('Layout changed:', { layout, allLayouts, currentBreakpoint });
    if (onLayoutChange) {
      // Apply constraints to the new layout
      const constrainedLayout = layout.map((item) => {
        const widget = items.find(w => w.id.toString() === item.i);
        if (!widget) return item;
        
        const constraints = getWidgetConstraints(widget.type);
        return {
          ...item,
          w: Math.max(constraints.minW, Math.min(constraints.maxW, item.w)),
          h: Math.max(constraints.minH, Math.min(constraints.maxH, item.h)),
          minW: constraints.minW,
          minH: constraints.minH,
          maxW: constraints.maxW,
          maxH: constraints.maxH,
          isResizable: isEditing && constraints.isResizable,
          isDraggable: isEditing,
          static: !isEditing,
        };
      });
      
      onLayoutChange(constrainedLayout, {
        ...allLayouts,
        [currentBreakpoint]: constrainedLayout
      });
    }
  };

  // Handle breakpoint change
  const handleBreakpointChange = (breakpoint) => {
    setCurrentBreakpoint(breakpoint);
    if (onBreakpointChange) {
      onBreakpointChange(breakpoint);
    }
  };

  // Handle drop from external element
  const handleDrop = (layout, layoutItem, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('===== DROP DEBUG =====');
    console.log('Current breakpoint:', currentBreakpoint);
    console.log('Event details:', {
      clientX: e.clientX,
      clientY: e.clientY,
      target: e.target,
      currentTarget: e.currentTarget
    });
    console.log('Layout item received (RAW):', layoutItem);
    console.log('Current layout (RAW):', layout);
    
    // Validasi dan perbaiki layoutItem
    if (layoutItem) {
      // Ambil tipe widget dari dataTransfer
      const chartType = e.dataTransfer.getData("type");
      const constraints = getWidgetConstraints(chartType);
      
      // Pastikan posisi tidak undefined atau NaN
      const validatedLayoutItem = {
        ...layoutItem,
        x: Math.max(0, Math.round(layoutItem.x || 0)),
        y: Math.max(0, Math.round(layoutItem.y || 0)),
        w: Math.max(constraints.minW, Math.round(layoutItem.w || bootstrapWidths[currentBreakpoint] || constraints.minW)),
        h: Math.max(constraints.minH, Math.round(layoutItem.h || constraints.minH || 4)),
        minW: constraints.minW,
        minH: constraints.minH,
        maxW: constraints.maxW,
        maxH: constraints.maxH,
        isResizable: constraints.isResizable,
        // Ensure proper positioning
        isDraggable: true,
        static: false
      };
      
      console.log('Validated layout item:', validatedLayoutItem);
      console.log('Widget constraints applied:', constraints);
      console.log('======================');
      
      if (chartType && onChartDrop) {
        console.log('Calling onChartDrop with:', { chartType, dropItem: validatedLayoutItem });
        onChartDrop(chartType, validatedLayoutItem);
      }
    }
  };

  // Handle adding widget via drag and drop dari area lain (fallback)
  const handleAddWidgetDrop = (e) => {
    e.preventDefault();
    const chartType = e.dataTransfer.getData("type");
    if (chartType && onChartDrop) {
      const constraints = getWidgetConstraints(chartType);
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
  };

  // Remove widget function
  const handleRemoveWidget = async (widgetId) => {
    if (isEditing && stageWidgetRemoval) {
      // In edit mode: stage the removal
      stageWidgetRemoval(widgetId);
    } else if (removeWidgetFromDatabase) {
      // Not in edit mode: remove directly from database
      await removeWidgetFromDatabase(widgetId);
    } else {
      // Fallback to original behavior
      try {
        const res = await fetchFromBackend(`/widget/${widgetId}`, {
          method: "DELETE",
        });

        if (!res.ok) throw new Error("Failed to delete widget");

        // Update local state immediately
        const updatedItems = items.filter((item) => item.id !== widgetId);
        setItems(updatedItems);

        // Update layouts by removing this widget from all breakpoints
        const updatedLayouts = { ...layouts };
        Object.keys(updatedLayouts).forEach((bp) => {
          updatedLayouts[bp] = updatedLayouts[bp].filter(
            (item) => item.i !== widgetId.toString()
          );
        });
        setLayouts(updatedLayouts);
      } catch (error) {
        console.error("Error removing widget:", error);
        errorToast("Gagal menghapus widget");
      }
    }
  };

  return (
    <div
      className="space-y-4"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleAddWidgetDrop}
    >
      <ResponsiveGridLayout
        className={cn("layout", isEditing ? gridStyle : "")}
        style={isEditing ? {
          backgroundSize: `${100/12}% 40px`, // 12 columns, 40px row height (30px + 10px margin)
          backgroundPosition: '0 0'
        } : {}}
        layouts={layouts}
        onLayoutChange={handleLayoutChange}
        onBreakpointChange={handleBreakpointChange}
        onDrop={handleDrop}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={cols}
        rowHeight={30}
        margin={[10, 10]}
        containerPadding={isEditing ? [5,5] : [0, 0]}
        measureBeforeMount={false}
        useCSSTransforms={true}
        isBounded={true}
        isResizable={isEditing}
        isDroppable={isEditing}
        isDraggable={isEditing}
        resizeHandles={availableHandles}
        droppingItem={{
          i: "__dropping-elem__",
          w: 6,  // Default width for dropping items
          h: 6,  // Default height for dropping items
          minW: 3,
          minH: 3,
          maxW: 12,
          maxH: 12,
          isResizable: true,
          isDraggable: true,
          static: false,
        }}
        draggableHandle=".drag-handle"
        preventCollision={true}
        compactType={null}
        verticalCompact={false}
        autoSize={true}
      >
          {items.length === 0 && (
            <div
              key="empty"
              className="widget-info absolute top-1/2 text-center left-1/2 min-w-lg transform -translate-x-1/2 -translate-y-1/2 inset-0 flex flex-col items-center pointer-events-none select-none z-10"
            >
              <h2 className="text-2xl font-bold mb-2 text-muted-foreground">
                Tambah widget baru
              </h2>
              <p className="text-muted-foreground text-balance">
                <b>Klik tombol +</b> atau <b>tarik</b> kedalam kanvas.
              </p>
            </div>
          )}
        {/* Get layout items for current breakpoint */}
        {(layouts[currentBreakpoint] || []).map((layoutItem) => {
          // Find corresponding widget by matching widget.id with layout item.i
          const widget = items.find((w) => w.id.toString() === layoutItem.i);

          if (!widget) {
            // Widget tidak ditemukan - mungkin sudah dihapus dari database
            return null;
          }

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

          // Get constraints for this widget type
          const widgetConstraints = getWidgetConstraints(widget.type);
          
          // Apply constraints to layout item following official documentation
          const constrainedLayoutItem = {
            ...layoutItem,
            // Apply min/max constraints
            minW: widgetConstraints.minW,
            minH: widgetConstraints.minH,
            maxW: widgetConstraints.maxW,
            maxH: widgetConstraints.maxH,
            // Ensure current dimensions meet minimum requirements and are valid numbers
            w: Math.max(widgetConstraints.minW, Number.isFinite(layoutItem.w) ? layoutItem.w : widgetConstraints.minW),
            h: Math.max(widgetConstraints.minH, Number.isFinite(layoutItem.h) ? layoutItem.h : widgetConstraints.minH),
            // Ensure position values are valid numbers
            x: Number.isFinite(layoutItem.x) ? layoutItem.x : 0,
            y: Number.isFinite(layoutItem.y) ? layoutItem.y : 0,
            isResizable: isEditing && widgetConstraints.isResizable // Only resizable in edit mode
          };

          // Debug logging untuk constraint
          console.log(`Widget ${widget.type} (${widget.id}):`, {
            original: layoutItem,
            constraints: widgetConstraints,
            final: constrainedLayoutItem,
            isEditing,
            isResizable: constrainedLayoutItem.isResizable
          });

          return (
            <div 
              key={layoutItem.i} 
              className="relative group"
              data-grid={constrainedLayoutItem}
            >
              <div
                className={`h-full w-full bg-white dark:bg-gray-800 rounded-sm shadow-sm flex flex-col overflow-hidden relative group ${
                  isEditing
                    ? "border-2 border-dashed border-red-300"
                    : "border border-gray-200 dark:border-gray-600"
                }`}
              >
                {isEditing && (
                  <>
                    <div className="drag-handle cursor-move absolute inset-0 bg-background/80 flex flex-col font-semibold gap-3 items-center justify-center opacity-0 max-lg:opacity-100 group-hover:opacity-100 transition-opacity z-5 pointer-events-none group-hover:pointer-events-auto">
                      <Move className="w-10 h-10 text-foreground drop-shadow-lg" />
                      <span>Tekan dan tahan</span>
                    </div>
                  </>
                )}

                <div className="flex font-semibold pt-3 items-center justify-center px-2 py-1">
                  {widget.description || "Widget Content"}
                </div>

                {isEditing && (
                  <div className="absolute top-3 right-3 flex gap-3 opacity-0 max-lg:opacity-100 group-hover:opacity-100 transition-opacity z-10">
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

                    <Button
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveWidget(widget.id);
                      }}
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                )}

                {/* Chart Content */}
                <div className="flex-1 p-2 flex justify-center items-center overflow-hidden min-h-0 min-w-0">
                  <div className="w-full h-full min-h-[120px] min-w-[120px]">
                    <WidgetComponent widget={widget} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        </ResponsiveGridLayout>
    </div>
  );
}

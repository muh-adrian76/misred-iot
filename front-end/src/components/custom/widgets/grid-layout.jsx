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
      minH: 6,    // Minimum 6 rows for charts (consistent with dashboard-logic)
      maxW: 12,   // Maximum full width
      maxH: 12,   // Maximum height (consistent with dashboard-logic)
      isResizable: true
    };
  } else if (controlTypes.includes(widgetType)) {
    return {
      minW: 3,    // Minimum 3 columns for controls
      minH: 3,    // Minimum 3 rows for controls (consistent with dashboard-logic)
      maxW: 6,    // Maximum 6 columns for controls
      maxH: 3,    // Maximum 4 rows for controls (consistent with dashboard-logic)
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

// Bootstrap-style responsive widths (optimized for better responsiveness)
const getBootstrapWidths = () => ({
  lg: 3,   // Large screens: 4 items per row (3 cols each) - 25% width
  md: 4,   // Medium screens: 3 items per row (4 cols each) - 33% width  
  sm: 6,   // Small screens: 2 items per row (6 cols each) - 50% width
  xs: 12,  // Extra small screens: 1 item per row (12 cols each) - 100% width
  xxs: 12  // Extra extra small: 1 item per row (12 cols each) - 100% width
});

// Generate responsive layouts using bootstrap-style approach (following react-grid-layout docs)
const generateResponsiveLayouts = (items, existingLayouts = {}) => {
  const widths = getBootstrapWidths();
  const cols = { lg: 12, md: 12, sm: 12, xs: 12, xxs: 12 };
  
  // console.log('generateResponsiveLayouts called with:', { 
  //   itemsCount: items.length, 
  //   existingLayoutKeys: Object.keys(existingLayouts) 
  // });
  
  return Object.keys(widths).reduce((memo, breakpoint) => {
    const defaultWidth = widths[breakpoint];
    const colCount = cols[breakpoint];
    const existingLayoutForBreakpoint = existingLayouts[breakpoint] || [];
    
    // console.log(`=== Processing breakpoint: ${breakpoint} ===`);
    // console.log(`Default width for ${breakpoint}:`, defaultWidth);
    // console.log(`Column count:`, colCount);
    // console.log(`Existing items for ${breakpoint}:`, existingLayoutForBreakpoint.length);
    
    // Create layout array for this breakpoint following react-grid-layout pattern
    memo[breakpoint] = items.map((widget, i) => {
      const constraints = getWidgetConstraints(widget.type);
      
      // Check if this widget already has a layout position for this breakpoint
      const existingItem = existingLayoutForBreakpoint.find(item => item.i === widget.id.toString());
      
      // Calculate responsive width based on widget type and breakpoint FIRST
      let responsiveWidth = defaultWidth;
      
      // Charts need minimum space but adapt to breakpoint
      if (constraints.minW > defaultWidth) {
        // For small screens, allow charts to take full width
        if (breakpoint === 'xs' || breakpoint === 'xxs') {
          responsiveWidth = 12; // Full width on mobile
        } else if (breakpoint === 'sm') {
          responsiveWidth = Math.max(6, constraints.minW); // At least half width on small tablets
        } else {
          responsiveWidth = constraints.minW; // Use minimum width on larger screens
        }
      }
      
      if (existingItem) {
        // Use existing position but ensure constraints are met and responsive width is applied
        // console.log(`Using existing layout for widget ${widget.id} at ${breakpoint}:`, existingItem);
        
        return {
          ...existingItem,
          // Use responsive width for current breakpoint
          w: responsiveWidth,
          h: Math.max(constraints.minH, existingItem.h),
          minW: constraints.minW,
          minH: constraints.minH,
          maxW: constraints.maxW,
          maxH: constraints.maxH,
          isResizable: constraints.isResizable,
        };
      }
      
      // Generate new position for new widgets following bootstrap pattern
      
      // Calculate responsive height
      let responsiveHeight = constraints.minH;
      
      // Use bootstrap-style positioning: (i * defaultWidth) % cols for x, let collision algo figure out y
      const x = (i * defaultWidth) % colCount;
      const y = 0; // Let react-grid-layout's collision algorithm figure this out
      
      // console.log(`New widget ${widget.id} (${widget.type}) at ${breakpoint}:`, {
      //   defaultWidth,
      //   responsiveWidth,
      //   responsiveHeight,
      //   position: { x, y },
      //   index: i
      // });
      
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
        isResizable: constraints.isResizable
      };
    });
    
    // console.log(`=== Finished processing breakpoint: ${breakpoint} ===`);
    // console.log(`Generated ${memo[breakpoint].length} layout items for ${breakpoint}`);
    // console.log(`Sample item:`, memo[breakpoint][0]);
    // console.log('================================================');
    
    return memo;
  }, {});
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
  currentTimeRange = "1h",
  // Staging functions
  stageWidgetRemoval,
  removeWidgetFromDatabase,
  handleEditWidget,
}) {
  const [currentBreakpoint, setCurrentBreakpoint] = useState("lg");
  const [openWidgetSetting, setOpenWidgetSetting] = useState(null);
  const [forceRegenerate, setForceRegenerate] = useState(0);

  // Generate bootstrap-style layouts if layouts are empty or missing
  const getEffectiveLayouts = () => {
    // Check if we have valid existing layouts
    const hasValidLayouts = layouts && typeof layouts === 'object' && Object.keys(layouts).length > 0;
    
    // Always regenerate layouts to ensure proper responsiveness
    if (items.length > 0) {
      // console.log('Generating responsive bootstrap layouts for', items.length, 'items');
      // console.log('Current breakpoint:', currentBreakpoint);
      // console.log('Force regenerate counter:', forceRegenerate);
      // console.log('Existing layouts:', layouts);
      
      // Pass existing layouts to preserve any positions that might exist, but allow regeneration
      const responsiveLayouts = generateResponsiveLayouts(items, hasValidLayouts ? layouts : {});
      // console.log('Generated responsive layouts:', responsiveLayouts);
      return responsiveLayouts;
    }
    
    // Fallback to empty layouts
    return {};
  };

  const effectiveLayouts = getEffectiveLayouts();

  // Handle layout change
  const handleLayoutChange = (layout, allLayouts) => {
    // console.log('Layout change detected:', { 
    //   currentBreakpoint, 
    //   layoutItems: layout.length, 
    //   allLayoutKeys: Object.keys(allLayouts) 
    // });
    
    if (onLayoutChange) {
      // Apply constraints to the new layout
      const constrainedLayout = layout.map((item) => {
        const widget = items.find(w => w.id.toString() === item.i);
        if (!widget) return item;
        
        const constraints = getWidgetConstraints(widget.type);
        const constrainedItem = {
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
        
        // console.log(`Widget ${widget.id} (${widget.type}) layout update:`, {
        //   original: { x: item.x, y: item.y, w: item.w, h: item.h },
        //   constrained: { x: constrainedItem.x, y: constrainedItem.y, w: constrainedItem.w, h: constrainedItem.h }
        // });
        
        return constrainedItem;
      });
      
      // Update all layouts with the constrained layout for current breakpoint
      const updatedAllLayouts = {
        ...allLayouts,
        [currentBreakpoint]: constrainedLayout
      };
      
      // console.log('Calling onLayoutChange with updated layouts');
      onLayoutChange(constrainedLayout, updatedAllLayouts);
    }
  };

  // Handle breakpoint change
  const handleBreakpointChange = (breakpoint) => {
    // console.log('=== BREAKPOINT CHANGE ===');
    // console.log('Old breakpoint:', currentBreakpoint);
    // console.log('New breakpoint:', breakpoint);
    // console.log('Bootstrap widths:', getBootstrapWidths());
    // console.log('Current layout for new breakpoint:', effectiveLayouts[breakpoint]);
    // console.log('=========================');
    
    setCurrentBreakpoint(breakpoint);
    
    // Force regeneration when breakpoint changes
    setForceRegenerate(prev => prev + 1);
    
    if (onBreakpointChange) {
      onBreakpointChange(breakpoint);
    }
  };

  // Handle drop from external element
  const handleDrop = (layout, layoutItem, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Get chart type first
    const chartType = e.dataTransfer.getData("type");
    
    // Validate and fix layoutItem
    if (layoutItem && chartType) {
      const constraints = getWidgetConstraints(chartType);
      const bootstrapWidths = getBootstrapWidths();
      
      // Use bootstrap width for the current breakpoint
      const defaultWidth = Math.max(constraints.minW, bootstrapWidths[currentBreakpoint] || constraints.minW);
      
      const validatedLayoutItem = {
        ...layoutItem,
        x: Math.max(0, Math.round(layoutItem.x || 0)),
        y: Math.max(0, Math.round(layoutItem.y || 0)),
        w: Math.max(constraints.minW, Math.round(layoutItem.w || defaultWidth)),
        h: Math.max(constraints.minH, Math.round(layoutItem.h || constraints.minH)),
        minW: constraints.minW,
        minH: constraints.minH,
        maxW: constraints.maxW,
        maxH: constraints.maxH,
        isResizable: constraints.isResizable,
        isDraggable: true,
        static: false
      };
      
      // console.log('Validated layout item:', validatedLayoutItem);
      // console.log('Widget constraints applied:', constraints);
      // console.log('Bootstrap width used:', defaultWidth);
      // console.log('======================');
      
      if (onChartDrop) {
        // console.log('Calling onChartDrop with:', { chartType, dropItem: validatedLayoutItem });
        onChartDrop(chartType, validatedLayoutItem);
      }
    }
  };

  // Handle adding widget via drag and drop from other areas (fallback)
  const handleAddWidgetDrop = (e) => {
    e.preventDefault();
    const chartType = e.dataTransfer.getData("type");
    if (chartType && onChartDrop) {
      const constraints = getWidgetConstraints(chartType);
      const bootstrapWidths = getBootstrapWidths();
      const defaultWidth = Math.max(constraints.minW, bootstrapWidths[currentBreakpoint] || constraints.minW);
      
      onChartDrop(chartType, {
        x: 0,
        y: Infinity, // Let collision algorithm place it
        w: defaultWidth,
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

  // Debug logging for layout troubleshooting
  // console.log('=== GRID LAYOUT RENDER DEBUG ===');
  // console.log('Items count:', items.length);
  // console.log('Current breakpoint:', currentBreakpoint);
  // console.log('Props layouts:', layouts);
  // console.log('Effective layouts:', effectiveLayouts);
  // console.log('Items details:', items.map(item => ({ id: item.id, type: item.type, description: item.description })));
  // if (effectiveLayouts[currentBreakpoint]) {
  //   console.log(`Layout for ${currentBreakpoint}:`, effectiveLayouts[currentBreakpoint]);
  // }
  // console.log('================================');

  return (
    <div
      className="space-y-4"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleAddWidgetDrop}
    >
      <ResponsiveGridLayout
        className={cn("layout", isEditing ? gridStyle : "")}
        style={isEditing ? {
          backgroundSize: `${100/12}% 50px`, // 12 columns, 50px row height (40px + 10px margin)
          backgroundPosition: '0 0'
        } : {}}
        layouts={effectiveLayouts}
        onLayoutChange={handleLayoutChange}
        onBreakpointChange={handleBreakpointChange}
        onDrop={handleDrop}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 12, sm: 12, xs: 12, xxs: 12 }}
        rowHeight={40}
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
        {/* Get layout items for current breakpoint */}
        {(effectiveLayouts[currentBreakpoint] || []).map((layoutItem) => {
          // Find corresponding widget by matching widget.id with layout item.i
          const widget = items.find((w) => w.id.toString() === layoutItem.i);

          if (!widget) {
            // Widget tidak ditemukan - mungkin sudah dihapus dari database
            // console.log(`Widget not found for layout item ${layoutItem.i}`);
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
          // console.log(`Widget ${widget.type} (${widget.id}) layout:`, {
          //   original: layoutItem,
          //   constraints: widgetConstraints,
          //   final: constrainedLayoutItem,
          //   isEditing,
          //   currentBreakpoint
          // });

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

                {/* Old title */}
                {/* <div className="flex font-semibold pt-3 items-center justify-center px-2 py-1">
                  {widget.description || "Widget Content"}
                </div> */}

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
        })}
        </ResponsiveGridLayout>
    </div>
  );
}

// Bootstrap widths for responsive grid (FIXED - matched with constraints)
export const bootstrapWidths = { 
  lg: 4,    // Match chart minW=4
  md: 6,    // Match chart minW=6 
  sm: 12,   // Match chart minW=12
  xs: 12,   // Match chart minW=12
  xxs: 12   // Match chart minW=12
};

// Grid columns for different breakpoints
export const cols = { lg: 12, md: 12, sm: 12, xs: 12, xxs: 12 };

// Available resize handles - all 4 corners for better UX
export const availableHandles = ["sw", "nw", "se", "ne"];

// Generate initial responsive layouts
export function generateInitialLayouts(count) {
  const layoutPerBreakpoint = {};
  const breakpoints = Object.keys(bootstrapWidths);

  for (const bp of breakpoints) {
    const width = bootstrapWidths[bp];
    const columns = cols[bp];
    layoutPerBreakpoint[bp] = Array.from({ length: count }).map((_, i) => ({
      i: i.toString(),
      x: (i * width) % columns,
      y: Math.floor(i / (columns / width)) * 6, // Use height of 6 to match widget constraints
      w: width,
      h: 6, // Default height of 6 rows to match minimum chart height
      resizeHandles: availableHandles
    }));
  }

  return layoutPerBreakpoint;
}

// Generate responsive layout for single widget
export function generateWidgetLayout(widgetId, position = {}) {
  const responsiveLayout = {};
  const breakpoints = Object.keys(bootstrapWidths);
  
  for (const bp of breakpoints) {
    responsiveLayout[bp] = {
      i: widgetId.toString(),
      x: position.x || 0,
      y: position.y || Infinity,
      w: bootstrapWidths[bp],
      h: position.h || 6, // Default height of 6 rows
      resizeHandles: availableHandles
    };
  }
  
  return responsiveLayout;
}

// Find available position for new widget
export function findAvailablePosition(existingLayouts, breakpoint = 'lg') {
  const width = bootstrapWidths[breakpoint];
  const existingItems = existingLayouts[breakpoint] || [];
  
  for (let y = 0; y < 50; y++) {
    for (let x = 0; x <= cols[breakpoint] - width; x += width) {
      const position = { x, y, w: width, h: 4 };
      const hasCollision = existingItems.some(item => 
        item.x < position.x + position.w &&
        item.x + item.w > position.x &&
        item.y < position.y + position.h &&
        item.y + item.h > position.y
      );
      if (!hasCollision) {
        return position;
      }
    }
  }
  
  // If no position found, place at bottom
  return { 
    x: 0, 
    y: Math.max(0, ...existingItems.map(item => item.y + item.h)), 
    w: width, 
    h: 6  // Default height of 6 rows
  };
}

// Get widget constraints based on type and breakpoint (RESPONSIVE - FIXED)
export function getWidgetConstraints(widgetType, breakpoint = 'lg') {
  const chartTypes = ["area", "bar", "line", "pie"];
  const controlTypes = ["switch", "slider"];
  
  if (chartTypes.includes(widgetType)) {
    // Chart responsive constraints (matched with bootstrapWidths)
    switch (breakpoint) {
      case 'lg':
        return {
          minW: 4,     // Match bootstrap width for charts
          minH: 6, 
          maxW: 12,
          maxH: 12,
          isResizable: true,
        };
      case 'md':
        return {
          minW: 6,     // Match bootstrap width for charts
          minH: 6, 
          maxW: 12,
          maxH: 12,
          isResizable: true,
        };
      case 'sm':
      case 'xs':
      case 'xxs':
        return {
          minW: 12,    // Match bootstrap width for charts (full width on mobile)
          minH: 6, 
          maxW: 12,
          maxH: 12,
          isResizable: true,
        };
      default:
        return {
          minW: 4, 
          minH: 6, 
          maxW: 12,
          maxH: 12,
          isResizable: true,
        };
    }
  } else if (controlTypes.includes(widgetType)) {
    // Control responsive constraints (smaller widgets)
    switch (breakpoint) {
      case 'lg':
        return {
          minW: 2,     // Smaller controls on large screens
          minH: 4, 
          maxW: 6,     // Allow more flexible sizing 
          maxH: 8, 
          isResizable: true,
        };
      case 'md':
        return {
          minW: 3,     // Medium controls on medium screens
          minH: 4, 
          maxW: 8,
          maxH: 8, 
          isResizable: true,
        };
      case 'sm':
        return {
          minW: 6,     // Half width on small screens
          minH: 4, 
          maxW: 12, 
          maxH: 8, 
          isResizable: true,
        };
      case 'xs':
      case 'xxs':
        return {
          minW: 12,    // Full width on mobile
          minH: 4, 
          maxW: 12, 
          maxH: 8, 
          isResizable: true,
        };
      default:
        return {
          minW: 2,
          minH: 4, 
          maxW: 6, 
          maxH: 8, 
          isResizable: true,
        };
    }
  }

  // Default constraints (fallback)
  return {
    minW: 4,
    minH: 4,
    maxW: 12,
    maxH: 10,
    isResizable: true,
  };
}

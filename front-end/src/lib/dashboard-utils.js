// Bootstrap widths for responsive grid (optimized for better responsiveness)
export const bootstrapWidths = { lg: 3, md: 4, sm: 6, xs: 12, xxs: 12 };

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

// Konfigurasi lebar Bootstrap untuk tata letak grid responsif
// TETAP (FIXED) - sudah disesuaikan dengan batasan widget untuk konsistensi
export const bootstrapWidths = { 
  lg: 4,    // Desktop: 4 kolom (3 widget per baris)
  md: 6,    // Tablet: 6 kolom (2 widget per baris) 
  sm: 12,   // Mobile: 12 kolom (1 widget per baris)
  xs: 12,   // Layar sangat kecil: 12 kolom
  xxs: 12   // Layar ekstra kecil: 12 kolom
};

// Jumlah kolom grid untuk setiap breakpoint (total 12 kolom, sistem grid 12-kolom)
export const cols = { lg: 12, md: 12, sm: 12, xs: 12, xxs: 12 };

// Handle pengubahan ukuran yang tersedia - semua 4 sudut untuk pengalaman pengguna yang baik
export const availableHandles = ["s", "w", "e", "n", "sw", "nw", "se", "ne"];

// Hasilkan layout responsif awal untuk banyak widget
// Mengatur posisi otomatis berdasarkan jumlah widget dan breakpoint
export function generateInitialLayouts(count) {
  const layoutPerBreakpoint = {};
  const breakpoints = Object.keys(bootstrapWidths);

  for (const bp of breakpoints) {
    const width = bootstrapWidths[bp];
    const columns = cols[bp];
    layoutPerBreakpoint[bp] = Array.from({ length: count }).map((_, i) => ({
      i: i.toString(),
      x: (i * width) % columns, // Posisi otomatis dalam grid
      y: Math.floor(i / (columns / width)) * 6, // Tinggi bawaan 6 baris
      w: width,
      h: 6, // Tinggi bawaan sesuai tinggi minimum grafik
      resizeHandles: availableHandles
    }));
  }

  return layoutPerBreakpoint;
}

// Hasilkan layout responsif untuk satu widget dengan posisi kustom
export function generateWidgetLayout(widgetId, position = {}) {
  const responsiveLayout = {};
  const breakpoints = Object.keys(bootstrapWidths);
  
  for (const bp of breakpoints) {
    responsiveLayout[bp] = {
      i: widgetId.toString(),
      x: position.x || 0,
      y: position.y || Infinity, // Infinity = tempatkan otomatis di bagian bawah
      w: bootstrapWidths[bp],
      h: position.h || 6, // Tinggi bawaan 6 baris
      resizeHandles: availableHandles
    };
  }
  
  return responsiveLayout;
}

// Cari posisi kosong yang tersedia untuk widget baru
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
  
  // Jika tidak ada posisi yang ditemukan, letakkan di bagian bawah
  return { 
    x: 0, 
    y: Math.max(0, ...existingItems.map(item => item.y + item.h)), 
    w: width, 
    h: 6  // Tinggi bawaan 6 baris
  };
}

// Dapatkan batasan widget berdasarkan tipe dan breakpoint (Responsif - Tetap)
export function getWidgetConstraints(widgetType, breakpoint = 'lg') {
  const chartTypes = ["area", "bar", "line", "pie"];
  const controlTypes = ["switch", "slider"];
  const monitorTypes = ["gauge", "text"];
  
  if (chartTypes.includes(widgetType)) {
    // Batas responsif untuk grafik (disesuaikan dengan bootstrapWidths)
    switch (breakpoint) {
      case 'lg':
        return {
          minW: 4,     // Sesuai lebar bootstrap untuk grafik
          minH: 6, 
          maxW: 12,
          maxH: 12,
          isResizable: true,
        };
      case 'md':
        return {
          minW: 6,     // Sesuai lebar bootstrap untuk grafik
          minH: 6, 
          maxW: 12,
          maxH: 12,
          isResizable: true,
        };
      case 'sm':
      case 'xs':
      case 'xxs':
        return {
          minW: 12,    // Lebar penuh di perangkat mobile
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
    // Batas responsif untuk kontrol (widget lebih kecil)
    switch (breakpoint) {
      case 'lg':
        return {
          minW: 2,     // Kontrol lebih kecil di layar besar
          minH: 4, 
          maxW: 6,     // Ukuran lebih fleksibel 
          maxH: 8, 
          isResizable: true,
        };
      case 'md':
        return {
          minW: 3,     // Sedikit lebih besar di layar sedang
          minH: 4, 
          maxW: 8,
          maxH: 8, 
          isResizable: true,
        };
      case 'sm':
        return {
          minW: 6,     // Setengah lebar di layar kecil
          minH: 4, 
          maxW: 12, 
          maxH: 8, 
          isResizable: true,
        };
      case 'xs':
      case 'xxs':
        return {
          minW: 12,    // Lebar penuh di perangkat mobile
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
  } else if (monitorTypes.includes(widgetType)) {
    // Widget monitor (gauge, teks) - batas ukuran menengah
    switch (breakpoint) {
      case 'lg':
        return {
          minW: 3,     // Ukuran menengah untuk gauge/teks di layar besar
          minH: 5, 
          maxW: 8,     // Tidak terlalu besar namun fleksibel
          maxH: 10, 
          isResizable: true,
        };
      case 'md':
        return {
          minW: 4,     // Sedikit lebih besar di layar sedang
          minH: 5, 
          maxW: 10,
          maxH: 10, 
          isResizable: true,
        };
      case 'sm':
        return {
          minW: 6,     // Setengah lebar di layar kecil
          minH: 5, 
          maxW: 12, 
          maxH: 10, 
          isResizable: true,
        };
      case 'xs':
      case 'xxs':
        return {
          minW: 12,    // Lebar penuh di perangkat mobile
          minH: 5, 
          maxW: 12, 
          maxH: 10, 
          isResizable: true,
        };
      default:
        return {
          minW: 3,
          minH: 5, 
          maxW: 8, 
          maxH: 10, 
          isResizable: true,
        };
    }
  }

  // Batasan bawaan (fallback)
  return {
    minW: 4,
    minH: 4,
    maxW: 12,
    maxH: 10,
    isResizable: true,
  };
}

// RippleButton Component - Custom button dengan efek ripple animation saat diklik
// Menggunakan React forwardRef untuk mendukung ref forwarding ke elemen button
//
// ===== CONTOH PENGGUNAAN UNTUK DEVELOPER =====
//
// 1. Basic Usage - Ripple button sederhana:
//    <RippleButton onClick={() => console.log('clicked')}>
//      Click Me
//    </RippleButton>
//
// 2. Custom Ripple Color - Ganti warna ripple:
//    <RippleButton 
//      rippleColor="#3b82f6" 
//      className="bg-blue-500 text-white border-blue-600"
//    >
//      Blue Ripple
//    </RippleButton>
//
// 3. Custom Duration - Kontrol kecepatan animasi:
//    <RippleButton 
//      duration="800ms" 
//      rippleColor="#10b981"
//      className="bg-green-500 text-white border-green-600"
//    >
//      Slow Ripple
//    </RippleButton>
//
// 4. With Icons - Kombinasi dengan icon:
//    <RippleButton 
//      rippleColor="#f59e0b"
//      className="bg-yellow-500 text-white border-yellow-600 flex items-center gap-2"
//    >
//      <Star className="w-4 h-4" />
//      Star Button
//    </RippleButton>
//
// 5. Form Integration - Dalam form dengan validation:
//    <RippleButton 
//      type="submit"
//      disabled={!isValid}
//      rippleColor="#22c55e"
//      className="bg-emerald-500 disabled:bg-gray-400"
//    >
//      Submit Form
//    </RippleButton>
//
// 6. Dark Mode - Responsive color untuk theme:
//    <RippleButton 
//      rippleColor="rgba(255,255,255,0.3)"
//      className="bg-gray-800 dark:bg-white text-white dark:text-gray-800 border-gray-700 dark:border-gray-300"
//    >
//      Theme Adaptive
//    </RippleButton>
//
// ============================================

"use client";;
import { cn } from "@/lib/utils";
import React, { useEffect, useState } from "react";

// Komponen RippleButton dengan efek ripple animation
export const RippleButton = React.forwardRef((
  {
    className, // Custom CSS classes untuk styling tambahan
    children, // Konten yang ditampilkan di dalam button
    rippleColor = "#ffffff", // Warna efek ripple, default putih
    duration = "600ms", // Durasi animasi ripple, default 600ms
    onClick, // Handler function saat button diklik
    ...props // Props lainnya yang akan diteruskan ke elemen button
  },
  ref, // Ref yang akan diteruskan ke elemen button
) => {
  // State untuk menyimpan array ripple effects yang aktif
  const [buttonRipples, setButtonRipples] = useState([]);

  // Handler untuk menghandle click event pada button
  const handleClick = (event) => {
    createRipple(event); // Buat efek ripple baru
    onClick?.(event); // Panggil onClick handler jika ada
  };

  // Function untuk membuat efek ripple baru berdasarkan posisi klik
  const createRipple = (event) => {
    const button = event.currentTarget; // Dapatkan elemen button yang diklik
    const rect = button.getBoundingClientRect(); // Dapatkan posisi dan ukuran button
    const size = Math.max(rect.width, rect.height); // Ukuran ripple berdasarkan dimensi terbesar button
    const x = event.clientX - rect.left - size / 2; // Posisi X ripple relatif terhadap button (terpusat pada klik)
    const y = event.clientY - rect.top - size / 2; // Posisi Y ripple relatif terhadap button (terpusat pada klik)

    // Buat object ripple baru dengan posisi, ukuran, dan key unik
    const newRipple = { x, y, size, key: Date.now() };
    // Tambahkan ripple baru ke state array
    setButtonRipples((prevRipples) => [...prevRipples, newRipple]);
  };

  // useEffect untuk menghapus ripple setelah durasi animasi selesai
  useEffect(() => {
    if (buttonRipples.length > 0) {
      const lastRipple = buttonRipples[buttonRipples.length - 1]; // Dapatkan ripple terakhir
      const timeout = setTimeout(() => {
        // Hapus ripple dari state setelah durasi animasi
        setButtonRipples((prevRipples) =>
          prevRipples.filter((ripple) => ripple.key !== lastRipple.key));
      }, parseInt(duration)); // Convert duration string ke number
      return () => clearTimeout(timeout); // Cleanup timeout saat component unmount atau dependency berubah
    }
  }, [buttonRipples, duration]); // Dependencies: buttonRipples array dan duration

  return (
    // Elemen button dengan styling dan overflow hidden untuk ripple effect
    <button
      className={cn(
        "relative flex cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 bg-background px-4 py-2 text-center text-primary",
        className // Merge dengan custom className jika ada
      )}
      onClick={handleClick} // Handler untuk click event
      ref={ref} // Forward ref ke elemen button
      {...props}> {/* Spread props lainnya */}
      {/* Konten button dengan z-index tinggi agar tampil di atas ripple */}
      <div className="relative z-10">{children}</div>
      {/* Container untuk semua ripple effects */}
      <span className="pointer-events-none absolute inset-0">
        {/* Render setiap ripple dalam buttonRipples array */}
        {buttonRipples.map((ripple) => (
          <span
            className="absolute animate-rippling rounded-full bg-background opacity-30" // CSS classes untuk animasi ripple
            key={ripple.key} // Unique key untuk React rendering
            style={{
              width: `${ripple.size}px`, // Lebar ripple
              height: `${ripple.size}px`, // Tinggi ripple  
              top: `${ripple.y}px`, // Posisi Y ripple
              left: `${ripple.x}px`, // Posisi X ripple
              backgroundColor: rippleColor, // Warna ripple dari props
              transform: `scale(0)`, // Initial scale 0 untuk animasi
            }} />
        ))}
      </span>
    </button>
  );
});

// Set display name untuk debugging dan dev tools
RippleButton.displayName = "RippleButton";

// ===== DEMO COMPONENT UNTUK TESTING =====
// Uncomment code dibawah untuk testing dan development

/*
// Demo component untuk testing RippleButton dengan berbagai konfigurasi
export const RippleButtonDemo = () => {
  return (
    <div className="p-8 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <h1 className="text-2xl font-bold text-center mb-8">RippleButton Demo</h1>
      
      <div className="max-w-4xl mx-auto space-y-8">
        // Basic Examples
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Basic Examples</h2>
          <div className="flex flex-wrap gap-4">
            <RippleButton onClick={() => alert('Basic ripple!')}>
              Default Ripple
            </RippleButton>
            
            <RippleButton 
              rippleColor="#3b82f6"
              className="bg-blue-500 text-white border-blue-600"
              onClick={() => console.log('Blue ripple clicked')}
            >
              Blue Ripple
            </RippleButton>
            
            <RippleButton 
              duration="300ms"
              rippleColor="#ef4444"
              className="bg-red-500 text-white border-red-600"
            >
              Fast Red Ripple
            </RippleButton>
          </div>
        </div>

        // Advanced Examples
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Advanced Examples</h2>
          <div className="flex flex-wrap gap-4">
            <RippleButton 
              duration="1000ms"
              rippleColor="#10b981"
              className="bg-green-500 text-white border-green-600 px-6 py-3"
            >
              Slow Green Ripple
            </RippleButton>
            
            <RippleButton 
              rippleColor="rgba(255,255,255,0.4)"
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 px-6 py-3"
            >
              Gradient Button
            </RippleButton>
            
            <RippleButton 
              rippleColor="#000000"
              className="bg-white text-black border-black hover:bg-gray-50"
              onClick={() => alert('Dark ripple on light button')}
            >
              Dark Ripple
            </RippleButton>
          </div>
        </div>

        // Size Variations
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Size Variations</h2>
          <div className="flex flex-wrap items-center gap-4">
            <RippleButton 
              rippleColor="#f59e0b"
              className="bg-yellow-500 text-white border-yellow-600 px-2 py-1 text-sm"
            >
              Small
            </RippleButton>
            
            <RippleButton 
              rippleColor="#8b5cf6"
              className="bg-purple-500 text-white border-purple-600 px-4 py-2"
            >
              Medium
            </RippleButton>
            
            <RippleButton 
              rippleColor="#06b6d4"
              className="bg-cyan-500 text-white border-cyan-600 px-6 py-3 text-lg"
            >
              Large
            </RippleButton>
          </div>
        </div>

        // Usage Instructions
        <div className="mt-8 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h3 className="font-semibold mb-2">How to Use:</h3>
          <pre className="text-sm bg-gray-100 dark:bg-gray-700 p-3 rounded overflow-x-auto">
{`// Import the component
import { RippleButton } from "@/components/custom/buttons/ripple-button";

// Basic usage
<RippleButton onClick={handleClick}>
  Click Me
</RippleButton>

// With custom ripple color and duration
<RippleButton 
  rippleColor="#3b82f6"
  duration="800ms"
  className="bg-blue-500 text-white"
>
  Custom Ripple
</RippleButton>`}
          </pre>
        </div>
      </div>
    </div>
  );
};
*/

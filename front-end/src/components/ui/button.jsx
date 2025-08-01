// Button Component - UI button dengan berbagai variant termasuk ripple effect
// Menggunakan class-variance-authority untuk variant management dan Radix Slot untuk composition
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center font-semibold gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline hover:border hover:border-primary",
        ripple:
          "relative overflow-hidden border-2 bg-background text-primary hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        xs: "h-8 rounded-md gap-1.5 px-2 has-[>svg]:px-2",
        sm: "h-9 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        iconSm: "size-7"
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

// Hook untuk ripple effect logic - digunakan hanya untuk variant ripple
const useRipple = (rippleColor = "#ffffff", duration = "600ms") => {
  // State untuk menyimpan array ripple effects yang aktif
  const [buttonRipples, setButtonRipples] = useState([]);

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

  return { buttonRipples, createRipple };
};

function Button({
  className,
  variant,
  size,
  asChild = false,
  rippleColor = "#ffffff", // Props khusus untuk ripple variant
  rippleDuration = "600ms", // Props khusus untuk ripple variant
  onClick,
  children,
  ...props
}) {
  const Comp = asChild ? Slot : "button"
  
  // Gunakan ripple hook hanya jika variant adalah ripple
  const { buttonRipples, createRipple } = variant === "ripple" 
    ? useRipple(rippleColor, rippleDuration) 
    : { buttonRipples: [], createRipple: null };

  // Handler untuk click event
  const handleClick = (event) => {
    // Buat ripple effect jika variant adalah ripple
    if (variant === "ripple" && createRipple) {
      createRipple(event);
    }
    // Panggil onClick handler yang diberikan
    onClick?.(event);
  };

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      onClick={handleClick} // Gunakan custom click handler
      {...props}>
      {/* Conditional wrapper hanya untuk variant ripple */}
      {variant === "ripple" ? (
        <>
          {/* Konten button dengan z-index tinggi untuk variant ripple */}
          <div className="relative z-10">
            {children}
          </div>
          
          {/* Render ripple effects */}
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
        </>
      ) : (
        /* Untuk variant selain ripple, render children langsung tanpa wrapper */
        children
      )}
    </Comp>
  );
}

export { Button, buttonVariants }

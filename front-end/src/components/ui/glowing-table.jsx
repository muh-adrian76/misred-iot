"use client";

import { memo, useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { animate } from "motion/react";

// Konfigurasi untuk berbagai jenis elemen tabel
const TABLE_PRESETS = {
  // Untuk baris tabel
  row: {
    spread: 25,
    proximity: 40,
    inactiveZone: 0.15,
    borderWidth: 1,
    movementDuration: 1.5
  },
  // Untuk kolom header
  header: {
    spread: 30,
    proximity: 48,
    inactiveZone: 0.1,
    borderWidth: 1.5,
    movementDuration: 2
  },
  // Untuk cell individual
  cell: {
    spread: 20,
    proximity: 32,
    inactiveZone: 0.2,
    borderWidth: 0.8,
    movementDuration: 1.2
  },
  // Untuk cell yang sedang selected
  selectedCell: {
    spread: 35,
    proximity: 56,
    inactiveZone: 0.05,
    borderWidth: 2,
    movementDuration: 1.8
  }
};

const GlowingTable = memo(({
  children,
  type = "row", // "row", "header", "cell", "selectedCell"
  blur = 0,
  inactiveZone = null,
  proximity = null,
  spread = null,
  variant = "default",
  glow = false,
  className,
  movementDuration = null,
  borderWidth = null,
  disabled = false,
  isSelected = false, // Untuk cell yang sedang selected
  isHovered = false,  // Untuk interaksi hover
  customGradient = null, // Custom gradient untuk variasi warna
  ...props
}) => {
  const containerRef = useRef(null);
  const lastPosition = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef(0);

  // Gunakan preset berdasarkan type atau custom values
  const preset = TABLE_PRESETS[isSelected ? 'selectedCell' : type] || TABLE_PRESETS.row;
  const finalSpread = spread ?? preset.spread;
  const finalProximity = proximity ?? preset.proximity;
  const finalInactiveZone = inactiveZone ?? preset.inactiveZone;
  const finalBorderWidth = borderWidth ?? preset.borderWidth;
  const finalMovementDuration = movementDuration ?? preset.movementDuration;

  const handleMove = useCallback((e) => {
    if (!containerRef.current || disabled) return;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      const element = containerRef.current;
      if (!element) return;

      const { left, top, width, height } = element.getBoundingClientRect();
      const mouseX = e?.x ?? lastPosition.current.x;
      const mouseY = e?.y ?? lastPosition.current.y;

      if (e) {
        lastPosition.current = { x: mouseX, y: mouseY };
      }

      const center = [left + width * 0.5, top + height * 0.5];
      const distanceFromCenter = Math.hypot(mouseX - center[0], mouseY - center[1]);
      const inactiveRadius = 0.5 * Math.min(width, height) * finalInactiveZone;

      if (distanceFromCenter < inactiveRadius) {
        element.style.setProperty("--active", "0");
        return;
      }

      const isActive =
        mouseX > left - finalProximity &&
        mouseX < left + width + finalProximity &&
        mouseY > top - finalProximity &&
        mouseY < top + height + finalProximity;

      // Untuk selected cell, selalu aktif meskipun mouse tidak dekat
      const shouldBeActive = isSelected || isActive;
      element.style.setProperty("--active", shouldBeActive ? "1" : "0");

      if (!shouldBeActive) return;

      const currentAngle =
        parseFloat(element.style.getPropertyValue("--start")) || 0;
      let targetAngle =
        (180 * Math.atan2(mouseY - center[1], mouseX - center[0])) /
          Math.PI +
        90;

      const angleDiff = ((targetAngle - currentAngle + 180) % 360) - 180;
      const newAngle = currentAngle + angleDiff;

      animate(currentAngle, newAngle, {
        duration: finalMovementDuration,
        ease: [0.16, 1, 0.3, 1],
        onUpdate: (value) => {
          element.style.setProperty("--start", String(value));
        },
      });
    });
  }, [finalInactiveZone, finalProximity, finalMovementDuration, disabled, isSelected]);

  useEffect(() => {
    if (disabled) return;

    const handleScroll = () => handleMove();
    const handlePointerMove = (e) => handleMove(e);

    window.addEventListener("scroll", handleScroll, { passive: true });
    document.body.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener("scroll", handleScroll);
      document.body.removeEventListener("pointermove", handlePointerMove);
    };
  }, [handleMove, disabled]);

  // Gradient variations untuk berbagai kondisi
  const getGradient = () => {
    if (customGradient) return customGradient;
    
    if (isSelected) {
      // Gradient khusus untuk selected cell (lebih vibrant)
      return `radial-gradient(circle, #ff6b9d 15%, #ff6b9d00 25%),
              radial-gradient(circle at 40% 40%, #ffd93d 10%, #ffd93d00 20%),
              radial-gradient(circle at 60% 60%, #6bcf7f 15%, #6bcf7f00 25%), 
              radial-gradient(circle at 40% 60%, #4dabf7 15%, #4dabf700 25%),
              repeating-conic-gradient(
                from 236.84deg at 50% 50%,
                #ff6b9d 0%,
                #ffd93d calc(25% / var(--repeating-conic-gradient-times)),
                #6bcf7f calc(50% / var(--repeating-conic-gradient-times)), 
                #4dabf7 calc(75% / var(--repeating-conic-gradient-times)),
                #ff6b9d calc(100% / var(--repeating-conic-gradient-times))
              )`;
    } else if (type === 'header') {
      // Gradient untuk header (lebih elegan)
      return `radial-gradient(circle, #a855f7 12%, #a855f700 22%),
              radial-gradient(circle at 40% 40%, #3b82f6 8%, #3b82f600 18%),
              radial-gradient(circle at 60% 60%, #06b6d4 12%, #06b6d400 22%), 
              radial-gradient(circle at 40% 60%, #8b5cf6 12%, #8b5cf600 22%),
              repeating-conic-gradient(
                from 236.84deg at 50% 50%,
                #a855f7 0%,
                #3b82f6 calc(25% / var(--repeating-conic-gradient-times)),
                #06b6d4 calc(50% / var(--repeating-conic-gradient-times)), 
                #8b5cf6 calc(75% / var(--repeating-conic-gradient-times)),
                #a855f7 calc(100% / var(--repeating-conic-gradient-times))
              )`;
    } else {
      // Gradient default untuk rows dan cells
      return `radial-gradient(circle, #dd7bbb 10%, #dd7bbb00 20%),
              radial-gradient(circle at 40% 40%, #d79f1e 5%, #d79f1e00 15%),
              radial-gradient(circle at 60% 60%, #5a922c 10%, #5a922c00 20%), 
              radial-gradient(circle at 40% 60%, #4c7894 10%, #4c789400 20%),
              repeating-conic-gradient(
                from 236.84deg at 50% 50%,
                #dd7bbb 0%,
                #d79f1e calc(25% / var(--repeating-conic-gradient-times)),
                #5a922c calc(50% / var(--repeating-conic-gradient-times)), 
                #4c7894 calc(75% / var(--repeating-conic-gradient-times)),
                #dd7bbb calc(100% / var(--repeating-conic-gradient-times))
              )`;
    }
  };

  return (
    <div className="relative" {...props}>
      {/* Fallback border untuk disabled state */}
      <div
        className={cn(
          "pointer-events-none absolute -inset-px rounded-[inherit] border opacity-0 transition-opacity",
          glow && "opacity-100",
          variant === "white" && "border-white",
          disabled && "opacity-20",
          isSelected && !disabled && "opacity-40 border-blue-400"
        )} 
      />
      
      {/* Main glowing effect container */}
      <div
        ref={containerRef}
        style={{
          "--blur": `${blur}px`,
          "--spread": finalSpread,
          "--start": "0",
          "--active": isSelected ? "1" : "0",
          "--glowingeffect-border-width": `${finalBorderWidth}px`,
          "--repeating-conic-gradient-times": "5",
          "--gradient": variant === "white"
            ? `repeating-conic-gradient(
                from 236.84deg at 50% 50%,
                var(--black),
                var(--black) calc(25% / var(--repeating-conic-gradient-times))
              )`
            : getGradient()
        }}
        className={cn(
          "pointer-events-none absolute inset-0 rounded-[inherit] opacity-100 transition-opacity",
          glow && "opacity-100",
          blur > 0 && "blur-[var(--blur)]",
          className,
          disabled && "!hidden"
        )}
      >
        <div
          className={cn(
            "glow-table",
            "rounded-[inherit]",
            'after:content-[""] after:rounded-[inherit] after:absolute after:inset-[calc(-1*var(--glowingeffect-border-width))]',
            "after:[border:var(--glowingeffect-border-width)_solid_transparent]",
            "after:[background:var(--gradient)] after:[background-attachment:fixed]",
            "after:opacity-[var(--active)] after:transition-opacity",
            type === 'cell' ? "after:duration-200" : "after:duration-300",
            "after:[mask-clip:padding-box,border-box]",
            "after:[mask-composite:intersect]",
            "after:[mask-image:linear-gradient(#0000,#0000),conic-gradient(from_calc((var(--start)-var(--spread))*1deg),#00000000_0deg,#fff,#00000000_calc(var(--spread)*2deg))]"
          )}
        />
      </div>
      
      {/* Content wrapper */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
});

GlowingTable.displayName = "GlowingTable";

export { GlowingTable, TABLE_PRESETS };

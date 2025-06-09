"use client";
import { cn } from "@/lib/utils";
import React, { useEffect, useRef } from "react";

export const GlowArea = (props) => {
  const { className = "", size = 300, ...rest } = props;
  const element = useRef(null);
  const frameId = useRef(null);
  const latestCoords = useRef(null);

  const updateGlow = () => {
    if (latestCoords.current && element.current) {
      element.current.style.setProperty("--glow-x", `${latestCoords.current.x}px`);
      element.current.style.setProperty("--glow-y", `${latestCoords.current.y}px`);
      frameId.current = null;
    }
  };

  const handleMouseMove = (e) => {
    const bounds = e.currentTarget.getBoundingClientRect();
    latestCoords.current = {
      x: e.clientX - bounds.left,
      y: e.clientY - bounds.top,
    };

    if (!frameId.current) {
      frameId.current = requestAnimationFrame(() => updateGlow());
    }
  };

  const handleMouseLeave = (e) => {
    e.currentTarget.style.removeProperty("--glow-x");
    e.currentTarget.style.removeProperty("--glow-y");
  };

  return (
    <div
      ref={element}
      style={{
        position: "relative",
        "--glow-size": `${size}px`,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(className, "")}
      {...rest}
    />
  );
};

GlowArea.displayName = "GlowArea";

export const Glow = (props) => {
  const { className, color = "blue", children, ...rest } = props;
  const element = useRef(null); // Removed <HTMLDivElement>

  useEffect(() => {
    if (element.current) {
      element.current.style.setProperty("--glow-top", `${element.current.offsetTop}px`);
      element.current.style.setProperty("--glow-left", `${element.current.offsetLeft}px`);
    }
  }, []);

  return (
    <div ref={element} className={cn(className, "relative")}>
      <div
        {...rest}
        style={{
          backgroundImage: `radial-gradient(
            var(--glow-size) var(--glow-size) at calc(var(--glow-x, -99999px) - var(--glow-left, 0px))
            calc(var(--glow-y, -99999px) - var(--glow-top, 0px)),
            ${color} 0%,
            transparent 100%
          )`,
        }}
        className={cn(
          className,
          "absolute pointer-events-none inset-0 dark:mix-blend-lighten mix-blend-multiply after:content-[''] after:absolute after:bg-background/90 after:inset-0.25 after:rounded-[inherit]"
        )}
      ></div>
      {children}
    </div>
  );
};

Glow.displayName = "Glow";
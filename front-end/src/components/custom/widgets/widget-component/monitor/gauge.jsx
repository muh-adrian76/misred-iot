import React, { useState, useEffect } from "react";

const StatusGaugeChart = ({
  // Data props
  value = 0,
  total = 100,
  title = "Sensor Reading",
  unit = "",
  
  // Visual props
  size = 240,
  strokeWidth = 12,
  ranges = [
    { min: 0, max: 25, label: "Low", color: "#ef4444", status: "critical" },
    { min: 25, max: 50, label: "Medium", color: "#f97316", status: "warning" },
    { min: 50, max: 75, label: "High", color: "#eab308", status: "ok" },
    { min: 75, max: 100, label: "Very High", color: "#22c55e", status: "excellent" },
  ],
  
  // Animation props
  animated = true,
  animationDuration = 2000,
  glowEffect = true,
  
  // Widget props for integration
  className = "",
}) => {
  const [animatedValue, setAnimatedValue] = useState(0);
  const [currentRange, setCurrentRange] = useState(null);

  useEffect(() => {
    // Find current range based on percentage
    const percentage = Math.min((parseFloat(value) / total) * 100, 100);
    const range = ranges.find((r) => percentage >= r.min && percentage <= r.max);
    setCurrentRange(range);

    if (animated) {
      const startTime = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / animationDuration, 1);

        // Smooth easing animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentValue = value * easeOutQuart;

        setAnimatedValue(currentValue);

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      requestAnimationFrame(animate);
    } else {
      setAnimatedValue(value);
    }
  }, [value, animated, animationDuration, ranges, total]);

  const center = size / 2;
  const radius = (size - strokeWidth - 40) / 2;
  const circumference = 2 * Math.PI * radius;
  const startAngle = -140; // Start from top-left
  const endAngle = 140; // End at top-right
  const totalAngle = endAngle - startAngle;
  const progress = Math.min(animatedValue / total, 1);

  // Calculate stroke dash array for progress
  const progressLength = (totalAngle / 360) * circumference * progress;
  const totalLength = (totalAngle / 360) * circumference;

  // Create gradient stops based on ranges
  const createGradientStops = () => {
    return ranges.map((range, index) => {
      const position = ((range.min + range.max) / 2) * 0.8; // Adjust for better gradient
      return (
        <stop key={index} offset={`${position}%`} stopColor={range.color} />
      );
    });
  };

  // Convert angle to coordinates
  const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  // Create SVG path for the arc
  const createArcPath = (centerX, centerY, radius, startAngle, endAngle) => {
    const start = polarToCartesian(centerX, centerY, radius, endAngle);
    const end = polarToCartesian(centerX, centerY, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    return [
      "M",
      start.x,
      start.y,
      "A",
      radius,
      radius,
      0,
      largeArcFlag,
      0,
      end.x,
      end.y,
    ].join(" ");
  };

  const backgroundPath = createArcPath(
    center,
    center,
    radius,
    startAngle,
    endAngle
  );

  const gradientId = `gradient-${Math.random().toString(36).substr(2, 9)}`;
  const glowId = `glow-${Math.random().toString(36).substr(2, 9)}`;

  // Get status info
  const getStatusInfo = () => {
    if (!currentRange) return { label: "Unknown", color: "#64748b" };
    return {
      label: currentRange.label,
      color: currentRange.color,
      status: currentRange.status,
    };
  };

  const statusInfo = getStatusInfo();

  // Format value display
  const formatValue = (val) => {
    const numVal = parseFloat(val);
    return isNaN(numVal) ? "0" : numVal.toFixed(1);
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`} style={{ height: "100%" }}>
      {/* Main Gauge */}
      <div
        className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-full shadow-2xl flex-shrink-0"
        style={{ width: size, height: size }}
      >
        {/* Radial lines background effect */}
        <div className="absolute inset-0 rounded-full opacity-10">
          <div className="absolute inset-4 rounded-full border border-slate-600"></div>
          <div className="absolute inset-8 rounded-full border border-slate-600"></div>
        </div>

        <svg
          width={size}
          height={size}
          className="absolute inset-0"
          style={{ transform: "rotate(-90deg)" }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              {createGradientStops()}
            </linearGradient>
            {glowEffect && (
              <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            )}
          </defs>

          {/* Background track */}
          <path
            d={backgroundPath}
            fill="none"
            stroke="rgba(148, 163, 184, 0.2)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            transform={`translate(10, 10)`}
          />

          {/* Progress arc */}
          <path
            d={backgroundPath}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${progressLength} ${totalLength}`}
            filter={glowEffect ? `url(#${glowId})` : undefined}
            transform={`translate(10, 10)`}
            style={{
              transition: animated ? "none" : "stroke-dasharray 0.5s ease",
            }}
          />

          {/* Value indicator dot */}
          {progress > 0 && (
            <circle
              cx={
                polarToCartesian(
                  center,
                  center,
                  radius,
                  startAngle + totalAngle * progress
                ).x
              }
              cy={
                polarToCartesian(
                  center,
                  center,
                  radius,
                  startAngle + totalAngle * progress
                ).y
              }
              r="6"
              fill="white"
              stroke={statusInfo.color}
              strokeWidth="2"
              filter={glowEffect ? `url(#${glowId})` : undefined}
            />
          )}
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
          <div className="text-2xl md:text-3xl font-bold mb-1">
            {formatValue(animatedValue)}
            {unit && <span className="text-sm md:text-lg text-slate-400 ml-1">{unit}</span>}
          </div>
          <div className="text-xs text-slate-400 mb-2 text-center px-2">{title}</div>
          <div
            className="px-2 py-1 rounded-full text-xs font-medium"
            style={{
              backgroundColor: `${statusInfo.color}20`,
              color: statusInfo.color,
              border: `1px solid ${statusInfo.color}40`,
            }}
          >
            {statusInfo.label}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusGaugeChart;

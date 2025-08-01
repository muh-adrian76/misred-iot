import React, { useState, useEffect } from 'react';
import { Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const SimpleSensorCard = ({
  title = "Sensor Reading",
  value = "0",
  unit = "",
  icon: CustomIcon = Activity,
  maxValue = 100,
  thresholds = [25, 50, 75, 100],
  precision = 0,
  trend = null,
  className = "",
  accentColor = "blue"
}) => {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  const formatValue = (val) => {
    const numVal = parseFloat(val);
    return isNaN(numVal) ? val : numVal.toFixed(precision);
  };

  const getProgress = () => {
    return Math.min((parseFloat(value) / maxValue) * 100, 100);
  };

  const getTrendIcon = () => {
    switch (trend) {
      case "up": 
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case "down": 
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      case "stable": 
        return <Minus className="w-4 h-4 text-gray-500" />;
      default: 
        return null;
    }
  };

  const getActiveThresholds = () => {
    const currentValue = parseFloat(value);
    return thresholds.map(threshold => currentValue >= threshold);
  };

  const activeThresholds = getActiveThresholds();

  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'bg-blue-100 text-blue-600',
      progress: 'stroke-blue-500',
      active: 'bg-blue-500',
      inactive: 'bg-gray-200'
    },
    green: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: 'bg-green-100 text-green-600',
      progress: 'stroke-green-500',
      active: 'bg-green-500',
      inactive: 'bg-gray-200'
    },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      icon: 'bg-purple-100 text-purple-600',
      progress: 'stroke-purple-500',
      active: 'bg-purple-500',
      inactive: 'bg-gray-200'
    },
    orange: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      icon: 'bg-orange-100 text-orange-600',
      progress: 'stroke-orange-500',
      active: 'bg-orange-500',
      inactive: 'bg-gray-200'
    }
  };

  const colors = colorClasses[accentColor] || colorClasses.blue;

  return (
    <div className={`
      w-72 h-80 rounded-2xl border-2 bg-white
      ${colors.bg} ${colors.border}
      shadow-lg hover:shadow-xl transition-shadow duration-300
      ${className}
    `}>
      {/* Content */}
      <div className="p-6 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${colors.icon}`}>
              <CustomIcon className="w-5 h-5" />
            </div>
            <span className="text-gray-700 font-medium text-base">{title}</span>
          </div>
          {trend && (
            <div className="flex items-center">
              {getTrendIcon()}
            </div>
          )}
        </div>

        {/* Main Value */}
        <div className="flex-1 flex flex-col justify-center items-center mb-6">
          <div className="text-center mb-4">
            <div className="text-gray-500 text-xs mb-2 uppercase tracking-wider font-medium">
              Current Reading
            </div>
            <div className="text-gray-900 font-bold text-5xl">
              {formatValue(displayValue)}
            </div>
            {unit && (
              <div className="text-gray-600 text-lg font-medium mt-1">
                {unit}
              </div>
            )}
          </div>

          {/* Progress Ring */}
          <div className="relative w-24 h-24 mb-4">
            <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
              {/* Background ring */}
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="#e5e7eb"
                strokeWidth="6"
                fill="none"
              />
              {/* Progress ring */}
              <circle
                cx="50"
                cy="50"
                r="45"
                className={colors.progress}
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - getProgress() / 100)}`}
                style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-gray-600 text-sm font-semibold">
                {Math.round(getProgress())}%
              </span>
            </div>
          </div>
        </div>

        {/* Threshold Indicators */}
        <div className="space-y-2">
          <div className="flex justify-between text-gray-500 text-xs font-medium">
            {thresholds.map((threshold, index) => (
              <span key={index}>{threshold}</span>
            ))}
          </div>
          <div className="flex gap-1">
            {thresholds.map((threshold, index) => (
              <div
                key={index}
                className={`
                  flex-1 h-2 rounded-full transition-all duration-300
                  ${activeThresholds[index] ? colors.active : colors.inactive}
                `}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Demo Component
const SimpleSensorDemo = () => {
  const [steps, setSteps] = useState(6054);
  const [temperature, setTemperature] = useState(24.5);
  const [humidity, setHumidity] = useState(67);

  useEffect(() => {
    const interval = setInterval(() => {
      setSteps(prev => prev + Math.floor(Math.random() * 5));
      setTemperature(prev => Math.max(0, prev + (Math.random() - 0.5) * 1));
      setHumidity(prev => Math.max(0, Math.min(100, prev + (Math.random() - 0.5) * 3)));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Sensor Dashboard
        </h1>
        
        <div className="flex flex-wrap justify-center gap-8">
          <SimpleSensorCard
            title="Steps"
            value={steps}
            maxValue={10000}
            thresholds={[2000, 4000, 6000, 8000]}
            precision={0}
            trend={steps > 6000 ? "up" : "stable"}
            accentColor="blue"
          />
          
          <SimpleSensorCard
            title="Temperature"
            value={temperature}
            unit="°C"
            maxValue={50}
            thresholds={[10, 20, 30, 40]}
            precision={1}
            trend={temperature > 25 ? "up" : temperature < 20 ? "down" : "stable"}
            accentColor="orange"
          />
          
          <SimpleSensorCard
            title="Humidity"
            value={humidity}
            unit="%"
            maxValue={100}
            thresholds={[25, 50, 75, 100]}
            precision={0}
            trend={humidity > 70 ? "up" : humidity < 50 ? "down" : "stable"}
            accentColor="green"
          />
        </div>

        <div className="mt-12 bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Cara Penggunaan:</h2>
          <div className="text-gray-600 space-y-2 text-sm">
            <p>• <code className="bg-gray-100 px-2 py-1 rounded text-xs">title</code> - Judul sensor</p>
            <p>• <code className="bg-gray-100 px-2 py-1 rounded text-xs">value</code> - Nilai sensor saat ini</p>
            <p>• <code className="bg-gray-100 px-2 py-1 rounded text-xs">unit</code> - Satuan pengukuran</p>
            <p>• <code className="bg-gray-100 px-2 py-1 rounded text-xs">maxValue</code> - Nilai maksimum untuk progress ring</p>
            <p>• <code className="bg-gray-100 px-2 py-1 rounded text-xs">thresholds</code> - Array nilai ambang batas</p>
            <p>• <code className="bg-gray-100 px-2 py-1 rounded text-xs">accentColor</code> - Warna tema (blue, green, purple, orange)</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleSensorDemo;
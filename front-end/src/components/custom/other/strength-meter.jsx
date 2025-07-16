"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, Check, X, RotateCcwKey } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cva } from "class-variance-authority";

const strengthMeterVariants = cva(
  "transition-all w-full h-2 rounded-full bg-gray-200 dark:bg-gray-700 mt-1 flex gap-1",
  {
    variants: {
      size: {
        default: "h-2",
        sm: "h-1.5",
        lg: "h-3",
      },
      animated: {
        true: "",
        false: "",
      },
    },
    defaultVariants: {
      size: "default",
      animated: true,
    },
  }
);

const strengthBarSegmentVariants = cva(
  "h-full rounded-full transition-all duration-300 ease-in-out",
  {
    variants: {
      strength: {
        empty: "bg-transparent",
        weak: "bg-red-500",
        fair: "bg-orange-500",
        good: "bg-yellow-500",
        strong: "bg-green-500",
      },
      animated: {
        true: "animate-pulse",
        false: "",
      },
    },
    defaultVariants: {
      strength: "empty",
      animated: false,
    },
  }
);

const defaultRequirements = [
  {
    label: "8 Karakter atau lebih",
    validator: (password) => password.length >= 8,
  },
  {
    label: "Setidaknya ada satu huruf kecil",
    validator: (password) => /[a-z]/.test(password),
  },
  {
    label: "Setidaknya ada satu huruf besar",
    validator: (password) => /[A-Z]/.test(password),
  },
  {
    label: "Setidaknya ada satu angka",
    validator: (password) => /\d/.test(password),
  },
  {
    label: "Setidaknya ada satu huruf alfanumerik",
    validator: (password) => /[@/._-]/.test(password),
  },
];

const defaultStrengthLabels = {
  empty: "Kosong",
  weak: "Lemah",
  fair: "Cukup",
  good: "Bagus",
  strong: "Kuat",
};

const defaultStrengthThresholds = {
  empty: 0,
  weak: 1,
  fair: 40,
  good: 70,
  strong: 90,
};

export function PasswordStrengthMeter({
  value = "",
  onValueChange,
  showText = true,
  showRequirements = true,
  segments = 4,
  strengthThresholds = defaultStrengthThresholds,
  requirements = defaultRequirements,
  customCalculateStrength,
  showPasswordToggle = true,
  strengthLabels = defaultStrengthLabels,
  className,
  meterClassName,
  inputClassName,
  placeholder = "Enter password",
  size,
  animated = true,
  enableAutoGenerate = false,
  autoGenerateLength = 10,
                          autoComplete,
  ...props
}) {
  const [password, setPassword] = React.useState(value);
  const [showPassword, setShowPassword] = React.useState(false);

  React.useEffect(() => {
    setPassword(value);
  }, [value]);

  const generateStrongPassword = (length = autoGenerateLength) => {
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    const specialChars = "@/._-";

    const allChars = lowercase + uppercase + numbers + specialChars;

    let password = "";

    // Pastikan minimal 1 karakter dari setiap kategori
    password += lowercase[Math.floor(Math.random() * lowercase.length)]
    password += uppercase[Math.floor(Math.random() * uppercase.length)]
    password += numbers[Math.floor(Math.random() * numbers.length)]
    password += specialChars[Math.floor(Math.random() * specialChars.length)]

    // Tambahkan karakter acak untuk sisanya
    for (let i = 4; i < length; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)]
    }

    // Shuffle menggunakan Fisher-Yates algorithm untuk keamanan yang lebih baik
    const passwordArray = password.split('')
    for (let i = passwordArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]]
    }

    return passwordArray.join('')
  };

  const handleGeneratePassword = () => {
    const newPassword = generateStrongPassword(autoGenerateLength);
    setPassword(newPassword);
    onValueChange?.(newPassword);
  };

  const calculateBaseStrength = (password) => {
    if (!password) return 0;

    let score = 0;
    let passedRequirements = 0;

    requirements.forEach((requirement) => {
      if (requirement.validator(password)) {
        passedRequirements++;
      }
    });

    score = (passedRequirements / requirements.length) * 100;

    if (password.length > 12) score += 10;
    if (password.length > 16) score += 10;
    if (/[@./-_]{2,}/.test(password)) score += 10;

    return Math.min(score, 100);
  };

  const calculateStrength = customCalculateStrength || calculateBaseStrength;
  const strengthScore = calculateStrength(password);

  const getStrengthLevel = () => {
    if (strengthScore >= strengthThresholds.strong) return "strong";
    if (strengthScore >= strengthThresholds.good) return "good";
    if (strengthScore >= strengthThresholds.fair) return "fair";
    if (strengthScore >= strengthThresholds.weak) return "weak";
    return "empty";
  };

  const strengthLevel = getStrengthLevel();

  const getSegmentStrength = (index) => {
    const segmentThreshold = (index + 1) * (100 / segments);

    if (strengthScore >= segmentThreshold) {
      if (strengthLevel === "strong") return "strong";
      if (strengthLevel === "good") return "good";
      if (strengthLevel === "fair") return "fair";
      if (strengthLevel === "weak") return "weak";
    }

    return "empty";
  };

  const handleChange = (e) => {
    const newValue = e.target.value;
    setPassword(newValue);
    onValueChange?.(newValue);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const getPassedRequirements = () => {
    return requirements.filter((requirement) =>
      requirement.validator(password)
    );
  };

  const getStrengthColor = () => {
    switch (strengthLevel) {
      case "strong":
        return "text-green-500";
      case "good":
        return "text-yellow-500";
      case "fair":
        return "text-orange-500";
      case "weak":
        return "text-red-500";
      default:
        return "text-gray-400";
    }
  };

  return (
    <div className={cn("space-y-2", className)} {...props}>
      <div className="relative">
        <Input
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={handleChange}
          autoComplete={autoComplete}
          className={cn(
            showPasswordToggle && enableAutoGenerate
              ? "pr-20"
              : showPasswordToggle || enableAutoGenerate
                ? "pr-10"
                : "",
            inputClassName
          )}
          noInfo
          placeholder={placeholder}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {/* {enableAutoGenerate && (
            <button
              type="button"
              onClick={handleGeneratePassword}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
              aria-label="Generate strong password"
              title="Generate strong password"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          )} */}
          {showPasswordToggle && (
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
      </div>
      <div
        className={cn(
          strengthMeterVariants({ size, animated }),
          meterClassName
        )}
      >
        {Array.from({ length: segments }).map((_, i) => (
          <div
            key={i}
            className={cn(
              strengthBarSegmentVariants({
                strength: getSegmentStrength(i),
                animated:
                  animated &&
                  getSegmentStrength(i) !== "empty" &&
                  strengthLevel !== "strong",
              }),
              "flex-1"
            )}
            style={{
              transitionDelay: `${i * 75}ms`,
            }}
          />
        ))}
      </div>
      {showText && password && (
        <div className="flex items-center">
          <span className={cn("text-sm font-medium", getStrengthColor())}>
            {strengthLabels[strengthLevel]}
          </span>
          <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
            {getPassedRequirements().length} dari {requirements.length}{" "}
            kondisi terpenuhi
          </span>
        </div>
      )}
      {showRequirements && (
        <div className="space-y-3">
          {enableAutoGenerate && (
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2">
                <RotateCcwKey className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Butuh password yang kuat?
                </span>
              </div>
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 dark:text-blue-300 dark:bg-blue-900 dark:hover:bg-blue-800 rounded-md transition-colors"
              >
                Ya
              </button>
            </div>
          )}
          <ul className="space-y-1.5">
            {requirements.map((requirement, index) => {
              const passed = requirement.validator(password);
              return (
                <li
                  key={index}
                  className={cn(
                    "flex items-center gap-2 text-sm",
                    passed
                      ? "text-green-600 dark:text-green-500"
                      : "text-gray-500 dark:text-gray-400"
                  )}
                >
                  {passed ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-gray-400" />
                  )}
                  {requirement.label}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

export function PasswordInput({
  value,
  onChange,
  className,
  showToggle = true,
  ...props
}) {
  const [showPassword, setShowPassword] = React.useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="relative">
      <Input
        type={showPassword ? "text" : "password"}
        className={cn("pr-10", className)}
        value={value}
        onChange={onChange}
        {...props}
      />
      {showToggle && (
        <button
          type="button"
          onClick={togglePasswordVisibility}
          className="absolute right-3 top-1/2 -translate-y-1/2 "
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      )}
    </div>
  );
}

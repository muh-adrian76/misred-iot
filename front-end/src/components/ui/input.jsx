import * as React from "react";

import { cn } from "@/lib/utils";

const textInput = "Karakter alfanumerik dibatasi hanya (@ / . , - _)";
const numberInput = "Hanya berisi angka";

function Input({
  className,
  type,
  onChange,
  noInfo = true,
  ...props
}) {
  // Regex untuk karakter yang dianggap aman (alfanumerik, spasi, dan beberapa simbol)
  const safePattern = /^[a-zA-Z0-9 @/,._-]*$/;
  const [isValid, setIsValid] = React.useState(true);
  const [showInfo, setShowInfo] = React.useState(false);
  const [hideInfo, setHideInfo] = React.useState(false);

  React.useEffect(() => {
    if (noInfo) {
      setHideInfo(true);
    }
  }, [noInfo]);

  const handleKeyDown = (e) => {
    if (type === "file") return;
    
    // Izinkan key navigasi dan control
    const allowedKeys = [
      'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'Home', 'End', 'Tab', 'Enter', 'Escape', 'Shift', 'Control', 'Alt', 'Meta'
    ];
    
    if (allowedKeys.includes(e.key)) return;
    
    // Cek apakah karakter yang akan diketik valid
    const char = e.key;
    const charPattern = /^[a-zA-Z0-9 @/.,_-]$/;
    
    if (!charPattern.test(char)) {
      e.preventDefault(); // BLOKIR karakter sebelum masuk ke input
      setIsValid(false);
      
      // Reset state setelah 1 detik
      setTimeout(() => setIsValid(true), 1000);
      return;
    }
  };

  const handleChange = (e) => {
    if (type === "file") {
      // Untuk file input, langsung panggil onChange tanpa validasi
      onChange?.(e);
      return;
    }
    const value = e.target.value;
    const valid = safePattern.test(value);
    setIsValid(valid);
    if (!valid) {
      return;
    }
    onChange?.(e);
  };

  return (
    <div>
      <input
        type={type}
        data-slot="input"
        className={cn(
          "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:pr-4 file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          isValid
            ? "border-gray-200 focus:border-gray-400 dark:border-gray-800 dark:focus:border-gray-600"
            : "border-red-500 focus:border-red-600 dark:border-red-700 dark:focus:border-red-800",
          className
        )}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setShowInfo(true)}
        onBlur={() => setShowInfo(false)}
        onAbort={() => setShowInfo(false)}
        aria-invalid={!isValid}
        aria-describedby="input-info"
        aria-label="Input field"

        {...props}
      />
      <span
        className={cn(
          "px-1 text-sm relative text-balance text-muted-foreground transition-all duration-100 ease-out max-sm:text-xs",
          !hideInfo && showInfo
            ? "opacity-100 flex pt-2"
            : "absolute opacity-0 pointer-events-none"
        )}
      >
        {type === "number" ? numberInput : textInput}
      </span>
    </div>
  );
}

export { Input };

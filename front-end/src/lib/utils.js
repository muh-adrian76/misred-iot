import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility function untuk merge Tailwind CSS classes dengan conflict resolution
// Menggunakan clsx untuk conditional classes dan twMerge untuk dedupe/override conflicts
// Contoh: cn("bg-red-500", "bg-blue-500") -> "bg-blue-500" (blue override red)
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

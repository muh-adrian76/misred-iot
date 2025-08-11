import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Fungsi utilitas untuk menggabungkan kelas Tailwind CSS dengan resolusi konflik
// Menggunakan clsx untuk kelas kondisional dan twMerge untuk menghapus duplikasi/memutus konflik
// Contoh: cn("bg-red-500", "bg-blue-500") -> "bg-blue-500" (blue menimpa red)
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Import komponen tooltip dari shadcn/ui untuk membuat tooltip yang dapat diakses
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Komponen DescriptionTooltip
 * 
 * Komponen wrapper yang menyediakan tooltip deskripsi untuk elemen UI apapun.
 * Berguna untuk memberikan informasi tambahan atau penjelasan singkat tentang
 * suatu fitur atau kontrol dalam aplikasi IoT.
 * 
 * @param {React.ReactNode} children - Elemen yang akan memiliki tooltip
 * @param {string} content - Teks yang akan ditampilkan di dalam tooltip
 * @param {string} side - Posisi tooltip relatif terhadap trigger (top, bottom, left, right)
 * @param {string} className - Kelas CSS tambahan untuk gaya tooltip
 */
export default function DescriptionTooltip({children, content, side, className}) {
  return (
    // Container utama tooltip menggunakan komponen shadcn/ui
    <Tooltip>
      {/* Trigger tooltip - elemen yang akan menampilkan tooltip saat di-hover */}
      <TooltipTrigger asChild>
        {children}
      </TooltipTrigger>
      
      {/* Konten tooltip dengan posisi dan styling yang dapat dikustomisasi */}
      <TooltipContent side={side} className={className}>
        {/* Teks deskripsi yang akan ditampilkan dalam tooltip */}
        <p>{content}</p>
      </TooltipContent>
    </Tooltip>
  );
}

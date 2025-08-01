// Import komponen UI dan utilities
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Komponen DataTablePagination untuk navigasi halaman table
export default function DataTablePagination({
  page, // Halaman saat ini
  totalPages, // Total jumlah halaman
  totalRows, // Total jumlah baris data
  limit, // Jumlah item per halaman
  isMobile, // Flag untuk responsive layout
  setPage // Setter untuk mengubah halaman
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between mt-4",
        isMobile ? "flex-col gap-3" : "" // Layout vertikal untuk mobile
      )}
    >
      {/* Informasi range data yang sedang ditampilkan */}
      <span className="text-sm text-muted-foreground">
        Menampilkan {(page - 1) * limit + (totalRows > 0 ? 1 : 0)} {/* Item pertama di halaman ini */}
        {" - "}
        {Math.min(page * limit, totalRows)} {/* Item terakhir di halaman ini atau total jika kurang */}
        {" dari total "}
        {totalRows} data
      </span>
      
      {/* Kontrol navigasi pagination */}
      <div className="flex gap-2 items-center">
        {/* Tombol halaman sebelumnya */}
        <Button
          size="sm"
          variant="outline"
          onClick={() => setPage(page - 1)}
          disabled={page === 1} // Disable jika sudah di halaman pertama
        >
          <span className="text-xs sm:text-sm">Sebelumnya</span>
        </Button>
        
        {/* Indikator halaman saat ini dari total halaman */}
        <span className="text-xs sm:text-sm px-2">
          {page} / {totalPages}
        </span>
        
        {/* Tombol halaman berikutnya */}
        <Button
          size="sm"
          variant="outline"
          onClick={() => setPage(page + 1)}
          disabled={page === totalPages} // Disable jika sudah di halaman terakhir
        >
          <span className="text-xs sm:text-sm">Berikutnya</span>
        </Button>
      </div>
    </div>
  );
}

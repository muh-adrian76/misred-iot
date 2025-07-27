import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function DataTablePagination({
  page,
  totalPages,
  totalRows,
  limit,
  isMobile,
  setPage
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between mt-4",
        isMobile ? "flex-col gap-3" : ""
      )}
    >
      <span className="text-sm text-muted-foreground">
        Menampilkan {(page - 1) * limit + (totalRows > 0 ? 1 : 0)}
        {" - "}
        {Math.min(page * limit, totalRows)}
        {" dari total "}
        {totalRows} data
      </span>
      <div className="flex gap-2 items-center">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setPage(page - 1)}
          disabled={page === 1}
        >
          <span className="text-xs sm:text-sm">Sebelumnya</span>
        </Button>
        <span className="text-xs sm:text-sm px-2">
          {page} / {totalPages}
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setPage(page + 1)}
          disabled={page === totalPages}
        >
          <span className="text-xs sm:text-sm">Berikutnya</span>
        </Button>
      </div>
    </div>
  );
}

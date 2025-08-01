// Import komponen UI dan utilities
import { TableHead } from "@/components/ui/table";
import DescriptionTooltip from "../../other/description-tooltip";
import { ArrowDownAZ, ArrowUpAZ, Funnel } from "lucide-react"; // Icons untuk sorting dan filtering
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import CheckboxButton from "../../buttons/checkbox-button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// Komponen DataTableHead untuk render header kolom dengan sorting dan filtering
export default function DataTableHead({
  col, // Konfigurasi kolom (key, label, sortable, filterable, dll)
  idx, // Index kolom dalam array columns
  columns, // Array semua kolom untuk referensi
  sortBy, // Kolom yang sedang di-sort
  sortDir, // Arah sorting (asc/desc)
  handleSort, // Handler untuk sorting kolom
  filterMenuOpen, // Key kolom yang sedang membuka menu filter
  setFilterMenuOpen, // Setter untuk kontrol menu filter
  filters, // Object berisi filter yang aktif per kolom
  filterOptions, // Opsi filter yang tersedia per kolom
  handleFilterChange, // Handler untuk mengubah filter
  handleFilterReset, // Handler untuk reset filter kolom
  glowingHeaders = false, // Flag untuk efek glowing pada header
  hoveredColumn = null, // Kolom yang sedang di-hover untuk efek visual
}) {
  // Render header yang dapat di-sort (sortable)
  return col.sortable ? (
    <DescriptionTooltip key={col.key} content="Urutkan Data">
      <TableHead
        className={cn([
          // Styling untuk kolom pertama (sticky)
          idx === 0
            ? "sm:sticky left-0 bg-accent z-20 border-r min-w-[150px] cursor-pointer select-none"
            : "",
          // Styling untuk kolom yang dapat difilter atau tidak sortable
          col.filterable || col.sortable === false
            ? "min-w-[100px] border-r select-none bg-accent"
            : // Styling default untuk kolom lainnya
              ![0, columns.length].includes(idx)
              ? "border-r min-w-[100px] cursor-pointer select-none bg-accent"
              : "",
          // Efek glowing jika diaktifkan
          glowingHeaders && "glowing-header-effect"
        ].join(" "))}
        data-column={col.key} // Data attribute untuk CSS selectors
        onClick={col.sortable ? () => handleSort(col.key) : undefined} // Handler click untuk sorting
      >
        <span className="flex items-center justify-center">
          {col.label} {/* Label kolom */}
          {/* Icon sorting berdasarkan state saat ini */}
          {sortBy === col.key &&
            (sortDir === "asc" ? (
              <ArrowDownAZ className="inline w-4 h-4 ml-2" />
            ) : (
              <ArrowUpAZ className="inline w-4 h-4 ml-2" />
            ))}
          {col.filterable && (
            <DropdownMenu
              open={filterMenuOpen === col.key}
              onOpenChange={(open) => setFilterMenuOpen(open ? col.key : null)}
            >
              <DescriptionTooltip content="Filter Data">
                <DropdownMenuTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className={cn(
                      filters[col.key]?.length > 0
                        ? "text-primary"
                        : "text-muted-foreground",
                      "-mr-3"
                    )}
                    aria-label="Filter"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Funnel className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
              </DescriptionTooltip>
              <DropdownMenuContent align="center" className="w-48">
                <div className="px-2 py-2">
                  {(filterOptions[col.key] || []).map((option) => (
                    <Label
                      key={option}
                      className="flex items-center gap-2 py-1 cursor-pointer"
                    >
                      <CheckboxButton
                        type="checkbox"
                        checked={!!filters[col.key]?.includes(option)}
                        onChange={(e) =>
                          handleFilterChange(col.key, option, e.target.checked)
                        }
                      />
                      <span className="capitalize">{option}</span>
                    </Label>
                  ))}
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleFilterReset(col.key)}
                    >
                      Reset
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => setFilterMenuOpen(null)}
                    >
                      OK
                    </Button>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </span>
      </TableHead>
    </DescriptionTooltip>
  ) : (
    <TableHead
      key={col.key}
      className={cn([
        idx === 0
          ? "sticky left-0 bg-accent z-20 border-r min-w-[150px] cursor-pointer select-none"
          : "",
        idx === columns.length - 1 ? "" : "",
        col.filterable || col.sortable === false
          ? "min-w-[100px] border-r select-none bg-accent"
          : ![0, columns.length].includes(idx)
            ? "border-r min-w-[100px] cursor-pointer select-none bg-accent"
            : "",
        glowingHeaders && "glowing-header-effect"
      ].join(" "))}
      data-column={col.key}
      onClick={col.sortable ? () => handleSort(col.key) : undefined}
    >
      <span className="flex items-center justify-center">
        {col.label}
        {col.filterable && (
          <DropdownMenu
            open={filterMenuOpen === col.key}
            onOpenChange={(open) => setFilterMenuOpen(open ? col.key : null)}
          >
            <DescriptionTooltip content="Filter Data">
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className={cn(
                    filters[col.key]?.length > 0
                      ? "text-primary"
                      : "text-muted-foreground",
                    "-mr-3"
                  )}
                  aria-label="Filter"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Funnel className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
            </DescriptionTooltip>
            <DropdownMenuContent align="center" className="w-48">
              <div className="px-2 py-2">
                {(filterOptions[col.key] || []).map((option) => (
                  <Label
                    key={option}
                    className="flex items-center gap-2 py-1 cursor-pointer"
                  >
                    <CheckboxButton
                      type="checkbox"
                      checked={!!filters[col.key]?.includes(option)}
                      onChange={(e) =>
                        handleFilterChange(col.key, option, e.target.checked)
                      }
                    />
                    <span className="capitalize">{option}</span>
                  </Label>
                ))}
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleFilterReset(col.key)}
                  >
                    Reset
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => setFilterMenuOpen(null)}
                  >
                    OK
                  </Button>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </span>
    </TableHead>
  );
}

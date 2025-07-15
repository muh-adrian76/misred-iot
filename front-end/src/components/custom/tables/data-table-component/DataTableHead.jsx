import { TableHead } from "@/components/ui/table";
import DescriptionTooltip from "../../other/description-tooltip";
import { ArrowDownAZ, ArrowUpAZ, Funnel } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import CheckboxButton from "../../buttons/checkbox-button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function DataTableHead({
  col,
  idx,
  columns,
  sortBy,
  sortDir,
  handleSort,
  filterMenuOpen,
  setFilterMenuOpen,
  filters,
  filterOptions,
  handleFilterChange,
  handleFilterReset,
}) {
  return col.sortable ? (
    <DescriptionTooltip key={col.key} content="Urutkan Data">
      <TableHead
        className={[
          idx === 0
            ? "sticky left-0 bg-accent z-20 border-r min-w-[150px] cursor-pointer select-none"
            : "",
          col.filterable || col.sortable === false
            ? "min-w-[100px] border-r select-none bg-accent"
            : ![0, columns.length].includes(idx)
              ? "border-r min-w-[100px] cursor-pointer select-none bg-accent"
              : "",
        ].join(" ")}
        onClick={col.sortable ? () => handleSort(col.key) : undefined}
      >
        <span className="flex items-center justify-center">
          {col.label}
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
      className={[
        idx === 0
          ? "sticky left-0 bg-accent z-20 border-r min-w-[150px] cursor-pointer select-none"
          : "",
        idx === columns.length - 1 ? "" : "",
        col.filterable || col.sortable === false
          ? "min-w-[100px] border-r select-none bg-accent"
          : ![0, columns.length].includes(idx)
            ? "border-r min-w-[100px] cursor-pointer select-none bg-accent"
            : "",
      ].join(" ")}
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

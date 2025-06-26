import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Edit,
  Trash2,
  Ellipsis,
  ArrowDown,
  ArrowUp,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function DataTable({
  columns = [],
  data = [],
  loading = false,
  isMobile,
  onAdd,
  onEdit,
  onDelete,
  noDataText = "Tidak ada data.",
  content,
  limit = 10,
  searchPlaceholder = "Cari...",
}) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState(columns[0]?.key || "");
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);

  // Handler sorting
  const handleSort = (key) => {
    if (sortBy === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(key);
      setSortDir("asc");
    }
    setPage(1); // Reset ke halaman 1 saat sorting berubah
  };

  // Filter & sort data
  const filteredData = useMemo(() => {
    let filtered = data;
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter((row) =>
        columns.some((col) =>
          (row[col.key] ?? "").toString().toLowerCase().includes(q)
        )
      );
    }
    if (sortBy) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = (a[sortBy] ?? "").toString().toLowerCase();
        const bVal = (b[sortBy] ?? "").toString().toLowerCase();
        if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
        if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
    }
    return filtered;
  }, [data, search, columns, sortBy, sortDir]);

  // Pagination logic
  const totalRows = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / limit));
  const pagedData = filteredData.slice((page - 1) * limit, page * limit);

  // Jika search/filter berubah, reset ke halaman 1
  useMemo(() => {
    setPage(1);
  }, [search, sortBy, sortDir]);

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    >
      {/* Header: Search & Add */}
      <motion.div
        className="flex items-end w-full rounded-2xl py-3 gap-3 justify-between"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        transition={{ duration: 0.5, delay: 0.5, ease: "easeInOut" }}
      >
        <div className="relative w-full max-w-xs">
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs pr-10"
          />
          <span className="absolute right-3 top-2.5 text-muted-foreground">
            <Search className="w-4 h-4" />
          </span>
        </div>
        {onAdd && (
          <Button onClick={onAdd} className="gap-2">
            <Plus className="w-4 h-4" />
            {isMobile ? content : `Tambah ${content}`}
          </Button>
        )}
      </motion.div>
      {/* Table */}
      <div className="rounded-md border bg-background overflow-x-auto relative">
        <Table className="min-w-[600px] w-full text-center">
          <TableHeader className="bg-accent">
            <TableRow>
              {columns.map((col, idx) => (
                <TableHead
                  key={col.key}
                  className={[
                    idx === 0
                      ? "sticky left-0 z-20 bg-accent border-r min-w-[200px] cursor-pointer select-none"
                      : "",
                    idx === columns.length - 1 ? "" : "",
                    ["key", "max_value"].includes(col.key)
                      ? "min-w-[100px] border-r cursor-pointer select-none bg-accent"
                      : ![0, columns.length - 1].includes(idx)
                        ? "border-r min-w-[100px] cursor-pointer select-none bg-accent"
                        : "",
                  ].join(" ")}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                >
                  <span className="flex items-center justify-center">
                    {col.label}
                    {col.sortable &&
                      sortBy === col.key &&
                      (sortDir === "asc" ? (
                        <ArrowDown className="inline w-5 h-5 ml-2" />
                      ) : (
                        <ArrowUp className="inline w-5 h-5 ml-2" />
                      ))}
                  </span>
                </TableHead>
              ))}
              <TableHead className="sticky right-0 z-20 bg-accent border-l min-w-[90px]">
                Aksi
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + 1}
                  className="text-center text-muted-foreground bg-background"
                >
                  Memuat data...
                </TableCell>
              </TableRow>
            ) : filteredData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + 1}
                  className="text-center text-muted-foreground bg-background"
                >
                  {noDataText}
                </TableCell>
              </TableRow>
            ) : (
              pagedData.map((row, i) => (
                <TableRow key={row.id || i}>
                  {columns.map((col, idx) => (
                    <TableCell
                      key={col.key}
                      className={[
                        idx === 0
                          ? "sticky left-0 z-10 bg-background border-r min-w-[200px] truncate"
                          : "bg-background",
                        idx === columns.length - 1 ? "" : "",
                        ["default_value", "min_value", "max_value"].includes(
                          col.key
                        )
                          ? "min-w-[100px] border-r bg-background"
                          : ![0, columns.length - 1].includes(idx)
                            ? "border-r min-w-[100px] bg-background"
                            : "",
                      ].join(" ")}
                    >
                      {col.render
                        ? col.render(row)
                        : row[col.key] !== undefined &&
                            row[col.key] !== null &&
                            row[col.key] !== ""
                          ? row[col.key]
                          : "-"}
                    </TableCell>
                  ))}
                  <TableCell className="sticky right-0 z-10 bg-background border-l min-w-[90px]">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="link">
                          <Ellipsis className="w-6 h-6" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="center">
                        {onEdit && (
                          <DropdownMenuItem
                            className="flex gap-2 items-center cursor-pointer hover:bg-accent"
                            onClick={() => onEdit(row)}
                          >
                            <Edit className="w-5 h-5 mr-2 text-foreground" />{" "}
                            Edit
                          </DropdownMenuItem>
                        )}
                        {onDelete && (
                          <DropdownMenuItem
                            onClick={() => onDelete(row)}
                            className="flex gap-2 items-center cursor-pointer hover:bg-accent"
                          >
                            <Trash2 className="w-5 h-5 mr-2 text-foreground" />{" "}
                            Hapus
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
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
            Sebelumnya
          </Button>
          <span className="text-sm px-2">
            {page} / {totalPages}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
          >
            Berikutnya
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

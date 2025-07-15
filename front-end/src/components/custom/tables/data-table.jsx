"use client";

import { useState, useMemo } from "react";
import CheckboxButton from "../buttons/checkbox-button";
import { motion } from "framer-motion";
import { TextShimmer } from "@/components/ui/text-shimmer";
import DataTableHead from "./data-table-component/DataTableHead";
import DataTableRowActions from "./data-table-component/DataTableRowActions";
import DataTablePagination from "./data-table-component/DataTablePagination";
import DataTableToolbar from "./data-table-component/DataTableToolbar";
import DataTableBulkActions from "./data-table-component/DataTableBulkActions";
import {
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function DataTable({
  columns = [],
  data = [],
  rowActions = [],
  loading = false,
  isMobile,
  selectedRows,
  setSelectedRows,
  onAdd,
  onEdit,
  onDelete,
  noDataText = "Tidak ada data.",
  content,
  limit = 10,
  searchPlaceholder = "Cari...",
}) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [openDropdownOptions, setOpenDropdownOptions] = useState(null);

  // Logic sorting
  const [sortBy, setSortBy] = useState(columns[0]?.key || "");
  const [sortDir, setSortDir] = useState("asc");

  // Logic filter
  const [filters, setFilters] = useState({});
  const [filterMenuOpen, setFilterMenuOpen] = useState(null); // key kolom yang sedang open

  // Handler select all
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedRows(pagedData.map((row) => row.id));
    } else {
      setSelectedRows([]);
    }
  };

  // Handler select satu baris
  const handleSelectRow = (id, checked) => {
    setSelectedRows((prev) =>
      checked ? [...prev, id] : prev.filter((rowId) => rowId !== id)
    );
  };

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

  // Handler filtering
  const filterOptions = useMemo(() => {
    const opts = {};
    columns.forEach((col) => {
      if (col.filterable) {
        opts[col.key] = Array.from(
          new Set(data.map((row) => row[col.key]))
        ).filter(Boolean);
      }
    });
    return opts;
  }, [columns, data]);
  const handleFilterChange = (key, value, checked) => {
    setFilters((prev) => {
      const prevArr = prev[key] || [];
      return {
        ...prev,
        [key]: checked
          ? [...prevArr, value]
          : prevArr.filter((v) => v !== value),
      };
    });
  };
  const handleFilterReset = (key) => {
    setFilters((prev) => ({ ...prev, [key]: [] }));
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
    Object.entries(filters).forEach(([key, values]) => {
      if (values && values.length > 0) {
        filtered = filtered.filter((row) => values.includes(row[key]));
      }
    });
    return filtered;
  }, [data, search, columns, sortBy, sortDir, filters]);

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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1, delay: 1, ease: "easeInOut" }}
    >
      {/* Header: Search & Add */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        transition={{ duration: 1, delay: 1.5, ease: "easeInOut" }}
      >
        <DataTableToolbar
          search={search}
          setSearch={setSearch}
          searchPlaceholder={searchPlaceholder}
          onAdd={onAdd}
          isMobile={isMobile}
          content={content}
        />
      </motion.div>

      <DataTableBulkActions
        selectedRows={selectedRows}
        content={content}
        totalRows={totalRows}
        onDelete={onDelete}
        setSelectedRows={setSelectedRows}
      />

      {/* Table */}
      <div className="rounded-md bg-background overflow-x-auto relative">
        <Table className="lg:8/9 w-full text-center">
          <TableHeader className="bg-accent">
            <TableRow>
              <TableHead className="w-[25px] border-r">
                <div className="flex items-center justify-center h-full min-h-[40px]">
                  <CheckboxButton
                    checked={
                      pagedData.length > 0 &&
                      pagedData.every((row) => selectedRows.includes(row.id))
                    }
                    indeterminate={
                      selectedRows.length > 0 &&
                      selectedRows.length < pagedData.length
                        ? true
                        : undefined
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    aria-label="Pilih semua"
                  />
                </div>
              </TableHead>
              {columns.map((col, idx) => (
                <DataTableHead
                  key={col.key}
                  col={col}
                  idx={idx}
                  columns={columns}
                  sortBy={sortBy}
                  sortDir={sortDir}
                  handleSort={handleSort}
                  filterMenuOpen={filterMenuOpen}
                  setFilterMenuOpen={setFilterMenuOpen}
                  filters={filters}
                  filterOptions={filterOptions}
                  handleFilterChange={handleFilterChange}
                  handleFilterReset={handleFilterReset}
                />
              ))}
              <TableHead className="sticky right-0 z-20 bg-accent border-l min-w-[55px]">
                Opsi
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
                  <TextShimmer className="text-sm" duration={1}>
                    Memuat data...
                  </TextShimmer>
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
                  <TableCell className="w-[25px] bg-background border-r">
                    <div className="flex items-center justify-center h-full min-h-[40px]">
                      <CheckboxButton
                        checked={selectedRows.includes(row.id)}
                        onChange={(e) =>
                          handleSelectRow(row.id, e.target.checked)
                        }
                        aria-label="Pilih baris"
                      />
                    </div>
                  </TableCell>
                  {columns.map((col, idx) => (
                    <TableCell
                      key={col.key}
                      className={[
                        idx === 0
                          ? "sticky left-0 z-10 border-r min-w-[150px] truncate"
                          : "bg-background",
                        idx === columns.length - 1 ? "" : "",
                        ["default_value", "min_value", "max_value"].includes(
                          col.key
                        )
                          ? "min-w-[100px] border-r"
                          : ![0, columns.length - 1].includes(idx)
                            ? "border-r min-w-[100px]"
                            : "",
                        "bg-background px-4 transition-all",
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
                  <TableCell className="sticky right-0 z-10 bg-background border-l min-w-[55px]">
                    <DataTableRowActions
                      openDropdownOptions={openDropdownOptions}
                      setOpenDropdownOptions={setOpenDropdownOptions}
                      row={row}
                      rowActions={rowActions}
                      rowIndex={i}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        transition={{ duration: 1, delay: 1.5, ease: "easeInOut" }}
      >
        <DataTablePagination
          page={page}
          totalPages={totalPages}
          totalRows={totalRows}
          limit={limit}
          isMobile={isMobile}
          setPage={setPage}
        />
      </motion.div>
    </motion.div>
  );
}

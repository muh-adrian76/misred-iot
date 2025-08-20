"use client";

// Import hooks React untuk state management dan optimasi performa
import { useState, useMemo, useCallback, useRef } from "react";

// Import komponen custom untuk table functionality
import CheckboxButton from "../buttons/checkbox-button";
import { motion } from "framer-motion"; // Animasi transisi
import { TextShimmer } from "@/components/ui/text-shimmer"; // Efek shimmer untuk loading
import { GlowingEffect } from "@/components/ui/glowing-effect"; // Efek visual glowing
import { cn } from "@/lib/utils"; // Utility untuk class name conditional

// Import komponen-komponen data table yang modular
import DataTableHead from "./data-table-component/DataTableHead";
import DataTableRowActions from "./data-table-component/DataTableRowActions";
import DataTablePagination from "./data-table-component/DataTablePagination";
import DataTableToolbar from "./data-table-component/DataTableToolbar";
import DataTableBulkActions from "./data-table-component/DataTableBulkActions";

// Import komponen UI table dari shadcn/ui
import {
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Komponen DataTable yang dapat dikustomisasi dengan berbagai fitur advanced
// Mendukung sorting, filtering, pagination, bulk actions, dan efek visual
export default function DataTable({
  columns = [], // Konfigurasi kolom table dengan key, label, render function
  data = [], // Array data yang akan ditampilkan di table
  rowActions = [], // Array aksi yang dapat dilakukan pada setiap baris
  loading = false, // Status loading untuk menampilkan skeleton/shimmer
  isMobile, // Flag untuk responsive behavior
  selectedRows, // Array ID baris yang dipilih
  setSelectedRows, // Function untuk mengubah selected rows
  onAdd, // Handler untuk menambah data baru
  onEdit, // Handler untuk mengedit data
  onDelete, // Handler untuk menghapus data
  onUploadFirmware, // Handler khusus untuk upload firmware (IoT specific)
  noDataText = "Tidak ada data.", // Text yang ditampilkan saat tidak ada data
  content, // Konten atau context dari table (untuk labeling)
  limit: initialLimit = 10, // Jumlah data per halaman default
  searchPlaceholder = "Cari...", // Placeholder untuk search input
  showUploadFirmware = false, // Flag untuk menampilkan tombol upload firmware
  showNotificationInfo = false, // Flag untuk menampilkan info notifikasi
  showConnectionInfo = false, // Flag untuk menampilkan info koneksi device
  glowingTable = false, // Prop untuk mengaktifkan efek glowing pada table
  glowingConfig = {     // Konfigurasi detail efek glowing
    spread: 35, // Penyebaran efek glow
    proximity: 56, // Jarak trigger efek
    inactiveZone: 0.05, // Zone tidak aktif
    disabled: false // Status aktif/nonaktif efek
  },
  glowingCells = false,    // Efek glowing pada cell individual
  glowingHeaders = false,   // Efek glowing pada header
  devices = [] // Data devices untuk referensi (untuk filter device_id)
}) {
  // State management untuk fitur-fitur table
  const [search, setSearch] = useState(""); // State untuk search/filter teks
  const [page, setPage] = useState(1); // State untuk halaman pagination saat ini
  const [limit, setLimit] = useState(initialLimit); // State untuk jumlah data per halaman
  const [openDropdownOptions, setOpenDropdownOptions] = useState(null); // State untuk dropdown actions yang terbuka
  const [hoveredCell, setHoveredCell] = useState(null); // State untuk cell yang sedang di-hover
  const [hoveredColumn, setHoveredColumn] = useState(null); // State untuk kolom yang sedang di-hover
  const tableRef = useRef(null); // Ref untuk mengakses DOM element table

  // Handler mouse tracking untuk dynamic glowing colors
  // Mengupdate CSS custom properties untuk posisi mouse dan warna glow
  const handleMouseMove = useCallback((e) => {
    if (!tableRef.current) return;
    
    // Hitung posisi mouse relatif terhadap table
    const rect = tableRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Update CSS custom properties untuk posisi mouse
    tableRef.current.style.setProperty('--mouse-x', `${x}%`);
    tableRef.current.style.setProperty('--mouse-y', `${y}%`);
    
    // Generate dynamic hue berdasarkan posisi mouse untuk efek rainbow
    const hue = Math.round(((x + y) / 2) * 3.6) % 360;
    tableRef.current.style.setProperty('--glow-hue', hue);
  }, []);

  // Handler untuk hover pada cell yang mempengaruhi header glow
  // Menangani efek visual saat user hover pada cell tertentu
  const handleCellHover = useCallback((columnKey, isHovering) => {
    if (!tableRef.current) return;
    
    if (isHovering) {
      // Set state dan attribute untuk kolom yang di-hover
      setHoveredColumn(columnKey);
      tableRef.current.setAttribute('data-hover-column', columnKey);
      
      // Reset semua header effects terlebih dahulu
      const allHeaders = tableRef.current.querySelectorAll('.glowing-header-effect');
      allHeaders.forEach(header => {
        header.classList.remove('column-hovered');
      });
      
      // Tambahkan glow effect pada header yang sesuai
      const matchingHeader = tableRef.current.querySelector(`.glowing-header-effect[data-column="${columnKey}"]`);
      if (matchingHeader) {
        matchingHeader.classList.add('column-hovered');
      }
    } else {
      // Reset semua effects saat tidak hover
      setHoveredColumn(null);
      tableRef.current.removeAttribute('data-hover-column');
      
      // Hapus glow dari semua headers
      const allHeaders = tableRef.current.querySelectorAll('.glowing-header-effect');
      allHeaders.forEach(header => {
        header.classList.remove('column-hovered');
      });
    }
  }, []);

  // State dan logic untuk sorting data
  const [sortBy, setSortBy] = useState(columns[0]?.key || ""); // Kolom yang sedang di-sort
  const [sortDir, setSortDir] = useState("asc"); // Arah sorting (asc/desc)

  // State dan logic untuk filtering data
  const [filters, setFilters] = useState({}); // Object berisi filter per kolom
  const [filterMenuOpen, setFilterMenuOpen] = useState(null); // Kolom yang sedang membuka menu filter

  // Handler untuk select all checkbox di header
  // Memilih/deselect semua baris yang sedang ditampilkan
  const handleSelectAll = (checked) => {
    if (checked) {
      // Pilih semua baris dari data yang sedang ditampilkan (setelah filter & pagination)
      setSelectedRows(pagedData.map((row) => row.id));
    } else {
      // Deselect semua baris
      setSelectedRows([]);
    }
  };

  // Handler untuk select checkbox individual pada setiap baris
  const handleSelectRow = (id, checked) => {
    setSelectedRows((prev) =>
      checked 
        ? [...prev, id] // Tambahkan ID ke selected rows
        : prev.filter((rowId) => rowId !== id) // Hapus ID dari selected rows
    );
  };

  // Handler untuk sorting kolom
  // Toggle arah sort jika kolom sama, atau set kolom baru dengan asc
  const handleSort = (key) => {
    if (sortBy === key) {
      // Jika kolom sama, toggle arah sorting
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      // Jika kolom berbeda, set kolom baru dengan asc
      setSortBy(key);
      setSortDir("asc");
    }
    setPage(1); // Reset ke halaman 1 saat sorting berubah
  };

  // Handler dan logic untuk filtering data
  // Generate opsi filter berdasarkan data unik per kolom
  const filterOptions = useMemo(() => {
    const opts = {};
    columns.forEach((col) => {
      if (col.filterable) {
        if (col.key === 'device_id' && devices && devices.length > 0) {
          // Untuk kolom device_id, gunakan deskripsi device sebagai filter options
          const deviceIds = Array.from(
            new Set(data.map((row) => row[col.key]))
          ).filter(Boolean);
          
          opts[col.key] = deviceIds.map(deviceId => {
            const device = devices.find(d => d.id === deviceId);
            return device ? device.description : deviceId;
          }).filter(Boolean);
        } else if (col.key === 'is_active') {
          // Untuk kolom boolean is_active, konversi ke teks yang user-friendly
          const uniqueValues = Array.from(
            new Set(data.map((row) => row[col.key]))
          ).filter(val => val !== null && val !== undefined);
          
          opts[col.key] = uniqueValues.map(val => val ? "Aktif" : "Non-aktif");
        } else {
          // Untuk kolom lainnya, ambil nilai unik dari setiap kolom yang bisa difilter
          opts[col.key] = Array.from(
            new Set(data.map((row) => row[col.key]))
          ).filter(Boolean); // Hapus nilai kosong/null
        }
      }
    });
    return opts;
  }, [columns, data, devices]);
  
  // Handler untuk mengubah filter pada kolom tertentu
  const handleFilterChange = (key, value, checked) => {
    setFilters((prev) => {
      const prevArr = prev[key] || []; // Ambil filter sebelumnya untuk kolom ini
      return {
        ...prev,
        [key]: checked
          ? [...prevArr, value] // Tambahkan nilai ke filter
          : prevArr.filter((v) => v !== value), // Hapus nilai dari filter
      };
    });
  };
  
  // Handler untuk reset filter pada kolom tertentu
  const handleFilterReset = (key) => {
    setFilters((prev) => ({ ...prev, [key]: [] }));
  };

  // Proses filter dan sort data menggunakan useMemo untuk optimasi performa
  const filteredData = useMemo(() => {
    let filtered = data;
    
    // Apply search filter jika ada query search
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter((row) =>
        // Cari di semua kolom apakah ada yang match dengan query
        columns.some((col) =>
          (row[col.key] ?? "").toString().toLowerCase().includes(q)
        )
      );
    }
    
    // Apply sorting jika ada kolom yang di-sort
    if (sortBy) {
      filtered = [...filtered].sort((a, b) => {
        // Konversi nilai ke string lowercase untuk perbandingan
        const aVal = (a[sortBy] ?? "").toString().toLowerCase();
        const bVal = (b[sortBy] ?? "").toString().toLowerCase();
        
        // Lakukan sorting berdasarkan arah yang dipilih
        if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
        if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
    }
    
    // Apply filters per kolom
    Object.entries(filters).forEach(([key, values]) => {
      if (values && values.length > 0) {
        if (key === 'device_id' && devices && devices.length > 0) {
          // Untuk filter device_id, konversi deskripsi device kembali ke device_id
          const deviceIds = values.map(description => {
            const device = devices.find(d => d.description === description);
            return device ? device.id : description;
          });
          filtered = filtered.filter((row) => deviceIds.includes(row[key]));
        } else if (key === 'is_active') {
          // Untuk filter is_active, konversi teks kembali ke boolean
          const booleanValues = values.map(text => text === "Aktif");
          filtered = filtered.filter((row) => booleanValues.includes(row[key]));
        } else {
          // Filter hanya baris yang memiliki nilai yang dipilih di filter
          filtered = filtered.filter((row) => values.includes(row[key]));
        }
      }
    });
    
    return filtered;
  }, [data, search, columns, sortBy, sortDir, filters, devices]);

  // Logic pagination untuk membagi data menjadi halaman-halaman
  const totalRows = filteredData.length; // Total baris setelah filter
  const totalPages = Math.max(1, Math.ceil(totalRows / limit)); // Total halaman (minimal 1)
  const pagedData = filteredData.slice((page - 1) * limit, page * limit); // Data untuk halaman saat ini

  // Auto reset ke halaman 1 jika search/filter berubah
  useMemo(() => {
    setPage(1);
  }, [search, sortBy, sortDir, limit]);

  return (
    // Container utama dengan animasi fade in
    <motion.div
      className="w-full"
      initial={{ opacity: 0 }} // Mulai transparan
      animate={{ opacity: 1 }} // Fade in ke opaque
      exit={{ opacity: 0 }} // Fade out saat exit
      transition={{ duration: 1, delay: 1, ease: "easeInOut" }}
    >
      {/* Section toolbar: Search, Add, Upload, dll */}
      <motion.div
        initial={{ opacity: 0, y: 50 }} // Mulai dari bawah
        animate={{ opacity: 1, y: 0 }} // Slide up ke posisi normal
        exit={{ opacity: 0, y: 50 }} // Slide down saat exit
        transition={{ duration: 1, delay: 1.5, ease: "easeInOut" }}
      >
        {/* Komponen toolbar dengan search, add, upload, dll */}
        <DataTableToolbar
          search={search}
          setSearch={setSearch}
          searchPlaceholder={searchPlaceholder}
          onAdd={onAdd}
          onUploadFirmware={onUploadFirmware}
          isMobile={isMobile}
          content={content}
          showUploadFirmware={showUploadFirmware}
          showNotificationInfo={showNotificationInfo}
          showConnectionInfo={showConnectionInfo}
          limit={limit}
          setLimit={setLimit}
        />
      </motion.div>

      {/* Komponen bulk actions untuk operasi pada multiple rows */}
      <DataTableBulkActions
        selectedRows={selectedRows}
        content={content}
        totalRows={totalRows}
        onDelete={onDelete}
        setSelectedRows={setSelectedRows}
      />

      {/* Container table utama dengan efek glowing opsional */}
      <div className="relative">
        {/* Efek glowing untuk seluruh table jika diaktifkan */}
        {glowingTable && (
          <GlowingEffect
            spread={glowingConfig.spread}
            proximity={glowingConfig.proximity}
            inactiveZone={glowingConfig.inactiveZone}
            disabled={glowingConfig.disabled}
            className="rounded-md"
          />
        )}
        {/* Wrapper table dengan scroll horizontal */}
        <div className="rounded-md bg-background overflow-x-auto relative">
          <Table 
            ref={tableRef}
            className="lg:8/9 w-full text-center"
            onMouseMove={handleMouseMove} // Track mouse untuk efek glowing dinamis
          >
            {/* Header table dengan checkbox select all dan kolom-kolom */}
            <TableHeader className="bg-accent">
              <TableRow>
                {/* Header checkbox untuk select all */}
                <TableHead className={cn(
                  "w-[25px] border-r relative",
                  glowingHeaders && "glowing-header-effect" // Efek glow opsional
                )}>
                  <div className="flex items-center justify-center h-full min-h-[40px]">
                    <CheckboxButton
                      checked={
                        // Checked jika semua data di halaman ini dipilih
                        pagedData.length > 0 &&
                        pagedData.every((row) => selectedRows.includes(row.id))
                      }
                      indeterminate={
                        // Indeterminate jika sebagian data dipilih
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
                    glowingHeaders={glowingHeaders}
                    hoveredColumn={hoveredColumn}
                  />
                ))}
                <TableHead className={cn(
                  "sticky right-0 z-20 bg-accent border-l min-w-[55px] p-2",
                  glowingHeaders && "glowing-header-effect"
                )}>
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
                  <TableRow 
                    key={row.id || i}
                    className={cn(
                      "transition-colors"
                    )}
                  >
                    <TableCell className={cn(
                      "w-[25px] bg-background border-r relative",
                      glowingCells && "glowing-cell-effect checkbox-cell"
                    )}>
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
                        className={cn(
                          [
                            idx === 0
                              ? "sm:sticky left-0 z-10 border-r min-w-[150px] truncate"
                              : "bg-background",
                            idx === columns.length - 1 ? "" : "",
                            ["min_value", "max_value"].includes(
                              col.key
                            )
                              ? "min-w-[100px] border-r"
                              : ![0, columns.length - 1].includes(idx)
                                ? "border-r min-w-[100px]"
                                : "",
                            "bg-background px-4 transition-all",
                          ].join(" "),
                          glowingCells && "glowing-cell-effect",
                          glowingCells && idx === 0 && "sticky-cell",
                        )}
                        data-column={col.key}
                        onMouseEnter={() => {
                          setHoveredCell(`${i}-${idx}`);
                          handleCellHover(col.key, true);
                        }}
                        onMouseLeave={() => {
                          setHoveredCell(null);
                          handleCellHover(col.key, false);
                        }}
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
                    <TableCell className={cn(
                      "sticky right-0 z-10 bg-background border-l min-w-[55px]",
                      glowingCells && "glowing-cell-effect"
                    )}>
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

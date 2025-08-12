// Import komponen UI untuk badge dan button
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
// Import komponen DataTable untuk menampilkan data alarm
import DataTable from "@/components/custom/tables/data-table";
// Import ikon-ikon dari Lucide React
import { Pencil, Trash2, Plus } from "lucide-react";
// Import Framer Motion untuk animasi
import { AnimatePresence, motion } from "framer-motion";
// Import opsi unit untuk datastream
import unitOptions from "../datastream/unit.json";
// Import tooltip untuk deskripsi
import DescriptionTooltip from "@/components/custom/other/description-tooltip";
// Import utility untuk konversi tanggal
import { convertDate } from "@/lib/helper";

// Komponen konten utama untuk halaman alarm management
export default function AlarmContent({
  alarms, // Data array alarm
  loading, // Status loading
  setAddFormOpen, // Setter untuk dialog tambah alarm
  setEditAlarm, // Setter untuk alarm yang akan diedit
  setEditFormOpen, // Setter untuk dialog edit alarm
  setAlarmToDelete, // Setter untuk alarm yang akan dihapus
  setDeleteFormOpen, // Setter untuk dialog hapus alarm
  isMobile, // Status apakah dalam mode mobile
  selectedRows, // Baris yang dipilih
  setSelectedRows, // Setter untuk baris yang dipilih
}) {
  // Definisi kolom-kolom untuk tabel alarm
  const columns = [
    // Kolom deskripsi alarm
    { key: "description", label: "Nama", sortable: true },
    {
      // Kolom device yang terkait dengan alarm
      key: "device",
      label: "Device",
  render: (row) => row.device_description || "Tidak diketahui", // Fallback deskripsi device
    },
    {
      // Kolom datastream yang dimonitor
      key: "datastream",
      label: "Datastream",
      render: (row) =>
        // Format: "Deskripsi Datastream (Pin X)"
  `${row.datastream_description || "Tidak diketahui"} (Pin ${row.datastream_pin || "Tidak tersedia"})`,
    },
    {
      // Kolom kondisi alarm
      key: "condition",
      label: "Kondisi",
      render: (row) => {
        // Cari opsi unit berdasarkan datastream unit
        const option = unitOptions?.find(
          (u) => u.value === row.datastream_unit
        );

        // Cek apakah ada kondisi yang valid
        // Cek apakah ada kondisi yang valid
        if (
          !row.conditions ||
          !Array.isArray(row.conditions) ||
          row.conditions.length === 0
        ) {
          return "Tidak ada kondisi";
        }

        // Format kondisi menjadi teks yang dapat dibaca
        const conditionsText = row.conditions
          .map((condition) => `${condition.operator} ${condition.threshold}`)
          .join(", ");
        return (
          <div className="flex items-center justify-center gap-1">
            <span>{conditionsText}</span>
            {/* Tampilkan unit dengan tooltip jika ada */}
            {option?.label && (
              <DescriptionTooltip content={option.label}>
                <span className="underline underline-offset-2 cursor-help">
                  {row.datastream_unit}
                </span>
              </DescriptionTooltip>
            )}
          </div>
        );
      },
    },
    {
      // Kolom status alarm (aktif/non-aktif)
      key: "status",
      label: "Status",
      render: (row) => (
        <span
          className={`px-2 py-1 rounded text-xs ${
            // Styling kondisional berdasarkan status aktif
            row.is_active
              ? "bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200"
              : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
          }`}
        >
          {/* Tampilkan teks status */}
          {row.is_active ? "Aktif" : "Non-aktif"}
        </span>
      ),
    },
    {
      // Kolom waktu tunggu cooldown
      key: "cooldown",
      label: "Waktu Tunggu",
      sortable: true,
      render: (row) => `${row.cooldown_minutes} menit`,
    },
    {
      // Kolom kapan alarm terakhir dipicu
      key: "last_triggered",
      label: "Terakhir Dipicu",
      render: (row) =>
        // Konversi tanggal atau tampilkan "-" jika belum pernah dipicu
        row.last_triggered
          ? convertDate(row.last_triggered)
          : "-",
    },
  ];

  // Definisi aksi yang dapat dilakukan pada setiap baris
  // Definisi aksi yang dapat dilakukan pada setiap baris
  const rowActions = [
    {
      // Aksi edit alarm
      key: "edit",
      label: "Edit",
      icon: Pencil, // Ikon pensil dari Lucide
      className: "hover:text-foreground", // Styling hover
      disabled: false, // Tidak di-disable
      onClick: (row) => {
        // Set alarm yang akan diedit dan buka dialog
        setEditAlarm(row);
        setEditFormOpen(true);
      },
    },
    {
      // Aksi hapus alarm
      key: "delete",
      label: "Hapus",
      icon: Trash2, // Ikon trash dari Lucide
      className: "hover:text-primary", // Styling hover
      disabled: false, // Tidak di-disable
      onClick: (row) => {
        // Set alarm yang akan dihapus dan buka dialog
        setAlarmToDelete(row);
        setDeleteFormOpen(true);
      },
    },
  ];

  // Komponen empty state - ditampilkan jika tidak ada data alarm
  // Komponen empty state - ditampilkan jika tidak ada data alarm
  if (!loading && alarms.length === 0) {
    return (
      // Container dengan animasi fade-in dari Framer Motion
      <motion.div
        className="flex items-center justify-center h-full"
        initial={{ opacity: 0, y: 50 }} // Mulai transparan dan bergeser ke bawah
        animate={{ opacity: 1, y: 0 }} // Animasi ke posisi normal
        exit={{ opacity: 0, y: 50 }} // Animasi keluar
        transition={{ duration: 0.5, delay: 1, ease: "easeInOut" }}
      >
        {/* Container konten empty state */}
        <div className="flex flex-col items-center text-sm text-center gap-4 w-xl max-w-md">
          {/* Gambar ilustrasi alarm kosong */}
          <motion.img
            key="alarm-image"
            src="/alarm.svg"
            alt="Tidak ada alarm"
            className="w-72 h-auto -mb-5 mt-[-50px]"
            initial={{ opacity: 0, scale: 0 }} // Mulai dengan scale 0
            animate={{ opacity: 1, scale: 1 }} // Animasi ke ukuran normal
            exit={{ opacity: 0, scale: 0 }} // Animasi keluar
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
          {/* Judul empty state */}
          <h2 className="text-xl font-semibold">Alarm masih kosong</h2>
          {/* Deskripsi tentang fungsi alarm */}
          <p className="text-gray-500 dark:text-gray-400">Alarm digunakan untuk mendefinisikan kondisi bahaya yang akan memunculkan notifikasi berdasarkan data dari perangkat IoT.</p>
          {/* Button untuk membuat alarm pertama */}
          <Button
            onClick={() => setAddFormOpen(true)}
            className="gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            Buat Alarm
          </Button>
        </div>
      </motion.div>
    );
  }

  // Render tabel data alarm jika ada data
  return (
    // AnimatePresence untuk transisi smooth antar komponen
    <AnimatePresence mode="wait">
      {/* Komponen DataTable untuk menampilkan data alarm */}
      <DataTable
        content="Alarm" // Label konten
        columns={columns} // Konfigurasi kolom
        data={alarms} // Data alarm
        loading={loading} // Status loading
        isMobile={isMobile} // Mode mobile
        selectedRows={selectedRows} // Baris yang dipilih
        setSelectedRows={setSelectedRows} // Setter baris yang dipilih
        onAdd={() => setAddFormOpen(true)} // Handler untuk tombol tambah
        rowActions={rowActions} // Aksi pada setiap baris
        showNotificationInfo={true} // Tampilkan info notifikasi
        onDelete={(selected) => {
          // Handler untuk aksi delete (single atau bulk)
          if (Array.isArray(selected)) {
            // Jika array (bulk delete), map ID ke objek alarm
            setAlarmToDelete(
              selected.map((id) => alarms.find((a) => a.id === id))
            );
          } else {
            // Jika single delete
            setAlarmToDelete(selected);
          }
          // Buka dialog delete
          setDeleteFormOpen(true);
        }}
        // Teks yang ditampilkan jika tidak ada data
        noDataText={
          !alarms || alarms.length === 0
            ? "Anda belum menambahkan alarm."
            : "Tidak ada alarm yang cocok."
        }
        searchPlaceholder="Cari alarm" // Placeholder untuk search
        glowingTable={true} // Efek glow pada tabel
        glowingHeaders={true} // Efek glow pada header
        glowingCells={true} // Efek glow pada cell
      />
    </AnimatePresence>
  );
}

// Import komponen DataTable untuk menampilkan data datastream
import DataTable from "@/components/custom/tables/data-table";
// Import ikon-ikon dari Lucide React
import { Edit, Trash2, Plus } from "lucide-react";
// Import komponen Button
import { Button } from "@/components/ui/button";
// Import Framer Motion untuk animasi
import { AnimatePresence } from "framer-motion";
// Import tooltip untuk deskripsi
import DescriptionTooltip from "@/components/custom/other/description-tooltip";
import { motion } from "framer-motion";

// Komponen konten utama untuk halaman pengelolaan datastream
export default function DatastreamContent({
  datastreams, // Data array datastream
  loading, // Status loading
  setAddFormOpen, // Setter untuk dialog tambah datastream
  setEditDatastream, // Setter untuk datastream yang akan diedit
  setEditFormOpen, // Setter untuk dialog edit datastream
  setDatastreamToDelete, // Setter untuk datastream yang akan dihapus
  setDeleteFormOpen, // Setter untuk dialog hapus datastream
  isMobile, // Status apakah dalam mode mobile
  selectedRows, // Baris yang dipilih
  setSelectedRows, // Setter untuk baris yang dipilih
  devices, // Data devices untuk referensi
  unitOptions, // Opsi unit yang tersedia
}) {
  // Definisi kolom-kolom untuk tabel datastream
  const columns = [
    // Kolom nama/deskripsi datastream
    { key: "description", label: "Nama", sortable: true },
    {
      // Kolom device yang terkait
      key: "device_id",
      label: "Device",
      filterable: true,
      render: (row) => {
        // Cari device berdasarkan device_id
        const dev = devices?.find((d) => d.id === row.device_id);
        return (
          // Tooltip menampilkan informasi device lengkap
          <DescriptionTooltip content={`UID: ${dev?.id || ""} - ${dev?.description || ""}`}>
            <span className="underline underline-offset-2 cursor-help">
              {/* Tampilkan deskripsi device */}
              {dev?.description}
            </span>
          </DescriptionTooltip>
        );
      },
    },
    // Kolom virtual pin
    { key: "pin", label: "Virtual Pin", sortable: true },
    {
      // Kolom tipe data
      key: "type",
      label: "Tipe Data",
      filterable: true, // Dapat difilter
      render: (row) => {
        // Kapitalisasi huruf pertama tipe data
        const typeLabel = row.type.charAt(0).toUpperCase() + row.type.slice(1);
        // Jika tipe double, tampilkan format desimal dalam tooltip
        if (row.type === "double") {
          return (
            <DescriptionTooltip
              content={"Format Desimal: " + row.decimal_value || ""}
            >
              <span className="underline underline-offset-2 cursor-help">
                {typeLabel}
              </span>
            </DescriptionTooltip>
          );
        }
        return typeLabel;
      },
    },
    {
      key: "unit",
      label: "Satuan",
      sortable: true,
      render: (row) => {
        const option = unitOptions?.find((u) => u.value === row.unit);
        return (
          <DescriptionTooltip content={option?.label || "Tidak ada satuan"}>
            <span className="underline underline-offset-2 cursor-help">
              {row.unit}
            </span>
          </DescriptionTooltip>
        );
      },
    },
    { key: "min_value", label: "Min", sortable: false },
    { key: "max_value", label: "Max", sortable: false },
  ];

  const rowActions = [
    {
      key: "edit",
      label: "Edit",
      icon: Edit,
      className: "hover:text-foreground",
      disabled: false,
      onClick: (row) => {
        setEditDatastream(row);
        setEditFormOpen(true);
      },
    },
    {
      key: "delete",
      label: "Hapus",
      icon: Trash2,
      className: "hover:text-primary",
      disabled: false,
      onClick: (row) => {
        setDatastreamToDelete(row);
        setDeleteFormOpen(true);
      },
    },
    // Tambahkan aksi lain di sini, misal:
    // {
    //   key: "connection",
    //   label: "Koneksi",
    //   icon: Trash2,
    //   disabled: true,
    //   onClick: (row) => { ... },
    // },
  ];

  if (!loading && datastreams.length === 0) {
    return (
      <motion.div
        className="flex items-center justify-center h-full"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        transition={{ duration: 0.5, delay: 1, ease: "easeInOut" }}
      >
        <div className="flex flex-col items-center text-sm text-center gap-4 w-xl max-w-md">
          <motion.img
            key="datastream-image"
            src="/datastream.svg"
            alt="Tidak ada datastream"
            className="w-72 h-auto -mb-5 mt-[-50px]"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
          <h2 className="text-xl font-semibold">Datastream masih kosong</h2>
          <p className="text-gray-500 dark:text-gray-400">
            Datastream digunakan untuk mendefinisikan aliran data masuk dan
            keluar dari perangkat IoT. Gunakan untuk mencatat data sensor dan
            aktuator.
          </p>
          <Button
            onClick={() => setAddFormOpen(true)}
            className="gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            Buat Datastream
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="border-0 rounded-xl">
          <DataTable
            content="Datastream"
            columns={columns}
            data={datastreams}
            loading={loading}
            selectedRows={selectedRows}
            setSelectedRows={setSelectedRows}
            onAdd={() => setAddFormOpen(true)}
            rowActions={rowActions}
            devices={devices}
            onDelete={(selected) => {
              if (Array.isArray(selected)) {
                setDatastreamToDelete(
                  selected.map((id) => datastreams.find((ds) => ds.id === id))
                );
              } else {
                setDatastreamToDelete([selected]);
              }
              setDeleteFormOpen(true);
            }}
            noDataText={
              !datastreams || datastreams.length === 0
                ? "Anda belum menambahkan datastream."
                : "Tidak ada datastream yang cocok."
            }
            // limit={5}
            searchPlaceholder="Cari datastream..."
            isMobile={isMobile}
            glowingTable={true}
            glowingHeaders={true}
            glowingCells={true}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

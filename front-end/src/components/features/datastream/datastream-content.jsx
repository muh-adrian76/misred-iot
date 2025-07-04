import DataTable from "@/components/custom/tables/data-table";
import { Edit, Trash2 } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import DescriptionTooltip from "@/components/custom/other/description-tooltip";
import { motion } from "framer-motion";

export default function DatastreamContent({
  datastreams,
  loading,
  setAddFormOpen,
  setEditDatastream,
  setEditFormOpen,
  setDatastreamToDelete,
  setDeleteFormOpen,
  isMobile,
  selectedRows,
  setSelectedRows,
  devices,
  unitOptions,
}) {
  const columns = [
    { key: "description", label: "Nama", sortable: true },
    {
      key: "device_id",
      label: "Device",
      sortable: true,
      render: (row) => {
        const dev = devices?.find((d) => d.id === row.device_id);
        return dev?.description || dev?.name || row.device_id;
      },
    },
    { key: "pin", label: "Pin (0-255)", sortable: true },
    {
      key: "type",
      label: "Tipe Data",
      filterable: true,
      render: (row) => {
        const typeLabel = row.type.charAt(0).toUpperCase() + row.type.slice(1);
        if (row.type === "double") {
          return (
            <DescriptionTooltip content={row.decimal_value || ""}>
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
          <DescriptionTooltip content={option?.label || ""}>
            <span className="underline underline-offset-2 cursor-help">
              {row.unit}
            </span>
          </DescriptionTooltip>
        );
      },
    },
    { key: "default_value", label: "Default", sortable: false },
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
        className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        transition={{ duration: 0.5, delay: 1, ease: "easeInOut" }}
      >
        <div className="flex flex-col items-center text-sm text-center gap-4 w-xl max-w-md">
          <h2 className="text-xl font-semibold">Tidak ada datastream</h2>
          <span className="text-muted-foreground text-balance">
            Buat datastream baru pada sisi kanan atas layar.
          </span>
        </div>
      </motion.div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <DataTable
        content="Datastream"
        columns={columns}
        data={datastreams}
        loading={loading}
        selectedRows={selectedRows}
        setSelectedRows={setSelectedRows}
        onAdd={() => setAddFormOpen(true)}
        rowActions={rowActions}
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
      />
    </AnimatePresence>
  );
}

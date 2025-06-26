import DataTable from "@/components/custom/other/data-table";
import { AnimatePresence } from "framer-motion";

export default function DatastreamContent({
  datastreams,
  loading,
  setAddFormOpen,
  setEditDatastream,
  setEditFormOpen,
  setDatastreamToDelete,
  setDeleteFormOpen,
  isMobile,
}) {
  const columns = [
    { key: "description", label: "Nama", sortable: true },
    { key: "pin", label: "Pin (0-255)", sortable: true },
    { key: "type", label: "Tipe Data", sortable: true },
    { key: "unit", label: "Satuan", sortable: true },
    { key: "default_value", label: "Default", sortable: true },
    { key: "min_value", label: "Min", sortable: true },
    { key: "max_value", label: "Max", sortable: true },
  ];

  return (
    <AnimatePresence>
      <DataTable
        content="Datastream"
        columns={columns}
        data={datastreams}
        loading={loading}
        onAdd={() => setAddFormOpen(true)}
        onEdit={(device) => {
          setEditDatastream(device);
          setEditFormOpen(true);
        }}
        onDelete={(device) => {
          setDatastreamToDelete(device);
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

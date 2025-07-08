import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DataTable from "@/components/custom/tables/data-table";
import { Pencil, Trash2, Plus } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export default function AlarmContent({
  alarms,
  loading,
  setAddFormOpen,
  setEditAlarm,
  setEditFormOpen,
  setAlarmToDelete,
  setDeleteFormOpen,
  isMobile,
  selectedRows,
  setSelectedRows,
}) {
  const columns = [
    { key: "description", label: "Deskripsi", sortable: true },
    { key: "widget_id", label: "Widget ID" },
    { key: "operator", label: "Operator" },
    { key: "threshold", label: "Threshold" },
    {
      key: "last_sended",
      label: "Terakhir Kirim",
      render: (row) =>
        row.last_sended ? new Date(row.last_sended).toLocaleString() : "-",
    },
  ];

  const rowActions = [
    {
      key: "edit",
      label: "Edit",
      icon: Pencil,
      className: "hover:text-foreground",
      disabled: false,
      onClick: (row) => {
        setEditAlarm(row);
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
        setAlarmToDelete(row);
        setDeleteFormOpen(true);
      },
    },
  ];

  if (!loading && alarms.length === 0) {
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
            key="alarm-image"
            src="/alarm.svg"
            alt="No Alarms"
            className="w-72 h-auto -mb-5 mt-[-50px]"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
          <h2 className="text-xl font-semibold">Alarm masih kosong</h2>
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

  return (
    <AnimatePresence mode="wait">
      <DataTable
        content="Alarm"
        columns={columns}
        data={alarms}
        loading={loading}
        isMobile={isMobile}
        selectedRows={selectedRows}
        setSelectedRows={setSelectedRows}
        onAdd={() => setAddFormOpen(true)}
        rowActions={rowActions}
        onDelete={(selected) => {
          if (Array.isArray(selected)) {
            setAlarmToDelete(
              selected.map((id) => alarms.find((a) => a.id === id))
            );
          } else {
            setAlarmToDelete(selected);
          }
          setDeleteFormOpen(true);
        }}
        noDataText={
          !alarms || alarms.length === 0
            ? "Anda belum menambahkan alarm."
            : "Tidak ada alarm yang cocok."
        }
        searchPlaceholder="Cari alarm"
      />
    </AnimatePresence>
  );
}

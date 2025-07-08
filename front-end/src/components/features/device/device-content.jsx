import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Copy,
  Edit,
  WifiCog,
  Power,
  PowerOff,
  Trash2,
  Plus,
} from "lucide-react";
import { successToast } from "@/components/custom/other/toaster";
import DataTable from "@/components/custom/tables/data-table";
import { AnimatePresence } from "framer-motion";
import DescriptionTooltip from "@/components/custom/other/description-tooltip";
import { motion } from "framer-motion";

export default function DeviceContent({
  devices,
  loading,
  setAddFormOpen,
  setEditDevice,
  setEditFormOpen,
  setDeviceToDelete,
  setDeleteFormOpen,
  isMobile,
  selectedRows,
  setSelectedRows,
}) {
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    successToast("Secret berhasil disalin ke clipboard.");
  };

  const columns = [
    { key: "description", label: "Nama", sortable: true },
    {
      key: "status",
      label: "Status",
      filterable: true,
      render: (row) => (
        <Badge variant={row.status || "online"}>
          {row.status === "online" ? (
            <Power className="w-5 h-5" />
          ) : (
            <PowerOff className="w-5 h-5" />
          )}
          {row.status.charAt(0).toUpperCase() + row.status.slice(1) || "Contoh"}
        </Badge>
      ),
    },
    {
      key: "key",
      label: "Secret",
      sortable: false,
      render: (row) => (
        <span className="flex items-center justify-center gap-2">
          <span className="truncate max-w-[100px] inline-block">{row.key}</span>
          <DescriptionTooltip content="Salin" side="right">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => handleCopy(row.key)}
              className="p-1 opacity-50 hover:opacity-100"
            >
              <Copy className="w-4 h-4" />
            </Button>
          </DescriptionTooltip>
        </span>
      ),
    },
    { key: "board_type", label: "Tipe Board", filterable: true },
    {
      key: "protocol",
      label: "Protokol",
      filterable: true,
    },
    { key: "mqtt_topic", label: "Topik MQTT", sortable: true },
    { key: "mqtt_qos", label: "QoS MQTT", filterable: true },
    { key: "lora_profile", label: "Profil Lora", sortable: true },
  ];

  const rowActions = [
    {
      key: "edit",
      label: "Edit",
      icon: Edit,
      className: "hover:text-foreground",
      disabled: false,
      onClick: (row) => {
        setEditDevice(row);
        setEditFormOpen(true);
      },
    },
    {
      key: "connection",
      label: "Koneksi",
      icon: WifiCog,
      className: "hover:text-foreground",
      disabled: true,
      // onClick: (row) => { ... },
    },
    {
      key: "delete",
      label: "Hapus",
      icon: Trash2,
      className: "hover:text-primary",
      disabled: false,
      onClick: (row) => {
        setDeviceToDelete(row);
        setDeleteFormOpen(true);
      },
    },
    // Tambahkan aksi lain di sini, misal:
  ];

  if (!loading && devices.length === 0) {
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
            src="/device.svg"
            alt="No Alarms"
            className="w-72 h-auto -mb-5 mt-[-50px]"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
          <h2 className="text-xl font-semibold">Device masih kosong</h2>
          <Button
            onClick={() => setAddFormOpen(true)}
            className="gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            Buat Device
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <DataTable
        content="Device"
        columns={columns}
        data={devices}
        loading={loading}
        isMobile={isMobile}
        selectedRows={selectedRows}
        setSelectedRows={setSelectedRows}
        onAdd={() => setAddFormOpen(true)}
        rowActions={rowActions}
        onDelete={(selected) => {
          if (Array.isArray(selected)) {
            setDeviceToDelete(
              selected.map((id) => devices.find((d) => d.id === id))
            );
          } else {
            setDeviceToDelete(selected);
          }
          setDeleteFormOpen(true);
        }}
        noDataText={
          !devices || devices.length === 0
            ? "Anda belum menambahkan device."
            : "Tidak ada device yang cocok."
        }
        // limit={5}
        searchPlaceholder="Cari device"
      />
    </AnimatePresence>
  );
}

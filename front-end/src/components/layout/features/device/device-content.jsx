import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import showToast from "@/components/custom/other/toaster";
import DataTable from "@/components/custom/other/data-table";
import { AnimatePresence } from "framer-motion";

export default function DeviceContent({
  devices,
  loading,
  setAddFormOpen,
  setEditDevice,
  setEditFormOpen,
  setDeviceToDelete,
  setDeleteFormOpen,
  isMobile,
}) {
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    showToast("success", "Secret berhasil disalin ke clipboard.");
  };

  const columns = [
    { key: "description", label: "Nama", sortable: true },
    { key: "board_type", label: "Tipe Board", sortable: true },
    {
      key: "protocol",
      label: "Protokol",
      sortable: true,
      render: (row) => (
        <Badge variant="outline">{row.protocol?.toUpperCase()}</Badge>
      ),
    },
    { key: "mqtt_topic", label: "Topik MQTT", sortable: true },
    { key: "mqtt_qos", label: "QoS MQTT", sortable: true },
    { key: "lora_profile", label: "Profil Lora", sortable: true },
    {
      key: "key",
      label: "Secret",
      sortable: false,
      render: (row) => (
        <span className="flex items-center justify-center gap-2">
          <span className="truncate max-w-[100px] inline-block">{row.key}</span>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => handleCopy(row.key)}
            className="p-1"
            title="Copy Secret"
          >
            <Copy className="w-4 h-4" />
          </Button>
        </span>
      ),
    },
  ];

  return (
    <AnimatePresence>
      <DataTable
        content="Device"
        columns={columns}
        data={devices}
        loading={loading}
        isMobile={isMobile}
        onAdd={() => setAddFormOpen(true)}
        onEdit={(device) => {
          setEditDevice(device);
          setEditFormOpen(true);
        }}
        onDelete={(device) => {
          setDeviceToDelete(device);
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

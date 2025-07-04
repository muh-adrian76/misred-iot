import { useState, useEffect } from "react";
import ResponsiveDialog from "@/components/custom/dialogs/responsive-dialog";
import { successToast, errorToast } from "@/components/custom/other/toaster";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

export default function AddWidgetDialog({
  open,
  setOpen,
  initialData,
  onSubmit,
  devices = [],
  datastreams = [],
}) {
  const [form, setForm] = useState({
    description: "",
    dashboard_id: "",
    device_id: "",
    datastream_id: "",
  });
  const [loading, setLoading] = useState(false);

  // Reset form saat dialog dibuka
  useEffect(() => {
    if (open) {
      setForm({
        description: "",
        dashboard_id: String(initialData?.dashboard_id) || "",
        device_id: "",
        datastream_id: "",
      });
    }
  }, [open, initialData]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSelectChange = (name, value) => {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        ...form,
        chartType: initialData?.chartType,
        layout: initialData?.layoutItem,
      });
      setOpen(false);
      successToast("Widget berhasil ditambahkan");
    } catch (error) {
      errorToast("Gagal menambahkan widget");
    } finally {
      setLoading(false);
    }
  };

  const formContent = (
    <div className="flex flex-col gap-4 py-2">
      {/* Deskripsi */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="description" className="text-left ml-1 font-medium">
          Nama
        </Label>
        <Input
          id="description"
          name="description"
          placeholder="Nama atau judul widget"
          value={form.description}
          onChange={handleChange}
          required
        />
      </div>
      {/* Dashboard ID */}
      <Input
        id="dashboard_id"
        type="hidden"
        value={form.dashboard_id}
        required
      />
      {/* Device */}
      <div className="flex flex-col gap-2">
        <Label className="text-left ml-1 font-medium">Device</Label>
        <Select
          value={form.device_id}
          onValueChange={(value) => handleSelectChange("device_id", value)}
          required
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Pilih Device" />
          </SelectTrigger>
          <SelectContent>
            {devices.map((device) => (
              <SelectItem key={device.id} value={String(device.id)}>
                {device.description}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {/* Datastream */}
      <div className="flex flex-col gap-2">
        <Label className="text-left ml-1 font-medium">Datastream</Label>
        <Select
          value={form.datastream_id}
          onValueChange={(value) => handleSelectChange("datastream_id", value)}
          required
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Pilih Datastream" />
          </SelectTrigger>
          <SelectContent>
            {datastreams.map((ds) => (
              <SelectItem key={ds.id} value={String(ds.id, ds.pin)}>
                {`${ds.description} (Pin ${ds.pin})`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <ResponsiveDialog
      open={open}
      setOpen={setOpen}
      title="Pengaturan Widget"
      form={formContent}
      formHandle={handleSubmit}
      loading={loading}
      confirmText="Simpan"
      cancelText="Batal"
    />
  );
}

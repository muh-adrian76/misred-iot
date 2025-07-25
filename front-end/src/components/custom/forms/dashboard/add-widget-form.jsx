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
import { Button } from "@/components/ui/button";
import { useBreakpoint } from "@/hooks/use-mobile";

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
    selectedPairs: [], // Array of { device_id, datastream_id }
  });
  const [loading, setLoading] = useState(false);
  
  // State untuk menyimpan pilihan sementara sebelum ditambahkan
  const [tempSelection, setTempSelection] = useState("");

  // Popover state for device selection
  const [openDevicePopover, setOpenDevicePopover] = useState(false);

  const { isMobile, isTablet, isDesktop } = useBreakpoint();

  // Reset form saat dialog dibuka
  useEffect(() => {
    if (open) {
      setForm({
        description: "",
        dashboard_id: String(initialData?.dashboard_id) || "",
        selectedPairs: [],
      });
      setTempSelection(""); // Reset temp selection
    }
  }, [open, initialData]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSelectChange = (name, value) => {
    setForm((prev) => ({
      ...prev,
      [name]: value,
      // Reset datastream selection when device changes
      ...(name === "device_id" ? { datastream_id: "", datastream_ids: [] } : {}),
    }));
  };

  // Handle adding device-datastream pair from temp selection
  const handleAddPair = () => {
    if (!tempSelection) return;
    
    const [deviceId, datastreamId] = tempSelection.split('|');
    const device_id = parseInt(deviceId);
    const datastream_id = parseInt(datastreamId);
    
    const currentPairs = form.selectedPairs || [];
    const exists = currentPairs.some(
      (pair) => pair.device_id === device_id && pair.datastream_id === datastream_id
    );
    
    if (!exists && currentPairs.length < 5) {
      setForm((prev) => ({
        ...prev,
        selectedPairs: [...currentPairs, { device_id, datastream_id }],
      }));
      setTempSelection(""); // Reset selection after adding
    }
  };

  // Handle removing device-datastream pair
  const handleRemovePair = (device_id, datastream_id) => {
    const currentPairs = form.selectedPairs || [];
    setForm((prev) => ({
      ...prev,
      selectedPairs: currentPairs.filter(
        (pair) => !(pair.device_id === device_id && pair.datastream_id === datastream_id)
      ),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (form.selectedPairs.length === 0) {
        errorToast("Pilih minimal satu device dan datastream!");
        return;
      }
      await onSubmit({
        description: form.description,
        dashboard_id: form.dashboard_id,
        inputs: form.selectedPairs,
        chartType: initialData?.chartType,
        layout: initialData?.layoutItem,
      });
      setOpen(false);
    } catch (error) {
      errorToast("Gagal menambahkan widget");
    } finally {
      setLoading(false);
    }
  };

  // Filter datastreams sesuai device yang dipilih
  // Group datastreams by device
  const datastreamsByDevice = devices.map((device) => ({
    ...device,
    datastreams: datastreams.filter((ds) => String(ds.device_id) === String(device.id)),
  }));

  const formContent = (
    <div className="flex flex-col gap-4 py-2">
      {/* Dashboard ID & Nama */}
      <Input id="dashboard_id" type="hidden" value={form.dashboard_id} required />
      <Label htmlFor="description" className="text-left ml-1 font-medium">Nama</Label>
      <Input
        id="description"
        name="description"
        placeholder="Nama atau judul widget"
        value={form.description}
        onChange={handleChange}
        required
      />
      {/* Multi-select device-datastream */}
      <div className="flex flex-col gap-2">
        <Label className="text-left ml-1 font-medium">Device & Datastream</Label>
        
        {/* Kondisi yang ditambahkan */}
        <div className="space-y-2">
          {form.selectedPairs.map((pair, idx) => {
            const device = devices.find((d) => d.id === pair.device_id);
            const ds = datastreams.find((d) => d.id === pair.datastream_id);
            return (
              <div key={idx} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ background: `var(--chart-${(idx % 5) + 1})` }}
                  ></div>
                  <div>
                    <p className="text-sm font-medium">{device?.description || device?.name}</p>
                    <p className="text-xs text-muted-foreground">{ds?.description} (Pin {ds?.pin})</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemovePair(pair.device_id, pair.datastream_id)}
                  className="h-8 w-8 p-0"
                >
                  ×
                </Button>
              </div>
            );
          })}
        </div>

        {/* Tambah kondisi baru */}
        {form.selectedPairs.length < 5 && (
          <div className="flex items-center gap-2 p-3 border-2 border-dashed rounded-lg">
            <Select
              value={tempSelection}
              onValueChange={setTempSelection}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Pilih Device & Datastream" />
              </SelectTrigger>
              <SelectContent>
                {devices.length === 0 || datastreams.length === 0 ? (
                  <div className="px-2 py-3 text-center text-sm text-muted-foreground">
                    {devices.length === 0 && datastreams.length === 0 
                      ? "Device dan datastream masih kosong" 
                      : devices.length === 0 
                        ? "Device masih kosong" 
                        : "Datastream masih kosong"}
                  </div>
                ) : (
                  datastreamsByDevice.map((device) => (
                    <div key={device.id}>
                      {device.datastreams.length > 0 && (
                        <>
                          <div className="px-2 py-1 text-xs font-semibold text-muted-foreground border-b">
                            {device.description || device.name}
                          </div>
                          {device.datastreams.map((ds) => {
                            const alreadySelected = form.selectedPairs.some(
                              pair => pair.device_id === device.id && pair.datastream_id === ds.id
                            );
                            if (alreadySelected) return null;
                            
                            return (
                              <SelectItem key={ds.id} value={`${device.id}|${ds.id}`}>
                                {ds.description} (Pin {ds.pin})
                              </SelectItem>
                            );
                          })}
                        </>
                      )}
                    </div>
                  ))
                )}
              </SelectContent>
            </Select>
            <Button 
              type="button" 
              size="sm" 
              variant="outline"
              onClick={handleAddPair}
              disabled={!tempSelection}
            >
              +
            </Button>
          </div>
        )}
      </div>
    </div>
  );
// ...existing code...

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

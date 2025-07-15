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
import { ChevronDown, Check } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Link } from "next-view-transitions";
import { useBreakpoint } from "@/hooks/use-mobile";

export default function EditWidgetDialog({
  open,
  setOpen,
  widgetData,
  onSubmit,
  devices = [],
  datastreams = [],
}) {
  const [form, setForm] = useState({
    id: "",
    description: "",
    dashboard_id: "",
    device_id: "",
    datastream_id: "",
  });
  const [loading, setLoading] = useState(false);

  // Popover state for device selection
  const [openDevicePopover, setOpenDevicePopover] = useState(false);

  const { isMobile, isTablet, isDesktop } = useBreakpoint();

  // Reset form when dialog is opened
  useEffect(() => {
    if (open && widgetData) {
      setForm({
        id: widgetData.id || "",
        description: widgetData.description || "",
        dashboard_id: widgetData.dashboard_id || "",
        device_id: widgetData.device_id || "",
        datastream_id: widgetData.datastream_id || "",
      });
    }
  }, [open, widgetData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleDeviceSelect = (deviceId) => {
    setForm((prev) => ({ ...prev, device_id: deviceId, datastream_id: "" }));
    setOpenDevicePopover(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation
      if (!form.description.trim()) {
        errorToast("Nama widget harus diisi");
        return;
      }

      if (!form.device_id) {
        errorToast("Device harus dipilih");
        return;
      }

      if (!form.datastream_id) {
        errorToast("Datastream harus dipilih");
        return;
      }

      await onSubmit(form);
    //   successToast("Widget berhasil diupdate");
      setOpen(false);
    } catch (error) {
      console.error("Error updating widget:", error);
      errorToast("Gagal mengupdate widget");
    } finally {
      setLoading(false);
    }
  };

  // Filter datastreams based on selected device
  const filteredDatastreams = datastreams.filter(
    (ds) => ds.device_id === form.device_id
  );

  const formContent = (
    <div className="flex flex-col gap-4 py-2">
      {/* Hidden ID field */}
      <Input
        id="id"
        type="hidden"
        value={form.id}
        required
      />
      
      {/* Deskripsi */}
      <div className="flex flex-col gap-2">
        {/* Dashboard ID */}
        <Input
          id="dashboard_id"
          type="hidden"
          value={form.dashboard_id}
          required
        />
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
      
      {/* Device */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label className="text-left ml-1 font-medium">Device</Label>
          <Popover open={openDevicePopover} onOpenChange={setOpenDevicePopover}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openDevicePopover}
                className="justify-between w-full"
              >
                <span className="truncate">
                  {devices.find((d) => d.id === form.device_id)?.description ||
                    devices.find((d) => d.id === form.device_id)?.name ||
                    "Pilih Device"}
                </span>
                <ChevronDown className="ml-2 h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-full" align="start">
              <Command>
                <CommandInput placeholder="Cari device..." />
                <CommandList>
                  <CommandEmpty>
                    <Link
                      href="/devices"
                      className="opacity-50 transition-all hover:opacity-100"
                    >
                      Device tidak ditemukan. Buat device baru.
                    </Link>
                  </CommandEmpty>
                  {devices.map((device) => (
                    <CommandItem
                      key={device.id}
                      value={device.description || device.name}
                      onSelect={() => handleDeviceSelect(device.id)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          form.device_id === device.id
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {device.description || device.name}
                        </span>
                        {device.description && device.name && (
                          <span className="text-xs opacity-60">{device.name}</span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Datastream */}
        <div className="flex flex-col gap-2">
          <Label className="text-left ml-1 font-medium">Datastream</Label>
          <Select
            value={form.datastream_id}
            onValueChange={(value) =>
              setForm((prev) => ({ ...prev, datastream_id: value }))
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih Datastream" />
            </SelectTrigger>
            <SelectContent>
              {filteredDatastreams.length === 0 ? (
                <div className="p-2 text-center">
                  <span className="text-sm opacity-50">
                    {form.device_id
                      ? "Tidak ada datastream untuk device ini"
                      : "Pilih device terlebih dahulu"}
                  </span>
                  {form.device_id && (
                    <Link
                      href="/datastreams"
                      className="block mt-1 text-xs opacity-50 transition-all hover:opacity-100"
                    >
                      Buat datastream baru
                    </Link>
                  )}
                </div>
              ) : (
                filteredDatastreams.map((datastream) => (
                  <SelectItem key={datastream.id} value={datastream.id}>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {`${datastream.description} (Pin ${datastream.pin})`}
                      </span>
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  return (
    <ResponsiveDialog
      open={open}
      setOpen={setOpen}
      title={
        <>
          Edit <i>{widgetData?.description || ""}</i>
        </>
      }
      form={formContent}
      formHandle={handleSubmit}
      loading={loading}
      confirmText="Simpan"
      cancelText="Batal"
    />
  );
}

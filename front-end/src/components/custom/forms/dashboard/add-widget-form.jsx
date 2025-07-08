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

  // Popover state for device selection
  const [openDevicePopover, setOpenDevicePopover] = useState(false);

  const { isMobile, isTablet, isDesktop } = useBreakpoint();

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
      ...(name === "device_id" ? { datastream_id: "" } : {}), // reset datastream jika device berubah
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

  // Filter datastreams sesuai device yang dipilih
  const filteredDatastreams = form.device_id
    ? datastreams.filter(
        (ds) => String(ds.device_id) === String(form.device_id)
      )
    : [];

  const formContent = (
    <div className="flex flex-col gap-4 py-2">
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
                      Buat device baru
                    </Link>
                  </CommandEmpty>
                  {devices.map((dev) => (
                    <CommandItem
                      key={dev.id}
                      value={dev.id}
                      onSelect={() => {
                        handleSelectChange("device_id", dev.id);
                        setOpenDevicePopover(false);
                      }}
                    >
                      <span className="truncate">
                        {dev.description || dev.name}
                      </span>
                      <Check
                        className={cn(
                          "ml-auto",
                          form.device_id === dev.id
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
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
              handleSelectChange("datastream_id", value)
            }
            required
            disabled={!form.device_id}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih Datastream" />
            </SelectTrigger>
            <SelectContent>
              {filteredDatastreams.length === 0 ? (
                <div className="px-2 py-2 text-sm text-center">
                  {form.device_id
                    ? <Link
                      href="/datastreams"
                      className="opacity-50 transition-all hover:opacity-100"
                    >
                      Buat datastream baru
                    </Link>
                    : "Pilih device terlebih dahulu"}
                </div>
              ) : (
                filteredDatastreams.map((ds) => (
                  <SelectItem key={ds.id} value={String(ds.id)}>
                    {`${ds.description} (Pin ${ds.pin})`}
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
      title="Pengaturan Widget"
      form={formContent}
      formHandle={handleSubmit}
      loading={loading}
      confirmText="Simpan"
      cancelText="Batal"
    />
  );
}

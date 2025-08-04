"use client"; // Next.js directive untuk client-side component

// Import komponen dialog responsif untuk form
import ResponsiveDialog from "@/components/custom/dialogs/responsive-dialog";
// Import UI components untuk form inputs
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
// Import komponen Command untuk search/select functionality
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
// Import Popover untuk dropdown menu
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
// Import icons untuk UI elements
import { ChevronDown, Check, Plus, X, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils"; // Utility untuk CSS classes
// Import komponen Select untuk dropdown
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
// Import React hooks untuk state management
import { useState, useEffect } from "react";
// Import toaster untuk error notifications
import { errorToast } from "../../other/toaster";
import DescriptionTooltip from "@/components/custom/other/description-tooltip";

// Komponen AddAlarmForm untuk membuat alarm monitoring IoT
export default function AddAlarmForm({
  open, // State untuk kontrol visibility modal
  setOpen, // Setter untuk mengubah state modal
  handleAddAlarm, // Handler function untuk create alarm baru
  devices = [], // Array device yang tersedia untuk monitoring
  datastreams = [], // Array datastream dari devices
  loadingDevices = false, // Loading state untuk devices data
  loadingDatastreams = false, // Loading state untuk datastreams data
  isMobile, // Flag untuk responsive design
}) {
  // State untuk form fields
  const [description, setDescription] = useState(""); // Deskripsi alarm
  const [deviceId, setDeviceId] = useState(""); // ID device yang dipilih
  const [datastreamId, setDatastreamId] = useState(""); // ID datastream yang dipilih
  const [conditions, setConditions] = useState([]); // Array kondisi threshold alarm
  const [isActive, setIsActive] = useState(true); // Status aktif/nonaktif alarm
  const [cooldownMinutes, setCooldownMinutes] = useState("1"); // Cooldown delay dalam menit

  // State untuk kontrol popover dropdowns
  const [openDevicePopover, setOpenDevicePopover] = useState(false);
  const [openDatastreamPopover, setOpenDatastreamPopover] = useState(false);

  // State untuk form input kondisi baru
  const [newConditionOperator, setNewConditionOperator] = useState(">"); // Operator kondisi (>, <, =, !=)
  const [newConditionThreshold, setNewConditionThreshold] = useState(""); // Nilai threshold untuk trigger alarm

  // Filter datastreams berdasarkan device yang dipilih untuk menampilkan hanya sensor yang relevan
  const filteredDatastreams = deviceId
    ? datastreams.filter((ds) => String(ds.device_id) === String(deviceId))
    : [];

  // Reset form when dialog opens - clear semua input saat modal dibuka
  useEffect(() => {
    if (open) {
      setDescription(""); // Clear deskripsi alarm
      setDeviceId(""); // Clear device selection
      setDatastreamId(""); // Clear datastream selection
      setConditions([]); // Clear array kondisi threshold
      setCooldownMinutes("1"); // Reset cooldown ke default
      setNewConditionOperator(">"); // Reset operator ke default
      setNewConditionThreshold(""); // Clear threshold input
    }
  }, [open]);

  // Reset datastream when device changes - memastikan konsistensi data
  useEffect(() => {
    if (deviceId) {
      setDatastreamId(""); // Reset datastream selection saat device berubah
    }
  }, [deviceId]);

  // Function untuk menambahkan kondisi threshold baru ke alarm
  const addCondition = () => {
    // Validasi input dan limit maksimum 5 kondisi
    if (newConditionThreshold.trim() !== "" && conditions.length < 5) {
      const newCondition = {
        operator: newConditionOperator, // Operator perbandingan (>, <, =, !=)
        threshold: Number(newConditionThreshold), // Convert string ke number
      };
      setConditions([...conditions, newCondition]); // Tambahkan ke array kondisi
      setNewConditionThreshold(""); // Reset input field
    }
  };

  // Function untuk menghapus kondisi dari list
  const removeCondition = (index) => {
    setConditions(conditions.filter((_, i) => i !== index)); // Remove by index
  };

  // Content form dengan layout responsive
  const formContent = (
    <div className="flex flex-col gap-4 py-2">
      {/* Section Description - input deskripsi alarm */}
      <div className="grid grid-cols-1 gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex gap-2 items-center">
            <Label className="text-left ml-1 font-medium max-sm:text-xs">Nama</Label>
            <DescriptionTooltip
              side="right"
              content="Karakter alfanumerik dibatasi hanya (@ / . - _)"
            >
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </DescriptionTooltip>
          </div>
          <Input
            value={description} // Controlled input
            onChange={(e) => setDescription(e.target.value)} // Update state saat typing
            placeholder="Masukkan nama alarm" // Placeholder text
            required // Field wajib diisi
          />
        </div>
      </div>

      {/* Section Device and Datastream Selection - pilih device dan sensor untuk monitoring */}
      <div className="grid grid-cols-3 max-sm:grid-cols-2 gap-4">
        {/* Device Selection dengan searchable dropdown */}
        <div className="flex flex-col gap-2">
          <div className="flex gap-2 items-center">
            <Label className="text-left ml-1 font-medium max-sm:text-xs">Device</Label>
            <DescriptionTooltip side="top" content="Pilih perangkat IoT">
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </DescriptionTooltip>
          </div>
          {/* Comment: Menggunakan Popover untuk semua screen size karena memberikan UX yang lebih baik */}
          {/* {isMobile ? (
            <Select value={deviceId} onValueChange={setDeviceId}>
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={loadingDevices ? "Loading..." : "Pilih Device"}
                />
              </SelectTrigger>
              <SelectContent>
                {devices.map((d) => (
                  <SelectItem key={d.id} value={String(d.id)}>
                    {d.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : ( */}
          <Popover
            open={openDevicePopover} // State kontrol popover visibility
            onOpenChange={setOpenDevicePopover} // Handler untuk toggle popover
          >
            <PopoverTrigger asChild>
              <Button
                variant="outline" // Style button sebagai outline
                role="combobox" // Accessibility role
                aria-expanded={openDevicePopover} // Accessibility state
                className="justify-between w-full" // Layout classes
              >
                <span className="truncate">
                  {/* Display selected device atau placeholder */}
                  {devices.find((d) => String(d.id) === String(deviceId))
                    ?.description ||
                    (loadingDevices ? "Loading..." : "Pilih Device")}
                </span>
                <ChevronDown className="ml-2 h-5 w-5" /> {/* Dropdown icon */}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-full" align="start">
              <Command>
                {" "}
                {/* Command component untuk search functionality */}
                <CommandInput placeholder="Cari device..." />{" "}
                {/* Search input */}
                <CommandList>
                  <CommandEmpty>
                    <span className="opacity-50">Tidak ada device.</span>{" "}
                    {/* Empty state */}
                  </CommandEmpty>
                  {/* Render list devices yang tersedia */}
                  {devices.map((d) => (
                    <CommandItem
                      key={d.id} // Unique key untuk list rendering
                      value={String(d.id)} // Value untuk selection
                      onSelect={() => {
                        setDeviceId(String(d.id)); // Set selected device ID
                        setOpenDevicePopover(false); // Close popover setelah select
                      }}
                    >
                      <span className="truncate">{d.description}</span>{" "}
                      {/* Display device name */}
                      <Check
                        className={cn(
                          "ml-auto", // Position check icon
                          String(deviceId) === String(d.id)
                            ? "opacity-100" // Show check jika selected
                            : "opacity-0" // Hide check jika tidak selected
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {/* )} */}
        </div>

        {/* Datastream Selection - sensor yang akan dimonitor */}
        <div className="flex flex-col gap-2">
          <div className="flex gap-2 items-center">
            <Label className="text-left ml-1 font-medium max-sm:text-xs">Datastream</Label>
            <DescriptionTooltip
              side="top"
              content="Pilih sensor yang akan dimonitor"
            >
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </DescriptionTooltip>
          </div>
          {/* Comment: Menggunakan Popover untuk consistency dengan device selection */}
          {/* {isMobile ? (
            <Select
              value={datastreamId}
              onValueChange={setDatastreamId}
              disabled={!deviceId}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    loadingDatastreams
                      ? "Loading..."
                      : deviceId
                        ? "Pilih Sensor"
                        : "Pilih device terlebih dahulu"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {filteredDatastreams.map((ds) => (
                  <SelectItem key={ds.id} value={String(ds.id)}>
                    {ds.description} (Pin {ds.pin})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : ( */}
          <Popover
            open={openDatastreamPopover} // State kontrol datastream popover
            onOpenChange={setOpenDatastreamPopover} // Handler toggle datastream popover
          >
            <PopoverTrigger asChild>
              <Button
                variant="outline" // Style button outline
                role="combobox" // Accessibility role
                aria-expanded={openDatastreamPopover} // Accessibility state
                className="justify-between w-full" // Layout classes
                disabled={!deviceId} // Disable jika device belum dipilih
              >
                <span className="truncate">
                  {/* Display selected datastream atau placeholder */}
                  {filteredDatastreams.find(
                    (ds) => String(ds.id) === String(datastreamId)
                  )?.description ||
                    (loadingDatastreams
                      ? "Loading..." // Loading state
                      : deviceId
                        ? "Pilih Sensor"
                        : "Pilih device terlebih dahulu")}
                </span>
                <ChevronDown className="ml-2 h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-full" align="start">
              <Command>
                <CommandInput placeholder="Cari sensor..." />
                <CommandList>
                  <CommandEmpty>
                    <span className="opacity-50">Tidak ada sensor.</span>
                  </CommandEmpty>
                  {filteredDatastreams.map((ds) => (
                    <CommandItem
                      key={ds.id}
                      value={String(ds.id)}
                      onSelect={() => {
                        setDatastreamId(String(ds.id));
                        setOpenDatastreamPopover(false);
                      }}
                    >
                      <span className="truncate">
                        {ds.description} (Pin {ds.pin})
                      </span>
                      <Check
                        className={cn(
                          "ml-auto",
                          String(datastreamId) === String(ds.id)
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
          {/* )} */}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex gap-2 items-center">
            <Label className="text-left ml-1 font-medium max-sm:text-xs">Waktu Tunggu (menit)</Label>
            <DescriptionTooltip
              side="left"
              content="Jeda alarm setelah terpicu"
            >
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </DescriptionTooltip>
          </div>
          <Input
            value={cooldownMinutes}
            onChange={(e) => setCooldownMinutes(e.target.value)}
            type="number"
            min="1"
            placeholder="1"
            noInfo
          />
        </div>
      </div>

      {/* Conditions */}
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-4 gap-2 border rounded-md py-2 px-5">
          <div className="flex gap-2 items-center">
            <Label className="text-left ml-1 font-medium max-sm:text-xs">Kondisi: </Label>
            <DescriptionTooltip side="top" content="Syarat untuk memicu alarm">
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </DescriptionTooltip>
          </div>
          {/* Input untuk kondisi baru */}
          {/* <Label className="text-xs">Operator</Label> */}
          <Select
            value={newConditionOperator}
            onValueChange={setNewConditionOperator}
          >
            <SelectTrigger className="h-9 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value=">">&gt;</SelectItem>
              <SelectItem value="<">&lt;</SelectItem>
              <SelectItem value=">=">&gt;=</SelectItem>
              <SelectItem value="<=">&lt;=</SelectItem>
              <SelectItem value="=">=</SelectItem>
            </SelectContent>
          </Select>
          {/* <Label className="text-xs">Threshold</Label> */}
          <Input
            value={newConditionThreshold}
            onChange={(e) => setNewConditionThreshold(e.target.value)}
            type="number"
            className="h-9"
            placeholder="Nilai..."
            noInfo
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addCondition}
            disabled={!newConditionThreshold.trim() || conditions.length >= 5}
            className="h-9 px-3"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Display kondisi sebagai tags */}
        {conditions.length > 0 && (
          <>
            <Label className="text-xs text-muted-foreground">
              Kondisi yang ditambahkan:
            </Label>
            <div className="flex flex-wrap gap-2">
              {conditions.map((condition, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="text-sm flex items-center gap-2 px-3 py-1"
                >
                  <span>
                    {condition.operator} {condition.threshold}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCondition(index)}
                    className="h-4 w-4 p-0 hover:opacity-100 opacity-50"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </>
        )}

        {/* Empty state message ketika belum ada kondisi */}
        {conditions.length === 0 && (
          <div className="text-sm text-muted-foreground italic py-2">
            Belum ada kondisi. Tambahkan minimal satu kondisi untuk alarm.{" "}
            {/* Info message */}
          </div>
        )}

        {/* Section Status Aktif - toggle untuk aktivasi alarm */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="space-y-0.5 mr-3">
            <Label>Status Alarm</Label>
            <p className="text-sm text-muted-foreground">
              {/* Dynamic description berdasarkan status alarm */}
              {isActive
                ? "Alarm sedang aktif dan akan memantau kondisi" // Active state description
                : "Alarm tidak aktif dan tidak akan memantau kondisi"}{" "}
              {/* Inactive state description */}
            </p>
          </div>
          <Switch checked={isActive} onCheckedChange={setIsActive} />{" "}
          {/* Toggle switch */}
        </div>
      </div>
    </div>
  );

  // Handler untuk submit form alarm baru dengan validasi
  const handleSubmit = (e) => {
    e.preventDefault(); // Prevent default form submission

    // Validasi minimal satu kondisi harus ada
    if (conditions.length === 0) {
      errorToast("Harap tambahkan minimal satu kondisi alarm!"); // Error toast notification
      return; // Stop execution jika validasi gagal
    }

    // Call parent handler dengan data alarm
    handleAddAlarm({
      description, // Deskripsi alarm
      device_id: Number(deviceId), // Convert string ke number untuk device ID
      datastream_id: Number(datastreamId), // Convert string ke number untuk datastream ID
      is_active: isActive, // Status aktif alarm
      conditions: conditions, // Array kondisi threshold
      cooldown_minutes: Number(cooldownMinutes), // Convert cooldown ke number
    });
    setOpen(false); // Close modal setelah submit
  };

  // Render ResponsiveDialog dengan form content
  return (
    <ResponsiveDialog
      open={open} // State visibility modal
      setOpen={setOpen} // Function untuk kontrol modal
      title="Tambah Alarm" // Title modal
      form={formContent} // Content form
      formHandle={handleSubmit} // Submit handler
      confirmText="Tambah" // Button text untuk confirm
      cancelText="Batal" // Button text untuk cancel
    />
  );
}

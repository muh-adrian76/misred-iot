// Import komponen dialog responsif untuk form edit
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

// Komponen EditAlarmForm untuk mengedit alarm monitoring IoT yang sudah ada
export default function EditAlarmForm({
  open, // State untuk kontrol visibility modal
  setOpen, // Setter untuk mengubah state modal
  editAlarm, // Data alarm yang akan diedit
  handleEditAlarm, // Handler function untuk update alarm
  devices = [], // Array device yang tersedia untuk monitoring
  datastreams = [], // Array datastream dari devices
  loadingDevices = false, // Loading state untuk devices data
  loadingDatastreams = false, // Loading state untuk datastreams data
  isMobile, // Flag untuk responsive design
}) {
  // State untuk form fields dengan data yang akan diedit
  const [description, setDescription] = useState(""); // Deskripsi alarm
  const [deviceId, setDeviceId] = useState(""); // ID device yang dipilih
  const [datastreamId, setDatastreamId] = useState(""); // ID datastream yang dipilih
  const [conditions, setConditions] = useState([]); // Array kondisi threshold alarm
  const [cooldownMinutes, setCooldownMinutes] = useState("1"); // Cooldown delay dalam menit
  const [isActive, setIsActive] = useState(true); // Status aktif/nonaktif alarm

  // State untuk kontrol popover dropdowns
  const [openDevicePopover, setOpenDevicePopover] = useState(false);
  const [openDatastreamPopover, setOpenDatastreamPopover] = useState(false);

  // Form input untuk kondisi baru
  const [newConditionOperator, setNewConditionOperator] = useState(">");
  const [newConditionThreshold, setNewConditionThreshold] = useState("");

  // Filter datastreams berdasarkan device yang dipilih
  const filteredDatastreams = deviceId
    ? datastreams.filter((ds) => String(ds.device_id) === String(deviceId))
    : [];

  // Load data dan populate form ketika editAlarm berubah
  useEffect(() => {
    if (editAlarm) {
      setDescription(editAlarm.description || "");
      setDeviceId(editAlarm.device_id?.toString() || "");
      setDatastreamId(editAlarm.datastream_id?.toString() || "");
      setIsActive(
        editAlarm.is_active !== undefined ? Boolean(editAlarm.is_active) : true
      );

      // Handle conditions - convert to new format
      if (editAlarm.conditions && Array.isArray(editAlarm.conditions)) {
        setConditions(
          editAlarm.conditions.map((c) => ({
            operator: c.operator || ">",
            threshold: Number(c.threshold) || 0,
          }))
        );
      } else if (editAlarm.operator && editAlarm.threshold !== undefined) {
        // Backward compatibility for old single condition format
        setConditions([
          {
            operator: editAlarm.operator || ">",
            threshold: Number(editAlarm.threshold) || 0,
          },
        ]);
      } else {
        setConditions([]);
      }

      setCooldownMinutes(editAlarm.cooldown_minutes || "1");
      setNewConditionOperator(">");
      setNewConditionThreshold("");
    }
  }, [editAlarm, open]);

  // Reset datastream when device changes (selain saat inisialisasi)
  useEffect(() => {
    if (
      deviceId &&
      editAlarm &&
      String(deviceId) !== String(editAlarm.device_id)
    ) {
      setDatastreamId(""); // Reset datastream selection when device changes
    }
  }, [deviceId, editAlarm]);

  // Condition management functions
  const addCondition = () => {
    if (newConditionThreshold.trim() !== "" && conditions.length < 5) {
      const newCondition = {
        operator: newConditionOperator,
        threshold: Number(newConditionThreshold),
      };
      setConditions([...conditions, newCondition]);
      setNewConditionThreshold(""); // Reset input
    }
  };

  const removeCondition = (index) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const formContent = (
    <div className="flex flex-col gap-4 py-2">
      {/* Description */}
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
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Masukkan deskripsi alarm"
            required
          />
        </div>
      </div>

      {/* Device and Datastream */}
      <div className="grid grid-cols-3 max-sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex gap-2 items-center">
            <Label className="text-left ml-1 font-medium max-sm:text-xs">Device</Label>
            <DescriptionTooltip side="top" content="Pilih perangkat IoT">
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </DescriptionTooltip>
          </div>
          {/* {isMobile ? (
            <Select
              value={deviceId}
              onValueChange={(value) => {
                setDeviceId(value);
                setDatastreamId(""); // Reset datastream
              }}
            >
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
          <Popover open={openDevicePopover} onOpenChange={setOpenDevicePopover}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openDevicePopover}
                className="justify-between w-full"
              >
                <span className="truncate">
                  {devices.find((d) => String(d.id) === String(deviceId))
                    ?.description || "Pilih Device"}
                </span>
                <ChevronDown className="ml-2 h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-full" align="start">
              <Command>
                <CommandInput placeholder="Cari device..." />
                <CommandList>
                  <CommandEmpty>
                    <span className="opacity-50">Tidak ada device.</span>
                  </CommandEmpty>
                  {devices.map((d) => (
                    <CommandItem
                      key={d.id}
                      value={String(d.id)}
                      onSelect={() => {
                        setDeviceId(String(d.id));
                        setDatastreamId(""); // Reset datastream
                        setOpenDevicePopover(false);
                      }}
                    >
                      <span className="truncate">{d.description}</span>
                      <Check
                        className={cn(
                          "ml-auto",
                          String(deviceId) === String(d.id)
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
            <Label className="text-left ml-1 font-medium max-sm:text-xs">Datastream</Label>
            <DescriptionTooltip
              side="top"
              content="Pilih sensor yang akan dimonitor"
            >
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </DescriptionTooltip>
          </div>
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
            open={openDatastreamPopover}
            onOpenChange={setOpenDatastreamPopover}
          >
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openDatastreamPopover}
                className="justify-between w-full"
                disabled={!deviceId}
              >
                <span className="truncate">
                  {filteredDatastreams.find(
                    (ds) => String(ds.id) === String(datastreamId)
                  )?.description ||
                    (deviceId
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

        {/* Cooldown */}
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

      {/* Input untuk kondisi baru */}
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-4 gap-2 items-center border rounded-md py-2 px-5">
          <div className="flex gap-2 items-center">
            <Label className="text-left ml-1 font-medium max-sm:text-xs">Kondisi: </Label>
            <DescriptionTooltip side="top" content="Syarat untuk memicu alarm">
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </DescriptionTooltip>
          </div>
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

        {conditions.length === 0 && (
          <div className="text-sm text-muted-foreground italic py-2">
            Belum ada kondisi. Tambahkan minimal satu kondisi untuk alarm.
          </div>
        )}

        {/* Status Aktif */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="space-y-0.5 mr-3">
            <Label>Status Alarm</Label>
            <p className="text-sm text-muted-foreground">
              {isActive
                ? "Alarm sedang aktif dan akan memantau kondisi"
                : "Alarm tidak aktif dan tidak akan memantau kondisi"}
            </p>
          </div>
          <Switch checked={isActive} onCheckedChange={setIsActive} />
        </div>
      </div>
    </div>
  );

  const handleSubmit = (e) => {
    e.preventDefault();

    if (conditions.length === 0) {
      errorToast("Harap tambahkan minimal satu kondisi alarm!");
      return;
    }

    handleEditAlarm(editAlarm.id, {
      description,
      device_id: Number(deviceId),
      datastream_id: Number(datastreamId),
      conditions: conditions,
      cooldown_minutes: Number(cooldownMinutes),
      is_active: isActive,
    });
    setOpen(false);
  };

  if (!editAlarm) return null;

  return (
    <ResponsiveDialog
      open={open}
      setOpen={setOpen}
      title="Edit Alarm"
      form={formContent}
      formHandle={handleSubmit}
      confirmText="Simpan"
      cancelText="Batal"
    />
  );
}

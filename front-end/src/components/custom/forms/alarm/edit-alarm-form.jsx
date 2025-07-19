import ResponsiveDialog from "@/components/custom/dialogs/responsive-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ChevronDown, Check, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { fetchFromBackend } from "@/lib/helper";

export default function EditAlarmForm({
  open,
  setOpen,
  editAlarm,
  handleEditAlarm,
}) {
  const [description, setDescription] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [datastreamId, setDatastreamId] = useState("");
  const [conditions, setConditions] = useState([]);
  const [cooldownMinutes, setCooldownMinutes] = useState(1);
  const [isActive, setIsActive] = useState(true);
  const [openDevicePopover, setOpenDevicePopover] = useState(false);
  const [openDatastreamPopover, setOpenDatastreamPopover] = useState(false);

  // Form input untuk kondisi baru
  const [newConditionOperator, setNewConditionOperator] = useState(">");
  const [newConditionThreshold, setNewConditionThreshold] = useState("");

  // State untuk data
  const [devices, setDevices] = useState([]);
  const [datastreams, setDatastreams] = useState([]);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [loadingDatastreams, setLoadingDatastreams] = useState(false);

  // Fetch devices when dialog opens
  useEffect(() => {
    if (open) {
      fetchDevices();
    }
  }, [open]);

  // Fetch datastreams when device changes
  useEffect(() => {
    if (deviceId) {
      fetchDatastreams();
    } else {
      setDatastreams([]);
    }
  }, [deviceId]);

  const fetchDevices = async () => {
    setLoadingDevices(true);
    try {
      const res = await fetchFromBackend("/device");
      if (!res.ok) throw new Error("Gagal fetch devices");
      const data = await res.json();
      setDevices(data.result || []);
    } catch (e) {
      console.error("Error fetching devices:", e);
      setDevices([]);
    } finally {
      setLoadingDevices(false);
    }
  };

  const fetchDatastreams = async () => {
    if (!deviceId) return;

    setLoadingDatastreams(true);
    try {
      const res = await fetchFromBackend(`/datastream/device/${deviceId}`);
      if (!res.ok) throw new Error("Gagal fetch datastreams");
      const data = await res.json();
      setDatastreams(data.result || []);
    } catch (e) {
      console.error("Error fetching datastreams:", e);
      setDatastreams([]);
    } finally {
      setLoadingDatastreams(false);
    }
  };

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

      setCooldownMinutes(editAlarm.cooldown_minutes || 1);
      setNewConditionOperator(">");
      setNewConditionThreshold("");
    }
  }, [editAlarm, open]);

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
          <Label>Deskripsi</Label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>
      </div>

      {/* Status Aktif */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>Status Alarm</Label>
          <p className="text-sm text-muted-foreground">
            {isActive
              ? "Alarm sedang aktif dan akan memantau kondisi"
              : "Alarm tidak aktif dan tidak akan memantau kondisi"}
          </p>
        </div>
        <Switch checked={isActive} onCheckedChange={setIsActive} />
      </div>

      {/* Device and Datastream */}
      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-2">
          <Label>Device</Label>
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
                      <span className="truncate">
                        {d.description}
                      </span>
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
        </div>

        <div className="flex flex-col gap-2">
          <Label>Datastream</Label>
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
                  {datastreams.find(
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
                  {datastreams.map((ds) => (
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
        </div>

        {/* Cooldown */}
        <div className="flex flex-col gap-2">
          <Label>Tunggu (menit)</Label>
          <Input
            value={cooldownMinutes}
            onChange={(e) => setCooldownMinutes(parseInt(e.target.value))}
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
          <Label>Kondisi:</Label>
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
          <div className="mt-3">
            <Label className="text-xs text-muted-foreground">
              Kondisi yang ditambahkan:
            </Label>
            <div className="flex flex-wrap gap-2 mt-2">
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
          </div>
        )}

        {conditions.length === 0 && (
          <div className="mt-2 text-sm text-muted-foreground">
            Belum ada kondisi. Tambahkan minimal satu kondisi untuk alarm.
          </div>
        )}
      </div>
    </div>
  );

  const handleSubmit = (e) => {
    e.preventDefault();

    if (conditions.length === 0) {
      alert("Harap tambahkan minimal satu kondisi alarm!");
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

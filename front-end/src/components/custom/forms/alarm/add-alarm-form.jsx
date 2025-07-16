"use client";
import ResponsiveDialog from "@/components/custom/dialogs/responsive-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { fetchFromBackend } from "@/lib/helper";

export default function AddAlarmForm({
  open,
  setOpen,
  handleAddAlarm,
}) {
  const [description, setDescription] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [datastreamId, setDatastreamId] = useState("");
  const [operator, setOperator] = useState(">");
  const [threshold, setThreshold] = useState("");
  const [cooldownMinutes, setCooldownMinutes] = useState(5);
  const [notificationWhatsapp, setNotificationWhatsapp] = useState(true);
  const [notificationBrowser, setNotificationBrowser] = useState(true);
  const [openDevicePopover, setOpenDevicePopover] = useState(false);
  const [openDatastreamPopover, setOpenDatastreamPopover] = useState(false);
  
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
    setDatastreamId(""); // Reset datastream when device changes
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

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setDescription("");
      setDeviceId("");
      setDatastreamId("");
      setOperator(">");
      setThreshold("");
      setCooldownMinutes(5);
      setNotificationWhatsapp(true);
      setNotificationBrowser(true);
    }
  }, [open]);

  const formContent = (
    <div className="flex flex-col gap-4 py-2">
      <div>
        <Label>Deskripsi</Label>
        <Input value={description} onChange={e => setDescription(e.target.value)} required />
      </div>
      
      <div>
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
                {devices.find((d) => String(d.id) === String(deviceId))?.description ||
                  (loadingDevices ? "Loading..." : "Pilih Device")}
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
                      setOpenDevicePopover(false);
                    }}
                  >
                    <span className="truncate">
                      #{d.id} - {d.description}
                    </span>
                    <Check
                      className={cn(
                        "ml-auto",
                        String(deviceId) === String(d.id) ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <div>
        <Label>Sensor/Datastream</Label>
        <Popover open={openDatastreamPopover} onOpenChange={setOpenDatastreamPopover}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={openDatastreamPopover}
              className="justify-between w-full"
              disabled={!deviceId}
            >
              <span className="truncate">
                {datastreams.find((ds) => String(ds.id) === String(datastreamId))?.description ||
                  (loadingDatastreams ? "Loading..." : deviceId ? "Pilih Sensor" : "Pilih device terlebih dahulu")}
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
                        String(datastreamId) === String(ds.id) ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <div>
        <Label>Operator</Label>
        <Select value={operator} onValueChange={setOperator}>
          <SelectTrigger>
            <SelectValue placeholder="Pilih operator" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value=">">&gt;</SelectItem>
            <SelectItem value="<">&lt;</SelectItem>
            <SelectItem value=">=">&gt;=</SelectItem>
            <SelectItem value="<=">&lt;=</SelectItem>
            <SelectItem value="=">=</SelectItem>
            <SelectItem value="!=">!=</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Threshold</Label>
        <Input value={threshold} onChange={e => setThreshold(e.target.value)} type="number" required />
      </div>

      <div>
        <Label>Cooldown (menit)</Label>
        <Input 
          value={cooldownMinutes} 
          onChange={e => setCooldownMinutes(parseInt(e.target.value))} 
          type="number" 
          min="1"
          max="1440"
        />
      </div>

      <div className="flex items-center justify-between border rounded-lg p-3">
        <div>
          <Label>WhatsApp Notification</Label>
          <p className="text-sm text-muted-foreground">Kirim notifikasi via WhatsApp</p>
        </div>
        <Switch 
          checked={notificationWhatsapp} 
          onCheckedChange={setNotificationWhatsapp} 
        />
      </div>

      <div className="flex items-center justify-between border rounded-lg p-3">
        <div>
          <Label>Browser Notification</Label>
          <p className="text-sm text-muted-foreground">Tampilkan notifikasi di browser</p>
        </div>
        <Switch 
          checked={notificationBrowser} 
          onCheckedChange={setNotificationBrowser} 
        />
      </div>
    </div>
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    handleAddAlarm({
      description,
      device_id: Number(deviceId),
      datastream_id: Number(datastreamId),
      operator,
      threshold: Number(threshold),
      cooldown_minutes: Number(cooldownMinutes),
      notification_whatsapp: notificationWhatsapp,
      notification_browser: notificationBrowser,
    });
    setOpen(false);
  };

  return (
    <ResponsiveDialog
      open={open}
      setOpen={setOpen}
      title="Tambah Alarm"
      form={formContent}
      formHandle={handleSubmit}
      confirmText="Tambah"
      cancelText="Batal"
    />
  );
}

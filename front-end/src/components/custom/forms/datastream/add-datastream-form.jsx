import { useEffect } from "react";
import ResponsiveDialog from "@/components/custom/dialogs/responsive-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useState } from "react";
import { Link } from "next-view-transitions";

export default function AddDatastreamForm({
  open,
  setOpen,
  handleAddDatastream,
  unitOptions,
  devices,
  usedPins,
  decimalOptions,
  isMobile,
}) {
  const [description, setDescription] = useState("");
  const [pin, setPin] = useState("");
  const [type, setType] = useState("");
  const [unit, setUnit] = useState("");
  const [defaultValue, setDefaultValue] = useState("");
  const [minValue, setMinValue] = useState(0);
  const [maxValue, setMaxValue] = useState(1);
  const [deviceId, setDeviceId] = useState("");

  const [openDevicePopover, setOpenDevicePopover] = useState(false);
  const [decimalValue, setdecimalValue] = useState("0.0");
  const [booleanValue, setBooleanValue] = useState("0");

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setDescription("");
      setPin("");
      setType("");
      setUnit("");
      setDefaultValue("");
      setMinValue(0);
      setMaxValue(1);
      setDeviceId("");
      setdecimalValue("0.0");
      setBooleanValue("0");
    }
  }, [open]);

  const formContent = (
    <div className="grid gap-4 py-2">
      <div className="flex flex-col gap-2">
        <Label
          htmlFor="description"
          className="text-left font-medium max-sm:text-xs ml-1"
        >
          Nama
        </Label>
        <Input
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full"
          placeholder="Contoh: Sensor suhu ruangan"
          required
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* DEVICE COMMAND */}
        <div className="flex flex-col gap-2">
          <Label className="text-left font-medium max-sm:text-xs ml-1">
            Device
          </Label>
          {isMobile ? (
            <Select value={deviceId} onValueChange={setDeviceId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih Device" />
              </SelectTrigger>
              <SelectContent>
                {devices.map((d) => (
                  <SelectItem key={d.id} value={String(d.id)}>
                    {d.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Popover
              open={openDevicePopover}
              onOpenChange={setOpenDevicePopover}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openDevicePopover}
                  className="justify-between w-full"
                >
                  <span className="truncate">
                    {devices.find((d) => d.id === deviceId)?.description ||
                      devices.find((d) => d.id === deviceId)?.name ||
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
                          setDeviceId(dev.id);
                          setOpenDevicePopover(false);
                        }}
                      >
                        <span className="truncate">
                          {dev.description || dev.name}
                        </span>
                        <Check
                          className={cn(
                            "ml-auto",
                            deviceId === dev.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          )}
        </div>
        {/* PIN */}
        <div className="flex flex-col gap-2">
          <Label className="text-left font-medium max-sm:text-xs ml-1">
            Virtual Pin
          </Label>
          <Select
            value={pin}
            onValueChange={setPin}
            disabled={!deviceId}
            required
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih Pin" />
            </SelectTrigger>
            <SelectContent>
              {(() => {
                const used =
                  deviceId && usedPins?.[deviceId]
                    ? usedPins[deviceId]
                    : new Set();
                const availablePins = [];
                for (let p = 0; p < 256 && availablePins.length < 32; p++) {
                  if (!used.has(`V${String(p)}`)) {
                    availablePins.push(p);
                  }
                }
                return availablePins.length === 0 ? (
                  <div className="px-2 py-2 text-sm text-muted-foreground italic">
                    Semua pin sudah terpakai
                  </div>
                ) : (
                  availablePins.map((p) => (
                    <SelectItem key={p} value={String(p)}>
                      {`V${String(p)}`}
                    </SelectItem>
                  ))
                );
              })()}
            </SelectContent>
          </Select>
        </div>
        {/* TIPE DATA */}
        <div className="flex flex-col gap-2">
          <Label className="text-left font-medium max-sm:text-xs ml-1">
            Tipe Data
          </Label>
          <Select value={type} onValueChange={setType} required>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih Tipe Data" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="integer">Integer</SelectItem>
              <SelectItem value="string">String</SelectItem>
              <SelectItem value="double">Double</SelectItem>
              <SelectItem value="boolean">Boolean</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* SATUAN & FORMAT DESIMAL */}
      <div
        className={cn(
          "grid gap-4",
          type === "double" || type === "boolean" ? "grid-cols-2" : ""
        )}
      >
        {/* SATUAN */}
        <div className="flex flex-col gap-2">
          <Label className="text-left font-medium max-sm:text-xs ml-1">
            Satuan
          </Label>
          <Select value={unit} onValueChange={setUnit} required>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih Satuan" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(
                unitOptions.reduce((acc, opt) => {
                  acc[opt.group] = acc[opt.group] || [];
                  acc[opt.group].push(opt);
                  return acc;
                }, {})
              ).map(([group, items]) => (
                <SelectGroup key={group}>
                  <SelectLabel>{group}</SelectLabel>
                  {items.map((unit) => (
                    <SelectItem key={unit.value} value={unit.value}>
                      {`${unit.label}, ${unit.value}`}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
        </div>
        {type === "boolean" && (
          <div className="flex flex-col gap-2">
            <Label className="text-left font-medium max-sm:text-xs ml-1">
              Nilai Default
            </Label>
            <Select
              value={booleanValue}
              onValueChange={setBooleanValue}
              required
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih Nilai Default" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">False</SelectItem>
                <SelectItem value="1">True</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        {/* FORMAT DESIMAL */}
        {type === "double" && (
          <div className="flex flex-col gap-2">
            <Label className="text-left font-medium max-sm:text-xs ml-1">
              Format Desimal
            </Label>
            <Select value={decimalValue} onValueChange={setdecimalValue}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih Format Desimal" />
              </SelectTrigger>
              <SelectContent>
                {decimalOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {type === "boolean" ? null : type === "string" ? (
        <div className="flex flex-col gap-2">
          <Label
            htmlFor="defaultValue"
            className="text-left font-medium max-sm:text-xs ml-1"
          >
            Nilai Default
          </Label>
          <Input
            id="defaultValue"
            type="text"
            value={defaultValue}
            onChange={(e) => setDefaultValue(e.target.value)}
            className="w-full"
            placeholder="Data"
            noInfo
          />
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="defaultValue"
              className="text-left font-medium max-sm:text-xs ml-1"
            >
              Nilai Default
            </Label>
            <Input
              id="defaultValue"
              type="number"
              value={defaultValue}
              onChange={(e) => setDefaultValue(String(e.target.value))}
              className="w-full"
              placeholder="0"
              noInfo
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="minValue"
              className="text-left font-medium ml-1 max-sm:text-xs"
            >
              Minimal
            </Label>
            <Input
              id="minValue"
              type="number"
              value={minValue}
              onChange={(e) => setMinValue(e.target.value)}
              className="w-full"
              placeholder="0"
              noInfo
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="maxValue"
              className="text-left font-medium ml-1 max-sm:text-xs"
            >
              Maksimal
            </Label>
            <Input
              id="maxValue"
              type="number"
              value={maxValue}
              onChange={(e) => setMaxValue(e.target.value)}
              className="w-full"
              placeholder="1"
              noInfo
            />
          </div>
        </div>
      )}
    </div>
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    handleAddDatastream({
      description,
      deviceId,
      pin,
      type,
      unit,
      defaultValue,
      minValue,
      maxValue,
      decimalValue,
      booleanValue,
    });
    setDescription("");
    setPin("");
    setType("");
    setUnit("");
    setDeviceId("");
    setOpen(false);
  };

  return (
    <ResponsiveDialog
      open={open}
      setOpen={setOpen}
      title="Tambah Datastream"
      form={formContent}
      formHandle={handleSubmit}
      confirmText="Tambah"
      cancelText="Batalkan"
    />
  );
}

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
import { useState, useEffect } from "react";

export default function EditDatastreamForm({
  open,
  setOpen,
  editDatastream,
  handleEditDatastream,
  unitOptions,
  usedPins,
  devices,
  decimalOptions,
  isMobile,
}) {
  const [description, setDescription] = useState("");
  const [pin, setPin] = useState("");
  const [type, setType] = useState("");
  const [unit, setUnit] = useState("");
  const [minValue, setMinValue] = useState(0);
  const [maxValue, setMaxValue] = useState(1);
  const [deviceId, setDeviceId] = useState("");
  const [openDevicePopover, setOpenDevicePopover] = useState(false);
  const [openUnitPopover, setOpenUnitPopover] = useState(false);
  const [showDecimal, setShowDecimal] = useState(false);
  const [decimalValue, setdecimalValue] = useState("0.0");
  const [booleanValue, setBooleanValue] = useState("0");

  useEffect(() => {
    if (editDatastream) {
      setDescription(editDatastream.description || "");
      setDeviceId(
        editDatastream.device_id ? String(editDatastream.device_id) : ""
      );
      // Ekstrak angka dari format V0 menjadi 0
      setPin(
        editDatastream.pin ? String(editDatastream.pin).replace("V", "") : ""
      );
      setType(editDatastream.type || "");
      setUnit(editDatastream.unit || "");
      setMinValue(editDatastream.min_value || 0);
      setMaxValue(editDatastream.max_value || 1);
    }
  }, [editDatastream, open]);

  useEffect(() => {
    // Reset pin jika deviceId berubah dan bukan saat inisialisasi editDatastream
    if (
      editDatastream &&
      deviceId &&
      deviceId !== String(editDatastream.device_id)
    ) {
      setPin("");
    }
    // eslint-disable-next-line
  }, [deviceId]);

  const getAvailablePins = () => {
    const used =
      deviceId && usedPins?.[deviceId] ? usedPins[deviceId] : new Set();
    const currentPin = editDatastream?.pin || null;
    const availablePins = [];
    for (let p = 0; p < 256 && availablePins.length < 32; p++) {
      // Hanya render pin yang belum terpakai, atau pin yang sedang dipakai datastream ini
      if (!used.has(`V${String(p)}`) || `V${String(p)}` === currentPin) {
        availablePins.push(p);
      }
    }
    return availablePins;
  };

  const formContent = (
    <div className="grid gap-4 py-2">
      <div className="flex flex-col gap-2">
        <Label
          htmlFor="descEdit"
          className="text-left font-medium ml-1 max-sm:text-xs"
        >
          Nama
        </Label>
        <Input
          id="descEdit"
          className="w-full"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        {/* DEVICE COMMAND */}
        <div className="flex flex-col gap-2">
          <Label className="text-left font-medium ml-1 max-sm:text-xs">
            Device
          </Label>
          {devices.length === 0 ? (
            <span className="text-sm text-muted-foreground px-2 py-2 italic">
              Tidak ada device
            </span>
          ) : isMobile ? (
            <Select
              value={deviceId}
              onValueChange={(value) => setDeviceId(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih Device" />
              </SelectTrigger>
              <SelectContent>
                {devices.map((dev) => (
                  <SelectItem key={dev.id} value={String(dev.id)}>
                    {dev.description || dev.name}
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
                    {devices.find((d) => String(d.id) === String(deviceId))
                      ?.description ||
                      devices.find((d) => String(d.id) === String(deviceId))
                        ?.name ||
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
                      <span className="opacity-50">Tidak ada device.</span>
                    </CommandEmpty>
                    {devices.map((dev) => (
                      <CommandItem
                        key={dev.id}
                        value={dev.id}
                        onSelect={() => {
                          setDeviceId(dev.id);
                          setOpenDevicePopover(false);
                        }}
                        className="cursor-pointer"
                      >
                        <span className="truncate">
                          {dev.description || ""}
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
          <Label className="text-left font-medium ml-1 max-sm:text-xs">
            Virtual Pin
          </Label>
          <Select value={pin} onValueChange={setPin} disabled={!deviceId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih Pin" />
            </SelectTrigger>
            <SelectContent>
              {(() => {
                const availablePins = getAvailablePins();
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
          <Label className="text-left font-medium ml-1 max-sm:text-xs">
            Tipe Data
          </Label>
          <Select
            value={type}
            onValueChange={(val) => {
              setType(val);
              setShowDecimal(val === "double");
            }}
            required
          >
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
          {isMobile ? (
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
          ) : (
            <Popover open={openUnitPopover} onOpenChange={setOpenUnitPopover}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openUnitPopover}
                  className="justify-between w-full"
                >
                  <span className="truncate">
                    {unitOptions.find((u) => u.value === unit)?.label ||
                      "Pilih Satuan"}
                  </span>
                  <ChevronDown className="ml-2 h-5 w-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-full" align="start">
                <Command>
                  <CommandInput placeholder="Cari satuan..." />
                  <CommandList>
                    <CommandEmpty>
                      <span className="opacity-50">Tidak ada satuan.</span>
                    </CommandEmpty>
                    {unitOptions.map((unitOption) => (
                      <CommandItem
                        key={unitOption.value}
                        value={`${unitOption.label} ${unitOption.value}`}
                        onSelect={() => {
                          setUnit(unitOption.value);
                          setOpenUnitPopover(false);
                        }}
                        className="cursor-pointer"
                      >
                        <span className="truncate">
                          {unitOption.label}, {unitOption.value}
                        </span>
                        <Check
                          className={cn(
                            "ml-auto",
                            unit === unitOption.value ? "opacity-100" : "opacity-0"
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

      {type === "boolean" || type === "string" ? null : (
        <div className="grid grid-cols-2 gap-4">
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    await handleEditDatastream(editDatastream.id, {
      description,
      deviceId,
      pin,
      type,
      unit,
      minValue,
      maxValue,
      decimalValue,
      booleanValue,
    });
    setOpen(false);
  };

  return (
    <ResponsiveDialog
      open={open}
      setOpen={setOpen}
      title={
        <>
          Edit <i>{editDatastream?.description || ""}</i>
        </>
      }
      form={formContent}
      formHandle={handleSubmit}
      confirmText="Simpan"
      cancelText="Batalkan"
    />
  );
}

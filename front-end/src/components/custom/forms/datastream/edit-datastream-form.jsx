// Import komponen dialog responsif untuk modal form
import ResponsiveDialog from "@/components/custom/dialogs/responsive-dialog";

// Import komponen UI untuk form elements
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Import komponen Command untuk searchable dropdown
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

// Import komponen Popover untuk dropdown positioning
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Import komponen UI dan utilities
import { Button } from "@/components/ui/button";
import { ChevronDown, Check, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// Import komponen Select untuk dropdown selections
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import DescriptionTooltip from "../../other/description-tooltip";
// Import React hooks untuk state management
import { useState, useEffect } from "react";

// Komponen EditDatastreamForm untuk mengedit datastream yang sudah ada
export default function EditDatastreamForm({
  open, // State untuk kontrol visibility modal
  setOpen, // Setter untuk mengubah state modal
  editDatastream, // Data datastream yang akan diedit
  handleEditDatastream, // Handler function untuk update datastream
  unitOptions, // Array opsi unit pengukuran (volt, ampere, dll)
  usedPins, // Array pin yang sudah digunakan untuk validasi
  devices, // Array device yang tersedia untuk dipilih
  decimalOptions, // Array opsi jumlah decimal places
  isMobile, // Flag untuk responsive behavior
}) {
  // State management untuk form fields datastream configuration dengan data existing
  const [description, setDescription] = useState(""); // Deskripsi/nama datastream
  const [pin, setPin] = useState(""); // Pin hardware yang digunakan
  const [type, setType] = useState(""); // Tipe data (sensor/actuator)
  const [unit, setUnit] = useState(""); // Unit pengukuran data
  const [minValue, setMinValue] = useState(0); // Nilai minimum yang diharapkan
  const [maxValue, setMaxValue] = useState(1); // Nilai maximum yang diharapkan
  const [deviceId, setDeviceId] = useState(""); // ID device yang akan menampung datastream

  // State untuk kontrol popover selections
  const [openDevicePopover, setOpenDevicePopover] = useState(false); // State popover device dropdown
  const [openUnitPopover, setOpenUnitPopover] = useState(false); // State popover unit dropdown
  const [showDecimal, setShowDecimal] = useState(false); // Flag untuk show decimal format
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
        <div className="flex gap-2 items-center">
          <Label htmlFor="descEdit" className="text-left ml-1 font-medium max-sm:text-xs">Nama</Label>
          <DescriptionTooltip
            side="right"
            content="Karakter alfanumerik dibatasi hanya (@ / . - _)"
          >
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
          </DescriptionTooltip>
        </div>
        <Input
          id="descEdit"
          className="w-full"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        {/* PERANGKAT */}
        <div className="flex flex-col gap-2">
          <div className="flex gap-2 items-center">
            <Label className="text-left ml-1 font-medium max-sm:text-xs">Device</Label>
            <DescriptionTooltip side="top" content="Pilih perangkat IoT">
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </DescriptionTooltip>
          </div>
          {devices.length === 0 ? (
            <span className="text-sm text-muted-foreground px-2 py-2 italic">
              Tidak ada perangkat
            </span>
          ) : (
            // : isMobile ? (
            //   <Select
            //     value={deviceId}
            //     onValueChange={(value) => setDeviceId(value)}
            //   >
            //     <SelectTrigger className="w-full">
            //       <SelectValue placeholder="Pilih Device" />
            //     </SelectTrigger>
            //     <SelectContent>
            //       {devices.map((dev) => (
            //         <SelectItem key={dev.id} value={String(dev.id)}>
            //           {dev.description || dev.name}
            //         </SelectItem>
            //       ))}
            //     </SelectContent>
            //   </Select>
            // )
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
                      "Pilih Perangkat"}
                  </span>
                  <ChevronDown className="ml-2 h-5 w-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-full" align="start">
                <Command>
                  <CommandInput placeholder="Cari perangkat..." />
                  <CommandList>
                    <CommandEmpty>
                      <span className="opacity-50">Tidak ada perangkat.</span>
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
          <div className="flex gap-2 items-center">
            <Label className="text-left font-medium max-sm:text-xs ml-1">
              Virtual Pin
            </Label>
            <DescriptionTooltip side="top" content="Pin buatan untuk menyimpan data sensor">
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </DescriptionTooltip>
          </div>
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
          <div className="flex gap-2 items-center">
            <Label className="text-left font-medium max-sm:text-xs ml-1">
              Tipe Data
            </Label>
            <DescriptionTooltip side="top" content="Pilih tipe data untuk nilai sensor">
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </DescriptionTooltip>
          </div>
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
              <SelectItem value="double">Desimal</SelectItem>
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
          <div className="flex gap-2 items-center">
            <Label className="text-left font-medium max-sm:text-xs ml-1">
              Satuan
            </Label>
            <DescriptionTooltip side="top" content="Pilih satuan untuk nilai sensor">
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </DescriptionTooltip>
          </div>
          {/* {isMobile ? (
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
          ) : ( */}
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
                          unit === unitOption.value
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
        {type === "boolean" && (
          <div className="flex flex-col gap-2">
            <div className="flex gap-2 items-center">
              <Label className="text-left font-medium max-sm:text-xs ml-1">
                Nilai Default
              </Label>
              <DescriptionTooltip side="top" content="Pilih nilai awal">
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
              </DescriptionTooltip>
            </div>
            <Select
              value={booleanValue}
              onValueChange={setBooleanValue}
              required
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih Nilai Default" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Salah</SelectItem>
                <SelectItem value="1">Benar</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        {/* FORMAT DESIMAL */}
        {type === "double" && (
          <div className="flex flex-col gap-2">
            <div className="flex gap-2 items-center">
              <Label className="text-left font-medium max-sm:text-xs ml-1">
                Format Desimal
              </Label>
              <DescriptionTooltip side="top" content="Jumlah angka di belakang koma">
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
              </DescriptionTooltip>
            </div>
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
            <div className="flex gap-2 items-center">
              <Label
                htmlFor="minValue"
                className="text-left font-medium ml-1 max-sm:text-xs"
              >
                Minimal
              </Label>
              <DescriptionTooltip
                side="right"
                content="Nilai minimal, nilai yang lebih kecil akan disamakan dengan nilai ini"
              >
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
              </DescriptionTooltip>
            </div>
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
            <div className="flex gap-2 items-center">
              <Label
                htmlFor="maxValue"
                className="text-left font-medium ml-1 max-sm:text-xs"
              >
                Maksimal
              </Label>
              <DescriptionTooltip
                side="top"
                content="Nilai maksimal, nilai yang lebih besar akan disamakan dengan nilai ini"
              >
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
              </DescriptionTooltip>
            </div>
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
          Ubah <i>{editDatastream?.description || ""}</i>
        </>
      }
      form={formContent}
      formHandle={handleSubmit}
      confirmText="Simpan"
      cancelText="Batalkan"
    />
  );
}

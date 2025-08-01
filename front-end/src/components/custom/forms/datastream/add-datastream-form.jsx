// Import React hooks untuk state management
import { useEffect } from "react";

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
import { ChevronDown, Check } from "lucide-react";
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

import { useState } from "react";
import { Link } from "next-view-transitions";

// Komponen AddDatastreamForm untuk menambah datastream baru ke IoT device
export default function AddDatastreamForm({
  open, // State untuk kontrol visibility modal
  setOpen, // Setter untuk mengubah state modal
  handleAddDatastream, // Handler function untuk menambah datastream
  unitOptions, // Array opsi unit pengukuran (volt, ampere, dll)
  devices, // Array device yang tersedia untuk dipilih
  usedPins, // Array pin yang sudah digunakan untuk validasi
  decimalOptions, // Array opsi jumlah decimal places
  isMobile, // Flag untuk responsive behavior
}) {
  // State management untuk form fields datastream configuration
  const [description, setDescription] = useState(""); // Deskripsi/nama datastream
  const [pin, setPin] = useState(""); // Pin hardware yang digunakan
  const [type, setType] = useState(""); // Tipe data (sensor/actuator)
  const [unit, setUnit] = useState(""); // Unit pengukuran data
  const [minValue, setMinValue] = useState(0); // Nilai minimum yang diharapkan
  const [maxValue, setMaxValue] = useState(1); // Nilai maximum yang diharapkan
  const [deviceId, setDeviceId] = useState(""); // ID device yang akan menampung datastream

  // State untuk kontrol popover device selection
  const [openDevicePopover, setOpenDevicePopover] = useState(false); // State popover device dropdown
  const [openUnitPopover, setOpenUnitPopover] = useState(false); // State popover unit dropdown
  const [decimalValue, setdecimalValue] = useState("0.0"); // Format decimal untuk tipe double
  const [booleanValue, setBooleanValue] = useState("0"); // Nilai default untuk tipe boolean

  // Effect untuk reset form ketika dialog dibuka/ditutup
  useEffect(() => {
    if (open) {
      // Reset semua field ke nilai default
      setDescription("");
      setPin("");
      setType("");
      setUnit("");
      setMinValue(0);
      setMaxValue(1);
      setDeviceId("");
      setdecimalValue("0.0");
      setBooleanValue("0");
      setOpenUnitPopover(false); // Tutup popover unit
    }
  }, [open]); // Dependency: re-run ketika modal open/close

  // Layout form content dengan input fields untuk konfigurasi datastream
  const formContent = (
    <div className="grid gap-4 py-2">
      {/* Input Field: Nama/Deskripsi Datastream */}
      <div className="flex flex-col gap-2">
        <Label
          htmlFor="description"
          className="text-left font-medium max-sm:text-xs ml-1"
        >
          Nama
        </Label>
        {/* Input untuk nama datastream dengan placeholder guide */}
        <Input
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)} // Update state saat user mengetik
          className="w-full"
          placeholder="Contoh: Sensor suhu ruangan" // Contoh naming convention
          required // Field wajib diisi
        />
      </div>

      {/* Grid Layout: Device, Pin, Type Selection */}
      <div className="grid grid-cols-3 gap-4">
        {/* Device Selection: Popover untuk memilih device */}
        <div className="flex flex-col gap-2">
          <Label className="text-left font-medium max-sm:text-xs ml-1">
            Device
          </Label>
          {/* Commented out mobile version - menggunakan popover untuk semua device */}
          {/* {isMobile ? (
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
          ) : ( */}
            {/* Popover component untuk device selection dengan search */}
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
                  {/* Display selected device atau placeholder */}
                  <span className="truncate">
                    {devices.find((d) => d.id === deviceId)?.description ||
                      devices.find((d) => d.id === deviceId)?.name ||
                      "Pilih Device"}
                  </span>
                  <ChevronDown className="ml-2 h-5 w-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-full" align="start">
                {/* Command component untuk searchable dropdown */}
                <Command>
                  <CommandInput placeholder="Cari device..." />
                  <CommandList>
                    {/* Empty state dengan link untuk create device baru */}
                    <CommandEmpty>
                      <Link
                        href="/devices" // Navigate ke halaman devices
                        className="opacity-50 transition-all hover:opacity-100"
                      >
                        Buat device baru
                      </Link>
                    </CommandEmpty>
                    {/* Render semua available devices */}
                    {devices.map((dev) => (
                      <CommandItem
                        key={dev.id}
                        value={dev.id}
                        onSelect={() => {
                          setDeviceId(dev.id); // Set device yang dipilih
                          setOpenDevicePopover(false); // Tutup popover
                        }}
                      >
                        <span className="truncate">
                          {dev.description || dev.name}
                        </span>
                        {/* Check icon untuk item yang selected */}
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
          {/* )} */}
        </div>
        
        {/* Virtual Pin Selection: Dropdown dengan available pins */}
        <div className="flex flex-col gap-2">
          <Label className="text-left font-medium max-sm:text-xs ml-1">
            Virtual Pin
          </Label>
          <Select
            value={pin}
            onValueChange={setPin}
            disabled={!deviceId} // Disable jika belum pilih device
            required // Field wajib diisi
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih Pin" />
            </SelectTrigger>
            <SelectContent>
              {/* Dynamic pin generation dengan validasi used pins */}
              {(() => {
                // Get used pins untuk device yang dipilih
                const used =
                  deviceId && usedPins?.[deviceId]
                    ? usedPins[deviceId]
                    : new Set();
                const availablePins = [];
                
                // Generate available pins (maksimal 32 pins dari V0-V255)
                for (let p = 0; p < 256 && availablePins.length < 32; p++) {
                  if (!used.has(`V${String(p)}`)) {
                    availablePins.push(p);
                  }
                }
                
                // Tampilkan pesan jika semua pin terpakai
                return availablePins.length === 0 ? (
                  <div className="px-2 py-2 text-sm text-muted-foreground italic">
                    Semua pin sudah terpakai
                  </div>
                ) : (
                  // Render available pins
                  availablePins.map((p) => (
                    <SelectItem key={p} value={String(p)}>
                      {`V${String(p)}`} {/* Format virtual pin */}
                    </SelectItem>
                  ))
                );
              })()}
            </SelectContent>
          </Select>
        </div>
        
        {/* Data Type Selection: Dropdown untuk tipe data IoT */}
        <div className="flex flex-col gap-2">
          <Label className="text-left font-medium max-sm:text-xs ml-1">
            Tipe Data
          </Label>
          <Select value={type} onValueChange={setType} required>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih Tipe Data" />
            </SelectTrigger>
            <SelectContent>
              {/* Data types untuk IoT sensors/actuators */}
              <SelectItem value="integer">Integer</SelectItem>
              <SelectItem value="string">String</SelectItem>
              <SelectItem value="double">Double</SelectItem>
              <SelectItem value="boolean">Boolean</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Conditional Fields: Unit & Format berdasarkan tipe data */}
      <div
        className={cn(
          "grid gap-4",
          // Dynamic grid columns berdasarkan tipe data
          type === "double" || type === "boolean" ? "grid-cols-2" : ""
        )}
      >
        {/* Unit Selection: Popover untuk measurement units */}
        <div className="flex flex-col gap-2">
          <Label className="text-left font-medium max-sm:text-xs ml-1">
            Satuan
          </Label>
          {/* Commented out mobile version - menggunakan popover untuk semua */}
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
            {/* Popover untuk unit selection dengan search functionality */}
            <Popover open={openUnitPopover} onOpenChange={setOpenUnitPopover}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openUnitPopover}
                  className="justify-between w-full"
                >
                  {/* Display selected unit atau placeholder */}
                  <span className="truncate">
                    {unitOptions.find((u) => u.value === unit)?.label ||
                      "Pilih Satuan"}
                  </span>
                  <ChevronDown className="ml-2 h-5 w-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-full" align="start">
                {/* Command component untuk searchable unit dropdown */}
                <Command>
                  <CommandInput placeholder="Cari satuan..." />
                  <CommandList>
                    <CommandEmpty>
                      <span className="opacity-50">Tidak ada satuan.</span>
                    </CommandEmpty>
                    {/* Render semua unit options */}
                    {unitOptions.map((unitOption) => (
                      <CommandItem
                        key={unitOption.value}
                        value={`${unitOption.label} ${unitOption.value}`} // Searchable text
                        onSelect={() => {
                          setUnit(unitOption.value); // Set unit yang dipilih
                          setOpenUnitPopover(false); // Tutup popover
                        }}
                        className="cursor-pointer"
                      >
                        <span className="truncate">
                          {unitOption.label}, {unitOption.value} {/* Display format */}
                        </span>
                        {/* Check icon untuk item yang selected */}
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
          {/* )} */}
        </div>
        
        {/* Conditional Field: Boolean Default Value */}
        {type === "boolean" && (
          <div className="flex flex-col gap-2">
            <Label className="text-left font-medium max-sm:text-xs ml-1">
              Nilai Default
            </Label>
            <Select
              value={booleanValue}
              onValueChange={setBooleanValue}
              required // Field wajib untuk boolean type
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih Nilai Default" />
              </SelectTrigger>
              <SelectContent>
                {/* Boolean values dengan labels yang jelas */}
                <SelectItem value="0">False</SelectItem>
                <SelectItem value="1">True</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        
        {/* Conditional Field: Decimal Format untuk Double */}
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
                {/* Render decimal format options dari props */}
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

      {/* Conditional Fields: Min/Max Values (tidak untuk boolean/string) */}
      {type === "boolean" || type === "string" ? null : (
        <div className="grid grid-cols-2 gap-4">
          {/* Minimum Value Input */}
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="minValue"
              className="text-left font-medium ml-1 max-sm:text-xs"
            >
              Minimal
            </Label>
            <Input
              id="minValue"
              type="number" // HTML5 number input
              value={minValue}
              onChange={(e) => setMinValue(e.target.value)} // Update min value
              className="w-full"
              placeholder="0" // Default minimum
              noInfo // Custom prop untuk styling
            />
          </div>
          
          {/* Maximum Value Input */}
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="maxValue"
              className="text-left font-medium ml-1 max-sm:text-xs"
            >
              Maksimal
            </Label>
            <Input
              id="maxValue"
              type="number" // HTML5 number input
              value={maxValue}
              onChange={(e) => setMaxValue(e.target.value)} // Update max value
              className="w-full"
              placeholder="1" // Default maximum
              noInfo // Custom prop untuk styling
            />
          </div>
        </div>
      )}
    </div>
  );

  // Handler untuk form submission dengan data preparation
  const handleSubmit = (e) => {
    e.preventDefault(); // Prevent default form submission
    
    // Prepare datastream object dengan semua configuration
    handleAddDatastream({
      description, // Nama/deskripsi datastream
      deviceId, // ID device yang dipilih
      pin, // Virtual pin yang digunakan
      type, // Tipe data (integer/string/double/boolean)
      unit, // Unit pengukuran
      minValue, // Nilai minimum (jika applicable)
      maxValue, // Nilai maximum (jika applicable)
      decimalValue, // Format decimal (untuk double)
      booleanValue, // Default value (untuk boolean)
    });
    
    // Reset form setelah submit
    setDescription("");
    setPin("");
    setType("");
    setUnit("");
    setDeviceId("");
    setOpen(false); // Tutup modal
  };

  // Render ResponsiveDialog dengan form configuration
  return (
    <ResponsiveDialog
      open={open} // State visibility modal
      setOpen={setOpen} // Function untuk kontrol modal
      title="Tambah Datastream" // Judul modal
      form={formContent} // Form content yang sudah dibuat
      formHandle={handleSubmit} // Handler untuk form submission
      confirmText="Tambah" // Text untuk tombol submit
      cancelText="Batalkan" // Text untuk tombol cancel
    />
  );
}

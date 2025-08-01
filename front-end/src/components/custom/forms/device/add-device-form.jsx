"use client";

// Import komponen dialog responsif untuk modal form
import ResponsiveDialog from "@/components/custom/dialogs/responsive-dialog";

// Import komponen UI untuk form elements
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

// Import icons dan komponen untuk interactive elements
import { ChevronDown, Check } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { useState } from "react";

// Komponen AddDeviceForm untuk menambah IoT device baru ke sistem
export default function AddDeviceForm({
  open, // State untuk kontrol visibility modal
  setOpen, // Setter untuk mengubah state modal
  handleAddDevice, // Handler function untuk menambah device
  openBoardPopover, // State untuk popover board selection
  setOpenBoardPopover, // Setter untuk popover board
  boardOptions, // Array opsi board type yang tersedia
  isMobile, // Flag untuk responsive behavior
}) {
  // State management untuk form fields IoT device
  const [name, setName] = useState(""); // Nama identifikasi device
  const [boardType, setBoardType] = useState(""); // Tipe microcontroller board
  const [protocol, setProtocol] = useState(""); // Protokol komunikasi (MQTT/LoRa)
  const [mqttTopic, setMqttTopic] = useState(""); // MQTT topic untuk messaging
  const [mqttQos, setMqttQos] = useState("0"); // Quality of Service level untuk MQTT
  const [loraProfile, setLoraProfile] = useState(""); // Profile LoRa untuk konfigurasi radio

  // Layout form content dengan input fields untuk konfigurasi IoT device
  const formContent = (
    <div className="flex flex-col gap-4 py-2">
      {/* Input Field: Nama Device */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="name" className="text-left ml-1 font-medium max-sm:text-xs">
          Nama
        </Label>
        {/* Input text untuk nama device dengan placeholder dan validasi */}
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)} // Update state nama saat user mengetik
          placeholder="Contoh: Device 1" // Contoh format nama device
          required // Field wajib diisi
          className="w-full" // Full width responsive
        />
      </div>

      {/* Grid Layout: Board Type & Protocol Selection side by side */}
      <div className="grid grid-cols-2 gap-4">
        {/* Board Type Selection: Conditional rendering berdasarkan device */}
        <div className="flex flex-col gap-2">
          <Label className="text-left ml-1 font-medium max-sm:text-xs">Tipe Board</Label>
          {isMobile ? (
            // Mobile: Gunakan Select dropdown sederhana
            <Select value={boardType} onValueChange={setBoardType}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih tipe board" />
              </SelectTrigger>
              <SelectContent>
                {/* Render semua opsi board dari props */}
                {boardOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            // Desktop: Gunakan Popover dengan search functionality
            <Popover open={openBoardPopover} onOpenChange={setOpenBoardPopover}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openBoardPopover}
                  className="justify-between w-full"
                >
                  {/* Display selected board atau placeholder dengan truncate */}
                  <span className="truncate">
                    {boardType || "Pilih tipe board"}
                  </span>
                  <ChevronDown className="ml-2 h-5 w-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-full">
                {/* Command component untuk searchable dropdown */}
                <Command>
                  <CommandInput placeholder="Cari tipe board..." />
                  <CommandList>
                    <CommandEmpty>Tidak ada opsi.</CommandEmpty>
                    {/* Render semua opsi board dengan search capability */}
                    {boardOptions.map((option) => (
                      <CommandItem
                        key={option}
                        value={option}
                        onSelect={() => {
                          setBoardType(option); // Set board yang dipilih
                          setOpenBoardPopover(false); // Tutup popover
                        }}
                      >
                        <span className="truncate">{option}</span>
                        {/* Check icon untuk item yang selected */}
                        <Check
                          className={cn(
                            "ml-auto",
                            boardType === option ? "opacity-100" : "opacity-0"
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
        
        {/* Protocol Selection: Dropdown untuk protokol komunikasi IoT */}
        <div className="flex flex-col gap-2">
          <Label className="text-left ml-1 font-medium max-sm:text-xs">
            Protokol Komunikasi
          </Label>
          <Select value={protocol} onValueChange={setProtocol}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih protokol" />
            </SelectTrigger>
            <SelectContent>
              {/* Opsi protokol komunikasi yang didukung sistem */}
              <SelectItem value="HTTP">HTTP</SelectItem>
              <SelectItem value="MQTT">MQTT</SelectItem>
              {/* LoRaWAN commented out - belum diimplementasi */}
              {/* <SelectItem value="LoRaWAN">LoRaWAN</SelectItem> */}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Conditional Field: MQTT Configuration - hanya muncul jika protokol MQTT */}
      {protocol === "MQTT" && (
        <div className="grid grid-cols-2 gap-4">
          {/* MQTT Topic Input */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="mqttTopic" className="text-left ml-1 font-medium max-sm:text-xs">
              Topik MQTT
            </Label>
            <Input
              id="mqttTopic"
              value={mqttTopic}
              placeholder="Contoh: data" // Contoh format MQTT topic
              onChange={(e) => setMqttTopic(e.target.value)}
              required // Field wajib untuk protokol MQTT
              className="w-full"
            />
          </div>
          {/* QoS MQTT - Currently commented out dalam implementasi */}
          {/* <div className="flex flex-col gap-2">
            <Label className="text-left ml-1 font-medium max-sm:text-xs">QoS MQTT</Label>
            <Select value={mqttQos} onValueChange={setMqttQos}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select QoS" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0</SelectItem>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
              </SelectContent>
            </Select>
          </div> */}
        </div>
      )}

      {/* Conditional Field: LoRaWAN Configuration - untuk protokol LoRa */}
      {protocol === "LoRaWAN" && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="loraProfile" className="text-left ml-1  font-medium">
            Profil Lora
          </Label>
          <Input
            id="loraProfile"
            value={loraProfile}
            placeholder="Contoh: Gateway 1" // Contoh konfigurasi LoRa gateway
            onChange={(e) => setLoraProfile(e.target.value)}
            required // Field wajib untuk protokol LoRaWAN
            className="w-full"
          />
        </div>
      )}
    </div>
  );

  // Handler untuk form submission dengan validasi dan data preparation
  const handleSubmit = (e) => {
    e.preventDefault(); // Prevent default form submission
    
    // Prepare data object sesuai dengan struktur yang diharapkan backend
    handleAddDevice({
      name, // Nama device
      board: boardType, // Tipe board yang dipilih
      protocol: protocol, // Protokol komunikasi
      mqtt_topic: protocol === "MQTT" ? mqttTopic : undefined, // MQTT topic jika protokol MQTT
      // mqtt_qos: protocol === "MQTT" ? mqttQos : undefined, // QoS (commented out)
      lora_profile: protocol === "LoRaWAN" ? loraProfile : undefined, // LoRa profile jika LoRaWAN
    });
    
    // Reset semua form fields setelah submit berhasil
    setName("");
    setBoardType("");
    setProtocol("");
    setMqttTopic("");
    setMqttQos("0");
    setLoraProfile("");
    setOpen(false); // Tutup modal setelah submit
  };

  // Render ResponsiveDialog dengan form configuration
  return (
    <ResponsiveDialog
      open={open} // State visibility modal
      setOpen={setOpen} // Function untuk kontrol modal
      title="Tambah Device" // Judul modal
      form={formContent} // Form content yang sudah dibuat
      formHandle={handleSubmit} // Handler untuk form submission
      confirmText="Tambah" // Text untuk tombol submit
      cancelText="Batalkan" // Text untuk tombol cancel
    />
  );
}

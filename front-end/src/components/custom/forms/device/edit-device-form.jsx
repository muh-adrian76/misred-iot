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
import { useState, useEffect } from "react";

// Komponen EditDeviceForm untuk mengedit IoT device yang sudah ada
export default function EditDeviceForm({
  open, // State untuk kontrol visibility modal
  setOpen, // Setter untuk mengubah state modal
  editDevice, // Data device yang akan diedit
  handleEditDevice, // Handler function untuk update device
  openBoardPopover, // State untuk popover board selection
  setOpenBoardPopover, // Setter untuk popover board
  boardOptions, // Array opsi board type yang tersedia
  isMobile, // Flag untuk responsive behavior
}) {
  // State management untuk form fields IoT device dengan data existing
  const [name, setName] = useState(""); // Nama identifikasi device
  const [boardType, setBoardType] = useState(""); // Tipe microcontroller board
  const [protocol, setProtocol] = useState(""); // Protokol komunikasi (MQTT/LoRa)
  const [mqttTopic, setMqttTopic] = useState(""); // MQTT topic untuk messaging
  const [mqttQos, setMqttQos] = useState("0"); // Quality of Service level untuk MQTT
  const [loraProfile, setLoraProfile] = useState(""); // Profile LoRa untuk konfigurasi radio

  // Effect untuk populate form fields dengan data device yang akan diedit
  useEffect(() => {
    if (editDevice) {
      // Populate nama device dengan fallback ke description
      setName(editDevice.name || editDevice.description || "");
      // Populate board type dengan berbagai format field yang mungkin
      setBoardType(editDevice.boardType || editDevice.board_type || "");
      // Populate protokol komunikasi device
      setProtocol(editDevice.protocol || "");
      // Populate MQTT configuration jika tersedia
      setMqttTopic(editDevice.mqtt_topic || "");
      setMqttQos(editDevice.mqtt_qos || "0");
      // Populate LoRa configuration jika tersedia
      setLoraProfile(editDevice.lora_profile || "");
    }
  }, [editDevice, open]); // Dependencies: re-run ketika editDevice atau modal state berubah

  // Layout form content dengan input fields untuk edit IoT device
  const formContent = (
    <div className="grid gap-4 py-2">
      {/* Input Field: Nama Device untuk editing */}
      <div className="flex flex-col gap-2">
        <Label
          htmlFor="nameEdit"
          className="text-left ml-1 font-medium max-sm:text-xs"
        >
          Nama
        </Label>
        {/* Input field dengan data existing dari device */}
        <Input
          id="nameEdit"
          className="w-full"
          value={name} // Pre-populated dengan data existing
          onChange={(e) => setName(e.target.value)} // Update state saat editing
          required // Field wajib diisi
        />
      </div>
      
      {/* Grid Layout: Board Type & Protocol Selection */}
      <div className="grid grid-cols-2 gap-4">
        {/* Board Type Selection: Conditional rendering untuk mobile/desktop */}
        <div className="flex flex-col gap-2">
          <Label className="text-left ml-1 font-medium max-sm:text-xs">
            Tipe Board
          </Label>
          {isMobile ? (
            // Mobile: Select dropdown sederhana
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
            // Desktop: Popover dengan search functionality untuk board selection
            <Popover open={openBoardPopover} onOpenChange={setOpenBoardPopover}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openBoardPopover}
                  className="justify-between w-full"
                >
                  {/* Display current board type atau placeholder */}
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
                        {/* Check icon untuk menunjukkan item yang selected */}
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
        
        {/* Protocol Selection: Dropdown untuk protokol komunikasi */}
        <div className="flex flex-col gap-2">
          <Label className="text-left ml-1 font-medium max-sm:text-xs">
            Protokol Komunikasi
          </Label>
          <Select
            value={protocol} // Pre-populated dengan data existing
            onValueChange={(value) => setProtocol(value)} // Update protocol selection
            required // Field wajib diisi
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih protokol" />
            </SelectTrigger>
            <SelectContent>
              {/* Opsi protokol komunikasi yang didukung */}
              <SelectItem value="HTTP">HTTP</SelectItem>
              <SelectItem value="MQTT">MQTT</SelectItem>
              {/* LoRaWAN commented out - belum diimplementasi */}
              {/* <SelectItem value="LoRaWAN">LoRaWAN</SelectItem> */}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Conditional Fields: MQTT Configuration - muncul jika protokol MQTT */}
      {protocol === "MQTT" && (
        <div className="grid grid-cols-2 gap-4">
          {/* MQTT Topic Input dengan smart parsing untuk device ID */}
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="mqttTopicEdit"
              className="text-left ml-1 font-medium max-sm:text-xs"
            >
              MQTT Topic
            </Label>
            <Input
              id="mqttTopicEdit"
              className="w-full"
              value={mqttTopic} // Pre-populated dengan existing MQTT topic
              placeholder="Contoh: data"
              onChange={(e) => {
                // Smart parsing: hapus device ID prefix jika ada
                let value = e.target.value;
                if (editDevice?.id && value.startsWith(editDevice.id + "/")) {
                  value = value.slice((editDevice.id + "/").length);
                }
                setMqttTopic(value);
              }}
              required // Field wajib untuk protokol MQTT
            />
          </div>
          {/* <div className="flex flex-col gap-2">
            <Label className="text-left ml-1 font-medium max-sm:text-xs">
              MQTT QoS
            </Label>
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
      {protocol === "LoRaWAN" && (
        <div className="flex flex-col gap-2">
          <Label
            htmlFor="loraProfileEdit"
            className="text-left ml-1 font-medium max-sm:text-xs"
          >
            Lora Profile
          </Label>
          <Input
            id="loraProfileEdit"
            className="w-full"
            placeholder="Contoh: Gateway 1"
            value={loraProfile}
            onChange={(e) => setLoraProfile(e.target.value)}
            required
          />
        </div>
      )}
    </div>
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Panggil handler function dengan device ID dan updated data
    await handleEditDevice(editDevice.id, {
      name, // Nama device yang sudah diedit
      board: boardType, // Board type yang dipilih/diedit
      protocol, // Protokol komunikasi
      mqtt_topic: protocol === "MQTT" ? mqttTopic : undefined, // MQTT topic jika protokol MQTT
      // mqtt_qos: protocol === "MQTT" ? mqttQos : undefined, // QoS (commented out)
      lora_profile: protocol === "LoRaWAN" ? loraProfile : undefined, // LoRa profile jika LoRaWAN
    });
    setOpen(false); // Tutup modal setelah update berhasil
  };

  // Render ResponsiveDialog dengan form configuration
  return (
    <ResponsiveDialog
      open={open} // State visibility modal
      setOpen={setOpen} // Function untuk kontrol modal
      title={
        <>
          {/* Dynamic title dengan nama device yang diedit */}
          Edit <i>{editDevice?.description || ""}</i>
        </>
      }
      form={formContent} // Form content yang sudah dibuat
      formHandle={handleSubmit} // Handler untuk form submission
      confirmText="Simpan" // Text untuk tombol save
      cancelText="Batalkan" // Text untuk tombol cancel
    />
  );
}

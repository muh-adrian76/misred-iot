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
import { ChevronDown, Check, HelpCircle } from "lucide-react";
import DescriptionTooltip from "../../other/description-tooltip";
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
  const [name, setName] = useState(""); // Nama identifikasi perangkat
  const [boardType, setBoardType] = useState(""); // Tipe microcontroller board
  const [protocol, setProtocol] = useState(""); // Protokol komunikasi (MQTT/LoRa)
  const [mqttTopic, setMqttTopic] = useState(""); // MQTT topic untuk messaging
  const [mqttQos, setMqttQos] = useState("0"); // Quality of Service level untuk MQTT
  const [loraProfile, setLoraProfile] = useState(""); // Profile LoRa untuk konfigurasi radio
  const [offlineTimeoutMinutes, setOfflineTimeoutMinutes] = useState("1"); // Timeout offline dalam menit

  // Layout form content dengan input fields untuk konfigurasi IoT device
  const formContent = (
    <div className="flex flex-col gap-4 py-2">
  {/* Input Field: Nama Perangkat */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-2 items-center">
          <Label className="text-left ml-1 font-medium max-sm:text-xs">
            Nama
          </Label>
          <DescriptionTooltip
            side="right"
            content="Karakter alfanumerik dibatasi hanya (@ / . - _)"
          >
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
          </DescriptionTooltip>
        </div>
        {/* Input text untuk nama perangkat dengan placeholder dan validasi */}
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)} // Update state nama saat user mengetik
          placeholder="Contoh: Perangkat 1" // Contoh format nama perangkat
          required // Field wajib diisi
          className="w-full" // Full width responsive
        />
      </div>

      {/* Grid Layout: Board Type & Protocol Selection side by side */}
      <div className="grid grid-cols-2 gap-4">
        {/* Board Type Selection: Conditional rendering berdasarkan device */}
        <div className="flex flex-col gap-2">
          <div className="flex gap-2 items-center">
            <Label className="text-left ml-1 font-medium max-sm:text-xs">
              Tipe Board
            </Label>
            <DescriptionTooltip side="top" content="Pilih tipe perangkat IoT">
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </DescriptionTooltip>
          </div>
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
        </div>

        {/* Protocol Selection: Dropdown untuk protokol komunikasi IoT */}
        <div className="flex flex-col gap-2">
          <div className="flex gap-2 items-center">
            <Label className="text-left ml-1 font-medium max-sm:text-xs">
              Protokol Komunikasi
            </Label>
            <DescriptionTooltip
              side="left"
              content="Protokol pengiriman data yang akan digunakan"
            >
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </DescriptionTooltip>
          </div>
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

      {/* Offline Timeout Configuration */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex gap-2 items-center">
            <Label className="text-left ml-1 font-medium max-sm:text-xs">
              Timeout Offline (Menit)
            </Label>
            <DescriptionTooltip
              side="right"
              content="Durasi sebelum perangkat dianggap offline jika tidak mengirim data"
            >
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </DescriptionTooltip>
          </div>
          <Input
            id="offlineTimeoutMinutes"
            type="number"
            value={offlineTimeoutMinutes}
            onChange={(e) => setOfflineTimeoutMinutes(e.target.value)}
            placeholder="1"
            min="1"
            max="60"
            required
            className="w-full"
          />
        </div>
        {protocol === "MQTT" && (
          <div className="flex flex-col gap-2">
            <div className="flex gap-2 items-center">
              <Label
                htmlFor="mqttTopic"
                className="text-left ml-1 font-medium max-sm:text-xs"
              >
                Topik MQTT
              </Label>
              <DescriptionTooltip
                side="top"
                content="Topik untuk komunikasi MQTT"
              >
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
              </DescriptionTooltip>
            </div>
            <Input
              id="mqttTopic"
              value={mqttTopic}
              placeholder="Contoh: data" // Contoh format MQTT topic
              onChange={(e) => setMqttTopic(e.target.value)}
              required // Field wajib untuk protokol MQTT
              className="w-full"
            />
          </div>
        )}

        {/* Conditional Field: LoRaWAN Configuration - untuk protokol LoRa */}
        {protocol === "LoRaWAN" && (
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="loraProfile"
              className="text-left ml-1  font-medium"
            >
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
    </div>
  );

  // Handler untuk form submission dengan validasi dan persiapan data
  const handleSubmit = (e) => {
    e.preventDefault(); // Prevent default form submission

    // Siapkan objek data sesuai dengan struktur yang diharapkan backend
    handleAddDevice({
      name, // Nama perangkat
      board: boardType, // Tipe board yang dipilih
      protocol: protocol, // Protokol komunikasi
      mqtt_topic: protocol === "MQTT" ? mqttTopic : undefined, // MQTT topic jika protokol MQTT
      offline_timeout_minutes: parseInt(offlineTimeoutMinutes), // Timeout offline dalam menit
      // mqtt_qos: protocol === "MQTT" ? mqttQos : undefined, // QoS (commented out)
      // lora_profile: protocol === "LoRaWAN" ? loraProfile : undefined, // LoRa profile jika LoRaWAN
    });

  // Reset semua field form setelah submit berhasil
    setName("");
    setBoardType("");
    setProtocol("");
    setMqttTopic("");
    setMqttQos("0");
    setLoraProfile("");
    setOfflineTimeoutMinutes("1");
    setOpen(false); // Tutup modal setelah submit
  };

  // Render ResponsiveDialog dengan form configuration
  return (
    <ResponsiveDialog
      open={open} // State visibility modal
      setOpen={setOpen} // Function untuk kontrol modal
  title="Tambah Perangkat" // Judul modal
      form={formContent} // Form content yang sudah dibuat
      formHandle={handleSubmit} // Handler untuk form submission
      confirmText="Tambah" // Text untuk tombol submit
      cancelText="Batalkan" // Text untuk tombol cancel
    />
  );
}

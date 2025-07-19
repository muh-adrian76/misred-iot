"use client";
import ResponsiveDialog from "@/components/custom/dialogs/responsive-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
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

export default function AddDeviceForm({
  open,
  setOpen,
  handleAddDevice,
  openBoardPopover,
  setOpenBoardPopover,
  boardOptions,
  isMobile,
}) {
  const [name, setName] = useState("");
  const [boardType, setBoardType] = useState("");
  const [protocol, setProtocol] = useState("");
  const [mqttTopic, setMqttTopic] = useState("");
  const [mqttQos, setMqttQos] = useState("0");
  const [loraProfile, setLoraProfile] = useState("");

  const formContent = (
    <div className="flex flex-col gap-4 py-2">
      {/* Input: Nama */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="name" className="text-left ml-1 font-medium max-sm:text-xs">
          Nama
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Contoh: Device 1"
          required
          className="w-full"
        />
      </div>

      {/* Baris: Tipe Board & Protokol Komunikasi */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label className="text-left ml-1 font-medium max-sm:text-xs">Tipe Board</Label>
          {isMobile ? (
            <Select value={boardType} onValueChange={setBoardType}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih tipe board" />
              </SelectTrigger>
              <SelectContent>
                {boardOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Popover open={openBoardPopover} onOpenChange={setOpenBoardPopover}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openBoardPopover}
                  className="justify-between w-full"
                >
                  <span className="truncate">
                    {boardType || "Pilih tipe board"}
                  </span>
                  <ChevronDown className="ml-2 h-5 w-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-full">
                <Command>
                  <CommandInput placeholder="Cari tipe board..." />
                  <CommandList>
                    <CommandEmpty>Tidak ada opsi.</CommandEmpty>
                    {boardOptions.map((option) => (
                      <CommandItem
                        key={option}
                        value={option}
                        onSelect={() => {
                          setBoardType(option);
                          setOpenBoardPopover(false);
                        }}
                      >
                        <span className="truncate">{option}</span>
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
        <div className="flex flex-col gap-2">
          <Label className="text-left ml-1 font-medium max-sm:text-xs">
            Protokol Komunikasi
          </Label>
          <Select value={protocol} onValueChange={setProtocol}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih protokol" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="HTTP">HTTP</SelectItem>
              <SelectItem value="MQTT">MQTT</SelectItem>
              {/* <SelectItem value="LoRaWAN">LoRaWAN</SelectItem> */}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Baris: MQTT */}
      {protocol === "MQTT" && (
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="mqttTopic" className="text-left ml-1 font-medium max-sm:text-xs">
              Topik MQTT
            </Label>
            <Input
              id="mqttTopic"
              value={mqttTopic}
              placeholder="Contoh: data"
              onChange={(e) => setMqttTopic(e.target.value)}
              required
              className="w-full"
            />
          </div>
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

      {/* Baris: Lora */}
      {protocol === "LoRaWAN" && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="loraProfile" className="text-left ml-1  font-medium">
            Profil Lora
          </Label>
          <Input
            id="loraProfile"
            value={loraProfile}
            placeholder="Contoh: Gateway 1"
            onChange={(e) => setLoraProfile(e.target.value)}
            required
            className="w-full"
          />
        </div>
      )}
    </div>
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    handleAddDevice({
      name,
      board: boardType,
      protocol: protocol,
      mqtt_topic: protocol === "MQTT" ? mqttTopic : undefined,
      // mqtt_qos: protocol === "MQTT" ? mqttQos : undefined,
      lora_profile: protocol === "LoRaWAN" ? loraProfile : undefined,
    });
    setName("");
    setBoardType("");
    setProtocol("");
    setMqttTopic("");
    setMqttQos("0");
    setLoraProfile("");
    setOpen(false);
  };

  return (
    <ResponsiveDialog
      open={open}
      setOpen={setOpen}
      title="Tambah Device"
      form={formContent}
      formHandle={handleSubmit}
      confirmText="Tambah"
      cancelText="Batalkan"
    />
  );
}

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
import { useState, useEffect } from "react";

export default function EditDeviceForm({
  open,
  setOpen,
  editDevice,
  handleEditDevice,
  openBoardPopover,
  setOpenBoardPopover,
  boardOptions,
  isMobile,
}) {
  // Local state untuk field dinamis
  const [name, setName] = useState("");
  const [boardType, setBoardType] = useState("");
  const [protocol, setProtocol] = useState("");
  const [mqttTopic, setMqttTopic] = useState("");
  const [mqttQos, setMqttQos] = useState("0");
  const [loraProfile, setLoraProfile] = useState("");

  useEffect(() => {
    if (editDevice) {
      setName(editDevice.name || editDevice.description || "");
      setBoardType(editDevice.boardType || editDevice.board_type || "");
      setProtocol(editDevice.protocol || "");
      setMqttTopic(editDevice.mqtt_topic || "");
      setMqttQos(editDevice.mqtt_qos || "0");
      setLoraProfile(editDevice.lora_profile || "");
    }
  }, [editDevice, open]);

  const formContent = (
    <div className="grid gap-4 py-2">
      <div className="flex flex-col gap-2">
        <Label
          htmlFor="nameEdit"
          className="text-left ml-1 font-medium max-sm:text-xs"
        >
          Nama
        </Label>
        <Input
          id="nameEdit"
          className="w-full"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label className="text-left ml-1 font-medium max-sm:text-xs">
            Tipe Board
          </Label>
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
          <Select
            value={protocol}
            onValueChange={(value) => setProtocol(value)}
            required
          >
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
      {protocol === "MQTT" && (
        <div className="grid grid-cols-2 gap-4">
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
              value={mqttTopic}
              placeholder="Contoh: data"
              onChange={(e) => {
                let value = e.target.value;
                if (editDevice?.id && value.startsWith(editDevice.id + "/")) {
                  value = value.slice((editDevice.id + "/").length);
                }
                setMqttTopic(value);
              }}
              required
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
    await handleEditDevice(editDevice.id, {
      name,
      board: boardType,
      protocol,
      mqtt_topic: protocol === "MQTT" ? mqttTopic : undefined,
      // mqtt_qos: protocol === "MQTT" ? mqttQos : undefined,
      lora_profile: protocol === "LoRaWAN" ? loraProfile : undefined,
    });
    setOpen(false);
  };

  return (
    <ResponsiveDialog
      open={open}
      setOpen={setOpen}
      title={
        <>
          Edit <i>{editDevice?.description || ""}</i>
        </>
      }
      form={formContent}
      formHandle={handleSubmit}
      confirmText="Simpan"
      cancelText="Batalkan"
    />
  );
}

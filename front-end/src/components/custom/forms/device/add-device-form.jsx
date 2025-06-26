import ResponsiveDialog from "@/components/custom/other/responsive-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useState } from "react";

export default function AddDeviceForm({
  open,
  setOpen,
  handleAddDevice,
  boardOptions,
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
        <Label htmlFor="name" className="text-left ml-1 font-medium">
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
          <Label className="text-left ml-1 font-medium">
            Tipe Board
          </Label>
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
        </div>
        <div className="flex flex-col gap-2">
          <Label className="text-left ml-1 font-medium">
            Protokol Komunikasi
          </Label>
          <Select value={protocol} onValueChange={setProtocol}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih protokol" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="http">HTTP</SelectItem>
              <SelectItem value="mqtt">MQTT</SelectItem>
              <SelectItem value="lorawan">LoRaWAN</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Baris: MQTT */}
      {protocol === "mqtt" && (
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="mqttTopic" className="text-left ml-1 font-medium">
              Topik MQTT
            </Label>
            <Input
              id="mqttTopic"
              value={mqttTopic}
              placeholder="Contoh: device/data"
              onChange={(e) => setMqttTopic(e.target.value)}
              required
              className="w-full"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-left ml-1 font-medium">
              QoS MQTT
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
          </div>
        </div>
      )}

      {/* Baris: Lora */}
      {protocol === "lorawan" && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="loraProfile" className="text-left ml-1  font-medium">
            Profil Lora
          </Label>
          <Input
            id="loraProfile"
            value={loraProfile}
            placeholder="Gateway 1"
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
      protocol,
      mqtt_topic: protocol === "mqtt" ? mqttTopic : undefined,
      mqtt_qos: protocol === "mqtt" ? mqttQos : undefined,
      lora_profile: protocol === "lorawan" ? loraProfile : undefined,
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
      description="Isi data perangkat yang ada miliki."
      form={formContent}
      formHandle={handleSubmit}
      confirmText="Tambah"
      cancelText="Batalkan"
    />
  );
}

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
import { fetchFromBackend } from "@/lib/helper";
import { useState, useEffect } from "react";
import showToast from "../../other/toaster";

export default function EditDeviceForm({
  open,
  setOpen,
  editDevice,
  setEditDevice,
  handleEditDevice,
  boardOptions,
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
        <Label htmlFor="nameEdit" className="text-left ml-1  font-medium">
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
          <Label className="text-left ml-1  font-medium">
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
          <Label className="text-left ml-1  font-medium">
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
              <SelectItem value="http">HTTP</SelectItem>
              <SelectItem value="mqtt">MQTT</SelectItem>
              <SelectItem value="lorawan">LoRaWAN</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {protocol === "mqtt" && (
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="mqttTopicEdit"
              className="text-left ml-1  font-medium"
            >
              MQTT Topic
            </Label>
            <Input
              id="mqttTopicEdit"
              className="w-full"
              value={mqttTopic}
              placeholder="Contoh: device/data"
              onChange={(e) => setMqttTopic(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label
              className="text-left ml-1  font-medium"
            >
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
          </div>
        </div>
      )}
      {protocol === "lorawan" && (
        <div className="flex flex-col gap-2">
          <Label
            htmlFor="loraProfileEdit"
            className="text-left ml-1  font-medium"
          >
            Lora Profile
          </Label>
          <Input
            id="loraProfileEdit"
            className="w-full"
            placeholder="Gateway 1"
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
      mqtt_topic: protocol === "mqtt" ? mqttTopic : undefined,
      mqtt_qos: protocol === "mqtt" ? mqttQos : undefined,
      lora_profile: protocol === "lorawan" ? loraProfile : undefined,
    });
    setOpen(false);
  };

  return (
    <ResponsiveDialog
      open={open}
      setOpen={setOpen}
      title="Edit Device"
      description="Ubah informasi perangkat disini."
      form={formContent}
      formHandle={handleSubmit}
      confirmText="Simpan"
      cancelText="Batalkan"
    />
  );
}

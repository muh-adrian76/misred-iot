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
import { useState, useEffect } from "react";

export default function EditDatastreamForm({
  open,
  setOpen,
  datastreamData,
  handleEditDatastream,
  unitOptions,
  datastreams,
}) {
  const [description, setDescription] = useState("");
  const [pin, setPin] = useState("");
  const [type, setType] = useState("");
  const [unit, setUnit] = useState("");
  const [defaultValue, setDefaultValue] = useState(0);
  const [minValue, setMinValue] = useState(0);
  const [maxValue, setMaxValue] = useState(1);

  useEffect(() => {
    if (datastreamData) {
      setDescription(datastreamData.description || "");
      setPin(datastreamData.pin || "");
      setType(datastreamData.type || "");
      setUnit(datastreamData.unit || "");
      setDefaultValue(datastreamData.default_value || "");
      setMinValue(datastreamData.min_value || "");
      setMaxValue(datastreamData.max_value || "");
    }
  }, [datastreamData, open]);

  // Generate opsi pin 0-255
  const pinOptions = Array.from({ length: 256 }, (_, i) => i.toString());
  const usedPins = datastreams
    .filter((ds) => ds.id !== datastreamData?.id)
    .map((ds) => ds.pin);

  const formContent = (
    <div className="grid gap-4 py-2">
      <div className="flex flex-col gap-2">
        <Label htmlFor="descEdit" className="text-left font-medium ml-1">
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
      <div className="grid grid-cols-2 gap-4">
        {/* PIN */}
        <div className="flex flex-col gap-2">
          <Label className="text-left font-medium ml-1">
            Pin
          </Label>
          <Select value={pin} onValueChange={setPin}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih Pin" />
            </SelectTrigger>
            <SelectContent>
              {pinOptions.map((p) => (
                <SelectItem
                  key={p}
                  value={p}
                  disabled={usedPins.includes(p)}
                  className={usedPins.includes(p) ? "opacity-50" : ""}
                >
                  {usedPins.includes(p) ? `${p} (telah terpakai)` : p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* TIPE DATA */}
        <div className="flex flex-col gap-2">
          <Label className="text-left font-medium ml-1">
            Tipe Data
          </Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih Tipe Data" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="integer">Integer</SelectItem>
              <SelectItem value="string">String</SelectItem>
              <SelectItem value="double">Double</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {/* SATUAN */}
      <div className="flex flex-col gap-2">
        <Label className="text-left font-medium ml-1">
          Satuan
        </Label>
        <Select value={unit} onValueChange={setUnit}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Pilih Satuan" />
          </SelectTrigger>
          <SelectContent position="bottom">
            {unitOptions.map((u) => (
              <SelectItem key={u.value} value={u.value}>
                {u.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="defaultValue" className="text-left font-medium ml-1">
            Nilai default
          </Label>
          <Input
            id="defaultValue"
            type="number"
            value={defaultValue}
            onChange={(e) => setDefaultValue(e.target.value)}
            className="w-full"
            placeholder="0"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="minValue" className="text-left font-medium ml-1">
            Nilai Minimal
          </Label>
          <Input
            id="minValue"
            type="number"
            value={minValue}
            onChange={(e) => setMinValue(e.target.value)}
            className="w-full"
            placeholder="0"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="maxValue" className="text-left font-medium ml-1">
            Nilai Maksimal
          </Label>
          <Input
            id="maxValue"
            type="number"
            value={maxValue}
            onChange={(e) => setMaxValue(e.target.value)}
            className="w-full"
            placeholder="1"
          />
        </div>
      </div>
    </div>
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    await handleEditDatastream(datastreamData.id, {
      description,
      pin,
      type,
      unit,
      defaultValue,
      minValue,
      maxValue,
    });
    setOpen(false);
  };

  return (
    <ResponsiveDialog
      open={open}
      setOpen={setOpen}
      title="Edit Datastream"
      description="Ubah informasi datastream di sini."
      form={formContent}
      formHandle={handleSubmit}
      confirmText="Simpan"
      cancelText="Batalkan"
    />
  );
}

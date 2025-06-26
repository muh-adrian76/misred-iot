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

export default function AddDatastreamForm({
  open,
  setOpen,
  handleAddDatastream,
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

  // Generate opsi pin 0-255
  const pinOptions = Array.from({ length: 256 }, (_, i) => i.toString());
  const usedPins = new Set(datastreams.map((ds) => String(ds.pin)));

  const formContent = (
    <div className="grid gap-4 py-2">
      <div className="flex flex-col gap-2">
        <Label htmlFor="description" className="text-left font-medium ml-1">
          Nama
        </Label>
        <Input
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full"
          placeholder="Contoh: Sensor suhu ruangan"
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
                  disabled={usedPins.has(p)}
                  className={usedPins.has(p) ? "opacity-50" : ""}
                >
                  {usedPins.has(p) ? `${p} (telah terpakai)` : p}
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

  const handleSubmit = (e) => {
    e.preventDefault();
    handleAddDatastream({
      description,
      pin,
      type,
      unit,
      defaultValue,
      minValue,
      maxValue,
    });
    setDescription("");
    setPin("");
    setType("");
    setUnit("");
    setOpen(false);
  };

  return (
    <ResponsiveDialog
      open={open}
      setOpen={setOpen}
      title="Tambah Datastream"
      description="Isi data datastream yang ingin ditambahkan."
      form={formContent}
      formHandle={handleSubmit}
      confirmText="Tambah"
      cancelText="Batalkan"
    />
  );
}

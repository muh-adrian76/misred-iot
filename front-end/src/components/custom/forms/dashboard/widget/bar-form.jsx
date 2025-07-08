import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export default function BarForm({ datastreams = [], datastream_id, onChange }) {
  const [selected, setSelected] = useState(datastream_id || "");

  const handleSelect = (val) => {
    setSelected(val);
    onChange && onChange({ datastream_id: val });
  };

  return (
    <div className="flex flex-col gap-4">
      <Label>Pilih Datastream</Label>
      <Select value={selected} onValueChange={handleSelect}>
        <SelectTrigger>
          <SelectValue placeholder="Pilih Datastream" />
        </SelectTrigger>
        <SelectContent>
          {datastreams.map((ds) => (
            <SelectItem key={ds.id} value={String(ds.id)}>
              {ds.description}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
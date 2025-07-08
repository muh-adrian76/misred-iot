import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useState } from "react";

export default function AddAlarmForm({ open, setOpen, handleAddAlarm }) {
  const [description, setDescription] = useState("");
  const [widgetId, setWidgetId] = useState("");
  const [operator, setOperator] = useState(">");
  const [threshold, setThreshold] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    handleAddAlarm({
      description,
      widget_id: Number(widgetId),
      operator,
      threshold: Number(threshold),
    });
    setDescription("");
    setWidgetId("");
    setOperator(">");
    setThreshold("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah Alarm</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <Label>Deskripsi</Label>
            <Input value={description} onChange={e => setDescription(e.target.value)} required />
          </div>
          <div>
            <Label>Widget ID</Label>
            <Input value={widgetId} onChange={e => setWidgetId(e.target.value)} type="number" required />
          </div>
          <div>
            <Label>Operator</Label>
            <Select value={operator} onValueChange={setOperator}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih operator" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=">">&gt;</SelectItem>
                <SelectItem value="<">&lt;</SelectItem>
                <SelectItem value="=">=</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Threshold</Label>
            <Input value={threshold} onChange={e => setThreshold(e.target.value)} type="number" required />
          </div>
          <DialogFooter>
            <Button type="submit">Tambah</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
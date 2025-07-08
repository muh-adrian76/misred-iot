import ResponsiveDialog from "@/components/custom/dialogs/responsive-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useState, useEffect } from "react";

export default function EditAlarmForm({
  open,
  setOpen,
  editAlarm,
  handleEditAlarm,
  widgets = [],
}) {
  const [description, setDescription] = useState("");
  const [widgetId, setWidgetId] = useState("");
  const [operator, setOperator] = useState(">");
  const [threshold, setThreshold] = useState("");
  const [openWidgetPopover, setOpenWidgetPopover] = useState(false);

  useEffect(() => {
    if (editAlarm) {
      setDescription(editAlarm.description || "");
      setWidgetId(editAlarm.widget_id?.toString() || "");
      setOperator(editAlarm.operator || ">");
      setThreshold(editAlarm.threshold?.toString() || "");
    }
  }, [editAlarm, open]);

  const formContent = (
    <div className="flex flex-col gap-4 py-2">
      <div>
        <Label>Deskripsi</Label>
        <Input value={description} onChange={e => setDescription(e.target.value)} required />
      </div>
      <div>
        <Label>Widget</Label>
        <Popover open={openWidgetPopover} onOpenChange={setOpenWidgetPopover}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={openWidgetPopover}
              className="justify-between w-full"
            >
              <span className="truncate">
                {widgets.find((w) => String(w.id) === String(widgetId))?.description ||
                  widgets.find((w) => String(w.id) === String(widgetId))?.type ||
                  "Pilih Widget"}
              </span>
              <ChevronDown className="ml-2 h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0 w-full" align="start">
            <Command>
              <CommandInput placeholder="Cari widget..." />
              <CommandList>
                <CommandEmpty>
                  <span className="opacity-50">Tidak ada widget.</span>
                </CommandEmpty>
                {widgets.map((w) => (
                  <CommandItem
                    key={w.id}
                    value={String(w.id)}
                    onSelect={() => {
                      setWidgetId(String(w.id));
                      setOpenWidgetPopover(false);
                    }}
                  >
                    <span className="truncate">
                      {w.description || w.type}
                    </span>
                    <Check
                      className={cn(
                        "ml-auto",
                        String(widgetId) === String(w.id) ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
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
    </div>
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    handleEditAlarm(editAlarm.id, {
      description,
      widget_id: Number(widgetId),
      operator,
      threshold: Number(threshold),
    });
    setOpen(false);
  };

  if (!editAlarm) return null;

  return (
    <ResponsiveDialog
      open={open}
      setOpen={setOpen}
      title="Edit Alarm"
      form={formContent}
      formHandle={handleSubmit}
      confirmText="Simpan"
      cancelText="Batal"
    />
  );
}
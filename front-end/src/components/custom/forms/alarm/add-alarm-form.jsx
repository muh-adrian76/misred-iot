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
import { ChevronDown, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useState } from "react";

export default function AddAlarmForm({
  open,
  setOpen,
  handleAddAlarm,
  widgets = [],
}) {
  const [description, setDescription] = useState("");
  const [widgetId, setWidgetId] = useState("");
  const [operator, setOperator] = useState(">");
  const [threshold, setThreshold] = useState("");
  const [openWidgetPopover, setOpenWidgetPopover] = useState(false);

  // State untuk multi threshold
  const [conditions, setConditions] = useState([]);

  // Tambah kondisi ke array
  const handleAddCondition = () => {
    if (!threshold || !operator) return;
    setConditions([...conditions, { operator, value: threshold }]);
    setThreshold("");
    setOperator(">");
  };

  // Hapus kondisi
  const handleRemoveCondition = (idx) => {
    setConditions(conditions.filter((_, i) => i !== idx));
  };

  const formContent = (
    <div className="flex flex-col gap-4 py-2">
      <div className="flex flex-col gap-2">
        <Label>Deskripsi</Label>
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Contoh: Alarm Suhu Tinggi"
          required
        />
      </div>
      <div className="grid min-md:grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
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
                  {widgets.find((w) => String(w.id) === String(widgetId))
                    ?.description ||
                    widgets.find((w) => String(w.id) === String(widgetId))
                      ?.type ||
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
                    <span className="opacity-50">
                      Buat widget terlebih dahulu
                    </span>
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
                          String(widgetId) === String(w.id)
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex flex-col gap-2 w-full">
          <Label>Nilai Ambang Batas</Label>
          <div className="flex gap-2 grid-cols-3">
            <Select value={operator} onValueChange={setOperator}>
              <SelectTrigger className="w-20">
                <SelectValue placeholder="Pilih operator" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="=">=</SelectItem>
                <SelectItem value=">">&gt;</SelectItem>
                <SelectItem value="<">&lt;</SelectItem>
                <SelectItem value=">=">&gt;=</SelectItem>
                <SelectItem value="<=">&lt;=</SelectItem>
              </SelectContent>
            </Select>
            <Input
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              type="number"
              placeholder="Nilai"
              noInfo
              className="w-24"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={handleAddCondition}
              disabled={!threshold}
            >
              Tambah
            </Button>
          </div>
        </div>
      </div>
      {/* Tag list */}
      <div className="flex flex-wrap gap-2 mt-2 items-center">
        <span
          className={cn("hidden text-sm", conditions.length > 0 && "block")}
        >
          Kondisi:
        </span>
        {conditions.map((cond, idx) => (
          <span
            key={idx}
            className="flex items-center px-3 py-1 rounded-full bg-muted text-sm"
          >
            {cond.operator} {cond.value}
            <button
              type="button"
              className="ml-2 text-muted-foreground hover:text-destructive"
              onClick={() => handleRemoveCondition(idx)}
            >
              <X className="w-4 h-4" />
            </button>
          </span>
        ))}
      </div>
    </div>
  );

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
    <ResponsiveDialog
      open={open}
      setOpen={setOpen}
      title="Tambah Alarm"
      form={formContent}
      formHandle={handleSubmit}
      confirmText="Tambah"
      cancelText="Batal"
    />
  );
}

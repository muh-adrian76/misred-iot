import { useState } from "react";
import { Check, ChevronDown, SquarePen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import DescriptionTooltip from "../../other/description-tooltip";
import { Input } from "../../../ui/input";

export default function DashboardSelect({
  options = [],
  value,
  onChange,
  placeholder = "Pilih opsi",
  searchPlaceholder = "Cari...",
  className = "",
  align = "start",
  editState,
  editValue,
  onEditValueChange,
  noDataText,
}) {
  const [open, setOpen] = useState(false);

  const selectedLabel =
    options.find((option) => option.value === value)?.label || placeholder;

  return (
    <>
      {editState ? (
        <div className="relative">
          <Input
            id="dashboard"
            type="text"
            placeholder={selectedLabel}
            value={editValue}
            className="w-[300px] max-sm:w-[260px] pr-10"
            onChange={(e) => onEditValueChange(e.target.value)}
            noInfo
            required
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <SquarePen
              className="relative h-5 w-5"
              onClick={() => setShowPassword(true)}
            />
          </div>
        </div>
      ) : (
        <Popover open={open} onOpenChange={setOpen}>
          <DescriptionTooltip content="Pilih dashboard lainnya">
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="justify-between w-[300px] max-sm:w-[260px] font-semibold"
                disabled={editState}
              >
                <span className="truncate">{selectedLabel}</span>
                <ChevronDown className="ml-2 h-5 w-5" />
              </Button>
            </PopoverTrigger>
          </DescriptionTooltip>
          <PopoverContent className={cn("p-0", className)} align={align}>
            <Command>
              <CommandInput placeholder={searchPlaceholder} className="h-9" />
              <CommandList className="truncate">
                <CommandEmpty>{noDataText}</CommandEmpty>
                <CommandGroup>
                  {options.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      className="hover:font-semibold"
                      onSelect={(currentValue) => {
                        // console.log('DashboardSelect: Tab change requested from', value, 'to', currentValue, 'option:', option);
                        if (currentValue !== value) {
                          // console.log('DashboardSelect: Calling onChange with:', option.value);
                          onChange(option.value); // Use option.value instead of currentValue
                        }
                        setOpen(false);
                      }}
                    >
                      <span className="truncate max-w-[400px]">
                        {option.label}
                      </span>
                      <Check
                        className={cn(
                          "ml-auto",
                          value === option.value ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}
    </>
  );
}

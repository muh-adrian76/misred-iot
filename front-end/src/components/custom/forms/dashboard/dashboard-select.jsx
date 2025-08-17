// Import React hooks untuk state management
import { useState } from "react";
// Import icons untuk UI elements
import { Check, ChevronDown, SquarePen, Star } from "lucide-react";
// Import utility untuk CSS classes
import { cn } from "@/lib/utils";
// Import UI components
import { Button } from "@/components/ui/button";
// Import komponen Command untuk search/select functionality
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
// Import Popover untuk dropdown menu
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
// Import komponen tooltip untuk additional info
import DescriptionTooltip from "../../other/description-tooltip";
// Import Input component untuk editing mode
import { Input } from "../../../ui/input";

// Komponen DashboardSelect untuk memilih dashboard dengan search dan edit functionality
export default function DashboardSelect({
  options = [], // Array pilihan dashboard { value, label }
  value, // Nilai yang dipilih saat ini
  onChange, // Handler ketika pilihan berubah
  placeholder = "Pilih opsi", // Placeholder default
  searchPlaceholder = "Cari...", // Placeholder untuk pencarian
  className = "", // Kelas tambahan
  align = "start", // Alignment konten popover
  editState, // Apakah dalam mode edit nama
  editValue, // Nilai yang sedang diedit
  onEditValueChange, // Handler perubahan edit value
  noDataText = "Tidak ada data", // Teks fallback jika tidak ada data
  isMobile, // Status mobile
  isMedium, // Status medium
  isTablet, // Status tablet
}) {
  // State untuk kontrol open/close popover
  const [open, setOpen] = useState(false);

  // Find selected option label berdasarkan value yang dipilih
  const selectedLabel =
    options.find((option) => option.value === value)?.label || placeholder;

  return (
    <>
      {/* Conditional rendering berdasarkan edit state */}
      {editState ? (
        // Edit mode: Input field untuk mengedit nama dashboard
        <div className="relative">
          <Input
            id="dashboard"
            type="text"
            placeholder={selectedLabel} // Placeholder dengan nama dashboard saat ini
            value={editValue} // Controlled input dengan edit value
            className="w-[300px] max-sm:w-[260px] pr-10" // Responsive width dengan padding untuk icon
            onChange={(e) => onEditValueChange(e.target.value)} // Update edit value saat typing
            noInfo // No info icon untuk input ini
            required // Field wajib diisi
          />
          {/* Icon edit di dalam input field */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <SquarePen
              className="relative h-5 w-5 text-muted-foreground" // Ikon dekoratif
              aria-hidden="true" // Hanya dekorasi
            />{" "}
            {/* Ikon tidak interaktif; onClick salah dihapus */}
          </div>
        </div>
      ) : (
        <>
          <Popover open={open} onOpenChange={setOpen}>
            {/* Tooltip wrapper untuk additional context */}
            <DescriptionTooltip content="Pilih dashboard lainnya">
              <PopoverTrigger asChild>
                <Button
                  variant="outline" // Button style variant
                  role="combobox" // Accessibility role
                  aria-expanded={open} // Accessibility state
                  className="justify-between w-[300px] max-sm:w-[calc(60vw-16px)] font-semibold" // Responsive styling
                  disabled={editState} // Disable saat dalam edit state
                >
                  <span className="truncate">{selectedLabel}</span>{" "}
                  {/* Display selected option atau placeholder */}
                  <ChevronDown className="ml-2 h-5 w-5" /> {/* Dropdown icon */}
                </Button>
              </PopoverTrigger>
            </DescriptionTooltip>
            {/* Popover content dengan Command component untuk search functionality */}
            <PopoverContent
              className={cn(
                "p-0 w-[300px] max-sm:w-[calc(60vw-16px)]",
                className
              )}
              align={align}
            >
              <Command>
                {" "}
                {/* Command component untuk search dan selection */}
                <CommandInput
                  placeholder={searchPlaceholder}
                  className="h-9"
                />{" "}
                {/* Search input */}
                <CommandList className="truncate">
                  <CommandEmpty>{noDataText}</CommandEmpty>{" "}
                  {/* Empty state message */}
                  <CommandGroup>
                    {/* Render semua options sebagai selectable items */}
                    {options.map((option) => (
                      <CommandItem
                        key={option.value} // Unique key untuk list rendering
                        value={option.value} // Value untuk selection
                        className="hover:font-semibold w-full" // Full width untuk mengikuti parent
                        onSelect={(currentValue) => {
                          // Debug logging (commented out)
                          // console.log('DashboardSelect: Tab change requested from', value, 'to', currentValue, 'option:', option);
                          
                          // Panggil onChange handler dengan value yang dipilih
                          if (currentValue !== value) {
                            // console.log('DashboardSelect: Calling onChange with:', option.value);
                            onChange(option.value); // Use option.value instead of currentValue untuk consistency
                          }
                          setOpen(false); // Close popover setelah selection
                        }}
                      >
                        <span className="truncate">{option.label}</span>
                        {/* Check icon untuk menunjukkan selected option */}
                        <Check
                          className={cn(
                            "ml-auto", // Position di kanan
                            value === option.value ? "opacity-100" : "opacity-0" // Show/hide berdasarkan selection
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {/* <Button
            size={isMobile || isMedium || isTablet ? "icon" : "sm"}
            className="flex items-center p-3"
            variant={"outline"}
            onClick={() => {
              const current = dashboards.find((d) => d.id === activeTab);
              setDashboardToDelete(current);
              setOpenDeleteDialog(true);
            }}
          >
            <Star className="h-5 w-5" />
            {isMobile || isMedium || isTablet ? null : (
              <span className="ml-1">Default</span>
            )}
          </Button> */}
        </>
      )}
    </>
  );
}

// Import komponen UI dan utilities
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Settings2 } from "lucide-react"; // Icon untuk trigger dropdown
import { cn } from "@/lib/utils";

// Komponen DataTableRowActions untuk dropdown menu aksi pada setiap baris table
export default function DataTableRowActions({
  openDropdownOptions, // Index baris yang sedang membuka dropdown
  setOpenDropdownOptions, // Setter untuk kontrol dropdown yang terbuka
  row, // Data baris saat ini
  rowActions, // Array konfigurasi aksi yang tersedia
  rowIndex // Index baris dalam table
}) {
  return (
    <DropdownMenu
      open={openDropdownOptions === rowIndex} // Buka dropdown jika index cocok
      onOpenChange={(onOpen) => setOpenDropdownOptions(onOpen ? rowIndex : null)}
    >
      {/* Trigger button untuk membuka dropdown */}
      <DropdownMenuTrigger asChild>
        <Button
          size="iconSm"
          variant="link"
          className="text-foreground hover:text-foreground hover:border-foreground"
        >
          <Settings2 className="w-6 h-6" />
        </Button>
      </DropdownMenuTrigger>
      
      {/* Content dropdown dengan list aksi */}
      <DropdownMenuContent align="end">
        {rowActions.map((action, idx) => (
          <DropdownMenuItem
            key={action.key || idx}
            className={cn(
              action.className, // Custom className dari konfigurasi aksi
              "flex gap-3 items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-accent transition-all"
            )}
            onClick={() => {
              setOpenDropdownOptions(null); // Tutup dropdown
              setTimeout(() => action.onClick(row), 50); // Delay eksekusi untuk animasi
            }}
            disabled={action.disabled} // Disable item jika perlu
          >
            {/* Icon aksi jika ada */}
            {action.icon && (
              <action.icon className={cn("w-5 h-5", action.className)} />
            )}
            {/* Label aksi - bisa berupa string atau function */}
            {typeof action.label === "function"
              ? action.label(row) // Dynamic label berdasarkan data row
              : action.label} {/* Static label */}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

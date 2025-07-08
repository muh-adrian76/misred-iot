import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DataTableRowActions({
  openDropdownOptions,
  setOpenDropdownOptions,
  row,
  rowActions,
  rowIndex
}) {
  return (
    <DropdownMenu
      open={openDropdownOptions === rowIndex}
      onOpenChange={(onOpen) => setOpenDropdownOptions(onOpen ? rowIndex : null)}
    >
      <DropdownMenuTrigger asChild>
        <Button
          size="iconSm"
          variant="link"
          className="text-foreground hover:text-primary dark:"
        >
          <Settings2 className="w-6 h-6" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {rowActions.map((action, idx) => (
          <DropdownMenuItem
            key={action.key || idx}
            className={cn(
              action.className,
              "flex gap-3 items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-accent transition-all"
            )}
            onClick={() => {
              setOpenDropdownOptions(null);
              setTimeout(() => action.onClick(row), 50);
            }}
            disabled={action.disabled}
          >
            {action.icon && (
              <action.icon className={cn("w-5 h-5", action.className)} />
            )}
            {typeof action.label === "function"
              ? action.label(row)
              : action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

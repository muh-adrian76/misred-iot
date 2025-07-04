import { Button } from "@/components/ui/button";
import { Trash2, XIcon } from "lucide-react";

export default function DataTableBulkActions({
  selectedRows,
  content,
  totalRows,
  onDelete,
  setSelectedRows
}) {
  if (selectedRows.length === 0) return null;
  return (
    <div className="flex items-center px-2 gap-3 mb-2 rounded-t-md">
      <span className="font-medium text-sm">
        <b>
          {selectedRows.length} {content || "Data"} terpilih
        </b>{" "}
        dari {totalRows} data.
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="iconSm"
          className="text-muted-foreground hover:text-primary hover:bg-background hover:border hover:border-primary transition-all"
          onClick={() => onDelete(selectedRows)}
          aria-label="Hapus"
        >
          <Trash2 className="w-5 h-5" />
        </Button>
        <Button
          size="iconSm"
          variant="ghost"
          className="text-muted-foreground hover:text-foreground hover:bg-background hover:border hover:border-foreground transition-all"
          onClick={() => setSelectedRows([])}
          aria-label="Batal"
        >
          <XIcon className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}

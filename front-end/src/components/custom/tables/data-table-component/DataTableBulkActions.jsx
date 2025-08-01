// Import komponen UI dan icons
import { Button } from "@/components/ui/button";
import { Trash2, XIcon } from "lucide-react";

// Komponen DataTableBulkActions untuk aksi terhadap multiple rows yang dipilih
export default function DataTableBulkActions({
  selectedRows, // Array ID baris yang dipilih
  content, // Label konten untuk pesan (mis: "User", "Device", dll)
  totalRows, // Total jumlah baris dalam data
  onDelete, // Handler untuk menghapus selected rows
  setSelectedRows // Setter untuk mengubah selected rows
}) {
  // Jangan render jika tidak ada baris yang dipilih
  if (selectedRows.length === 0) return null;
  
  return (
    <div className="flex items-center px-2 gap-3 mb-2 rounded-t-md">
      {/* Informasi jumlah data yang dipilih */}
      <span className="font-medium text-sm">
        <b>
          {selectedRows.length} {content || "Data"} terpilih
        </b>{" "}
        dari {totalRows} data.
      </span>
      
      {/* Container untuk tombol-tombol aksi bulk */}
      <div className="flex items-center gap-2">
        {/* Tombol hapus untuk selected rows */}
        <Button
          variant="ghost"
          size="iconSm"
          className="text-muted-foreground hover:text-primary hover:bg-background hover:border hover:border-primary transition-all"
          onClick={() => onDelete(selectedRows)} // Panggil handler delete dengan selected IDs
          aria-label="Hapus"
        >
          <Trash2 className="w-5 h-5" />
        </Button>
        
        {/* Tombol batal/clear selection */}
        <Button
          size="iconSm"
          variant="ghost"
          className="text-muted-foreground hover:text-foreground hover:bg-background hover:border hover:border-foreground transition-all"
          onClick={() => setSelectedRows([])} // Clear semua selection
          aria-label="Batal"
        >
          <XIcon className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";

export default function DataTableToolbar({
  search,
  setSearch,
  searchPlaceholder,
  onAdd,
  isMobile,
  content
}) {
  return (
    <div className="flex items-end w-full rounded-2xl pb-3 gap-3 justify-between">
      <div className="relative w-full max-w-xs">
        <Input
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs pr-10"
          noInfo
        />
        <span className="absolute right-3 top-2.5 text-muted-foreground">
          <Search className="w-4 h-4" />
        </span>
      </div>
      {onAdd && (
        <Button onClick={onAdd} className="gap-2 transition-all">
          <Plus className="w-4 h-4" />
          {isMobile ? content : `Tambah ${content}`}
        </Button>
      )}
    </div>
  );
}

import { useState } from "react";
import ResponsiveDialog from "@/components/custom/other/responsive-dialog";
import { cn } from "@/lib/utils";
import showToast from "../../other/toaster";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AddDashboardDialog({ open, setOpen, onCreateDashboard }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast("error", "Nama dashboard tidak boleh kosong");
      return;
    }
    setLoading(true);
    try {
      await onCreateDashboard(name);
      setName("");
      setOpen(false);
    } catch {
      setLoading(false);
    }
  };

  // Form input untuk dialog
  const formContent = (
    <div className="flex flex-col gap-2">
      <Label htmlFor="dashboard-name">Nama Dashboard</Label>
      <Input
        id="dashboard-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Contoh: Monitoring Ruangan"
        required
        autoFocus
      />
    </div>
  );

  return (
    <ResponsiveDialog
      open={open}
      setOpen={setOpen}
      title="Buat Tab Dashboard"
      form={formContent}
      formHandle={handleSubmit}
      loading={loading}
      confirmText="Buat"
      cancelText="Batal"
      className={cn("max-w-md")}
    />
  );
}
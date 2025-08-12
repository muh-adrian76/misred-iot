// Import React hooks untuk state management
import { useState } from "react";
// Import komponen dialog responsif untuk form
import ResponsiveDialog from "@/components/custom/dialogs/responsive-dialog";
// Import utility untuk CSS classes
import { cn } from "@/lib/utils";
// Import toaster untuk error notifications
import { errorToast } from "@/components/custom/other/toaster";
// Import UI components untuk form inputs
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Komponen AddDashboardDialog untuk membuat dashboard monitoring baru
export default function AddDashboardDialog({ open, setOpen, onCreateDashboard }) {
  // State untuk form input dan loading
  const [name, setName] = useState(""); // Nama dashboard baru
  const [loading, setLoading] = useState(false); // Loading state saat create dashboard

  // Handler untuk submit form create dashboard
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission
    
    // Validasi input nama tidak boleh kosong
    if (!name.trim()) {
      errorToast("Nama dashboard tidak boleh kosong"); // Error toast notification
      return; // Stop execution jika validasi gagal
    }
    
    setLoading(true); // Set loading state
    try {
      await onCreateDashboard(name); // Call parent handler dengan nama dashboard
      setName(""); // Reset form input
      setOpen(false); // Close modal setelah berhasil
    } catch {
      // Handle error saat create dashboard
      errorToast("Gagal membuat dashboard. Silakan coba lagi.");
    } finally {
      setLoading(false); // Reset loading state
    }
  };

  // Form content untuk dialog
  const formContent = (
    <div className="flex flex-col gap-2">
  <Label htmlFor="dashboard-name">Nama Tab Dashboard</Label>
      <Input
        id="dashboard-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
  placeholder="Contoh: Monitoring Ruangan" // Contoh nama yang deskriptif
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
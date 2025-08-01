// Import komponen dialog konfirmasi untuk aksi delete
import ConfirmDialog from "@/components/custom/dialogs/confirm-dialog";
// Import checkbox button untuk konfirmasi user
import CheckboxButton from "@/components/custom/buttons/checkbox-button";

// Komponen DeleteDashboardDialog untuk menghapus dashboard dari sistem IoT
export default function DeleteDashboardDialog({
  open, // State untuk kontrol visibility dialog
  setOpen, // Setter untuk mengubah state dialog
  dashboardToDelete, // Dashboard yang akan dihapus dengan data {description}
  handle, // Handler function untuk delete dashboard
  deleteChecked, // State checkbox konfirmasi user
  setDeleteChecked, // Setter untuk checkbox konfirmasi
}) {
  // Render ConfirmDialog dengan dynamic content dan safety measures
  return (
    <ConfirmDialog
      open={open} // State visibility dialog
      setOpen={setOpen} // Function untuk kontrol dialog
      title={
        // Dynamic title berdasarkan dashboard yang akan dihapus
        dashboardToDelete ? (
          <>
            Hapus dashboard <i>"{dashboardToDelete.description}"</i> ? {/* Italic styling untuk nama dashboard */}
          </>
        ) : (
          "" // Empty title jika tidak ada dashboard
        )
      }
      description="Tindakan ini tidak dapat dibatalkan." // Warning message singkat dan jelas
      checkbox={
        // Checkbox konfirmasi untuk memastikan user memahami konsekuensi
        <CheckboxButton
          id="deleteDashboardCheckbox"
          text="Saya mengerti konsekuensinya." // Confirmation text
          checked={!!deleteChecked} // Convert to boolean untuk safety
          onChange={(e) => setDeleteChecked(e.target.checked)} // Update checkbox state
        />
      }
      confirmHandle={handle} // Function yang dipanggil saat confirm delete
      confirmText="Hapus" // Button text untuk konfirmasi delete
      cancelText="Batal" // Button text untuk cancel
      confirmDisabled={!deleteChecked} // Disable confirm button sampai user check box
    />
  );
}

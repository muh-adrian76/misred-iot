// Import React untuk state management
import { useState } from "react";
// Import komponen dialog konfirmasi untuk aksi delete
import ConfirmDialog from "@/components/custom/dialogs/confirm-dialog";
// Import checkbox button untuk konfirmasi user
import CheckboxButton from "../../buttons/checkbox-button";

// Komponen DeleteAlarmForm untuk menghapus alarm dari sistem IoT monitoring
export default function DeleteAlarmForm({
  open, // State untuk kontrol visibility modal
  setOpen, // Setter untuk mengubah state modal
  alarmToDelete, // Alarm yang akan dihapus (bisa single atau array)
  handleDeleteAlarm, // Handler function untuk delete alarm
  deleteChecked, // State checkbox konfirmasi user (opsional - akan menggunakan local state jika tidak ada)
  setDeleteChecked, // Setter untuk checkbox konfirmasi (opsional)
  setSelectedRows, // Setter untuk clear selected rows di table (opsional)
}) {
  // Local state untuk checkbox jika tidak disediakan dari parent
  const [localDeleteChecked, setLocalDeleteChecked] = useState(false);
  
  // Gunakan props jika ada, fallback ke local state
  const isDeleteChecked = deleteChecked !== undefined ? deleteChecked : localDeleteChecked;
  const updateDeleteChecked = setDeleteChecked || setLocalDeleteChecked;
  // Handler untuk proses penghapusan alarm dengan batch support
  const handleDelete = async () => {
    // Check apakah multiple alarms yang akan dihapus
    if (Array.isArray(alarmToDelete)) {
      // Loop untuk menghapus semua selected alarms
      for (const alarm of alarmToDelete) {
        await handleDeleteAlarm(alarm.id); // Delete setiap alarm by ID
      }
    } else if (alarmToDelete) {
      // Delete single alarm
      await handleDeleteAlarm(alarmToDelete.id);
    }
    
    // Cleanup dan tutup modal setelah delete berhasil
    setOpen(false); // Tutup dialog
    setSelectedRows([]); // Clear selected rows di table
    updateDeleteChecked(false); // Reset checkbox konfirmasi
  };

  // Cleanup function saat modal ditutup
  const handleModalClose = (isOpen) => {
    setOpen(isOpen);
    if (!isOpen) {
      // Reset checkbox saat modal ditutup
      updateDeleteChecked(false);
    }
  };

  // Render ConfirmDialog dengan dynamic content berdasarkan jumlah alarm
  return (
    <ConfirmDialog
      open={open} // State visibility modal
      setOpen={handleModalClose} // Function untuk kontrol modal dengan cleanup
      title={
        // Dynamic title berdasarkan jumlah alarm yang akan dihapus
        Array.isArray(alarmToDelete) && alarmToDelete.length === 1 ? (
          <>
            {/* Single alarm dari array selection */}
            Hapus alarm <i>{alarmToDelete[0].description || ""}</i> ?
          </>
        ) : Array.isArray(alarmToDelete) && alarmToDelete.length > 1 ? (
          <>
            {/* Multiple alarms selection */}
            Hapus {alarmToDelete.length} alarm terpilih ?
          </>
        ) : (
          // Single alarm direct selection
          alarmToDelete && (
            <>
              Hapus alarm <i>{alarmToDelete.description}</i> ?
            </>
          )
        )
      }
      description="Semua data yang berkaitan dengan alarm ini juga akan dihapus. Tindakan ini tidak dapat dibatalkan." // Warning message
      checkbox={
        // Checkbox konfirmasi untuk memastikan user memahami konsekuensi
        <CheckboxButton
          id="deleteAlarmCheckbox"
          text="Saya mengerti konsekuensinya." // Confirmation text
          checked={isDeleteChecked} // Current state checkbox
          onChange={(e) => updateDeleteChecked(e.target.checked)} // Update checkbox state
        />
      }
      confirmHandle={handleDelete} // Function yang dipanggil saat confirm delete
      confirmText="Hapus" // Button text untuk konfirmasi delete
      cancelText="Batal" // Button text untuk cancel
      confirmDisabled={!isDeleteChecked} // Disable submit sampai user check box
    />
  );
}
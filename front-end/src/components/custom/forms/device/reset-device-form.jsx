// Import komponen dialog konfirmasi untuk aksi reset data
import ConfirmDialog from "@/components/custom/dialogs/confirm-dialog";
// Import checkbox button untuk konfirmasi user
import CheckboxButton from "../../buttons/checkbox-button";

// Komponen ResetDeviceForm untuk mereset data payload device dari sistem
export default function ResetDeviceForm({
  open, // State untuk kontrol visibility modal
  setOpen, // Setter untuk mengubah state modal
  deviceToReset, // Device yang akan direset datanya
  handleResetDeviceData, // Handler function untuk reset device data
  resetChecked, // State checkbox konfirmasi user
  setResetChecked, // Setter untuk checkbox konfirmasi
}) {
  // Handler untuk proses reset data device
  const handleReset = async () => {
    if (deviceToReset) {
      // Reset data device
      await handleResetDeviceData(deviceToReset.id);
    }
    
    // Cleanup dan tutup modal setelah reset berhasil
    setOpen(false); // Tutup dialog
    setResetChecked(false); // Reset checkbox konfirmasi
  };

  // Render ConfirmDialog untuk konfirmasi reset data
  return (
    <ConfirmDialog
      open={open} // State visibility modal
      setOpen={setOpen} // Function untuk kontrol modal
      title={
        deviceToReset && (
          <>
            Reset data perangkat <i>{deviceToReset.description}</i> ?
          </>
        )
      }
      description="Semua data dari perangkat ini akan dihapus. Device akan tetap aktif dan dapat mengirim data baru. Tindakan ini tidak dapat dibatalkan." // Warning message
      checkbox={
        // Checkbox konfirmasi untuk memastikan user memahami konsekuensi
        <CheckboxButton
          id="resetDeviceCheckbox"
          text="Saya mengerti konsekuensinya." // Confirmation text
          checked={resetChecked} // State checkbox
          onChange={(e) => setResetChecked(e.target.checked)} // Handler untuk toggle checkbox
        />
      }
      confirmHandle={handleReset} // Handler untuk confirm reset action
      confirmText="Reset Data" // Text untuk tombol reset
      cancelText="Batal" // Text untuk tombol cancel
      confirmDisabled={!resetChecked} // Disable tombol confirm jika checkbox tidak dicentang
    />
  );
}

// Import komponen dialog konfirmasi untuk aksi delete
import ConfirmDialog from "@/components/custom/dialogs/confirm-dialog";
// Import checkbox button untuk konfirmasi user
import CheckboxButton from "../../buttons/checkbox-button";

// Komponen DeleteDeviceForm untuk menghapus perangkat IoT dari sistem
export default function DeleteDeviceForm({
  open, // State untuk kontrol visibility modal
  setOpen, // Setter untuk mengubah state modal
  deviceToDelete, // Device yang akan dihapus (bisa single atau array)
  handleDeleteDevice, // Handler function untuk delete device
  deleteChecked, // State checkbox konfirmasi user
  setDeleteChecked, // Setter untuk checkbox konfirmasi
  setSelectedRows, // Setter untuk clear selected rows di table
}) {
  // Handler untuk proses penghapusan perangkat dengan batch support
  const handleDelete = async () => {
    // Check apakah multiple perangkat yang akan dihapus
    if (Array.isArray(deviceToDelete)) {
      // Loop untuk menghapus semua perangkat terpilih
      for (const device of deviceToDelete) {
        await handleDeleteDevice(device.id); // Delete setiap perangkat by ID
      }
    } else if (deviceToDelete) {
      // Delete single perangkat
      await handleDeleteDevice(deviceToDelete.id);
    }
    
    // Cleanup dan tutup modal setelah delete berhasil
    setOpen(false); // Tutup dialog
    setSelectedRows([]); // Clear selected rows di table
    setDeleteChecked(false); // Reset checkbox konfirmasi
  };

  // Render ConfirmDialog dengan dynamic content berdasarkan jumlah perangkat
  return (
    <ConfirmDialog
      open={open} // State visibility modal
      setOpen={setOpen} // Function untuk kontrol modal
      title={
        // Dynamic title berdasarkan jumlah perangkat yang akan dihapus
        Array.isArray(deviceToDelete) && deviceToDelete.length === 1 ? (
          <>
            {/* Single perangkat dari array selection */}
            Hapus perangkat <i>{deviceToDelete[0].description || ""}</i> ?
          </>
        ) : Array.isArray(deviceToDelete) && deviceToDelete.length > 1 ? (
          <>
            {/* Multiple perangkat selection */}
            Hapus {deviceToDelete.length} perangkat terpilih ?
          </>
        ) : (
          // Single perangkat direct selection
          deviceToDelete && (
            <>
              Hapus perangkat <i>{deviceToDelete.description}</i> ?
            </>
          )
        )
      }
      description="Semua data yang berkaitan dengan perangkat ini juga akan dihapus. Tindakan ini tidak dapat dibatalkan." // Warning message
      checkbox={
        // Checkbox konfirmasi untuk memastikan user memahami konsekuensi
        <CheckboxButton
          id="deleteDeviceCheckbox"
          text="Saya mengerti konsekuensinya." // Confirmation text
          checked={deleteChecked} // State checkbox
          onChange={(e) => setDeleteChecked(e.target.checked)} // Handler untuk toggle checkbox
        />
      }
      confirmHandle={handleDelete} // Handler untuk confirm delete action
      confirmText="Hapus" // Text untuk tombol delete
      cancelText="Batal" // Text untuk tombol cancel
      confirmDisabled={!deleteChecked} // Disable tombol confirm jika checkbox tidak dicentang
    />
  );
}

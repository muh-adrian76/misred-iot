// Import komponen dialog konfirmasi untuk aksi delete
import ConfirmDialog from "@/components/custom/dialogs/confirm-dialog";
// Import checkbox button untuk konfirmasi user
import CheckboxButton from "../../buttons/checkbox-button";

// Komponen DeleteDeviceForm untuk menghapus IoT device dari sistem
export default function DeleteDeviceForm({
  open, // State untuk kontrol visibility modal
  setOpen, // Setter untuk mengubah state modal
  deviceToDelete, // Device yang akan dihapus (bisa single atau array)
  handleDeleteDevice, // Handler function untuk delete device
  deleteChecked, // State checkbox konfirmasi user
  setDeleteChecked, // Setter untuk checkbox konfirmasi
  setSelectedRows, // Setter untuk clear selected rows di table
}) {
  // Handler untuk proses penghapusan device dengan batch support
  const handleDelete = async () => {
    // Check apakah multiple devices yang akan dihapus
    if (Array.isArray(deviceToDelete)) {
      // Loop untuk menghapus semua selected devices
      for (const device of deviceToDelete) {
        await handleDeleteDevice(device.id); // Delete setiap device by ID
      }
    } else if (deviceToDelete) {
      // Delete single device
      await handleDeleteDevice(deviceToDelete.id);
    }
    
    // Cleanup dan tutup modal setelah delete berhasil
    setOpen(false); // Tutup dialog
    setSelectedRows([]); // Clear selected rows di table
    setDeleteChecked(false); // Reset checkbox konfirmasi
  };

  // Render ConfirmDialog dengan dynamic content berdasarkan jumlah device
  return (
    <ConfirmDialog
      open={open} // State visibility modal
      setOpen={setOpen} // Function untuk kontrol modal
      title={
        // Dynamic title berdasarkan jumlah device yang akan dihapus
        Array.isArray(deviceToDelete) && deviceToDelete.length === 1 ? (
          <>
            {/* Single device dari array selection */}
            Hapus device <i>{deviceToDelete[0].description || ""}</i> ?
          </>
        ) : Array.isArray(deviceToDelete) && deviceToDelete.length > 1 ? (
          <>
            {/* Multiple devices selection */}
            Hapus {deviceToDelete.length} device terpilih ?
          </>
        ) : (
          // Single device direct selection
          deviceToDelete && (
            <>
              Hapus device <i>{deviceToDelete.description}</i> ?
            </>
          )
        )
      }
      description="Semua data yang berkaitan dengan device ini juga akan dihapus. Tindakan ini tidak dapat dibatalkan." // Warning message
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

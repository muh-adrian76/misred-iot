// Import komponen dialog konfirmasi untuk aksi delete
import ConfirmDialog from "@/components/custom/dialogs/confirm-dialog";
// Import checkbox button untuk konfirmasi user
import CheckboxButton from "../../buttons/checkbox-button";

// Komponen DeleteDatastreamForm untuk menghapus datastream dari sistem IoT
export default function DeleteDatastreamForm({
  open, // State untuk kontrol visibility modal
  setOpen, // Setter untuk mengubah state modal
  datastream, // Datastream yang akan dihapus (bisa single atau array)
  handleDeleteDatastream, // Handler function untuk delete datastream
  deleteChecked, // State checkbox konfirmasi user
  setDeleteChecked, // Setter untuk checkbox konfirmasi
  setSelectedRows, // Setter untuk clear selected rows di table
}) {
  // Handler untuk proses penghapusan datastream dengan batch support
  const handleDelete = async () => {
    // Check apakah multiple datastreams yang akan dihapus
    if (Array.isArray(datastream)) {
      // Loop untuk menghapus semua selected datastreams
      for (const ds of datastream) {
        await handleDeleteDatastream(ds.id); // Delete setiap datastream by ID
      }
    } else if (datastream) {
      // Delete single datastream
      await handleDeleteDatastream(datastream.id);
    }
    
    // Cleanup dan tutup modal setelah delete berhasil
    setOpen(false); // Tutup dialog
    setSelectedRows([]); // Clear selected rows di table
    setDeleteChecked(false); // Reset checkbox konfirmasi
  };

  // Render ConfirmDialog dengan dynamic content berdasarkan jumlah datastream
  return (
    <ConfirmDialog
      open={open} // State visibility modal
      setOpen={setOpen} // Function untuk kontrol modal
      title={
        // Dynamic title berdasarkan jumlah datastream yang akan dihapus
        Array.isArray(datastream) && datastream.length === 1 ? (
          <>
            {/* Single datastream dari array selection */}
            Hapus datastream{" "}
            <i>{datastream[0].description || datastream[0].pin || ""}</i> ?
          </>
        ) : Array.isArray(datastream) && datastream.length > 1 ? (
          <>
            {/* Multiple datastreams selection */}
            Hapus {datastream.length} datastream terpilih ?
          </>
        ) : (
          // Single datastream direct selection
          datastream && (
            <>
              Hapus datastream <i>{datastream.description}</i> ?
            </>
          )
        )
      }
      description="Semua data yang berkaitan dengan datastream ini juga akan dihapus. Tindakan ini tidak dapat dibatalkan." // Warning message
      checkbox={
        // Checkbox konfirmasi untuk memastikan user memahami konsekuensi
        <CheckboxButton
          id="deleteDatastreamCheckbox"
          text="Saya mengerti konsekuensinya." // Confirmation text
          checked={deleteChecked} // Current state checkbox
          onChange={(e) => setDeleteChecked(e.target.checked)} // Update checkbox state
        />
      }
      confirmHandle={handleDelete} // Function yang dipanggil saat confirm delete
      confirmText="Hapus" // Button text untuk konfirmasi delete
      cancelText="Batal" // Button text untuk cancel
      confirmDisabled={!deleteChecked} // Disable submit sampai user check box
    />
  );
}

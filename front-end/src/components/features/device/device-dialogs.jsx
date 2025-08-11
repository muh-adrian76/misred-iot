// Import form untuk menambah device baru
import AddDeviceForm from "@/components/custom/forms/device/add-device-form";
// Import form untuk mengedit device yang sudah ada
import EditDeviceForm from "@/components/custom/forms/device/edit-device-form";
// Import form untuk menghapus device
import DeleteDeviceForm from "@/components/custom/forms/device/delete-device-form";
// Import form untuk reset data device
import ResetDeviceForm from "@/components/custom/forms/device/reset-device-form";

// Komponen yang mengelola seluruh dialog/modal untuk manajemen perangkat
export default function DeviceDialogs({
  devices, // Data perangkat untuk referensi
  addFormOpen, // Status dialog tambah perangkat
  setAddFormOpen, // Setter dialog tambah perangkat
  handleAddDevice, // Handler untuk menambah perangkat baru
  editFormOpen, // Status dialog edit perangkat
  setEditFormOpen, // Setter dialog edit perangkat
  editDevice, // Perangkat yang dipilih untuk diedit
  setEditDevice, // Setter perangkat yang akan diedit
  handleEditDevice, // Handler untuk menyimpan perubahan perangkat
  deleteFormOpen, // Status dialog hapus perangkat
  setDeleteFormOpen, // Setter dialog hapus perangkat
  resetFormOpen, // Status dialog reset data perangkat
  setResetFormOpen, // Setter dialog reset data perangkat
  openBoardPopover, // Status popover untuk pilihan board
  setOpenBoardPopover, // Setter popover board
  deviceToDelete, // Perangkat yang akan dihapus
  deviceToReset, // Perangkat yang akan direset datanya
  handleDeleteDevice, // Handler untuk menghapus perangkat
  handleResetDeviceData, // Handler untuk reset data perangkat
  deleteChecked, // Status konfirmasi hapus
  setDeleteChecked, // Setter konfirmasi hapus
  resetChecked, // Status konfirmasi reset
  setResetChecked, // Setter konfirmasi reset
  setSelectedRows, // Setter untuk reset selected rows setelah operasi
  boardOptions, // Opsi board yang tersedia
  isMobile, // Status mode mobile untuk responsivitas
}) {
  return (
    <>
      {/* Dialog untuk menambah perangkat baru */}
      <AddDeviceForm
        open={addFormOpen}
        setOpen={setAddFormOpen}
        handleAddDevice={handleAddDevice}
        openBoardPopover={openBoardPopover} // Status popover board
        setOpenBoardPopover={setOpenBoardPopover}
        boardOptions={boardOptions} // Opsi board mikrokontroler
        isMobile={isMobile} // Mode mobile untuk responsif
      />
      {/* Dialog untuk mengedit perangkat */}
      <EditDeviceForm
        open={editFormOpen}
        setOpen={setEditFormOpen}
        editDevice={editDevice} // Data perangkat yang akan diedit
        handleEditDevice={handleEditDevice}
        openBoardPopover={openBoardPopover} // Status popover board
        setOpenBoardPopover={setOpenBoardPopover}
        boardOptions={boardOptions} // Opsi board mikrokontroler
        isMobile={isMobile} // Mode mobile untuk responsif
      />
      {/* Dialog untuk menghapus perangkat */}
      <DeleteDeviceForm
        open={deleteFormOpen}
        setOpen={setDeleteFormOpen}
        deviceToDelete={deviceToDelete}
        handleDeleteDevice={handleDeleteDevice}
        deleteChecked={deleteChecked}
        setDeleteChecked={setDeleteChecked}
        setSelectedRows={setSelectedRows}
      />
      {/* Dialog untuk reset data perangkat */}
      <ResetDeviceForm
        open={resetFormOpen}
        setOpen={setResetFormOpen}
        deviceToReset={deviceToReset}
        handleResetDeviceData={handleResetDeviceData}
        resetChecked={resetChecked}
        setResetChecked={setResetChecked}
      />
    </>
  );
}

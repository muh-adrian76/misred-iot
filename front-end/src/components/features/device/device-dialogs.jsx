// Import form untuk menambah device baru
import AddDeviceForm from "@/components/custom/forms/device/add-device-form";
// Import form untuk mengedit device yang sudah ada
import EditDeviceForm from "@/components/custom/forms/device/edit-device-form";
// Import form untuk menghapus device
import DeleteDeviceForm from "@/components/custom/forms/device/delete-device-form";

// Komponen yang mengelola semua dialog/modal untuk device management
export default function DeviceDialogs({
  devices, // Data devices untuk referensi
  addFormOpen, // State apakah dialog tambah device terbuka
  setAddFormOpen, // Setter untuk dialog tambah device
  handleAddDevice, // Handler untuk menambah device baru
  editFormOpen, // State apakah dialog edit device terbuka
  setEditFormOpen, // Setter untuk dialog edit device
  editDevice, // Device yang dipilih untuk diedit
  setEditDevice, // Setter untuk device yang akan diedit
  handleEditDevice, // Handler untuk mengedit device
  deleteFormOpen, // State apakah dialog hapus device terbuka
  setDeleteFormOpen, // Setter untuk dialog hapus device
  openBoardPopover, // State popover untuk pilihan board
  setOpenBoardPopover, // Setter untuk popover board
  deviceToDelete, // Device yang akan dihapus
  handleDeleteDevice, // Handler untuk menghapus device
  deleteChecked, // State konfirmasi hapus
  setDeleteChecked, // Setter untuk konfirmasi hapus
  setSelectedRows, // Setter untuk reset selected rows setelah operasi
  boardOptions, // Opsi board yang tersedia
  isMobile, // Status apakah dalam mode mobile
}) {
  return (
    <>
      {/* Dialog untuk menambah device baru */}
      <AddDeviceForm
        open={addFormOpen}
        setOpen={setAddFormOpen}
        handleAddDevice={handleAddDevice}
        openBoardPopover={openBoardPopover} // State popover board
        setOpenBoardPopover={setOpenBoardPopover}
        boardOptions={boardOptions} // Opsi board microcontroller
        isMobile={isMobile} // Mode mobile untuk responsive
      />
      {/* Dialog untuk mengedit device yang sudah ada */}
      <EditDeviceForm
        open={editFormOpen}
        setOpen={setEditFormOpen}
        editDevice={editDevice} // Data device yang akan diedit
        handleEditDevice={handleEditDevice}
        openBoardPopover={openBoardPopover} // State popover board
        setOpenBoardPopover={setOpenBoardPopover}
        boardOptions={boardOptions} // Opsi board microcontroller
        isMobile={isMobile} // Mode mobile untuk responsive
      />
      {/* Dialog untuk menghapus device */}
      <DeleteDeviceForm
        open={deleteFormOpen}
        setOpen={setDeleteFormOpen}
        deviceToDelete={deviceToDelete}
        handleDeleteDevice={handleDeleteDevice}
        deleteChecked={deleteChecked}
        setDeleteChecked={setDeleteChecked}
        setSelectedRows={setSelectedRows}
      />
    </>
  );
}

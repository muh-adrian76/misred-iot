import AddDeviceForm from "@/components/custom/forms/device/add-device-form";
import EditDeviceForm from "@/components/custom/forms/device/edit-device-form";
import DeleteDeviceForm from "@/components/custom/forms/device/delete-device-form";
import UploadFirmwareForm from "@/components/custom/forms/otaa/otaa-form";
import OtaaUploadFirmwareForm from "@/components/custom/forms/otaa/otaa-form";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export default function DeviceDialogs({
  devices,
  addFormOpen,
  setAddFormOpen,
  handleAddDevice,
  editFormOpen,
  setEditFormOpen,
  editDevice,
  setEditDevice,
  handleEditDevice,
  deleteFormOpen,
  setDeleteFormOpen,
  openBoardPopover,
  setOpenBoardPopover,
  deviceToDelete,
  handleDeleteDevice,
  deleteChecked,
  setDeleteChecked,
  setSelectedRows,
  boardOptions,
  isMobile,
}) {
  return (
    <>
      <AddDeviceForm
        open={addFormOpen}
        setOpen={setAddFormOpen}
        handleAddDevice={handleAddDevice}
        openBoardPopover={openBoardPopover}
        setOpenBoardPopover={setOpenBoardPopover}
        boardOptions={boardOptions}
        isMobile={isMobile}
      />
      <EditDeviceForm
        open={editFormOpen}
        setOpen={setEditFormOpen}
        editDevice={editDevice}
        handleEditDevice={handleEditDevice}
        openBoardPopover={openBoardPopover}
        setOpenBoardPopover={setOpenBoardPopover}
        boardOptions={boardOptions}
        isMobile={isMobile}
      />
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

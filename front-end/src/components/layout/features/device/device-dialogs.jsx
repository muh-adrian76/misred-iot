import AddDeviceForm from "@/components/custom/forms/device/add-device-form";
import EditDeviceForm from "@/components/custom/forms/device/edit-device-form";
import DeleteDeviceForm from "@/components/custom/forms/device/delete-device-form";

export default function DeviceDialogs({
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
  deviceToDelete,
  handleDeleteDevice,
  deleteChecked,
  setDeleteChecked,
}) {
  const BOARD_OPTIONS = [
    "ESP32",
    "ESP8266",
    "Arduino Uno",
    "Arduino Nano",
    "Raspberry Pi",
    "NodeMCU",
    "Lolin32",
    "Lainnya",
  ];

  return (
    <>
      <AddDeviceForm
        open={addFormOpen}
        setOpen={setAddFormOpen}
        handleAddDevice={handleAddDevice}
        boardOptions={BOARD_OPTIONS}
      />
      <EditDeviceForm
        open={editFormOpen}
        setOpen={setEditFormOpen}
        editDevice={editDevice}
        setEditDevice={setEditDevice}
        handleEditDevice={handleEditDevice}
        boardOptions={BOARD_OPTIONS}
      />
      <DeleteDeviceForm
        open={deleteFormOpen}
        setOpen={setDeleteFormOpen}
        deviceToDelete={deviceToDelete}
        handleDeleteDevice={handleDeleteDevice}
        deleteChecked={deleteChecked}
        setDeleteChecked={setDeleteChecked}
      />
    </>
  );
}

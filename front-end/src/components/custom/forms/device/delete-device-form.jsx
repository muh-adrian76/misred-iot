import ConfirmDialog from "@/components/custom/dialogs/confirm-dialog";
import CheckboxButton from "../../buttons/checkbox-button";

export default function DeleteDeviceForm({
  open,
  setOpen,
  deviceToDelete,
  handleDeleteDevice,
  deleteChecked,
  setDeleteChecked,
  setSelectedRows,
}) {
  const handleDelete = async () => {
    if (Array.isArray(deviceToDelete)) {
      for (const device of deviceToDelete) {
        await handleDeleteDevice(device.id);
      }
    } else if (deviceToDelete) {
      await handleDeleteDevice(deviceToDelete.id);
    }
    setOpen(false);
    setSelectedRows([]);
    setDeleteChecked(false);
  };

  return (
    <ConfirmDialog
      open={open}
      setOpen={setOpen}
      title={
        Array.isArray(deviceToDelete) && deviceToDelete.length === 1 ? (
          <>
            Hapus device <i>{deviceToDelete[0].description || ""}</i> ?
          </>
        ) : Array.isArray(deviceToDelete) && deviceToDelete.length > 1 ? (
          <>Hapus {deviceToDelete.length} device terpilih ?</>
        ) : (
          deviceToDelete && (
            <>
              Hapus device <i>{deviceToDelete.description}</i> ?
            </>
          )
        )
      }
      description="Semua data yang berkaitan dengan device ini juga akan dihapus. Tindakan ini tidak dapat dibatalkan."
      checkbox={
        <CheckboxButton
          id="deleteDeviceCheckbox"
          text="Saya mengerti konsekuensinya."
          checked={deleteChecked}
          onChange={(e) => setDeleteChecked(e.target.checked)}
        />
      }
      confirmHandle={handleDelete}
      confirmText="Hapus"
      cancelText="Batal"
      confirmDisabled={!deleteChecked}
    />
  );
}

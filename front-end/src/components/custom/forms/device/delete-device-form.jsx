import ConfirmDialog from "@/components/custom/other/confirm-dialog";
import { fetchFromBackend } from "@/lib/helper";
import CheckboxButton from "../../buttons/checkbox-button";
import showToast from "../../other/toaster";

export default function DeleteDeviceForm({
  open,
  setOpen,
  deviceToDelete,
  handleDeleteDevice,
  deleteChecked,
  setDeleteChecked,
}) {
  const handleDelete = async () => {
    await handleDeleteDevice(deviceToDelete.id);
    setOpen(false);
  };

  return (
    <ConfirmDialog
      open={open}
      setOpen={setOpen}
      title={
        deviceToDelete ? (
          <>
            Hapus device{" "}
            <i>"{deviceToDelete.name || deviceToDelete.description}"</i> ?
          </>
        ) : (
          ""
        )
      }
      description="Tindakan ini tidak dapat dibatalkan."
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

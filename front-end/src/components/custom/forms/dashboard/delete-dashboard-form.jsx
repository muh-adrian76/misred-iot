import ConfirmDialog from "@/components/custom/dialogs/confirm-dialog";
import CheckboxButton from "@/components/custom/buttons/checkbox-button";

export default function DeleteDashboardDialog({
  open,
  setOpen,
  dashboardToDelete,
  handle,
  deleteChecked,
  setDeleteChecked,
}) {
  return (
    <ConfirmDialog
      open={open}
      setOpen={setOpen}
      title={
        dashboardToDelete ? (
          <>
            Hapus dashboard <i>"{dashboardToDelete.description}"</i> ?
          </>
        ) : (
          ""
        )
      }
      description="Tindakan ini tidak dapat dibatalkan."
      checkbox={
        <CheckboxButton
          id="deleteDashboardCheckbox"
          text="Saya mengerti konsekuensinya."
          checked={!!deleteChecked}
          onChange={(e) => setDeleteChecked(e.target.checked)}
        />
      }
      confirmHandle={handle}
      confirmText="Hapus"
      cancelText="Batal"
      confirmDisabled={!deleteChecked}
    />
  );
}

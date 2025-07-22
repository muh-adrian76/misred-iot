import ConfirmDialog from "@/components/custom/dialogs/confirm-dialog";
import CheckboxButton from "../../buttons/checkbox-button";

export default function DeleteAlarmForm({
  open,
  setOpen,
  alarmToDelete,
  handleDeleteAlarm,
  deleteChecked,
  setDeleteChecked,
  setSelectedRows,
}) {
  const handleDelete = async () => {
    if (Array.isArray(alarmToDelete)) {
      for (const alarm of alarmToDelete) {
        await handleDeleteAlarm(alarm.id);
      }
    } else if (alarmToDelete) {
      await handleDeleteAlarm(alarmToDelete.id);
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
        Array.isArray(alarmToDelete) && alarmToDelete.length === 1 ? (
          <>
            Hapus alarm <i>{alarmToDelete[0].description || ""}</i> ?
          </>
        ) : Array.isArray(alarmToDelete) && alarmToDelete.length > 1 ? (
          <>Hapus {alarmToDelete.length} alarm terpilih ?</>
        ) : (
          alarmToDelete && (
            <>
              Hapus alarm <i>{alarmToDelete.description}</i> ?
            </>
          )
        )
      }
      description="Semua data yang berkaitan dengan alarm ini juga akan dihapus. Tindakan ini tidak dapat dibatalkan."
      checkbox={
        <CheckboxButton
          id="deleteAlarmCheckbox"
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
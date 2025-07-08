import ConfirmDialog from "@/components/custom/dialogs/confirm-dialog";

export default function DeleteAlarmForm({
  open,
  setOpen,
  alarmToDelete,
  handleDeleteAlarm,
}) {
  if (!alarmToDelete) return null;

  return (
    <ConfirmDialog
      open={open}
      setOpen={setOpen}
      title={
        <>
          Hapus alarm <i>{alarmToDelete.description}</i>?
        </>
      }
      description="Tindakan ini tidak dapat dibatalkan."
      confirmHandle={() => {
        handleDeleteAlarm(alarmToDelete.id);
        setOpen(false);
      }}
      confirmText="Hapus"
      cancelText="Batal"
      confirmDisabled={false}
    />
  );
}
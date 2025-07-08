import AddAlarmForm from "@/components/custom/forms/alarm/add-alarm-form";
import EditAlarmForm from "@/components/custom/forms/alarm/edit-alarm-form";
import DeleteAlarmForm from "@/components/custom/forms/alarm/delete-alarm-form";

export default function AlarmDialogs({
  addFormOpen,
  setAddFormOpen,
  handleAddAlarm,
  editFormOpen,
  setEditFormOpen,
  editAlarm,
  setEditAlarm,
  handleEditAlarm,
  deleteFormOpen,
  setDeleteFormOpen,
  alarmToDelete,
  handleDeleteAlarm,
}) {
  return (
    <>
      <AddAlarmForm
        open={addFormOpen}
        setOpen={setAddFormOpen}
        handleAddAlarm={handleAddAlarm}
      />
      <EditAlarmForm
        open={editFormOpen}
        setOpen={setEditFormOpen}
        editAlarm={editAlarm}
        setEditAlarm={setEditAlarm}
        handleEditAlarm={handleEditAlarm}
      />
      <DeleteAlarmForm
        open={deleteFormOpen}
        setOpen={setDeleteFormOpen}
        alarmToDelete={alarmToDelete}
        handleDeleteAlarm={handleDeleteAlarm}
      />
    </>
  );
}
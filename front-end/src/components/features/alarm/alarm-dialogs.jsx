import AddAlarmForm from "@/components/custom/forms/alarm/add-alarm-form";
import EditAlarmForm from "@/components/custom/forms/alarm/edit-alarm-form";
import DeleteAlarmForm from "@/components/custom/forms/alarm/delete-alarm-form";

export default function AlarmDialogs({
  devices,
  datastreams,
  loadingDevices,
  loadingDatastreams,
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
  isMobile,
}) {
  return (
    <>
      <AddAlarmForm
        open={addFormOpen}
        setOpen={setAddFormOpen}
        handleAddAlarm={handleAddAlarm}
        devices={devices}
        datastreams={datastreams}
        loadingDevices={loadingDevices}
        loadingDatastreams={loadingDatastreams}
        isMobile={isMobile}
      />
      <EditAlarmForm
        open={editFormOpen}
        setOpen={setEditFormOpen}
        editAlarm={editAlarm}
        setEditAlarm={setEditAlarm}
        handleEditAlarm={handleEditAlarm}
        devices={devices}
        datastreams={datastreams}
        loadingDevices={loadingDevices}
        loadingDatastreams={loadingDatastreams}
        isMobile={isMobile}
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
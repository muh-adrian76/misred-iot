// Import form untuk menambah alarm baru
import AddAlarmForm from "@/components/custom/forms/alarm/add-alarm-form";
// Import form untuk mengedit alarm yang sudah ada
import EditAlarmForm from "@/components/custom/forms/alarm/edit-alarm-form";
// Import form untuk menghapus alarm
import DeleteAlarmForm from "@/components/custom/forms/alarm/delete-alarm-form";

// Komponen yang mengelola semua dialog/modal untuk alarm management
export default function AlarmDialogs({
  devices, // Data devices untuk pilihan dalam form
  datastreams, // Data datastreams untuk pilihan dalam form
  loadingDevices, // Status loading devices
  loadingDatastreams, // Status loading datastreams
  addFormOpen, // State apakah dialog tambah alarm terbuka
  setAddFormOpen, // Setter untuk dialog tambah alarm
  handleAddAlarm, // Handler untuk menambah alarm baru
  editFormOpen, // State apakah dialog edit alarm terbuka
  setEditFormOpen, // Setter untuk dialog edit alarm
  editAlarm, // Alarm yang dipilih untuk diedit
  setEditAlarm, // Setter untuk alarm yang akan diedit
  handleEditAlarm, // Handler untuk mengedit alarm
  deleteFormOpen, // State apakah dialog hapus alarm terbuka
  setDeleteFormOpen, // Setter untuk dialog hapus alarm
  alarmToDelete, // Alarm yang akan dihapus
  handleDeleteAlarm, // Handler untuk menghapus alarm
  setSelectedRows, // Setter untuk clear selected rows di table
  isMobile, // Status apakah dalam mode mobile
}) {
  return (
    <>
      {/* Dialog untuk menambah alarm baru */}
      <AddAlarmForm
        open={addFormOpen}
        setOpen={setAddFormOpen}
        handleAddAlarm={handleAddAlarm}
        devices={devices} // Data devices untuk dropdown
        datastreams={datastreams} // Data datastreams untuk dropdown
        loadingDevices={loadingDevices} // Loading state devices
        loadingDatastreams={loadingDatastreams} // Loading state datastreams
        isMobile={isMobile} // Mode mobile untuk responsive
      />
      {/* Dialog untuk mengedit alarm yang sudah ada */}
      <EditAlarmForm
        open={editFormOpen}
        setOpen={setEditFormOpen}
        editAlarm={editAlarm} // Data alarm yang akan diedit
        setEditAlarm={setEditAlarm} // Setter untuk update data alarm
        handleEditAlarm={handleEditAlarm}
        devices={devices} // Data devices untuk dropdown
        datastreams={datastreams} // Data datastreams untuk dropdown
        loadingDevices={loadingDevices} // Loading state devices
        loadingDatastreams={loadingDatastreams} // Loading state datastreams
        isMobile={isMobile} // Mode mobile untuk responsive
      />
      {/* Dialog untuk menghapus alarm */}
      <DeleteAlarmForm
        open={deleteFormOpen}
        setOpen={setDeleteFormOpen}
        alarmToDelete={alarmToDelete}
        handleDeleteAlarm={handleDeleteAlarm}
        setSelectedRows={setSelectedRows}
      />
    </>
  );
}
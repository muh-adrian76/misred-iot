import AddDatastreamForm from "@/components/custom/forms/datastream/add-datastream-form";
import EditDatastreamForm from "@/components/custom/forms/datastream/edit-datastream-form";
import DeleteDatastreamForm from "@/components/custom/forms/datastream/delete-datastream-form";

// Komponen yang mengelola seluruh dialog/modal untuk fitur Datastream
export default function DatastreamDialogs({
  datastreams = [], // Daftar datastream untuk referensi
  devices = [], // Daftar perangkat untuk pemilihan device
  usedPinsPerDevice, // Pin yang sudah digunakan per device
  addFormOpen, // Status dialog tambah datastream
  setAddFormOpen, // Setter dialog tambah datastream
  handleAddDatastream, // Handler tambah datastream
  editFormOpen, // Status dialog edit datastream
  setEditFormOpen, // Setter dialog edit datastream
  editDatastream, // Datastream yang dipilih untuk diedit
  setEditDatastream, // Setter datastream yang akan diedit
  handleEditDatastream, // Handler simpan perubahan datastream
  deleteFormOpen, // Status dialog hapus datastream
  setDeleteFormOpen, // Setter dialog hapus datastream
  datastreamToDelete, // Datastream yang akan dihapus
  handleDeleteDatastream, // Handler hapus datastream
  deleteChecked, // Status konfirmasi hapus
  setDeleteChecked, // Setter konfirmasi hapus
  setSelectedRows, // Setter untuk reset pilihan baris pada tabel
  unitOptions, // Opsi satuan yang tersedia
  decimalOptions, // Opsi format desimal untuk tipe double
  isMobile, // Status mode mobile untuk responsivitas
}) {
  return (
    <>
      {/* Dialog tambah datastream */}
      <AddDatastreamForm
        open={addFormOpen}
        setOpen={setAddFormOpen}
        handleAddDatastream={handleAddDatastream}
        unitOptions={unitOptions}
        datastreams={datastreams}
        devices={devices}
        usedPins={usedPinsPerDevice}
        decimalOptions={decimalOptions}
        isMobile={isMobile}
      />

      {/* Dialog edit datastream */}
      <EditDatastreamForm
        open={editFormOpen}
        setOpen={setEditFormOpen}
        editDatastream={editDatastream}
        setEditDatastream={setEditDatastream}
        handleEditDatastream={handleEditDatastream}
        unitOptions={unitOptions}
        datastreams={datastreams}
        devices={devices}
        usedPins={usedPinsPerDevice}
        decimalOptions={decimalOptions}
        isMobile={isMobile}
      />

      {/* Dialog hapus datastream */}
      <DeleteDatastreamForm
        open={deleteFormOpen}
        setOpen={setDeleteFormOpen}
        datastream={datastreamToDelete}
        handleDeleteDatastream={handleDeleteDatastream}
        deleteChecked={deleteChecked}
        setDeleteChecked={setDeleteChecked}
        setSelectedRows={setSelectedRows}
      />
    </>
  );
}

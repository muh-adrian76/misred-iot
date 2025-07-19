import AddDatastreamForm from "@/components/custom/forms/datastream/add-datastream-form";
import EditDatastreamForm from "@/components/custom/forms/datastream/edit-datastream-form";
import DeleteDatastreamForm from "@/components/custom/forms/datastream/delete-datastream-form";

export default function DatastreamDialogs({
  datastreams = [],
  devices = [],
  usedPinsPerDevice,
  addFormOpen,
  setAddFormOpen,
  handleAddDatastream,
  editFormOpen,
  setEditFormOpen,
  editDatastream,
  setEditDatastream,
  handleEditDatastream,
  deleteFormOpen,
  setDeleteFormOpen,
  datastreamToDelete,
  handleDeleteDatastream,
  deleteChecked,
  setDeleteChecked,
  setSelectedRows,
  unitOptions,
  decimalOptions,
  isMobile,
}) {

  return (
    <>
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

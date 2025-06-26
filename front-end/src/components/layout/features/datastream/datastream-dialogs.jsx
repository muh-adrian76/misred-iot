import AddDatastreamForm from "@/components/custom/forms/datastream/add-datastream-form";
import EditDatastreamForm from "@/components/custom/forms/datastream/edit-datastream-form";
import DeleteDatastreamForm from "@/components/custom/forms/datastream/delete-datastream-form";

export default function DatastreamDialogs({
  datastreams,
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
}) {
  // Contoh satuan, bisa ditambah sesuai kebutuhan
  const UNIT_OPTIONS = [
    { label: "pH", value: "pH" },
    { label: "Milligram per Liter, mg/L", value: "mg/L" },
    { label: "Liter per second, L/s", value: "L/s" },
    { label: "Foot, ft", value: "ft" },
    { label: "Yard, yd", value: "yd" },
    { label: "Mile, mi", value: "mi" },
    { label: "Square Feet, sq ft", value: "sqft" },
    { label: "Millimeter, mm", value: "mm" },
    { label: "Centimeter, cm", value: "cm" },
    { label: "Meter, m", value: "m" },
    { label: "Inch, in", value: "in" },
    { label: "Degree Celsius, °C", value: "°C" },
    { label: "Degree Fahrenheit, °F", value: "°F" },
  ];

  return (
    <>
      <AddDatastreamForm
        open={addFormOpen}
        setOpen={setAddFormOpen}
        handleAddDatastream={handleAddDatastream}
        unitOptions={UNIT_OPTIONS}
        datastreams={datastreams}
      />
      <EditDatastreamForm
        open={editFormOpen}
        setOpen={setEditFormOpen}
        datastreamData={editDatastream}
        setEditDatastream={setEditDatastream}
        handleEditDatastream={handleEditDatastream}
        unitOptions={UNIT_OPTIONS}
        datastreams={datastreams}
      />
      <DeleteDatastreamForm
        open={deleteFormOpen}
        setOpen={setDeleteFormOpen}
        datastream={datastreamToDelete}
        handleDeleteDatastream={handleDeleteDatastream}
        deleteChecked={deleteChecked}
        setDeleteChecked={setDeleteChecked}
      />
    </>
  );
}

import ConfirmDialog from "@/components/custom/dialogs/confirm-dialog";
import CheckboxButton from "../../buttons/checkbox-button";

export default function DeleteDatastreamForm({
  open,
  setOpen,
  datastream,
  handleDeleteDatastream,
  deleteChecked,
  setDeleteChecked,
  setSelectedRows,
}) {
  const handleDelete = async () => {
    if (Array.isArray(datastream)) {
      for (const ds of datastream) {
        await handleDeleteDatastream(ds.id);
      }
    } else if (datastream) {
      await handleDeleteDatastream(datastream.id);
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
        Array.isArray(datastream) && datastream.length === 1 ? (
          <>
            Hapus datastream{" "}
            <i>{datastream[0].description || datastream[0].pin || ""}</i> ?
          </>
        ) : Array.isArray(datastream) && datastream.length > 1 ? (
          <>Hapus {datastream.length} datastream terpilih ?</>
        ) : (
          datastream && (
            <>
              Hapus datastream <i>{datastream.description}</i> ?
            </>
          )
        )
      }
      description="Tindakan ini tidak dapat dibatalkan."
      checkbox={
        <CheckboxButton
          id="deleteDatastreamCheckbox"
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

import ConfirmDialog from "@/components/custom/other/confirm-dialog";
import CheckboxButton from "../../buttons/checkbox-button";
import { useState } from "react";

export default function DeleteDatastreamForm({
  open,
  setOpen,
  datastream,
  handleDeleteDatastream,
  deleteChecked,
  setDeleteChecked,
}) {

  const handleDelete = async () => {
    await handleDeleteDatastream(datastream.id);
    setOpen(false);
    setDeleteChecked(false);
  };

  return (
    <ConfirmDialog
      open={open}
      setOpen={setOpen}
      title={
        datastream ? (
          <>
            Hapus datastream <i>"{datastream.description || datastream.pin}"</i>?
          </>
        ) : (
          ""
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
// Komponen Dialog Admin OTAA - dialog/modal untuk manajemen firmware
// Fitur: dialog konfirmasi hapus
"use client";

import DeleteOTAAForm from "@/components/custom/forms/admin/otaa/delete-otaa-form";

export default function AdminOTAADialogs({
  // State dialog hapus
  deleteDialogOpen,
  setDeleteDialogOpen,
  firmwareToDelete,
  handleDeleteConfirm,
  handleDeleteCancel,
}) {
  return (
    <>
      {/* Dialog Konfirmasi Hapus */}
      <DeleteOTAAForm
        deleteDialogOpen={deleteDialogOpen}
        setDeleteDialogOpen={setDeleteDialogOpen}
        firmwareToDelete={firmwareToDelete}
        handleDeleteConfirm={handleDeleteConfirm}
        handleDeleteCancel={handleDeleteCancel}
      />
    </>
  );
}

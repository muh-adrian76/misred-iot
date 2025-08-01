// Admin OTAA Dialogs Component - modal dialogs untuk firmware management
// Features: delete confirmation dialog
"use client";

import DeleteOTAAForm from "@/components/custom/forms/admin/otaa/delete-otaa-form";

export default function AdminOTAADialogs({
  // Delete dialog state
  deleteDialogOpen,
  setDeleteDialogOpen,
  firmwareToDelete,
  handleDeleteConfirm,
  handleDeleteCancel,
}) {
  return (
    <>
      {/* Delete Confirmation Dialog */}
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

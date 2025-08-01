// Delete OTAA Form Component - confirmation dialog untuk hapus firmware
// Features: firmware info display, confirmation buttons
"use client";

import ConfirmDialog from "@/components/custom/dialogs/confirm-dialog";

export default function DeleteOTAAForm({
  // Delete dialog state
  deleteDialogOpen,
  setDeleteDialogOpen,
  firmwareToDelete,
  handleDeleteConfirm,
  handleDeleteCancel,
}) {
  return (
    <ConfirmDialog
      open={deleteDialogOpen}
      setOpen={setDeleteDialogOpen}
      title={
        firmwareToDelete ? (
          <>
            Hapus firmware <i>"{firmwareToDelete.firmware_url?.split('/').pop()}"</i> ?
          </>
        ) : (
          "Hapus firmware"
        )
      }
      description={
        firmwareToDelete ? (
          <>
            <div className="space-y-2 text-left">
              <p>
                Firmware <strong>{firmwareToDelete.firmware_url?.split('/').pop()}</strong> akan dihapus secara permanen.
              </p>
              <div className="p-3 bg-muted rounded-md space-y-1 text-sm">
                <p><strong>Board Type:</strong> {firmwareToDelete.board_type}</p>
                <p><strong>Versi:</strong> {firmwareToDelete.firmware_version}</p>
                <p><strong>User ID:</strong> {firmwareToDelete.user_id}</p>
              </div>
              <p className="text-destructive font-medium">
                ⚠️ File fisik dan data database akan dihapus. Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
          </>
        ) : (
          "Tindakan ini tidak dapat dibatalkan."
        )
      }
      confirmHandle={handleDeleteConfirm}
      cancelHandle={handleDeleteCancel}
      confirmText="Hapus"
      cancelText="Batal"
      confirmDisabled={false}
    />
  );
}

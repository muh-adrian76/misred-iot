import ConfirmDialog from "@/components/custom/dialogs/confirm-dialog";
import CheckboxButton from "../../../buttons/checkbox-button";

export default function DeleteUserForm({
  open,
  setOpen,
  userToDelete,
  handleDeleteUser,
  deleteChecked,
  setDeleteChecked,
  setSelectedRows,
}) {
  const handleDelete = async () => {
    if (Array.isArray(userToDelete)) {
  // Hapus beberapa pengguna sekaligus
      for (const user of userToDelete) {
        await handleDeleteUser(user.id);
      }
    } else if (userToDelete) {
  // Hapus satu pengguna
      await handleDeleteUser(userToDelete.id);
    }
    setOpen(false);
    if (setSelectedRows) {
      setSelectedRows([]);
    }
    setDeleteChecked(false);
  };

  // Tentukan judul berdasarkan jumlah pengguna yang dihapus
  const getTitle = () => {
    if (Array.isArray(userToDelete) && userToDelete.length === 1) {
      return (
        <>
          Hapus pengguna <i>{userToDelete[0].name || userToDelete[0].email}</i> ?
        </>
      );
    } else if (Array.isArray(userToDelete) && userToDelete.length > 1) {
      return <>Hapus {userToDelete.length} pengguna terpilih ?</>;
    } else if (userToDelete) {
      return (
        <>
          Hapus pengguna <i>{userToDelete.name || userToDelete.email}</i> ?
        </>
      );
    }
    return "Hapus pengguna ?";
  };

  return (
    <ConfirmDialog
      open={open}
      setOpen={setOpen}
      title={getTitle()}
  description="Semua data yang berkaitan dengan pengguna ini juga akan dihapus. Tindakan ini tidak dapat dibatalkan."
      checkbox={
        <CheckboxButton
          id="deleteUserCheckbox"
          text="Saya mengerti konsekuensinya."
          checked={deleteChecked}
          onChange={(e) => setDeleteChecked(e.target.checked)}
        />
      }
      confirmHandle={handleDelete}
      confirmDisabled={!deleteChecked}
  confirmText="Hapus Pengguna"
      cancelText="Batal"
    />
  );
}

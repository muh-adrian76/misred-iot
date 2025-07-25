import ConfirmDialog from "@/components/custom/dialogs/confirm-dialog";
import CheckboxButton from "../../buttons/checkbox-button";

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
      // Handle multiple users deletion
      for (const user of userToDelete) {
        await handleDeleteUser(user.id);
      }
    } else if (userToDelete) {
      // Handle single user deletion
      await handleDeleteUser(userToDelete.id);
    }
    setOpen(false);
    if (setSelectedRows) {
      setSelectedRows([]);
    }
    setDeleteChecked(false);
  };

  // Determine title and description based on single or multiple users
  const getTitle = () => {
    if (Array.isArray(userToDelete) && userToDelete.length === 1) {
      return (
        <>
          Hapus user <i>{userToDelete[0].name || userToDelete[0].email}</i> ?
        </>
      );
    } else if (Array.isArray(userToDelete) && userToDelete.length > 1) {
      return <>Hapus {userToDelete.length} user terpilih ?</>;
    } else if (userToDelete) {
      return (
        <>
          Hapus user <i>{userToDelete.name || userToDelete.email}</i> ?
        </>
      );
    }
    return "Hapus user ?";
  };

  return (
    <ConfirmDialog
      open={open}
      setOpen={setOpen}
      title={getTitle()}
      description="Semua data yang berkaitan dengan user ini juga akan dihapus. Tindakan ini tidak dapat dibatalkan."
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
      confirmText="Hapus User"
      cancelText="Batal"
    />
  );
}

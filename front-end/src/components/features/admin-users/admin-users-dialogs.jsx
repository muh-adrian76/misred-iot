// Import form untuk menambah user baru
import AddUserForm from "@/components/custom/forms/admin/users/add-user-form";
// Import form untuk mengedit user yang sudah ada
import EditUserForm from "@/components/custom/forms/admin/users/edit-user-form";
// Import form untuk menghapus user
import DeleteUserForm from "@/components/custom/forms/admin/users/delete-user-form";

// Komponen yang mengelola semua dialog/modal untuk admin users
export default function AdminUsersDialogs({
  addUserOpen, // State apakah dialog tambah user terbuka
  setAddUserOpen, // Setter untuk dialog tambah user
  handleAddUser, // Handler untuk menambah user baru
  editUserOpen, // State apakah dialog edit user terbuka
  setEditUserOpen, // Setter untuk dialog edit user
  selectedUser, // User yang dipilih untuk diedit
  handleEditUser, // Handler untuk mengedit user
  deleteUserOpen, // State apakah dialog hapus user terbuka
  setDeleteUserOpen, // Setter untuk dialog hapus user
  userToDelete, // User yang akan dihapus
  handleDeleteUser, // Handler untuk menghapus user
  deleteChecked, // State konfirmasi hapus
  setDeleteChecked, // Setter untuk konfirmasi hapus
  setSelectedRows, // Setter untuk reset selected rows setelah operasi
}) {
  return (
    <>
      {/* Dialog untuk menambah user baru */}
      <AddUserForm
        open={addUserOpen}
        setOpen={setAddUserOpen}
        handleAddUser={handleAddUser}
      />
      
      {/* Dialog untuk mengedit user yang sudah ada */}
      <EditUserForm
        open={editUserOpen}
        setOpen={setEditUserOpen}
        editUser={selectedUser}
        handleEditUser={handleEditUser}
      />
      
      {/* Dialog untuk menghapus user */}
      <DeleteUserForm
        open={deleteUserOpen}
        setOpen={setDeleteUserOpen}
        userToDelete={userToDelete}
        handleDeleteUser={handleDeleteUser}
        deleteChecked={deleteChecked}
        setDeleteChecked={setDeleteChecked}
        setSelectedRows={setSelectedRows}
      />
    </>
  );
}

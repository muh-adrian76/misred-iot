import AddUserForm from "@/components/custom/forms/admin/add-user-form";
import EditUserForm from "@/components/custom/forms/admin/edit-user-form";
import DeleteUserForm from "@/components/custom/forms/admin/delete-user-form";

export default function AdminUsersDialogs({
  addUserOpen,
  setAddUserOpen,
  handleAddUser,
  editUserOpen,
  setEditUserOpen,
  selectedUser,
  handleEditUser,
  deleteUserOpen,
  setDeleteUserOpen,
  userToDelete,
  handleDeleteUser,
  deleteChecked,
  setDeleteChecked,
  setSelectedRows,
}) {
  return (
    <>
      <AddUserForm
        open={addUserOpen}
        setOpen={setAddUserOpen}
        handleAddUser={handleAddUser}
      />
      
      <EditUserForm
        open={editUserOpen}
        setOpen={setEditUserOpen}
        editUser={selectedUser}
        handleEditUser={handleEditUser}
      />
      
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

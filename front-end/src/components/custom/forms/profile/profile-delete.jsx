import ConfirmDialog from "../../other/confirm-dialog";
import CheckboxButton from "../../buttons/checkbox-button";
import showToast from "../../other/toaster";
import { fetchFromBackend } from "@/lib/helper";

export default function ProfileDeleteDialog({
  open,
  setOpen,
  deleteChecked,
  setDeleteChecked,
  router,
}) {
  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    const checkbox = document.getElementById("deleteAccountCheckbox");
    if (!checkbox.checked) {
      showToast(
        "warning",
        "Anda harus mencentang kotak untuk mengonfirmasi penghapusan akun!"
      );
      return null;
    }
    try {
      const res = await fetchFromBackend("/user", {
        method: "DELETE",
      });

      if (!res.ok) {
        showToast("warning", "Gagal menghapus akun!");
      } else {
        showToast("success", "Akun berhasil dihapus!");
        router.push("/auth");
      }
    } catch (error) {
      showToast(
        "error",
        "Terjadi kesalahan, coba lagi nanti!",
        `${error.message}`
      );
    }
  };

  return (
    <ConfirmDialog
      open={open}
      setOpen={(val) => {
        setOpen(val);
        if (!val) setDeleteChecked(false); // reset saat dialog ditutup
      }}
      title="Apakah Anda yakin?"
      description="Akun Anda akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan."
      checkbox={
        <CheckboxButton
          id="deleteAccountCheckbox"
          text="Saya mengerti konsekuensinya."
          checked={deleteChecked}
          onChange={(e) => setDeleteChecked(e.target.checked)}
        />
      }
      confirmHandle={handleDeleteAccount}
      confirmText="Hapus akun saya"
      cancelText="Batalkan"
      confirmDisabled={!deleteChecked}
    />
  );
}
// Import komponen dialog konfirmasi untuk aksi delete
import ConfirmDialog from "../../dialogs/confirm-dialog";
// Import checkbox button untuk konfirmasi user
import CheckboxButton from "../../buttons/checkbox-button";
// Import toaster untuk notifications
import { successToast, errorToast } from "../../other/toaster";
// Import helper function untuk API calls
import { fetchFromBackend } from "@/lib/helper";

// Komponen ProfileDeleteDialog untuk menghapus akun pengguna secara permanen
export default function ProfileDeleteDialog({
  open, // State untuk kontrol visibility dialog
  setOpen, // Setter untuk mengubah state dialog
  deleteChecked, // State checkbox konfirmasi user
  setDeleteChecked, // Setter untuk checkbox konfirmasi
  router, // Next.js router untuk navigasi setelah delete
}) {
  // Handler untuk hapus akun dengan konfirmasi ganda
  const handleDeleteAccount = async (e) => {
    e.preventDefault(); // Prevent default form submission

  // Validasi ulang checkbox konfirmasi
    const checkbox = document.getElementById("deleteAccountCheckbox");
    if (!checkbox.checked) {
      errorToast(
        "Anda harus mencentang kotak untuk mengonfirmasi penghapusan akun!" // Error message
      );
      return null; // Stop execution jika user belum confirm
    }

    try {
  // API call untuk hapus akun pengguna
      const res = await fetchFromBackend("/user/", {
        method: "DELETE", // HTTP method DELETE untuk hapus account
      });
      const data = await res.json(); // Parse response JSON
      if (!res.ok) {
        throw new Error(data.message || "Gagal menghapus akun!"); // Handle error jika response tidak ok
      } else {
        // Jika berhasil dihapus, redirect ke auth page
        successToast("Akun berhasil dihapus!"); // Success notification
        router.push("/auth"); // Redirect ke halaman auth/login
      }
    } catch (error) {
      // Handle error jika ada masalah dengan network atau server
      errorToast("Gagal menghapus akun!", error.message); // Error notification
    }
  };

  // Render ConfirmDialog dengan warning message dan checkbox konfirmasi
  return (
    <ConfirmDialog
      open={open} // State visibility dialog
      setOpen={(val) => {
        setOpen(val); // Update dialog state
        if (!val) setDeleteChecked(false); // Reset checkbox saat dialog ditutup untuk security
      }}
      title="Apakah Anda yakin?" // Title dialog yang menunjukkan tingkat seriusnya aksi
      description="Akun Anda akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan." // Warning description
      checkbox={
        // Checkbox konfirmasi untuk memastikan user memahami konsekuensi
        <CheckboxButton
          id="deleteAccountCheckbox"
          text="Saya mengerti konsekuensinya." // Confirmation text
          checked={deleteChecked} // Current state checkbox
          onChange={(e) => setDeleteChecked(e.target.checked)} // Update checkbox state
        />
      }
      confirmHandle={handleDeleteAccount} // Function yang dipanggil saat confirm delete
      confirmText="Hapus akun saya" // Button text untuk konfirmasi delete (wording yang jelas)
      cancelText="Batalkan" // Button text untuk cancel
      confirmDisabled={!deleteChecked} // Disable confirm button sampai user check box
    />
  );
}

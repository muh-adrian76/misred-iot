// Import UI components untuk form inputs
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
// Import icons untuk UI elements
import { UserPen, ShieldUser, Undo2, MessageCircle } from "lucide-react";
// Import helper functions untuk date conversion dan API calls
import { convertDate, fetchFromBackend } from "@/lib/helper";
// Import toaster untuk notifications
import { successToast, errorToast } from "../../other/toaster";
import DescriptionTooltip from "./../../other/description-tooltip";

// Komponen ProfileInfoSection untuk mengedit informasi dasar profil user
export default function ProfileInfoSection({
  user, // Data user yang sedang login
  username, // State nama user untuk editing
  setUsername, // Setter untuk update nama user
  phoneNumber, // State nomor telepon user
  setPhoneNumber, // Setter untuk update nomor telepon
  whatsappNotif, // State setting notifikasi WhatsApp
  setWhatsappNotif, // Setter untuk toggle notifikasi WhatsApp
  isEditing, // State mode editing (true/false)
  setIsEditing, // Setter untuk toggle mode editing
  setOpenDeleteAccountDialog, // Setter untuk buka modal delete account
  setUser, // Setter untuk update user data di parent component
}) {
  // Handler untuk update informasi profil user
  const handleUpdateAccount = async (e) => {
    e.preventDefault(); // Prevent default form submission
    try {
      // Payload data yang akan dikirim ke backend
      const payload = {
        name: username, // Nama user yang sudah diedit
        phone: phoneNumber || "", // Nomor telepon (kosong jika tidak diisi)
        whatsapp_notif: whatsappNotif, // Setting notifikasi WhatsApp
      };

      // API call untuk update profil user
      const res = await fetchFromBackend("/user/", {
        method: "PUT", // HTTP method PUT untuk update
        body: JSON.stringify(payload), // Convert payload to JSON string
      });

      if (!res.ok) {
        errorToast("Gagal mengubah profil!"); // Error notification
      } else {
        // Jika berhasil, update user data di state parent
        const updatedUser = await res.json();
        setUser((prevUser) => ({
          ...prevUser, // Spread existing user data
          ...updatedUser, // Override dengan data yang baru
        }));

        // Dispatch custom event untuk notify komponen lain tentang perubahan WhatsApp status
        window.dispatchEvent(
          new CustomEvent("whatsapp-status-updated", {
            detail: { whatsappEnabled: whatsappNotif }, // Data untuk event listener
          })
        );

        successToast("Berhasil mengubah profil!"); // Success notification
      }
    } catch (error) {
      // Handle error jika ada masalah dengan network atau server
      errorToast("Terjadi kesalahan, coba lagi nanti!", `${error.message}`);
    } finally {
      setIsEditing(false); // Exit editing mode setelah selesai
    }
  };

  // Handler untuk reset form ke data asli user (batalkan perubahan)
  const handleResetProfile = () => {
    setUsername(user?.name || ""); // Reset nama ke data asli
    setPhoneNumber(user?.phone || ""); // Reset telepon ke data asli
    setWhatsappNotif(user?.whatsapp_notif || false); // Reset WhatsApp setting ke data asli
    setIsEditing(false); // Exit editing mode
  };

  return (
    <>
      {/* Section informasi profil user dengan form fields */}
      <div className="space-y-4 w-full mb-6 text-sm">
        {/* Field Nama User */}
        <div className="flex flex-col gap-2">
          <p className="font-semibold">Nama:</p>
          <Input
            id="username"
            type="text"
            placeholder={user.name} // Placeholder dengan nama user saat ini
            value={username} // Controlled input dengan state
            className="text-foreground"
            onChange={(e) => setUsername(e.target.value)} // Update state saat typing
            disabled={!isEditing} // Disable jika tidak dalam mode editing
            required // Field wajib diisi
          />
        </div>

        {/* Field Email User (read-only) */}
        <div className="flex flex-col gap-2">
          <p className="font-semibold">Email:</p>
          <p className="ml-2">{user.email}</p> {/* Email tidak bisa diedit */}
        </div>

        {/* Field Nomor Telepon */}
        <div className="flex flex-col gap-2">
          <p className="font-semibold">No. Telepon:</p>
          <Input
            id="phone"
            type="number" // Input type number untuk nomor telepon
            maxLength="15" // Maksimal 15 digit
            minLength="10" // Minimal 10 digit
            placeholder={user.phone ? user.phone : "Belum ditambahkan"} // Dynamic placeholder
            value={phoneNumber} // Controlled input dengan state
            className="text-foreground"
            onChange={(e) => setPhoneNumber(e.target.value)} // Update state saat typing
            disabled={!isEditing} // Disable jika tidak dalam mode editing
            noInfo // No info icon untuk input ini
          />
        </div>

        {/* Section WhatsApp Notification Toggle dengan conditional styling */}
        <div
          className={`flex items-center justify-between gap-3 p-4 border rounded-lg transition-colors ${
            phoneNumber
              ? "bg-green-50/30 border-green-200/50"
              : "bg-gray-50/30 border-gray-200/50 "
          }`}
        >
          <div className="flex items-center gap-3">
            {/* Icon WhatsApp dengan conditional styling */}
            <div
              className={`p-2 rounded-full ${
                phoneNumber ? "bg-green-100" : "bg-gray-100"
              }`}
            >
              <MessageCircle
                className={`w-5 h-5 ${
                  phoneNumber ? "text-green-600" : "text-gray-500"
                }`}
              />
            </div>
            <div>
              <p
                className={`font-semibold ${
                  phoneNumber
                    ? "text-green-800 dark:text-green-300"
                    : "text-gray-700 dark:text-white"
                }`}
              >
                Notifikasi WhatsApp
              </p>
              <p
                className={`text-xs ${
                  phoneNumber
                    ? "text-green-600 dark:text-green-400"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {/* Dynamic description berdasarkan apakah nomor telepon sudah diisi */}
                {
                  phoneNumber
                    ? `Gunakan nomor ${phoneNumber} untuk menerima notifikasi alarm` // Jika ada nomor
                    : "Tambahkan nomor telepon untuk mengaktifkan notifikasi WhatsApp" // Jika belum ada nomor
                }
              </p>
            </div>
          </div>
          {/* Switch untuk toggle notifikasi WhatsApp */}
          <Switch
            variant="whatsapp" // Custom variant untuk WhatsApp styling
            checked={whatsappNotif && !!phoneNumber} // Hanya aktif jika ada nomor telepon dan setting enabled
            onCheckedChange={(checked) => {
              if (phoneNumber) {
                setWhatsappNotif(checked); // Update setting hanya jika ada nomor telepon
              }
            }}
            disabled={!isEditing || !phoneNumber} // Disable jika tidak editing atau belum ada nomor
          />
        </div>

        {/* Section informasi akun read-only */}
        <div className="flex flex-col gap-2">
          <p className="font-semibold">Tanggal Pembuatan Akun:</p>
          <p className="ml-2">{convertDate(user.created_at)}</p>{" "}
          {/* Format tanggal dengan helper function */}
        </div>
        <div className="flex flex-col gap-2">
          <p className="font-semibold">Log In Terakhir:</p>
          <p className="ml-2">{convertDate(user.last_login)}</p>{" "}
          {/* Format tanggal dengan helper function */}
        </div>
      </div>

      {/* Section action buttons dengan dynamic behavior */}
      <div className="flex gap-4 justify-center">
        {/* Button utama - Edit/Simpan */}
        <Button
          size="lg"
          type="submit"
          variant="outline"
          className="rounded-lg cursor-pointer transition-all duration-500"
          onClick={isEditing ? handleUpdateAccount : () => setIsEditing(true)} // Toggle antara edit dan save
        >
          {isEditing ? "Simpan" : "Edit"} {/* Dynamic text berdasarkan mode */}
          <UserPen className="h-5 w-5" /> {/* Icon edit */}
        </Button>

        {/* Button sekunder - Batalkan/Hapus Akun */}
        <DescriptionTooltip className={isEditing ? "hidden" : ""} content="Sementara dinonaktifkan saat kuisioner berlangsung.">
          <div>
            <Button
              size="lg"
              variant={isEditing ? "outline" : "default"} // Dynamic variant berdasarkan mode
              className="rounded-lg cursor-pointer transition-all duration-500"
              onClick={
                isEditing
                  ? handleResetProfile // Jika editing, batalkan perubahan
                  : () => setOpenDeleteAccountDialog(true) // Jika tidak editing, buka modal hapus akun
              }
              disabled={!isEditing}
            >
              {isEditing ? "Batalkan" : "Hapus Akun"}{" "}
              {/* Dynamic text berdasarkan mode */}
              {/* Dynamic icon berdasarkan mode */}
              {isEditing ? (
                <Undo2 className="h-5 w-5" /> // Icon undo untuk batalkan
              ) : (
                <ShieldUser className="h-5 w-5" /> // Icon shield untuk hapus akun
              )}
            </Button>
          </div>
        </DescriptionTooltip>
      </div>
    </>
  );
}

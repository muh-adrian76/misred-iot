import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { UserPen, ShieldUser, Undo2, MessageCircle } from "lucide-react";
import { convertDate, fetchFromBackend } from "@/lib/helper";
import { successToast, errorToast } from "../../other/toaster";

export default function ProfileInfoSection({
  user,
  username,
  setUsername,
  phoneNumber,
  setPhoneNumber,
  whatsappNotif,
  setWhatsappNotif,
  isEditing,
  setIsEditing,
  setOpenDeleteAccountDialog,
  setUser,
}) {
  const handleUpdateAccount = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: username,
        phone: phoneNumber || "",
        whatsapp_notif: whatsappNotif,
      };
      const res = await fetchFromBackend("/user", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        errorToast("Gagal mengubah profil!");
      } else {
        const updatedUser = await res.json();
        setUser((prevUser) => ({
          ...prevUser,
          ...updatedUser,
        }));
        
        // Dispatch custom event to notify other components about WhatsApp status change
        window.dispatchEvent(new CustomEvent('whatsapp-status-updated', {
          detail: { whatsappEnabled: whatsappNotif }
        }));
        
        successToast("Berhasil mengubah profil!");
      }
    } catch (error) {
      errorToast("Terjadi kesalahan, coba lagi nanti!", `${error.message}`);
    } finally {
      setIsEditing(false);
    }
  };

  const handleResetProfile = () => {
    setUsername(user?.name || "");
    setPhoneNumber(user?.phone || "");
    setWhatsappNotif(user?.whatsapp_notif || false);
    setIsEditing(false);
  };

  return (
    <>
      <div className="space-y-4 w-full mb-6 text-sm">
        <div className="flex flex-col gap-2">
          <p className="font-semibold">Nama:</p>
          <Input
            id="username"
            type="text"
            placeholder={user.name}
            value={username}
            className="text-foreground"
            onChange={(e) => setUsername(e.target.value)}
            disabled={!isEditing}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <p className="font-semibold">Email:</p>
          <p className="ml-2">{user.email}</p>
        </div>
        <div className="flex flex-col gap-2">
          <p className="font-semibold">No. Telepon:</p>
          <Input
            id="phone"
            type="number"
            maxLength="15"
            minLength="10"
            placeholder={user.phone ? user.phone : "Belum ditambahkan"}
            value={phoneNumber}
            className="text-foreground"
            onChange={(e) => setPhoneNumber(e.target.value)}
            disabled={!isEditing}
            noInfo
          />
        </div>

        {/* WhatsApp Notification Switch */}
        <div className={`flex items-center justify-between gap-3 p-4 border rounded-lg transition-colors ${
          phoneNumber ? 'bg-green-50/30 border-green-200/50' : 'bg-gray-50/30 border-gray-200/50 '
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${
              phoneNumber ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              <MessageCircle className={`w-5 h-5 ${
                phoneNumber ? 'text-green-600' : 'text-gray-500'
              }`} />
            </div>
            <div>
              <p className={`font-semibold ${
                phoneNumber ? 'text-green-800 dark:text-green-300' : 'text-gray-700 dark:text-white'
              }`}>Notifikasi WhatsApp</p>
              <p className={`text-xs ${
                phoneNumber ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
              }`}>
                {phoneNumber 
                  ? `Gunakan nomor ${phoneNumber} untuk menerima notifikasi alarm`
                  : "Tambahkan nomor telepon untuk mengaktifkan notifikasi WhatsApp"
                }
              </p>
            </div>
          </div>
          <Switch
            variant="whatsapp"
            checked={whatsappNotif && !!phoneNumber}
            onCheckedChange={(checked) => {
              if (phoneNumber) {
                setWhatsappNotif(checked);
              }
            }}
            disabled={!isEditing || !phoneNumber}
          />
        </div>

        <div className="flex flex-col gap-2">
          <p className="font-semibold">Tanggal Pembuatan Akun:</p>
          <p className="ml-2">{convertDate(user.created_at)}</p>
        </div>
        <div className="flex flex-col gap-2">
          <p className="font-semibold">Log In Terakhir:</p>
          <p className="ml-2">{convertDate(user.last_login)}</p>
        </div>
      </div>
      <div className="flex gap-4 justify-center">
        <Button
          size="lg"
          type="submit"
          variant="outline"
          className="rounded-lg cursor-pointer transition-all duration-500"
          onClick={isEditing ? handleUpdateAccount : () => setIsEditing(true)}
        >
          {isEditing ? "Simpan" : "Edit"}
          <UserPen className="h-5 w-5" />
        </Button>
        <Button
          size="lg"
          variant={isEditing ? "outline" : "default"}
          className="rounded-lg cursor-pointer transition-all duration-500"
          onClick={
            isEditing
              ? handleResetProfile // Batalkan edit
              : () => setOpenDeleteAccountDialog(true) // Buka modal hapus akun
          }
        >
          {isEditing ? "Batalkan" : "Hapus Akun"}
          {isEditing ? (
            <Undo2 className="h-5 w-5" />
          ) : (
            <ShieldUser className="h-5 w-5" />
          )}
        </Button>
      </div>
    </>
  );
}

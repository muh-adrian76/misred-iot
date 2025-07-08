import {
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserPen, ShieldUser, Undo2 } from "lucide-react";
import { convertDate, fetchFromBackend } from "@/lib/helper";
import { successToast, errorToast } from "../../other/toaster";

export default function ProfileInfoSection({
  user,
  username,
  setUsername,
  phoneNumber,
  setPhoneNumber,
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
    setIsEditing(false);
  };

  return (
    <AccordionItem
      value="account-info"
      className="bg-card px-4 shadow-2xs rounded-2xl mb-3"
    >
      <AccordionTrigger className="font-semibold">
        Informasi Akun
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-4 p-2 mb-3">
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
            />
          </div>
          <div className="flex flex-col gap-2">
            <p className="font-semibold">Tanggal Pembuatan Akun:</p>
            <p className="ml-2">{convertDate(user.created_at)}</p>
          </div>
          <div className="flex flex-col gap-2">
            <p className="font-semibold">Terakhir Log In:</p>
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
      </AccordionContent>
    </AccordionItem>
  );
}

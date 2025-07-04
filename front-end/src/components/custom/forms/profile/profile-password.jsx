import {
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, UserLock } from "lucide-react";
import { successToast, errorToast } from "../../other/toaster";
import { fetchFromBackend } from "@/lib/helper";

export default function ProfilePasswordSection({
  user,
  showPassword,
  setShowPassword,
  oldPassword,
  setOldPassword,
  newPassword,
  setNewPassword,
}) {
  const handleSavePassword = async (e) => {
    e.preventDefault();

    if (oldPassword === newPassword) {
      errorToast("Password baru tidak boleh sama dengan password lama!");
      return;
    }
    if (newPassword.length < 8) {
      errorToast("Password baru harus memiliki setidaknya 8 karakter!");
      return;
    }
    try {
      const payload = {
        oldPassword: oldPassword,
        newPassword: newPassword,
      };

      const res = await fetchFromBackend("/auth/reset-password", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        errorToast("Gagal mengubah password!", data.message || "");
      } else {
        successToast("Berhasil mengubah password!");
        setOldPassword("");
        setNewPassword("");
      }
    } catch (error) {
      errorToast("Terjadi kesalahan, coba lagi nanti!", `${error.message}`);
    }
  };

  return (
    <AccordionItem
      value="reset-password"
      className="bg-card px-4 shadow-2xs rounded-2xl mb-6"
    >
      <AccordionTrigger className="font-semibold">
        Ganti Kata Sandi
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-4 p-2 text-muted-foreground">
          <form action="#">
            <div className="sr-only">
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={user.email}
                readOnly
              />
            </div>
            <div className="relative flex flex-col gap-3 mb-3">
              <div className="flex gap-2 cursor-pointer hover:text-foreground">
                {showPassword ? (
                  <span
                    onClick={() => setShowPassword(false)}
                    className="flex gap-2"
                  >
                    Sembunyikan Kata Sandi
                    <EyeOff className="relative h-5 w-5" />
                  </span>
                ) : (
                  <span
                    onClick={() => setShowPassword(true)}
                    className="flex gap-2"
                  >
                    Tampilkan Kata Sandi
                    <Eye className="relative h-5 w-5" />
                  </span>
                )}
              </div>
              <Input
                id="old-password"
                type={showPassword ? "text" : "password"}
                placeholder="Masukkan password lama"
                autoComplete="old-password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
              />
              <Input
                id="new-password"
                type={showPassword ? "text" : "password"}
                placeholder="Masukkan password baru"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
          </form>
          <Button
            variant="outline"
            onClick={handleSavePassword}
            className="w-full cursor-pointer transition-all duration-500"
          >
            Simpan Perubahan
            <UserLock className="h-5 w-5" />
          </Button>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

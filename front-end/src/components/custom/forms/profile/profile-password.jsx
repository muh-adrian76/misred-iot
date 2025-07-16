import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, UserLock } from "lucide-react";
import { successToast, errorToast } from "../../other/toaster";
import { fetchFromBackend } from "@/lib/helper";
import { PasswordStrengthMeter } from "@/components/custom/other/strength-meter";

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
    <>
      <div className="space-y-4 text-muted-foreground text-sm">
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
            <div className="relative">
              <Input
                id="old-password"
                type={showPassword ? "text" : "password"}
                placeholder="Masukkan password lama"
                autoComplete="old-password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                noInfo
                required
              />
              <div className="absolute inset-y-0 right-0 flex items-center cursor-pointer pr-3">
                {showPassword ? (
                  <Eye
                    className="relative h-4 w-4"
                    onClick={() => setShowPassword(false)}
                  />
                ) : (
                  <EyeOff
                    className="relative h-4 w-4"
                    onClick={() => setShowPassword(true)}
                  />
                )}
              </div>
            </div>
            <PasswordStrengthMeter
              id="new-password"
              placeholder="Masukkan password baru"
              value={newPassword}
              className="max-w-md"
              onChange={(e) => setNewPassword(e.target.value)}
              strengthLabels={{
                empty: "Kosong",
                weak: "Lemah",
                fair: "Cukup",
                good: "Bagus",
                strong: "Kuat",
              }}
              enableAutoGenerate={true}
              autoGenerateLength={10}
              autoComplete="new-password"
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
    </>
  );
}

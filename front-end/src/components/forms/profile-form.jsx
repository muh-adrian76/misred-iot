"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/providers/user-provider";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, UserLock, UserPen, ShieldUser } from "lucide-react";
import { convertDate, fetchFromBackend } from "@/lib/helper";
import { showToast } from "../features/toaster";

export function ProfileForm({ open, setOpen, profile }) {
  const [username, setUsername] = useState(profile.name);
  const [phoneNumber, setPhoneNumber] = useState(profile.phone || "");
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();
  const { setUser } = useUser();

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
        showToast("warning", "Gagal mengubah profil!");
      } else {
        const updatedUser = await res.json();
        setUser((prevUser) => ({
          ...prevUser,
          ...updatedUser,
        }));
        showToast("success", "Berhasil mengubah profil!");
        setOpen(false);
      }
    } catch (error) {
      showToast(
        "error",
        "Terjadi kesalahan, coba lagi nanti!",
        `${error.message}`
      );
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    try {
      const res = await fetchFromBackend("/user", {
        method: "DELETE",
      });

      if (!res.ok) {
        showToast("warning", "Gagal menghapus akun!");
      } else {
        showToast("success", "Akun berhasil dihapus!");
        router.push("/auths");
      }
    } catch (error) {
      showToast(
        "error",
        "Terjadi kesalahan, coba lagi nanti!",
        `${error.message}`
      );
    }
  };

  const handleSavePassword = () => {
    console.log("Password diubah");
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="max-w-md w-full">
        <SheetHeader className="border-b-2">
          <SheetTitle>Pengaturan Akun</SheetTitle>
        </SheetHeader>
        <SheetDescription className="hidden" />
        <div className="p-6 space-y-6 my-auto">
          <Accordion type="single" collapsible>
            {/* Informasi Akun */}
            <AccordionItem
              value="account-info"
              className="bg-card px-4 shadow-2xs rounded-2xl mb-3"
            >
              <AccordionTrigger className="font-semibold">
                Informasi Akun
              </AccordionTrigger>
              <AccordionContent>
                <form>
                  <div className="space-y-4 p-2 text-muted-foreground mb-3">
                    <div className="flex flex-col gap-2">
                      <p className="font-semibold">Username:</p>
                      <Input
                        id="username"
                        type="text"
                        placeholder={profile.name}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <p className="font-semibold">Email:</p>
                      <p className="ml-2">{profile.email}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <p className="font-semibold">No. Telepon:</p>
                      <Input
                        id="phone"
                        type="text"
                        placeholder="Belum ditambahkan"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <p className="font-semibold">Tanggal pembuatan akun:</p>
                      <p className="ml-2">{convertDate(profile.created_at)}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <p className="font-semibold">Terakhir log in:</p>
                      <p className="ml-2">{convertDate(profile.last_login)}</p>
                    </div>
                  </div>
                  <div className="flex gap-4 justify-center">
                    <Button
                      size="lg"
                      type="submit"
                      variant="outline"
                      className="rounded-lg cursor-pointer"
                      onClick={handleUpdateAccount}
                    >
                      Simpan
                      <UserPen className="h-5 w-5" />
                    </Button>
                    <Button
                      size="lg"
                      className="rounded-lg cursor-pointer"
                      onClick={handleDeleteAccount}
                    >
                      Hapus Akun
                      <ShieldUser className="h-5 w-5" />
                    </Button>
                  </div>
                </form>
              </AccordionContent>
            </AccordionItem>

            {/* Reset Password */}
            <AccordionItem
              value="reset-password"
              className="bg-card px-4 shadow-2xs rounded-2xl mb-6"
            >
              <AccordionTrigger className="font-semibold">
                Ganti Password
              </AccordionTrigger>
              <AccordionContent>
                <form action="">
                  <div className="sr-only">
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      value={profile.email} // Pre-fill dengan email pengguna
                      readOnly
                    />
                  </div>
                  <div className="space-y-4 p-2 text-muted-foreground">
                    <div className="relative">
                      <div className="flex gap-2 mb-3 cursor-pointer hover:text-black">
                        {showPassword ? (
                          <span
                            onClick={() => setShowPassword(false)}
                            className="flex gap-2"
                          >
                            Sembunyikan
                            <Eye className="relative h-5 w-5" />
                          </span>
                        ) : (
                          <span
                            onClick={() => setShowPassword(true)}
                            className="flex gap-2"
                          >
                            Tampilkan
                            <EyeOff className="relative h-5 w-5" />
                          </span>
                        )}
                      </div>
                      <div className="flex items-center border rounded-md">
                        <Input
                          id="old-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Password lama"
                          autoComplete="old-password"
                        />
                      </div>
                    </div>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Password baru"
                        autoComplete="new-password"
                      />
                    </div>
                    <Button
                      variant="outline"
                      onClick={handleSavePassword}
                      className="w-full cursor-pointer"
                    >
                      Simpan Perubahan
                      <UserLock className="h-5 w-5" />
                    </Button>
                  </div>
                </form>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </SheetContent>
    </Sheet>
  );
}

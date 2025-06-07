"use client";

import { useState } from "react";
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
import { Eye, EyeOff, User, Phone, Trash, Save, Edit } from "lucide-react";
import { convertDate } from "@/lib/helper";

export function ProfileForm({ open, setOpen, profile }) {
  const [showPassword, setShowPassword] = useState(false);

  const handleDeleteAccount = () => {
    console.log("Akun dihapus");
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
          {/* Accordion untuk 3 bagian */}
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
                <div className="space-y-4 p-2 text-muted-foreground mb-3">
                  <div className="flex flex-col gap-2">
                    <p className="font-semibold">Username:</p>
                    <Input
                      id="name"
                      type="input"
                      value={profile.name}
                      disabled
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
                      type="number"
                      placeholder="Belum ditambahkan"
                      value={profile.phone}
                      disabled
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
                    variant="outline"
                    className="rounded-lg cursor-pointer"
                    onClick={handleDeleteAccount}
                  >
                    Edit
                    <Edit className="h-5 w-5" />
                  </Button>
                  <Button
                    size="lg"
                    className="rounded-lg cursor-pointer"
                    onClick={handleDeleteAccount}
                  >
                    Hapus Akun
                    <Trash className="h-5 w-5" />
                  </Button>
                </div>
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
                      autoComplete="username"
                      value={profile.email} // Pre-fill dengan email pengguna
                      readOnly
                    />
                  </div>
                  <div className="space-y-4 p-2 text-muted-foreground">
                    <div className="relative">
                      <div className="flex gap-2 mb-3 cursor-pointer hover:text-primary">
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
                          type={showPassword ? "text" : "password"}
                          placeholder="Password lama"
                          autoComplete="old-password"
                        />
                      </div>
                    </div>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password baru"
                        autoComplete="new-password"
                      />
                    </div>
                    <Button
                      onClick={handleSavePassword}
                      className="w-full hover:bg-red-600"
                    >
                      Simpan Perubahan
                      <Save className="h-5 w-5" />
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

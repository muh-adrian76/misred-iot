"use client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function ProfileForm({ open, setOpen, profile }) {
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="max-w-md w-full">
        <SheetHeader>
          <SheetTitle>Profile</SheetTitle>
        </SheetHeader>
        {/* Konten profil lengkap di sini */}
        <div className="p-4">
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="w-16 h-16 text-2xl">
              <AvatarFallback>{profile.name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-bold text-xl">{profile.name}</div>
              {/* Tambahkan badge, dsb jika perlu */}
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-semibold">EMAIL</span>
              <div>{profile.email}</div>
            </div>
            {/* Tambahkan info lain sesuai kebutuhan */}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

"use client";

import { useUser } from "@/providers/user-provider";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Settings, User } from "lucide-react";

import DescriptionTooltip from "../other/description-tooltip";
import ConfirmDialog from "../other/confirm-dialog";
import ProfileForm from "../forms/profile/profile-form";

import { fetchFromBackend } from "@/lib/helper";
import { googleLogout } from "@react-oauth/google";

export default function ProfileButton() {
  const [openProfileSheet, setOpenProfileSheet] = useState(false);
  const [openDropdownProfile, setOpenDropdownProfile] = useState(false);
  const [openLogoutDialog, setOpenLogoutDialog] = useState(false);

  const router = useRouter();
  const { user, setUser } = useUser();

  const handleLogout = async (e) => {
    e.preventDefault();
    await fetchFromBackend("/auth/logout", {
      method: "POST",
    });
    googleLogout?.();
    router.push("/auth");
    setTimeout(() => {
      setUser(null);
    }, 2500);
  };

  return (
    <>
      <DropdownMenu
        open={openDropdownProfile}
        onOpenChange={(open) => setOpenDropdownProfile(open)}
      >
        <DescriptionTooltip content="Profil">
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              className="relative rounded-full cursor-pointer bg-primary hover:bg-red-600"
            >
              <User className="w-5 h-5" />
              <span className="sr-only">Profile</span>
            </Button>
          </DropdownMenuTrigger>
        </DescriptionTooltip>
        <DropdownMenuContent align="end">
          <div className="px-3 py-3 flex gap-4 items-center">
            <Avatar>
              <AvatarFallback className="bg-red-100 text-primary">
                {user.name[0] || "User"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1">
              <div className="font-medium text-sm">{user.name || "Nama User"}</div>
              <div className="text-xs text-muted-foreground">{user.email || "Email User"}</div>
            </div>
            <DescriptionTooltip content="Pengaturan">
              <Settings
                className="w-5 h-5 hover:text-primary cursor-pointer"
                onClick={() => {
                  setOpenDropdownProfile(false);
                  setTimeout(() => {
                    setOpenProfileSheet(true);
                  }, 250);
                }}
              />
            </DescriptionTooltip>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild inset="true">
            <Button
              variant="ghost"
              className="w-full cursor-pointer justify-between gap-4 hover:bg-red-50 hover:text-primary"
              onClick={() => {
                setOpenDropdownProfile(false);
                setTimeout(() => {
                  setOpenLogoutDialog(true);
                }, 250);
              }}
            >
              Log Out
              <LogOut className="w-5 h-5 hover:text-primary" />
            </Button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Pengaturan Profil */}
      <ProfileForm
        open={openProfileSheet}
        setOpen={setOpenProfileSheet}
        user={user}
        setUser={setUser}
        router={router}
      />

      {/* Logout */}
      <ConfirmDialog
        open={openLogoutDialog}
        setOpen={setOpenLogoutDialog}
        title="Apakah Anda yakin untuk keluar?"
        confirmHandle={handleLogout}
        confirmText="Ya"
        cancelText="Batalkan"
      />
    </>
  );
}

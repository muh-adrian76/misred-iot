"use client";

import { useUser, userType } from "@/providers/user-provider";
import { useState } from "react";
import { useTransitionRouter as useRouter } from "next-view-transitions";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Settings2, User } from "lucide-react";

import DescriptionTooltip from "../other/description-tooltip";
import ConfirmDialog from "../dialogs/confirm-dialog";
import ProfileForm from "../forms/profile/profile-form";

import { fetchFromBackend } from "@/lib/helper";
import { googleLogout } from "@react-oauth/google";

export default function ProfileButton() {
  const [openProfileSheet, setOpenProfileSheet] = useState(false);
  const [openPopoverProfile, setOpenPopoverProfile] = useState(false);
  const [openLogoutDialog, setOpenLogoutDialog] = useState(false);

  const router = useRouter();
  const { user, setUser } = useUser();

  const handleLogout = async (e) => {
    e.preventDefault();
    
    // Clear user immediately
    setUser(userType);
    
    // Call backend logout
    await fetchFromBackend("/auth/logout", {
      method: "POST",
    });
    
    // Google logout
    googleLogout?.();
    
    // Redirect to auth page
    router.push("/auth");
  };

  return (
    <>
      <Popover open={openPopoverProfile} onOpenChange={setOpenPopoverProfile}>
        <DescriptionTooltip content="Profil">
          <PopoverTrigger asChild>
            <Button
              size="icon"
              className="relative rounded-full hover:scale-105 cursor-pointer bg-primary hover:bg-red-600 transition-all duration-500"
            >
              <User className="w-5 h-5" />
              <span className="sr-only">Profile</span>
            </Button>
          </PopoverTrigger>
        </DescriptionTooltip>
        <PopoverContent align="end" className="p-0 w-full">
          <div className="px-3 py-3 flex gap-4 items-center">
            <Avatar>
              <AvatarFallback className="bg-red-100 text-primary">
                {user?.name?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1">
              <div className="font-medium text-sm">
                {user?.name || "Nama User"}
              </div>
              <div className="text-xs text-muted-foreground">
                {user?.email || "Email User"}
              </div>
            </div>
            <DescriptionTooltip content="Pengaturan">
              <Settings2
                className="w-5 h-5 hover:text-primary cursor-pointer transition-all duration-300"
                onClick={() => {
                  setOpenPopoverProfile(false);
                  setTimeout(() => {
                    setOpenProfileSheet(true);
                  }, 250);
                }}
              />
            </DescriptionTooltip>
          </div>
          <div className="border-t" />
          <Button
            variant="ghost"
            size="default"
            className="w-full cursor-pointer rounded-b-md justify-between gap-4 hover:bg-transparent hover:text-primary transition-all"
            onClick={() => {
              setTimeout(() => {
                setOpenLogoutDialog(true);
              }, 250);
            }}
          >
            Log Out
            <LogOut className="w-5 h-5 hover:text-primary" />
          </Button>
        </PopoverContent>
      </Popover>

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

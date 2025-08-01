// Menggunakan "use client" untuk komponen React sisi klien
"use client";

// Import provider dan type untuk user management
import { useUser, userType } from "@/providers/user-provider";
// Import hook React untuk state
import { useState } from "react";
// Import router dengan view transitions
import { useTransitionRouter as useRouter } from "next-view-transitions";
// Import komponen UI
import { Button } from "@/components/ui/button";
import {
  Popover, // Container popover
  PopoverTrigger, // Trigger button untuk popover
  PopoverContent, // Konten popover
} from "@/components/ui/popover";
// Import ikon-ikon dari Lucide React
import { LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Settings2, User } from "lucide-react";

// Import komponen kustom
import DescriptionTooltip from "../other/description-tooltip";
import ConfirmDialog from "../dialogs/confirm-dialog";
import ProfileForm from "../forms/profile/profile-form";

// Import utility dan Google OAuth
import { fetchFromBackend } from "@/lib/helper";
import { googleLogout } from "@react-oauth/google";

// Komponen button profile dengan dropdown menu dan logout functionality
export default function ProfileButton() {
  // State untuk mengontrol berbagai dialog dan sheet
  const [openProfileSheet, setOpenProfileSheet] = useState(false); // Sheet untuk edit profile
  const [openPopoverProfile, setOpenPopoverProfile] = useState(false); // Popover profile menu
  const [openLogoutDialog, setOpenLogoutDialog] = useState(false); // Dialog konfirmasi logout

  // Hook untuk router dan user management
  const router = useRouter();
  const { user, setUser } = useUser();

  // Handler untuk proses logout
  const handleLogout = async (e) => {
    e.preventDefault();
    
    // Clear user data dari state (logout immediate untuk UX)
    setUser(userType);
    
    // Panggil backend logout untuk invalidate session
    await fetchFromBackend("/auth/logout", {
      method: "POST",
    });
    
    // Logout dari Google OAuth jika user login dengan Google
    googleLogout?.();
    
    // Redirect ke halaman auth
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

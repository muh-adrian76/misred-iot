"use client";

import { useUser } from "@/providers/user-provider";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { LogOut } from "lucide-react";

import { ConfirmDialog } from "../features/confirm-dialog";
import { ProfileForm } from "../forms/profile-form";
import ThemeButton from "../buttons/theme-button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell, Settings, User } from "lucide-react";

import { fetchFromBackend } from "@/lib/helper";
import { googleLogout } from "@react-oauth/google";

export default function AppNavbar({ page, profile }) {
  const [openProfileSheet, setOpenProfileSheet] = useState(false);
  const [openDropdownProfile, setOpenDropdownProfile] = useState(false); // fix overlapping
  const [openLogoutDialog, setOpenLogoutDialog] = useState(false);

  const router = useRouter();
  const { setUser } = useUser();

  const handleLogout = async (e) => {
    e.preventDefault();
    await fetchFromBackend("/auth/logout", {
      method: "POST",
    });
    googleLogout?.();
    router.push("/auths");
    setTimeout(() => {
      setUser(null);
    }, 1000);
  };
  return (
    <header className="flex h-16 items-center bg-background px-4 gap-4 justify-between sticky top-0 z-50">
      <div className="flex items-center gap-4 px-4">
        <SidebarTrigger className="min-xl:hidden" />
        {/* <Separator orientation="vertical" className="h-6" /> */}

        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="max-md:hidden">
              <span className="text-muted-foreground">Menu</span>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="max-md:hidden" />
            <BreadcrumbItem>
              <BreadcrumbPage>{page}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center gap-4 px-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="relative rounded-full cursor-pointer"
            >
              <Bell className="w-5 h-5" />
              {/* Notif */}
              {/* <span className="absolute top-0 right-0 inline-block w-2 h-2 bg-red-500 rounded-full" /> */}
              <span className="sr-only">Notifikasi</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <div className="px-3 py-2 font-medium">Notifikasi Terbaru</div>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <span className="text-sm">Alarm pH tinggi di Device1</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <span className="text-sm">Alarm TSS rendah di Device2</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Tema */}
        <ThemeButton />

        {/* Profil */}
        <DropdownMenu
          open={openDropdownProfile}
          onOpenChange={(open) => setOpenDropdownProfile(open)}
        >
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              className="relative rounded-full cursor-pointer bg-primary hover:bg-red-600"
            >
              <User className="w-5 h-5" />
              {/* Notif */}
              {/* <span className="absolute top-0 right-0 inline-block w-2 h-2 bg-red-500 rounded-full" /> */}
              <span className="sr-only">Profile</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <div className="px-3 py-3 flex gap-4 items-center">
              <Avatar>
                <AvatarFallback className="bg-red-100 text-primary">
                  {profile.name[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-1">
                <div className="font-medium text-sm">{profile.name}</div>
                <div className="text-xs text-muted-foreground">
                  {profile.email}
                </div>
              </div>
              <Settings
                className="w-4 h-4 hover:text-primary cursor-pointer"
                onClick={() => {
                  setOpenDropdownProfile(false);
                  setTimeout(() => {
                    setOpenProfileSheet(true);
                  }, 250);
                }}
              />
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
      </div>

      {/* Pengaturan Profil */}
      <ProfileForm
        open={openProfileSheet}
        setOpen={setOpenProfileSheet}
        profile={profile}
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
    </header>
  );
}

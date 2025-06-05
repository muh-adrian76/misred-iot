"use client";

import { useState } from "react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import { Bell, Sun, Moon, Laptop, Settings, User } from "lucide-react";
import { useTheme } from "next-themes";

import { ProfileForm } from "../forms/profile-form";
import LogoutButton from "../buttons/logout-button";

export default function AppNavbar({ page, profile }) {
  const { setTheme, theme } = useTheme();
  const [openProfileSheet, setOpenProfileSheet] = useState(false);
  const [dropdownProfileOpen, setDropdownProfileOpen] = useState(false); // fix overlapping

  return (
    <header className="flex h-16 items-center border-b bg-background px-4 gap-4 justify-between sticky top-0">
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full cursor-pointer"
            >
              {theme === "dark" ? (
                <Moon className="w-5 h-5" />
              ) : theme === "light" ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Laptop className="w-5 h-5" />
              )}
              <span className="sr-only">Toggle theme</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => setTheme("light")}
              className="cursor-pointer"
            >
              <Sun className="mr-2 w-4 h-4" /> Cerah
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setTheme("dark")}
              className="cursor-pointer"
            >
              <Moon className="mr-2 w-4 h-4" /> Gelap
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setTheme("system")}
              className="cursor-pointer"
            >
              <Laptop className="mr-2 w-4 h-4" /> Sistem
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Profil */}
        <DropdownMenu
          open={dropdownProfileOpen}
          onOpenChange={setDropdownProfileOpen}
        >
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="relative rounded-full cursor-pointer bg-red-500 hover:bg-red-600 text-white hover:text-white dark:bg-red-500 dark:hover:bg-red-600"
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
                <AvatarFallback className="bg-red-100 text-red-500">
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
                className="w-4 h-4 hover:text-red-500 cursor-pointer dark:hover:text-red-400"
                onClick={() => {
                  setDropdownProfileOpen(false);
                  setTimeout(() => {
                    setOpenProfileSheet(true);
                  }, 100);
                }}
              />
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <LogoutButton asChild />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ProfileForm
        open={openProfileSheet}
        setOpen={setOpenProfileSheet}
        profile={profile}
      />
    </header>
  );
}

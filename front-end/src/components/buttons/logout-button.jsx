"use client";

import { useRouter } from "next/navigation";

import { Button } from "../ui/button";
import { LogOut } from "lucide-react";

import { fetchFromBackend } from "@/lib/helper";
import { googleLogout } from "@react-oauth/google";

export default function LogoutButton({asChild}) {
  const router = useRouter();

  const handleLogout = async (e) => {
    await fetchFromBackend("/auth/logout", {
      method: "POST",
    });
    googleLogout?.();
    router.push("/auths");
  };

  if (asChild) {
    return (
      <Button
      variant="ghost"
      className="w-full cursor-pointer justify-between gap-4 hover:bg-red-50 hover:text-primary"
      onClick={handleLogout}
    >
      Log Out
      <LogOut className="w-5 h-5" />
    </Button>
    );
  }
}

"use client";

import { fetchFromBackend } from "@/lib/helper";
import { Button } from "../ui/button";
import { googleLogout } from "@react-oauth/google";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function LogoutButton({asChild}) {
  const router = useRouter();

  const handleLogout = async (e) => {
    await fetchFromBackend("/auth/logout", {
      method: "POST",
    });
    googleLogout?.();
    router.push("/login");
  };

  if (asChild) {
    return (
      <Button
      variant="ghost"
      className="w-full cursor-pointer justify-start gap-2 hover:bg-red-50 hover:text-red-500 dark:hover:text-red-400"
      onClick={handleLogout}
    >
      <LogOut className="w-5 h-5" />
      Logout
    </Button>
    );
  }
}

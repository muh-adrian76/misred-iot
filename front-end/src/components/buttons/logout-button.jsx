"use client";

import { fetchFromBackend } from "@/lib/helper";
import { Button } from "../ui/button";
import { googleLogout } from "@react-oauth/google";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetchFromBackend("/auth/logout", {
      method: "POST",
    });
    googleLogout?.();
    router.push("/login");
  };
  return (
    <Button variant="ghost" onClick={handleLogout}>
      Logout
    </Button>
  );
}

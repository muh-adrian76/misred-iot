"use client";

import { useAdminMapsLogic } from "@/components/features/admin-maps/admin-maps-logic";
import AdminMapsContent from "@/components/features/admin-maps/admin-maps-content";
import AdminMapsDialogs from "@/components/features/admin-maps/admin-maps-dialogs";

export default function AdminMapsLayout() {
  const logic = useAdminMapsLogic();

  if (!logic.isAuthenticated || !logic.isAdmin) return null;

  return (
    <>
      <AdminMapsContent {...logic} />
      <AdminMapsDialogs {...logic} />
    </>
  );
}

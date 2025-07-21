"use client";

import { useAdminOverviewsLogic } from "@/components/features/admin-overviews/admin-overviews-logic";
import AdminOverviewsContent from "@/components/features/admin-overviews/admin-overviews-content";
import AdminOverviewsDialogs from "@/components/features/admin-overviews/admin-overviews-dialogs";

export default function AdminOverviewsLayout() {
  const logic = useAdminOverviewsLogic();

  if (!logic.isAuthenticated || !logic.isAdmin) return null;

  return (
    <>
      <AdminOverviewsContent {...logic} />
      <AdminOverviewsDialogs {...logic} />
    </>
  );
}

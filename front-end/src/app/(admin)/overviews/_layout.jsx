// Layout component untuk Admin Overviews - orchestrates logic dan UI components
// Combines: business logic hook, content display, dan dialog management
"use client";

import { useAdminOverviewsLogic } from "@/components/features/admin-overviews/admin-overviews-logic";
import AdminOverviewsContent from "@/components/features/admin-overviews/admin-overviews-content";
import AdminOverviewsDialogs from "@/components/features/admin-overviews/admin-overviews-dialogs";

export default function AdminOverviewsLayout() {
  // Custom hook untuk business logic dan state management
  const logic = useAdminOverviewsLogic();

  // Guard clause - hanya render jika user authenticated dan admin
  if (!logic.isAuthenticated || !logic.isAdmin) return null;

  return (
    <>
      {/* Main content area dengan data dan UI */}
      <AdminOverviewsContent {...logic} />
      {/* Modal dialogs untuk actions (create, edit, delete, dll) */}
      <AdminOverviewsDialogs {...logic} />
    </>
  );
}

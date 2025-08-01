// Layout component untuk Admin OTAA - handles firmware management interface
// Combines: firmware logic hook, firmware list/table, dan firmware management dialogs
"use client";

import { useAdminOTAALogic } from "@/components/features/admin-otaa/admin-otaa-logic";
import AdminOTAAContent from "@/components/features/admin-otaa/admin-otaa-content";
import AdminOTAADialogs from "@/components/features/admin-otaa/admin-otaa-dialogs";

export default function AdminOTAALayout() {
  // Custom hook untuk firmware management logic (CRUD operations, search, filter)
  const logic = useAdminOTAALogic();

  // Guard clause - hanya render jika user authenticated dan admin
  if (!logic.isAuthenticated || !logic.isAdmin) return null;

  return (
    <>
      {/* Main content: firmware list, search, filters, actions */}
      <AdminOTAAContent {...logic} />
      {/* Dialog modals: upload firmware, delete confirmation, dll */}
      <AdminOTAADialogs {...logic} />
    </>
  );
}

// Layout component untuk Admin Users - handles user management interface
// Combines: user logic hook, user list/table, dan user management dialogs
"use client";

import { useAdminUsersLogic } from "@/components/features/admin-users/admin-users-logic";
import AdminUsersContent from "@/components/features/admin-users/admin-users-content";
import AdminUsersDialogs from "@/components/features/admin-users/admin-users-dialogs";

export default function AdminUsersLayout() {
  // Custom hook untuk user management logic (CRUD operations, search, filter)
  const logic = useAdminUsersLogic();

  // Guard clause - hanya render jika user authenticated dan admin
  if (!logic.isAuthenticated || !logic.isAdmin) return null;

  return (
    <>
      {/* Main content: user list, search, filters, actions */}
      <AdminUsersContent {...logic} />
      {/* Dialog modals: create user, edit user, delete confirmation, dll */}
      <AdminUsersDialogs {...logic} />
    </>
  );
}

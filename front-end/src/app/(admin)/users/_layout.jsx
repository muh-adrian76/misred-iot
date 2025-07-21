"use client";

import { useAdminUsersLogic } from "@/components/features/admin-users/admin-users-logic";
import AdminUsersContent from "@/components/features/admin-users/admin-users-content";
import AdminUsersDialogs from "@/components/features/admin-users/admin-users-dialogs";

export default function AdminUsersLayout() {
  const logic = useAdminUsersLogic();

  if (!logic.isAuthenticated || !logic.isAdmin) return null;

  return (
    <>
      <AdminUsersContent {...logic} />
      <AdminUsersDialogs {...logic} />
    </>
  );
}

// Layout component untuk Admin Maps - handles geographic device visualization
// Combines: maps logic hook, interactive map display, dan location management dialogs
"use client";

import { useAdminMapsLogic } from "@/components/features/admin-maps/admin-maps-logic";
import AdminMapsContent from "@/components/features/admin-maps/admin-maps-content";
import AdminMapsDialogs from "@/components/features/admin-maps/admin-maps-dialogs";

export default function AdminMapsLayout() {
  // Custom hook untuk maps logic (device locations, map interactions, clustering)
  const logic = useAdminMapsLogic();

  // Guard clause - hanya render jika user authenticated dan admin
  if (!logic.isAuthenticated || !logic.isAdmin) return null;

  return (
    <>
      {/* Main content: interactive map dengan device markers dan controls */}
      <AdminMapsContent {...logic} />
      {/* Dialog modals: device location info, location updates, map settings */}
      <AdminMapsDialogs {...logic} />
    </>
  );
}

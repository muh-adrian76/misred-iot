"use client";
import { useDashboardLogic } from "@/components/features/dashboard/dashboard-logic";
import DashboardHeader from "@/components/features/dashboard/dashboard-header";
import DashboardContent from "@/components/features/dashboard/dashboard-content";
import DashboardDialogs from "@/components/features/dashboard/dashboard-dialogs";

export default function DashboardLayout() {
  const logic = useDashboardLogic();

  if (!logic.isAuthenticated) return null;

  return (
    <>
      <DashboardHeader {...logic} />
      <div className="overflow-x-hidden h-screen">
        <DashboardContent {...logic} />
      </div>
      <DashboardDialogs {...logic} />
    </>
  );
}

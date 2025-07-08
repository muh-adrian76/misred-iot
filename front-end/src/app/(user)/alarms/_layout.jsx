"use client";
import { useAlarmLogic } from "@/components/features/alarm/alarm-logic";
import AlarmContent from "@/components/features/alarm/alarm-content";
import AlarmDialogs from "@/components/features/alarm/alarm-dialogs";

export default function AlarmLayout() {
  const logic = useAlarmLogic();

  if (!logic.isAuthenticated) return null;

  return (
    <>
      <AlarmContent {...logic} />
      <AlarmDialogs {...logic} />
    </>
  );
}

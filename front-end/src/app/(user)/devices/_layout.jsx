"use client";

import { useDeviceLogic } from "@/components/features/device/device-logic";
import DeviceContent from "@/components/features/device/device-content";
import DeviceDialogs from "@/components/features/device/device-dialogs";

export default function DeviceLayout() {
  const logic = useDeviceLogic();

  if (!logic.isAuthenticated) return null;

  return (
    <>
      <DeviceContent
        {...logic}
        noDevice={logic.devices.length === 0}
        search={logic.search}
      />
      <DeviceDialogs {...logic} />
    </>
  );
}

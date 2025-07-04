"use client";

import { useDatastreamLogic } from "@/components/features/datastream/datastream-logic";
import DatastreamContent from "@/components/features/datastream/datastream-content";
import DatastreamDialogs from "@/components/features/datastream/datastream-dialogs";

export default function DatastreamLayout() {
  const logic = useDatastreamLogic();

  if (!logic.isAuthenticated) return null;

  return (
    <>
      <DatastreamContent {...logic} />
      <DatastreamDialogs {...logic} />
    </>
  );
}

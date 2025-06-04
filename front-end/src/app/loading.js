"use client";
import LoaderText from "@/components/features/loader-text";

export default function Loading() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted">
      <LoaderText />
    </div>
  );
}
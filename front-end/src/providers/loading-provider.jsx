"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Progress } from "@/components/ui/progress";

export default function LoadingProviders({ children }) {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setLoading(true);
    setProgress(0);

    const start = setTimeout(() => setProgress(80), 100);
    const finish = setTimeout(() => setProgress(100), 700);
    const end = setTimeout(() => {
      setLoading(false);
      setProgress(0);
    }, 900);

    return () => {
      clearTimeout(start);
      clearTimeout(finish);
      clearTimeout(end);
    };
  }, [pathname]);

  return (
    <>
      {loading && (
        <Progress
          value={progress}
          className="fixed top-0 left-0 w-full z-[9999] transition-all"
        />
      )}
      {children}
    </>
  );
}

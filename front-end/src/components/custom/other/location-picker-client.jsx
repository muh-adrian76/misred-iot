"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

// Dynamic import untuk LocationPickerWithCoordinates untuk menghindari SSR issues
const LocationPickerWithCoordinates = dynamic(
  () => import("./location-picker-with-coordinates"),
  {
    ssr: false, // Disable server-side rendering untuk komponen ini
    loading: () => (
      <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800">
        <div className="animate-spin w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full"></div>
        <span className="text-sm text-gray-600 dark:text-gray-400">Loading location picker...</span>
      </div>
    )
  }
);

// Client-only wrapper
export function LocationPickerClient(props) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Render nothing during SSR
  if (!isMounted) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800">
        <div className="animate-pulse w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
        <span className="text-sm text-gray-600 dark:text-gray-400">Loading...</span>
      </div>
    );
  }

  return <LocationPickerWithCoordinates {...props} />;
}

export default LocationPickerClient;

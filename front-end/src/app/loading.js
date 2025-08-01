// Import komponen loader custom
import LoaderText from "@/components/features/loader-text";

/**
 * Komponen loading global untuk aplikasi
 * Ditampilkan saat navigasi atau loading initial page
 * @returns {JSX.Element} Centered loader dengan full viewport height
 */
export default function Loading() {
  return (
    // Container dengan flexbox untuk center alignment
    <div className="flex justify-center items-center h-[100vh]">
      {/* Komponen loader dengan text animasi */}
      <LoaderText />
    </div>
  );
}

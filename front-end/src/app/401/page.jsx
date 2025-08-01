// Import layout komponen untuk halaman 401 Unauthorized
import UnauthorizedLayout from "./_layout";

// Metadata untuk halaman 401
export const metadata = {
  title: "401 - Unauthorized", // Title untuk SEO dan browser tab
  description: "Halaman Otorisasi Gagal - MiSREd-IoT", // Deskripsi untuk SEO
}

/**
 * Halaman 401 Unauthorized
 * Ditampilkan ketika user mengakses resource tanpa authorization yang tepat
 * @returns {JSX.Element} Halaman 401 dengan centered layout dan call-to-action
 */
export default function Page() {
  return (
    // Container dengan full screen height dan center alignment
    <div className="flex flex-col items-center justify-center min-h-screen bg-muted text-center p-6">
      {/* Render layout 401 dengan animasi dan styling */}
      <UnauthorizedLayout />
    </div>
  );
}

// Import komponen layout untuk halaman 404
import NotFoundLayout from "./404-layout";

// Metadata untuk halaman 404
export const metadata = {
  title: "404 - Not Found", // Title untuk SEO dan browser tab
  description: "Halaman tidak ditemukan - MiSREd-IoT" // Deskripsi untuk SEO
}

/**
 * Komponen halaman Not Found (404)
 * Menggunakan layout khusus dengan animasi dan styling
 * @returns {JSX.Element} Halaman 404 dengan centered layout
 */
export default function NotFound() {
  return (
    // Container dengan full screen height dan center alignment
    <div className="flex flex-col items-center justify-center min-h-screen bg-muted text-center p-6">
      {/* Render layout 404 dengan animasi */}
      <NotFoundLayout />
    </div>
  );
}

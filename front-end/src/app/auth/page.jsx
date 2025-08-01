// Import layout komponen untuk halaman authentication
import AuthLayout from "./_layout";

// Import utility untuk conditional className
import { cn } from "@/lib/utils";

// Metadata untuk halaman login
export const metadata = {
  title: "Login - MiSREd-IoT", // Title untuk SEO dan browser tab
  description: "Halaman login MiSREd-IoT", // Deskripsi untuk SEO
};

/**
 * Halaman utama untuk authentication (login/register/forgot password)
 * Menggunakan background pattern dan gradient untuk visual yang menarik
 * @returns {JSX.Element} Halaman auth dengan background pattern dan centered layout
 */
export default function Page() {
  return (
    <>
      {/* Background pattern dengan dots menggunakan radial gradient */}
      <div
        className={cn(
          "absolute inset-0", // Full screen coverage
          "[background-size:20px_20px]", // Ukuran pattern 20x20px
          "[background-image:radial-gradient(#d4d4d4_1px,transparent_1px)]", // Light theme dots
          "dark:[background-image:radial-gradient(#404040_1px,transparent_1px)]" // Dark theme dots
        )}
      />
      
      {/* Radial gradient overlay untuk efek fade pada container */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] dark:bg-black"></div>
      
      {/* Container utama dengan center alignment dan responsive padding */}
      <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
        {/* Render komponen auth layout dengan form switching logic */}
        <AuthLayout />
      </div>
    </>
  );
}

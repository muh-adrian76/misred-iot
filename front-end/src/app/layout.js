// Import global CSS styles
import "./globals.css";

// Import font Google untuk typography utama
import { Public_Sans } from "next/font/google";

// Import komponen UI untuk notifikasi toast
import { Toaster } from "@/components/ui/sonner";

// Import view transitions untuk smooth page transitions
import { ViewTransitions } from "next-view-transitions";

// Import semua providers untuk state management global
import { UserProvider } from "@/providers/user-provider"; // Provider untuk data user dan authentication
import { GoogleOAuthProvider } from "@react-oauth/google"; // Provider untuk Google OAuth integration
import { ThemeProvider } from "@/providers/theme-provider"; // Provider untuk dark/light theme
import { ReactQueryProvider } from "@/providers/react-query-provider"; // Provider untuk data fetching dan caching
import LoadingProviders from "@/providers/loading-provider"; // Provider untuk loading states

// Import utility helper
import { brandLogo } from "@/lib/helper"; // Helper untuk logo brand

// Konfigurasi font utama aplikasi
const defaultFont = Public_Sans({
  variable: "--font-sans", // CSS variable untuk font
  subsets: ["latin"], // Subset karakter yang diload
});

// Metadata untuk SEO dan PWA
export const metadata = {
  title: "MiSREd-IoT", // Title aplikasi
  description:
    "Multi-input, Scalable, Reliable, and Easy-to-deploy IoT Platform", // Deskripsi aplikasi
};

/**
 * Root Layout komponen untuk aplikasi Next.js
 * Mengatur providers, fonts, metadata, dan struktur HTML dasar
 * @param {Object} props - Props komponen
 * @param {ReactNode} props.children - Konten halaman yang akan dirender
 * @returns {JSX.Element} HTML structure dengan semua providers
 */
export default function RootLayout({ children }) {
  return (
    // Google OAuth Provider sebagai wrapper terluar untuk authentication
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}>
      {/* ViewTransitions untuk smooth page transitions */}
      <ViewTransitions>
        {/* HTML root dengan lang dan hydration suppression */}
        <html lang="en" suppressHydrationWarning>
          <head>
            {/* Favicon menggunakan brand logo */}
            <link rel="icon" href={brandLogo} />
            
            {/* Meta viewport untuk responsive design */}
            <meta
              name="viewport"
              content="width=device-width, initial-scale=1"
            />
            
            {/* Meta description untuk SEO */}
            <meta name="description" content="MiSREd-IoT Platform" />
            
            {/* Disable format detection untuk mencegah auto-linking */}
            <meta
              name="format-detection"
              content="telephone=no, date=no, email=no, address=no"
            />
          </head>
          
          {/* Body dengan font variable dan antialiasing */}
          <body className={`${defaultFont.variable} antialiased`}>
            {/* Hierarchy providers dari luar ke dalam */}
            
            {/* ReactQueryProvider: Untuk data fetching, caching, dan synchronization */}
            <ReactQueryProvider>
              {/* LoadingProviders: Untuk global loading states */}
              <LoadingProviders>
                {/* UserProvider: Untuk user data dan authentication state */}
                <UserProvider>
                  {/* ThemeProvider: Untuk dark/light theme management */}
                  <ThemeProvider
                    attribute="class" // Menggunakan class-based theming
                    defaultTheme="system" // Default mengikuti system preference
                    enableSystem // Enable system theme detection
                  >
                    {/* Render konten halaman */}
                    {children}
                  </ThemeProvider>
                </UserProvider>
              </LoadingProviders>
            </ReactQueryProvider>
            
            {/* Toaster untuk notifikasi global */}
            <Toaster
              className="text-pretty" // Styling untuk text formatting
              duration={3500} // Durasi tampil 3.5 detik
              position="top-center" // Posisi di tengah atas
            />
          </body>
        </html>
      </ViewTransitions>
    </GoogleOAuthProvider>
  );
}

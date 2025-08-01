// Import komponen Button UI
import { Button } from "../../ui/button";
// Import hook untuk Google OAuth login
import { useGoogleLogin } from "@react-oauth/google";
// Import ikon Google kustom
import { GoogleIcon } from "../icons/google";
// Import utility untuk fetch data dari backend
import { fetchFromBackend } from "@/lib/helper";
// Import komponen toast untuk notifikasi error
import { errorToast } from "../other/toaster";
// Import hook untuk deteksi breakpoint layar
import { useBreakpoint } from "@/hooks/use-mobile";

// Komponen button untuk login/register dengan Google OAuth
export default function GoogleButton({
  router, // Router Next.js untuk navigasi
  action, // Teks aksi (Login/Register)
  isLoading, // Status loading
  setIsLoading, // Setter untuk loading state
  setUser, // Setter untuk user data setelah login berhasil
}) {
  // Hook untuk mendeteksi ukuran layar
  const { isMobile, isTablet, isDesktop } = useBreakpoint();

  // Handler untuk Google login menggunakan OAuth flow
  const googleLogin = useGoogleLogin({
    // Callback ketika login berhasil
    onSuccess: async ({ code }) => {
      try {
        // Set loading state
        setIsLoading(true);
        // Kirim authorization code ke backend untuk exchange dengan access token
        // Kirim authorization code ke backend untuk exchange dengan access token
        const res = await fetchFromBackend("/auth/google", {
          method: "POST",
          body: JSON.stringify({ code, mode: "popup" }),
        });

        // Parse response dari backend
        const data = await res.json();
        // Cek apakah response berhasil atau gagal
        !res.ok
          ? errorToast("Google login gagal!", `${data.message}`) // Tampilkan error jika gagal
          : setTimeout(() => {
              // Jika berhasil, set user data dan redirect ke dashboard
              setUser(data.user);
              router.push("/dashboards");
            }, 500); // Delay 500ms untuk UX yang smooth
      } catch {
        // Handle error jika terjadi exception
        errorToast("Google login gagal!");
      } finally {
        // Selalu set loading false di akhir
        setIsLoading(false);
      }
    },
    flow: "auth-code", // Menggunakan authorization code flow untuk keamanan
    // Callback ketika terjadi error
    onError: () => errorToast("Google login gagal!"),
    // UX mode: popup untuk desktop, redirect untuk mobile
    ux_mode: isMobile ? "redirect" : "popup",
    // Redirect URI hanya untuk mobile (redirect mode)
    redirect_uri: isMobile
      ? `${process.env.NEXT_PUBLIC_FRONTEND_URL}/auth/google-callback`
      : undefined,
  });

  return (
    // Button dengan styling outline dan full width
    <Button
      variant="outline"
      type="button"
      className="w-full cursor-pointer"
      onClick={() => {
        // Trigger Google login flow
        googleLogin();
      }}
      disabled={isLoading} // Disable button saat loading
    >
      {/* Ikon Google */}
      <GoogleIcon className="h-5 w-5 mr-2" />
      {/* Teks button yang berubah saat loading */}
      {isLoading ? "Memproses..." : `${action} dengan Gmail`}
    </Button>
  );
}

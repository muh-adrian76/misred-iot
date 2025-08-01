// Komponen client-side untuk handling Google OAuth callback
"use client";

// Import React hooks
import { useEffect } from "react";

// Import Next.js navigation hooks
import { useSearchParams, useRouter } from "next/navigation";

// Import utilities dan components
import { fetchFromBackend } from "@/lib/helper"; // Helper untuk API calls
import { errorToast } from "@/components/custom/other/toaster"; // Toast notification untuk error
import { useUser } from "@/providers/user-provider"; // Provider untuk user context

/**
 * Halaman callback untuk Google OAuth authentication
 * Memproses authorization code dari Google dan melakukan login ke backend
 * @returns {JSX.Element} Loading message saat memproses login
 */
export default function Page() {
  // Hooks untuk navigation dan search params
  const query = useSearchParams(); // Mendapatkan query parameters dari URL
  const router = useRouter(); // Router untuk navigation
  const { setUser } = useUser(); // Setter untuk update user context

  // Effect untuk memproses Google OAuth callback
  useEffect(() => {
    /**
     * Fungsi async untuk handle Google OAuth authorization code
     * Mengirim code ke backend untuk pertukaran dengan access token
     */
    const fetchCode = async () => {
      // Ambil authorization code dari query parameter
      const code = query.get("code");
      
      try {
        // Kirim authorization code ke backend untuk authentication
        const res = await fetchFromBackend("/auth/google", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            code, // Authorization code dari Google
            mode: "redirect" // Mode redirect untuk OAuth flow
          }),
        });

        // Parse response JSON
        const data = await res.json();
        
        // Handle response berdasarkan status
        !res.ok
          ? // Jika gagal, tampilkan error toast
            errorToast("Google login gagal!", `${data.message}`)
          : // Jika berhasil, set user dan redirect ke dashboard
            setTimeout(() => {
              setUser(data.user); // Update user context dengan data dari backend
              router.push("/dashboards"); // Redirect ke halaman dashboard
            }, 500); // Delay 500ms untuk smooth transition
      } catch {
        // Handle network atau parsing error
        errorToast("Google login gagal!");
        // Note: setIsLoading(false) sepertinya typo karena tidak ada state isLoading
      }
    };
    
    // Jalankan fungsi fetch code saat komponen mount
    fetchCode();
  }, [router, query, setUser]); // Dependencies untuk useEffect

  // Render loading message saat memproses
  return (
    <div className="flex justify-center items-center h-screen">
      Memproses login Google...
    </div>
  );
}

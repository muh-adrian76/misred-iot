// Import React hooks untuk state management
import { useState } from "react";

// Import komponen toast notification untuk feedback user
import { successToast, errorToast } from "../../other/toaster";

// Import komponen UI untuk form dan layout
import { Card } from "../../../ui/card";
import { Label } from "../../../ui/label";
import { Input } from "../../../ui/input";
import { Button } from "../../../ui/button";

// Import library animasi untuk smooth transitions
import { motion } from "framer-motion";

// Import utilities dan helper functions
import { fetchFromBackend } from "@/lib/helper";
import { brandLogo } from "@/lib/helper";

// Komponen ForgotPasswordForm untuk reset password user yang lupa
export default function ForgotPasswordForm({
  isLoading, // State loading untuk UI feedback
  logoFont, // Font untuk logo branding
  setIsLoading, // Setter untuk loading state
  setShowForgotPassword, // Function untuk kembali ke halaman login
  ...props // Props tambahan lainnya
}) {
  // State management untuk email input
  const [email, setEmail] = useState(""); // Email address user yang lupa password

  // Handler untuk proses reset password dengan email notification
  const handleForgotPassword = async (e) => {
    e.preventDefault(); // Prevent default form submission
    setIsLoading(true); // Tampilkan loading state
    
    try {
      // Request ke backend untuk generate password baru
      const res = await fetchFromBackend("/auth/reset-forgotten-password", {
        method: "PUT",
        body: JSON.stringify({ email }), // Kirim email untuk reset
      });

      // Handle response error dari backend
      if (!res.ok) {
        const errorMessage = await res.json();
        errorToast("Gagal melakukan reset password", errorMessage.message);
        return;
      }

      // Extract password baru yang di-generate oleh sistem
      const { updatedPassword } = await res.json();

      // Kirim email notification dengan password baru ke user
      await fetch("/api/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email, // Email tujuan
          password: updatedPassword, // Password baru yang di-generate
          type: "reset-password" // Tipe email untuk template yang tepat
        }),
      });

      // Tampilkan success message ke user
      successToast(
        "Email terkirim!",
        "Silakan cek email Anda pada bagian kotak masuk atau spam."
      );
      
      // Auto redirect ke halaman login setelah 2 detik
      setTimeout(() => setShowForgotPassword(false), 2000);
    } catch (error) {
      // Handle error dan tampilkan pesan error yang user-friendly
      console.error("Pengiriman email gagal:", error);
      errorToast(
        "Gagal melakukan reset password!",
        error?.text ||
          error?.message ||
          "Pengiriman email gagal, coba lagi nanti."
      );
    } finally {
      setIsLoading(false); // Reset loading state
    }
  };

  // Render form dengan animasi dan responsive design
  return (
    <div className="flex w-full z-10 max-w-sm flex-col gap-6">
      {/* Logo Brand dengan animasi entrance */}
      <motion.div
        initial={{ opacity: 0, y: 100 }} // Start dari bawah dengan opacity 0
        animate={{ opacity: 1, y: 0 }} // Animate ke posisi normal dengan fade in
        exit={{ opacity: 0, y: -100 }} // Exit animation ke atas
        transition={{ duration: 0.5, delay: 0.5, ease: "easeInOut" }}
        className="flex items-center gap-2 self-center text-xl tracking-wide"
      >
        {/* Logo container dengan styling konsisten */}
        <div className="flex h-8 w-8 mr-2 items-center justify-center rounded-md text-primary-foreground">
          <img src={brandLogo} alt="Logo Merek" />
        </div>
        {/* Brand text dengan font khusus */}
        <h1 className={`text-3xl tracking-wider ${logoFont}`}>MiSREd-IoT</h1>
      </motion.div>
      
      {/* Form container dengan animasi dan hover effect */}
      <motion.div
        initial={{ opacity: 0, y: -100 }} // Start dari atas dengan opacity 0
        animate={{ opacity: 1, y: 0 }} // Animate ke posisi normal
        exit={{ opacity: 0, y: -10 }} // Subtle exit animation
        whileHover={{ scale: 1.02 }} // Hover effect untuk interactivity
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="flex flex-col gap-6 rounded-2xl"
        {...props} // Spread additional props
      >
        {/* Card wrapper untuk form content */}
        <Card className="overflow-hidden p-0 z-10">
          <form className="p-6 md:p-8" onSubmit={handleForgotPassword}>
            <div className="flex flex-col gap-6">
              {/* Header section dengan title */}
              <div className="flex flex-col items-center text-center">
                <h1 className="font-bold text-xl text-balance">
                  Reset Kata Sandi
                </h1>
              </div>
              
              {/* Email input field dengan validation */}
              <div className="grid gap-3">
                <Label htmlFor="forgot-email">Email</Label>
                <Input
                  id="forgot-email"
                  type="email" // HTML5 email validation
                  placeholder="contoh@email.com" // Placeholder untuk guidance
                  value={email} // Controlled input dengan state
                  onChange={(e) => setEmail(e.target.value)} // Update state saat user mengetik
                  autoComplete="email" // Browser autocomplete support
                  noInfo // Custom prop untuk styling
                  required // Field wajib diisi
                />
              </div>
              
              {/* Submit button dengan loading state */}
              <Button
                type="submit"
                className="w-full cursor-pointer"
                disabled={isLoading} // Disable saat loading
              >
                {/* Dynamic text berdasarkan loading state */}
                {isLoading ? "Mengirim..." : "Kirim"}
              </Button>
              
              {/* Link kembali ke halaman login */}
              <div className="text-center text-sm">
                Kembali ke halaman{" "}
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)} // Toggle ke login form
                  className="cursor-pointer underline underline-offset-4"
                >
                  Masuk
                </button>
              </div>
            </div>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}

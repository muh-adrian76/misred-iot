// Import React hooks untuk state management dan DOM manipulation
import { useState, useRef, useEffect } from "react";

// Import komponen UI untuk form dan button elements
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Import komponen toast notification untuk feedback user
import { successToast, errorToast } from "../../other/toaster";

// Import utilities dan helper functions
import { fetchFromBackend } from "@/lib/helper";

// Import icons untuk visual indicators
import { Timer, RefreshCw } from "lucide-react";

// Komponen OTPInput untuk verifikasi kode OTP pada proses registrasi
export default function OTPInput({ 
  email, // Email address yang akan diverifikasi
  onVerified, // Callback function ketika verifikasi berhasil
  onBack, // Callback function untuk kembali ke form sebelumnya
  isLoading, // State loading untuk UI feedback
  setIsLoading // Setter untuk loading state
}) {
  // State management untuk OTP input fields (6 digit)
  const [otp, setOtp] = useState(["", "", "", "", "", ""]); // Array 6 digit untuk OTP
  // Timer state untuk countdown expiry OTP
  const [timeLeft, setTimeLeft] = useState(parseInt(process.env.NEXT_PUBLIC_OTP_TIME) * 60); // OTP timer dari environment variable
  const [canResend, setCanResend] = useState(false); // Flag untuk enable/disable resend button
  const [resendCooldown, setResendCooldown] = useState(0); // Cooldown timer untuk prevent spam resend
  
  // Ref array untuk focus management antar input fields
  const inputRefs = useRef([]);

  // Effect untuk timer countdown OTP expiry
  useEffect(() => {
    if (timeLeft > 0) {
      // Set timeout untuk countdown setiap detik
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer); // Cleanup timeout
    } else {
      // Enable resend button ketika timer habis
      setCanResend(true);
    }
  }, [timeLeft]); // Dependency: re-run ketika timeLeft berubah

  // Effect untuk resend cooldown timer (prevent spam)
  useEffect(() => {
    if (resendCooldown > 0) {
      // Set timeout untuk cooldown setiap detik
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer); // Cleanup timeout
    }
  }, [resendCooldown]); // Dependency: re-run ketika resendCooldown berubah

  // Helper function untuk format time display (MM:SS)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60); // Hitung menit
    const secs = seconds % 60; // Hitung detik sisa
    return `${mins}:${secs.toString().padStart(2, '0')}`; // Format dengan leading zero
  };

  // Handler untuk perubahan input OTP dengan paste support
  const handleOtpChange = (index, value) => {
    // Handle paste operation (multiple characters)
    if (value.length > 1) {
      // Extract maksimal 6 digit dari pasted data
      const pastedData = value.slice(0, 6).split('');
      const newOtp = [...otp]; // Copy current OTP array
      
      // Populate array dengan pasted data (hanya digit)
      pastedData.forEach((char, i) => {
        if (index + i < 6 && /^\d$/.test(char)) { // Validasi digit dan index bounds
          newOtp[index + i] = char;
        }
      });
      setOtp(newOtp); // Update state
      
      // Auto focus ke input berikutnya setelah paste
      const nextIndex = Math.min(index + pastedData.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    // Handle single character input (normal typing)
    if (/^\d*$/.test(value)) { // Validasi hanya digit
      const newOtp = [...otp]; // Copy current array
      newOtp[index] = value; // Update digit di index tertentu
      setOtp(newOtp); // Update state

      // Auto focus ke input berikutnya setelah input digit
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  // Handler untuk keyboard navigation (backspace behavior)
  const handleKeyDown = (index, e) => {
    // Backspace: focus ke input sebelumnya jika current input kosong
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handler untuk verifikasi OTP ke backend
  const handleVerifyOTP = async (e) => {
    e.preventDefault(); // Prevent default form submission
    const otpCode = otp.join(''); // Gabungkan array jadi string
    
    // Validasi OTP length (harus 6 digit)
    if (otpCode.length !== 6) {
      errorToast("Peringatan", "Mohon masukkan kode OTP 6 digit!");
      return;
    }

    setIsLoading(true); // Show loading state
    try {
      // Request verifikasi ke backend
      const res = await fetchFromBackend("/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ email, otp: otpCode }),
      });

      // Handle response error
      if (!res.ok) {
        const errorMessage = await res.json();
        errorToast("Verifikasi Gagal", errorMessage.message || "Kode OTP tidak valid!");
        return;
      }

      // Success: tampilkan message dan callback
      successToast("Verifikasi Berhasil!", "Akun Anda telah aktif. Silakan login.");
      onVerified(); // Trigger callback untuk navigate
    } catch (error) {
      // Handle network atau server error
      errorToast("Terjadi kesalahan", "Gagal memverifikasi OTP, coba lagi nanti!");
    } finally {
      setIsLoading(false); // Reset loading state
    }
  };

  // Handler untuk resend OTP dengan rate limiting
  const handleResendOTP = async () => {
    // Check apakah bisa resend (tidak dalam cooldown)
    if (!canResend || resendCooldown > 0) return;

    setIsLoading(true); // Show loading state
    try {
      // Request OTP baru dari backend
      const res = await fetchFromBackend("/auth/resend-otp", {
        method: "POST",
        body: JSON.stringify({ email }),
      });

      // Handle response error
      if (!res.ok) {
        const errorMessage = await res.json();
        errorToast("Gagal Kirim Ulang", errorMessage.message || "Gagal mengirim ulang OTP!");
        return;
      }

      // Extract OTP baru dari response
      const { otp: newOtp } = await res.json();
      
      // Kirim email notification dengan OTP baru
      await fetch("/api/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email, // Email tujuan
          otp: newOtp, // OTP code baru
          type: "otp-verification" // Template type
        }),
      });

      // Success feedback dan reset states
      successToast("OTP Terkirim!", "Kode verifikasi baru telah dikirim ke email Anda.");
      setTimeLeft(parseInt(process.env.NEXT_PUBLIC_OTP_TIME) * 60); // Reset timer OTP
      setCanResend(false); // Disable resend button
      setResendCooldown(60); // Set cooldown 60 detik untuk prevent spam
      setOtp(["", "", "", "", "", ""]); // Reset OTP input fields
    } catch (error) {
      // Handle error
      errorToast("Terjadi kesalahan", "Gagal mengirim ulang OTP!");
    } finally {
      setIsLoading(false); // Reset loading state
    }
  };

  // Render UI component dengan form layout dan responsive design
  return (
    <div className="grid gap-6">
      {/* Email confirmation section */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-4">
          Kode verifikasi telah dikirim ke email:
        </p>
        {/* Display email address dengan styling */}
        <p className="text-sm font-medium text-primary">{email}</p>
      </div>

      {/* OTP verification form */}
      <form onSubmit={handleVerifyOTP}>
        <div className="grid gap-4">
          {/* OTP input fields section */}
          <div className="grid gap-3">
            <Label className="text-center">Masukkan Kode Verifikasi 6 Digit</Label>
            {/* 6 digit OTP input fields dengan auto-focus */}
            <div className="flex gap-2 justify-center">
              {otp.map((digit, index) => (
                <Input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)} // Ref untuk focus management
                  type="text"
                  inputMode="numeric" // Mobile keyboard optimization
                  maxLength={6} // Allow paste operation dengan 6 digit
                  noInfo // Custom prop untuk hide info text
                  value={digit} // Controlled input
                  onChange={(e) => handleOtpChange(index, e.target.value)} // Handle input change
                  onKeyDown={(e) => handleKeyDown(index, e)} // Handle keyboard navigation
                  className="w-12 h-12 text-center text-lg font-bold" // Styling untuk OTP input
                  autoComplete="one-time-code" // Browser autocomplete hint
                />
              ))}
            </div>
          </div>

          {/* Timer display dengan countdown visual */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Timer className="w-4 h-4" />
            <span>
              {/* Dynamic text berdasarkan timer status */}
              {timeLeft > 0 ? `Berlaku hingga ${formatTime(timeLeft)}` : "Kode telah kedaluwarsa"}
            </span>
          </div>

          {/* Submit button dengan conditional disable */}
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || otp.join('').length !== 6} // Disable jika loading atau OTP belum lengkap
          >
            {/* Dynamic text berdasarkan loading state */}
            {isLoading ? "Memverifikasi..." : "Verifikasi"}
          </Button>

          {/* Action buttons section */}
          <div className="flex flex-col gap-2">
            {/* Resend OTP button dengan cooldown */}
            <Button
              type="button"
              variant="outline"
              onClick={handleResendOTP}
              disabled={!canResend || resendCooldown > 0 || isLoading} // Multiple disable conditions
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {/* Dynamic text berdasarkan cooldown dan canResend status */}
              {resendCooldown > 0 
                ? `Kirim Ulang (${resendCooldown}s)` 
                : canResend 
                  ? "Kirim Ulang OTP" 
                  : "Kirim Ulang OTP"
              }
            </Button>

            {/* Back button untuk kembali ke form registrasi */}
            <Button
              type="button"
              variant="ghost"
              onClick={onBack} // Callback untuk navigation back
              className="w-full text-sm"
            >
              Kembali ke Halaman Registrasi
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

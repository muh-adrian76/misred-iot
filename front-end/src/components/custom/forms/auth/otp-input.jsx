import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { successToast, errorToast } from "../../other/toaster";
import { fetchFromBackend } from "@/lib/helper";
import { Timer, RefreshCw } from "lucide-react";

export default function OTPInput({ 
  email, 
  onVerified, 
  onBack,
  isLoading,
  setIsLoading 
}) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timeLeft, setTimeLeft] = useState(600); // 10 menit dalam detik
  const [canResend, setCanResend] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef([]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      // Handle paste
      const pastedData = value.slice(0, 6).split('');
      const newOtp = [...otp];
      pastedData.forEach((char, i) => {
        if (index + i < 6 && /^\d$/.test(char)) {
          newOtp[index + i] = char;
        }
      });
      setOtp(newOtp);
      
      // Focus on the next empty input or last input
      const nextIndex = Math.min(index + pastedData.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    if (/^\d*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Auto focus next input
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      errorToast("Peringatan", "Mohon masukkan kode OTP 6 digit!");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetchFromBackend("/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ email, otp: otpCode }),
      });

      if (!res.ok) {
        const errorMessage = await res.json();
        errorToast("Verifikasi Gagal", errorMessage.message || "Kode OTP tidak valid!");
        return;
      }

      successToast("Verifikasi Berhasil!", "Akun Anda telah aktif. Silakan login.");
      onVerified();
    } catch (error) {
      errorToast("Terjadi kesalahan", "Gagal memverifikasi OTP, coba lagi nanti!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend || resendCooldown > 0) return;

    setIsLoading(true);
    try {
      const res = await fetchFromBackend("/auth/resend-otp", {
        method: "POST",
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const errorMessage = await res.json();
        errorToast("Gagal Kirim Ulang", errorMessage.message || "Gagal mengirim ulang OTP!");
        return;
      }

      // Kirim email OTP baru
      const { otp: newOtp } = await res.json();
      await fetch("/api/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email, 
          otp: newOtp, 
          type: "otp-verification" 
        }),
      });

      successToast("OTP Terkirim!", "Kode verifikasi baru telah dikirim ke email Anda.");
      setTimeLeft(600); // Reset timer ke 10 menit
      setCanResend(false);
      setResendCooldown(60); // Cooldown 60 detik untuk resend
      setOtp(["", "", "", "", "", ""]); // Reset OTP input
    } catch (error) {
      errorToast("Terjadi kesalahan", "Gagal mengirim ulang OTP!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid gap-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Verifikasi Akun</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Kode verifikasi telah dikirim ke email:
        </p>
        <p className="text-sm font-medium text-primary">{email}</p>
      </div>

      <form onSubmit={handleVerifyOTP}>
        <div className="grid gap-4">
          <div className="grid gap-3">
            <Label className="text-center">Masukkan Kode Verifikasi 6 Digit</Label>
            <div className="flex gap-2 justify-center">
              {otp.map((digit, index) => (
                <Input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-12 text-center text-lg font-bold"
                  autoComplete="one-time-code"
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Timer className="w-4 h-4" />
            <span>
              {timeLeft > 0 ? `Berlaku hingga ${formatTime(timeLeft)}` : "Kode telah kedaluwarsa"}
            </span>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || otp.join('').length !== 6}
          >
            {isLoading ? "Memverifikasi..." : "Verifikasi"}
          </Button>

          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleResendOTP}
              disabled={!canResend || resendCooldown > 0 || isLoading}
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {resendCooldown > 0 
                ? `Kirim Ulang (${resendCooldown}s)` 
                : canResend 
                  ? "Kirim Ulang OTP" 
                  : "Kirim Ulang OTP"
              }
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={onBack}
              className="w-full text-sm"
            >
              Kembali ke Registrasi
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

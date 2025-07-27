import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { successToast, errorToast } from "../../other/toaster";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import { fetchFromBackend } from "@/lib/helper";
import { brandLogo } from "@/lib/helper";
import GoogleButton from "../../buttons/google-button";
import { PasswordStrengthMeter } from "../../other/strength-meter";
import OTPInput from "./otp-input";

export default function RegisterForm({
  className,
  logoFont,
  router,
  setUser,
  isLoading,
  setIsLoading,
  setShowRegister,
  ...props
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showOTPInput, setShowOTPInput] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!email || !password) {
      errorToast("Peringatan", "Email dan password tidak boleh kosong!");
      setIsLoading(false);
      return;
    }
    if (password.length < 6) {
      errorToast("Peringatan", "Password harus lebih dari 6 karakter!");
      setIsLoading(false);
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      errorToast("Peringatan", "Email tidak valid!");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetchFromBackend("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const errorMessage = await res.json();
        errorToast(
          "Registrasi Gagal",
          errorMessage.message || "Gagal registrasi, coba lagi nanti!"
        );
        return;
      }

      const { otp } = await res.json();

      // Kirim OTP ke email
      await fetch("/api/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email, 
          otp, 
          type: "otp-verification" 
        }),
      });

      successToast("Registrasi Berhasil!", "Kode verifikasi telah dikirim ke email Anda.");
      setRegisteredEmail(email);
      setShowOTPInput(true);

    } catch (error) {
      errorToast("Terjadi kesalahan", "Gagal melakukan registrasi, coba lagi nanti!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPVerified = () => {
    setShowOTPInput(false);
    setShowRegister(false); // Kembali ke login form
  };

  const handleBackToRegister = () => {
    setShowOTPInput(false);
    setEmail("");
    setPassword("");
    setRegisteredEmail("");
  };

  return (
    <div className="flex z-10 w-full max-w-sm flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="flex items-center gap-2 self-center text-xl tracking-wide
        "
      >
        <div className="flex h-8 w-8 mr-2 items-center justify-center rounded-md text-primary-foreground">
          <img src={brandLogo} alt="Logo" />
        </div>
        <h1 className={`text-3xl tracking-wider ${logoFont}`}>MiSREd-IoT</h1>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        whileHover={{ scale: 1.02 }}
        className={cn("flex flex-col gap-6 rounded-2xl", className)}
        {...props}
      >
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl mb-3">
              {showOTPInput ? "Verifikasi Akun" : "Registrasi Akun"}
            </CardTitle>
            <CardDescription>{""}</CardDescription>
          </CardHeader>
          <CardContent>
            {showOTPInput ? (
              <OTPInput
                email={registeredEmail}
                onVerified={handleOTPVerified}
                onBack={handleBackToRegister}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
              />
            ) : (
              <form onSubmit={handleRegister}>
              <div className="grid gap-6">
                <div className="grid gap-6">
                  <div className="grid gap-3">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="contoh@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      noInfo
                      required
                    />
                  </div>
                  <div className="grid gap-3">
                    <div className="flex items-center">
                      <Label htmlFor="password">Kata Sandi</Label>
                    </div>
                    <div>
                      <PasswordStrengthMeter
                        id="password"
                        placeholder="Masukkan password baru"
                        value={password}
                        className="max-w-md"
                        onChange={(e) => setPassword(e.target.value)}
                        strengthLabels={{
                          empty: "Kosong",
                          weak: "Lemah",
                          fair: "Cukup",
                          good: "Bagus",
                          strong: "Kuat",
                        }}
                        enableAutoGenerate={true}
                        autoComplete="current-password"
                        autoGenerateLength={10}
                        required
                      />
                      <span className="px-1 text-sm text-pretty opacity-100 flex pt-2 text-muted-foreground transition-all duration-100 ease-out max-sm:text-xs">
                        <i>Karakter alfanumerik dibatasi hanya (@ / . - _)</i>
                      </span>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full cursor-pointer"
                    disabled={isLoading}
                  >
                    {isLoading ? "Memproses..." : "Daftar"}
                  </Button>
                </div>
                <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                  <span className="bg-transparent text-muted-foreground relative z-10 px-2">
                    Atau
                  </span>
                </div>
                <div className="flex flex-col gap-4">
                  <GoogleButton
                    router={router}
                    action="Daftar"
                    isLoading={isLoading}
                    setIsLoading={setIsLoading}
                    setUser={setUser}
                  />
                </div>
                <div className="text-center text-sm">
                  Kembali ke halaman{" "}
                  <button
                    type="button"
                    onClick={() => setShowRegister(false)}
                    className="cursor-pointer underline underline-offset-4"
                  >
                    Log In
                  </button>
                </div>
              </div>
            </form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

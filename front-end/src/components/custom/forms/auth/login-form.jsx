// Import hooks dan utilities
import { useState } from "react";
import { motion } from "framer-motion"; // Animasi transisi

// Import komponen UI
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Import komponen custom dan utilities
import { errorToast } from "../../other/toaster";
import { Link } from "next-view-transitions";
import { brandLogo, fetchFromBackend } from "@/lib/helper";
import GoogleButton from "../../buttons/google-button";
import { Eye, EyeOff } from "lucide-react"; // Icons untuk toggle password visibility
import OTPModal from "./otp-modal"; // Modal untuk verifikasi OTP

// Komponen LoginForm untuk autentikasi user ke sistem IoT
export default function LoginForm({
  className, // Custom CSS classes
  logoFont, // Font untuk logo branding
  router, // Next.js router untuk navigasi
  setUser, // Setter untuk user state setelah login berhasil
  isLoading, // State loading global
  setIsLoading, // Setter untuk loading state
  setShowRegister, // Handler untuk switch ke register mode
  setShowForgotPassword, // Handler untuk switch ke forgot password mode
  ...props
}) {
  // State management untuk form login
  const [email, setEmail] = useState(""); // Email user untuk login
  const [password, setPassword] = useState(""); // Password user
  const [showPassword, setShowPassword] = useState(false); // Toggle visibility password
  const [showOTPModal, setShowOTPModal] = useState(false); // State untuk modal OTP
  const [unverifiedEmail, setUnverifiedEmail] = useState(""); // Email yang belum terverifikasi

  // Handler untuk proses login
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true); // Set loading state
    
    try {
      // Request login ke backend API
      const res = await fetchFromBackend("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        // Handle error response dari server
        // Check jika akun belum diverifikasi email
        if (data.message && data.message.includes("belum diverifikasi")) {
          setUnverifiedEmail(email); // Simpan email untuk OTP modal
          setShowOTPModal(true); // Tampilkan modal OTP
        } else {
          // Tampilkan error message untuk kasus lain
          errorToast("Login gagal!", `${data.message}`);
        }
      } else {
        setTimeout(() => {
          setUser(data.user);
          router.push("/dashboards");
        }, 100);
      }
    } catch (error) {
      errorToast("Terjadi kesalahan, coba lagi nanti!", `${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPVerified = () => {
    setShowOTPModal(false);
    setUnverifiedEmail("");
    // Clear form untuk login ulang
    setPassword("");
  };

  return (
    <>
      <div className="w-full max-w-sm z-10">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        whileHover={{ scale: 1.02 }}
        className="flex flex-col gap-6"
        {...props}
      >
        <Card className="overflow-hidden p-0">
          <form className="p-6 md:p-8" onSubmit={handleLogin}>
            <div className="flex flex-col gap-6">
              <div className="flex gap-4 mb-4 justify-center items-center">
                <Link href="/auth" className="flex gap-3 items-center">
                  <div className="flex h-8 w-8 mr-2 items-center justify-center rounded-md text-primary-foreground">
                    <img src={brandLogo} alt="Logo Merek" />
                  </div>
                  <h1 className={`text-3xl tracking-wider ${logoFont}`}>
                    MiSREd-IoT
                  </h1>
                </Link>
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="email">Email</Label>
                  <button
                    type="button"
                    className="ml-auto text-sm underline-offset-2 underline cursor-pointer"
                    onClick={() => setShowRegister(true)}
                  >
                    Belum punya akun ?
                  </button>
                </div>
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
                  <button
                    type="button"
                    className="ml-auto text-sm underline-offset-2 underline cursor-pointer"
                    onClick={() => setShowForgotPassword(true)}
                  >
                    Lupa kata sandi ?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    className="pr-10"
                    type={showPassword ? "text" : "password"}
                    placeholder="********"
                    value={password}
                    minLength={8}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    noInfo
                    required
                  />
                  <div className="absolute inset-y-0 right-0 cursor-pointer flex items-center pr-3">
                    {showPassword ? (
                      <Eye
                        className="relative h-5 w-5"
                        onClick={() => setShowPassword(false)}
                      />
                    ) : (
                      <EyeOff
                        className="relative h-5 w-5"
                        onClick={() => setShowPassword(true)}
                      />
                    )}
                  </div>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full cursor-pointer"
                disabled={isLoading}
              >
                {isLoading ? "Memproses..." : "Masuk"}
              </Button>
              <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                <span className="bg-transparent text-muted-foreground relative z-10 px-2">
                  Atau
                </span>
              </div>
              <div className="grid grid-cols-1">
                <GoogleButton
                  router={router}
                  action="Masuk"
                  isLoading={isLoading}
                  setIsLoading={setIsLoading}
                  setUser={setUser}
                />
              </div>
            </div>
          </form>
        </Card>
      </motion.div>
    </div>

  {/* Modal OTP untuk verifikasi akun yang belum aktif */}
    <OTPModal
      isOpen={showOTPModal}
      onClose={() => setShowOTPModal(false)}
      email={unverifiedEmail}
      onVerified={handleOTPVerified}
      isLoading={isLoading}
      setIsLoading={setIsLoading}
    />
  </>
  );
}

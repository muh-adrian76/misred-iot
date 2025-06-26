import { useState } from "react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import showToast from "@/components/custom/other/toaster";

import { brandLogo, fetchFromBackend } from "@/lib/helper";
import GoogleButton from "../../buttons/google-button";
import { Eye, EyeOff } from "lucide-react";

export default function LoginForm({
  className,
  router,
  setUser,
  isLoading,
  setIsLoading,
  setShowRegister,
  setShowForgotPassword,
  ...props
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetchFromBackend("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      !res.ok
        ? showToast("warning", "Login gagal!", `${data.message}`)
        : setTimeout(() => {
            setUser(data.user);
            router.push("/dashboards");
          }, 100);
    } catch (error) {
      showToast(
        "error",
        "Terjadi kesalahan, coba lagi nanti!",
        `${error.message}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
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
              <div className="flex flex-col items-center text-center">
                <div className="flex gap-4 mb-4">
                  <div className="flex h-8 w-8 mr-2 items-center justify-center rounded-md text-primary-foreground">
                    <img src={brandLogo} alt="Logo" />
                  </div>
                  <h1 className="text-2xl tracking-wider font-bold">
                    MiSREd-IoT
                  </h1>
                </div>
                {/* <p className="text-muted-foreground text-balance">
                  Isi email dan password untuk masuk ke akun Anda.
                </p> */}
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="email">Email</Label>
                  <button
                    type="button"
                    className="ml-auto text-sm underline-offset-2 hover:underline cursor-pointer"
                    onClick={() => setShowRegister(true)}
                  >
                    Belum punya akun?
                  </button>
                </div>
                <Input
                  id="email"
                  type="email"
                  placeholder="contoh@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <button
                    type="button"
                    className="ml-auto text-sm underline-offset-2 hover:underline cursor-pointer"
                    onClick={() => setShowForgotPassword(true)}
                  >
                    Lupa password?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    className="pr-10"
                    type={showPassword ? "text" : "password"}
                    placeholder="********"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
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
                <span className="bg-card text-muted-foreground relative z-10 px-2">
                  Atau
                </span>
              </div>
              <div className="grid grid-cols-1">
                <GoogleButton
                  router={router}
                  action="Log In"
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
  );
}

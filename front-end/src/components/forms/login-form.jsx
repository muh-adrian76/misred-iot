"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "next-view-transitions";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { showToast } from "@/components/features/toaster";

import { brandLogo, fetchFromBackend } from "@/lib/helper";
import { useUser } from "@/providers/user-provider";
import GoogleButton from "../buttons/google-button";
import ForgotPasswordButton from "../buttons/forgot-password-button";

export function LoginForm({ ...props }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const router = useRouter();
  const { setUser } = useUser();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetchFromBackend("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      !res.ok
        ? showToast("warning", "Login gagal!", `${data.message}`)
        : setTimeout(() => {
            setUser(data.user);
            router.push("/dashboards");
          }, 500);
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
    <AnimatePresence mode="wait">
      {!showForgotPassword ? (
        <motion.div
          key="Login"
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
                      Misred-IoT
                    </h1>
                  </div>
                  <p className="text-muted-foreground text-balance">
                    Isi email dan password untuk masuk ke akun Anda.
                  </p>
                </div>
                <div className="grid gap-3">
                  <div className="flex items-center">
                    <Label htmlFor="email">Email</Label>
                    <Link
                      href={"/register"}
                      className="ml-auto text-sm underline-offset-2 hover:underline"
                    >
                      Belum punya akun?
                    </Link>
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
                      onClick={() => setShowForgotPassword(true)} // Tampilkan form lupa password
                    >
                      Lupa password?
                    </button>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="********"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
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
      ) : (
        <ForgotPasswordButton
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          setShowForgotPassword={setShowForgotPassword}
        />
      )}
    </AnimatePresence>
  );
}

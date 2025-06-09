"use client";

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
import { showToast } from "@/components/features/toaster";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import { fetchFromBackend } from "@/lib/helper";
import { brandLogo } from "@/lib/helper";
import GoogleButton from "../buttons/google-button";

export default function RegisterForm({
  className,
  router,
  setUser,
  isLoading,
  setIsLoading,
  setShowRegister,
  ...props
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!email || !password) {
      showToast(
        "warning",
        "Peringatan",
        "Email dan password tidak boleh kosong!"
      );
      return;
    }
    if (password.length < 6) {
      showToast(
        "warning",
        "Peringatan",
        "Password harus lebih dari 6 karakter!"
      );
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      showToast("warning", "Peringatan", "Email tidak valid!");
      return;
    }

    try {
      const res = await fetchFromBackend("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const errorMessage = await res.json();
        showToast(
          "warning",
          errorMessage.message || "Gagal registrasi, coba lagi nanti!"
        );
        return;
      }

      showToast("success", "Registrasi berhasil!");

      setTimeout(async () => {
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
              }, 500);
        } catch {
          showToast("warning", "Peringatan", "Gagal melakukan login.");
        }
      }, 500);
    } catch (error) {
      showToast("error", "Terjadi kesalahan, coba lagi nanti!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
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
        MiSREd-IoT
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
            <CardTitle className="text-xl mb-3">Registrasi Akun</CardTitle>
            <CardDescription>Tolong isi informasi berikut</CardDescription>
          </CardHeader>
          <CardContent>
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
                      required
                    />
                  </div>
                  <div className="grid gap-3">
                    <div className="flex items-center">
                      <Label htmlFor="password">Password</Label>
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
                    {isLoading ? "Memproses..." : "Daftar"}
                  </Button>
                </div>
                <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                  <span className="bg-card text-muted-foreground relative z-10 px-2">
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
                    Login
                  </button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

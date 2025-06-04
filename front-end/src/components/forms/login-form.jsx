"use client";

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { showToast } from "@/components/features/toaster"
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useGoogleLogin } from '@react-oauth/google';
import { GoogleIcon } from "@/components/icons/google";

export function LoginForm({
  className,
  ...props
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const router = useRouter();

  const validateForm = () => {
    let isValid = true;

    if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError("Email tidak valid. Contoh: user@example.com");
      isValid = false;
    } else {
      setEmailError("");
    }

    if (password.length < 6) {
      setPasswordError("Password harus memiliki minimal 6 karakter.");
      isValid = false;
    } else {
      setPasswordError("");
    }

    return isValid;
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const { message } = await res.json();
        showToast("warning", "Login gagal!", `${message}`);
      } else {
        const data = await res.json();
        showToast("success", "Login berhasil!", `Selamat datang, ${data.user.name}`);
        setTimeout(() => {
          router.push("/dashboards");
        }, 1500);
      }
    } catch (error) {
      showToast("error", "Terjadi kesalahan, coba lagi nanti!", `${error.message}`);
    }
  };

  // Google login handler
  const googleLogin = useGoogleLogin({
    flow: "auth-code",
    onSuccess: async ({ code }) => {
      try {
        const res = await fetch("/api/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });
        if (res.ok) {
          const data = await res.json();
          showToast("success", "Login Google berhasil!", `Selamat datang, ${data.user.name}`);
          setTimeout(() => router.push("/dashboards"), 500);
        } else {
          showToast("error", "Google login gagal!", `${data.message}`)
        }
      } catch {
        showToast("error", "Google login gagal!", `${res.message}`)
      }
    },
    onError: () => showToast("error", "Google login gagal!", "Silahkan login kembali"),
  });

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handleLogin}>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl tracking-wider font-bold">Misred-IoT</h1>
                <p className="text-muted-foreground text-balance">
                  Sistem Pemantauan Limbah Cair Industri
                </p>
              </div>
              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="contoh@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                {emailError && (
                  <span className="text-sm text-red-500">{emailError}</span>
                )}
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href={"/forgot-password"}
                    className="ml-auto text-sm underline-offset-2 hover:underline"
                  >
                    Lupa password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                {passwordError && (
                  <span className="text-sm text-red-500">{passwordError}</span>
                )}
              </div>
              <Button type="submit" className="w-full">
                Masuk
              </Button>
              <div
                className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t"
              >
                <span className="bg-card text-muted-foreground relative z-10 px-2">
                  Atau
                </span>
              </div>
              <div className="grid grid-cols-1">
                <Button
                  variant="outline"
                  type="button"
                  className="w-full flex items-center justify-center gap-2 border-gray-300 hover:bg-gray-100"
                  onClick={() => googleLogin()}
                >
                  <GoogleIcon className="w-5 h-5" />
                  Login dengan Google
                </Button>
              </div>
              <div className="text-center text-sm">
                Belum punya akun?{" "}
                <Link
                  href={"/register"}
                  className="underline ml-1 underline-offset-4"
                >
                  Daftar
                </Link>
              </div>
            </div>
          </form>
          <div className="bg-muted relative hidden md:block">
            <img
              src="/vector-auth.png"
              alt="Image"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

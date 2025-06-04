"use client";

import { cn } from "@/lib/utils";
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
import { useGoogleLogin } from "@react-oauth/google";
import Link from "next/link";
import { showToast } from "@/components/features/toaster";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { GoogleIcon } from "../icons/google";

export function RegisterForm({ className, ...props }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  // Google login handler
  const googleLogin = useGoogleLogin({
    flow: "auth-code",
    onSuccess: async ({ code }) => {
      try {
        const res = await fetch(
          "/api/auth/google",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code }),
          }
        );
        if (res.ok) {
          const data = await res.json();
          showToast(
            "success",
            "Login Google berhasil!",
            `Selamat datang, ${data.user.name}`
          );
          setTimeout(() => router.push("/dashboards"), 1500);
        } else {
          showToast("warning", "Google login gagal!");
        }
      } catch {
        showToast("error", "Google login gagal!");
      }
    },
    onError: () => toast.error("Google login gagal!"),
  });

  const handleRegister = async (e) => {
    e.preventDefault();
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
      const res = await fetch(
        "/api/auth/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );

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
          const login = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/login`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email, password }),
              credentials: "include",
            }
          );
          setTimeout(() => {
            router.push("/dashboards");
          }, 500);
        } catch {
          showToast("warning", "Peringatan", "Gagal melakukan login.");
        }
      }, 500);
    } catch (error) {
      showToast("error", "Terjadi kesalahan, coba lagi nanti!");
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Registrasi Akun</CardTitle>
          <CardDescription>
            Tolong isi informasi berikut untuk mendaftar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister}>
            <div className="grid gap-6">
              <div className="flex flex-col gap-4">
                <Button
                  variant="outline"
                  type="button"
                  className="w-full"
                  onClick={() => googleLogin()}
                >
                  <GoogleIcon className="h-5 w-5" />
                  Daftar dengan Google
                </Button>
              </div>
              <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                <span className="bg-card text-muted-foreground relative z-10 px-2">
                  Atau
                </span>
              </div>
              <div className="grid gap-6">
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
                </div>
                <div className="grid gap-3">
                  <div className="flex items-center">
                    <Label htmlFor="password">Password</Label>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="******"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Daftar
                </Button>
              </div>
              <div className="text-center text-sm">
                Kembali ke halaman{" "}
                <Link href={"/login"} className="underline underline-offset-4">
                  Login
                </Link>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

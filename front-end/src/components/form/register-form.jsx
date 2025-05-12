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
import { IconBrandGoogleFilled } from "@tabler/icons-react"
import Link  from "next/link";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function RegisterForm({ className, ...props }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Email dan password tidak boleh kosong!");
      return;
    }
    if (password.length < 6) {
      toast.error("Password harus lebih dari 6 karakter!");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      toast.error("Email tidak valid!");
      return;
    }
    try {
      const res = await fetch("http://localhost:7600/user/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        toast.success("Registrasi berhasil!"); // Tampilkan toast sukses
        setTimeout(() => {
          router.push("/login"); // Redirect ke halaman login setelah registrasi berhasil
        }, 2000);
      } else {
        const errorMessage = await res.text();
        toast.error(errorMessage || "Gagal registrasi, coba lagi nanti!");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan, coba lagi nanti!");
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
                <Button variant="outline" className="w-full">
                  <IconBrandGoogleFilled className="h-4 w-4" />
                  Masuk dengan Akun Google
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
        <ToastContainer autoClose={1500}/>
      </Card>
    </div>
  );
}

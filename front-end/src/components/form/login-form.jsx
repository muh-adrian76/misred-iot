"use client";
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { IconBrandGoogleFilled } from "@tabler/icons-react"
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm({
  className,
  ...props
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:7600/user/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const errorMessage = await res.text();
        toast.error(errorMessage); 
      } else {
        const data = await res.json();
        localStorage.setItem("accessToken", data.accessToken); // Simpan JWT di localStorage
        toast.success("Login berhasil!");
        
        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      }
    } catch (error) {
      toast.error("Terjadi kesalahan, coba lagi nanti!");
    }
  };
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handleLogin}>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl tracking-wider font-bold">Misred-Sparing</h1>
                <p className="text-muted-foreground text-balance">
                  Sistem Pemantauan Limbah Cair Industri
                </p>
              </div>
              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="contoh@email.com" value={email}
              onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <Link href={'/forgot-password'} className="ml-auto text-sm underline-offset-2 hover:underline">Lupa password?</Link>
                </div>
                <Input id="password" type="password" placeholder="********" value={password}
              onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full">
                Masuk
              </Button>
              <div
                className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                <span className="bg-card text-muted-foreground relative z-10 px-2">
                  Atau
                </span>
              </div>
              <div className="grid grid-cols-1">
                <Button variant="outline" type="button" className="w-full">
                  <IconBrandGoogleFilled className="h-4 w-4" />
                  <span className="mx-1">Masuk dengan Akun Google</span>
                </Button>
              </div>
              <div className="text-center text-sm">
                Belum punya akun?{" "}
                <Link href={"/register"} className="underline ml-1 underline-offset-4">Daftar</Link>
              </div>
            </div>
          </form>
          <div className="bg-muted relative hidden md:block">
            <img
              src="/vector-auth.png"
              alt="Image"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale" />
          </div>
        </CardContent>
        <ToastContainer autoClose={1000}/>
      </Card>
    </div>
  );
}

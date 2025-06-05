"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { showToast } from "@/components/features/toaster";
import { useGoogleLogin } from "@react-oauth/google";
import { GoogleIcon } from "@/components/icons/google";

import { cn } from "@/lib/utils";
import { fetchFromBackend } from "@/lib/helper";
import { useUser } from "@/contexts/user-context";

export function LoginForm({ className, ...props }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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

  // Google login handler
  const googleLogin = useGoogleLogin({
    flow: "auth-code",
    onSuccess: async ({ code }) => {
      setIsLoading(true);
      try {
        const res = await fetchFromBackend("/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });
        const data = await res.json();

        !res.ok
          ? showToast("error", "Google login gagal!", `${data.message}`)
          : setTimeout(() => {
            setUser(data.user);
              router.push("/dashboards");
            }, 500);
      } catch (error) {
        showToast("error", "Google login gagal!", `${error.message}`);
      } finally {
        setIsLoading(false); 
      }
    },
    onError: () =>
      showToast("error", "Google login gagal!", "Silahkan login kembali"),
  });

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        {/* <CardContent className="grid p-0 md:grid-cols-2"> */}
          <form className="p-6 md:p-8" onSubmit={handleLogin}>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <div className="flex gap-4 mb-4">
                <div className="flex h-8 w-8 mr-2 items-center justify-center rounded-md text-primary-foreground">
                  <img src="/misred-logo-red.svg" alt="" />
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
                  required
                />
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
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Memproses..." : "Masuk"}
              </Button>
              <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
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
                  disabled={isLoading}
                >
                  <GoogleIcon className="w-5 h-5 mr-2" />
                  Login dengan Gmail
                </Button>
              </div>
            </div>
          </form>
          {/* <div className="bg-muted relative hidden md:block">
            <img
              src="/vector-auth.png"
              alt="Image"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div> */}
        {/* </CardContent> */}
      </Card>
    </div>
  );
}

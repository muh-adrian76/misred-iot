import { useState } from "react";
import { successToast, errorToast } from "../../other/toaster";
import { Card } from "../../../ui/card";
import { Label } from "../../../ui/label";
import { Input } from "../../../ui/input";
import { Button } from "../../../ui/button";
import { motion } from "framer-motion";

import { fetchFromBackend } from "@/lib/helper";
import { brandLogo } from "@/lib/helper";

export default function ForgotPasswordForm({
  isLoading,
  logoFont,
  setIsLoading,
  setShowForgotPassword,
  ...props
}) {
  const [email, setEmail] = useState("");

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetchFromBackend("/auth/reset-forgotten-password", {
        method: "PUT",
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const errorMessage = await res.json();
        errorToast("Gagal melakukan reset password", errorMessage.message);
        return;
      }

      // Password baru untuk user
      const { updatedPassword } = await res.json();

      // Kirim email ke user
      await fetch("/api/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email, 
          password: updatedPassword, 
          type: "reset-password" 
        }),
      });

      successToast(
        "Email terkirim!",
        "Silakan cek email Anda pada bagian kotak masuk atau spam."
      );
      setTimeout(() => setShowForgotPassword(false), 2000);
    } catch (error) {
      console.error("Pengiriman email gagal:", error);
      errorToast(
        "Gagal melakukan reset password!",
        error?.text ||
          error?.message ||
          "Pengiriman email gagal, coba lagi nanti."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex w-full z-10 max-w-sm flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -100 }}
        transition={{ duration: 0.5, delay: 0.5, ease: "easeInOut" }}
        className="flex items-center gap-2 self-center text-xl tracking-wide"
      >
        <div className="flex h-8 w-8 mr-2 items-center justify-center rounded-md text-primary-foreground">
          <img src={brandLogo} alt="Logo" />
        </div>
        <h1 className={`text-3xl tracking-wider ${logoFont}`}>MiSREd-IoT</h1>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: -100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="flex flex-col gap-6 rounded-2xl"
        {...props}
      >
        <Card className="overflow-hidden p-0 z-10">
          <form className="p-6 md:p-8" onSubmit={handleForgotPassword}>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <h1 className="font-bold text-xl text-balance">
                  Reset Kata Sandi
                </h1>
              </div>
              <div className="grid gap-3">
                <Label htmlFor="forgot-email">Email</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="contoh@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  noInfo
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full cursor-pointer"
                disabled={isLoading}
              >
                {isLoading ? "Mengirim..." : "Kirim"}
              </Button>
              <div className="text-center text-sm">
                Kembali ke halaman{" "}
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="cursor-pointer underline underline-offset-4"
                >
                  Log In
                </button>
              </div>
            </div>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}

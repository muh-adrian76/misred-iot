import { useState } from "react";
import showToast from "../../other/toaster";
import { Card } from "../../../ui/card";
import { Label } from "../../../ui/label";
import { Input } from "../../../ui/input";
import { Button } from "../../../ui/button";
import { motion } from "framer-motion";

import { brandLogo, fetchFromBackend } from "@/lib/helper";
import emailjs from "@emailjs/browser";

export default function ForgotPasswordForm({
  isLoading,
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

      const data = await res.json();

      if (!res.ok) {
        showToast("warning", "Gagal melakukan reset password", res.message);
        return;
      }

      // Password baru untuk user
      const { updatedPassword } = data;

      // // Kirim email menggunakan library Email JS
      await emailjs.send(
        process.env.NEXT_PUBLIC_EMAIL_SERVICE_ID,
        process.env.NEXT_PUBLIC_EMAIL_TEMPLATE_ID,
        // Parameter buatan untuk library EmailJS, sesuaikan dengan konten pada template
        {
          email: email,
          password: updatedPassword,
        },
        process.env.NEXT_PUBLIC_EMAIL_PUBLIC_KEY
      );

      // Kirim email menggunakan library Resend
      // const response = await fetch("/api/resend", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ email, password: updatedPassword }),
      // });

      showToast("success", "Email terkirim!", "Silakan cek email Anda.");
      setTimeout(() => setShowForgotPassword(false), 2000);
    } catch (error) {
      console.error("EmailJS Error:", error);
      showToast(
        "warning",
        "Gagal melakukan reset password!",
        error?.text || error?.message || "Terjadi kesalahan pada EmailJS"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
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
        MiSREd-IoT
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
                <p className="text-muted-foreground text-balance">
                  Masukkan email anda untuk me-reset password.
                </p>
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
                  Login
                </button>
              </div>
            </div>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}

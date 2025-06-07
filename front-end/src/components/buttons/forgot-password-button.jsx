import { AnimatePresence, motion } from "framer-motion";
import { showToast } from "../features/toaster";
import { Card } from "../ui/card";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

export default function ForgotPasswordButton({
  isLoading,
  setIsLoading,
  setShowForgotPassword,
  ...props
}) {
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      console.log("ok");
      //   const res = await fetchFromBackend("/auth/forgot-password", {
      //     method: "POST",
      //     headers: {
      //       "Content-Type": "application/json",
      //     },
      //     body: JSON.stringify({ email }),
      //   });
      //   const data = await res.json();

      //   !res.ok
      //     ? showToast("warning", "Gagal mengirim email!", `${data.message}`)
      //     : showToast(
      //         "success",
      //         "Email terkirim!",
      //         "Silakan cek email Anda untuk reset password."
      //       );
      setShowForgotPassword(false);
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
      <motion.div
        key="ForgotPassword"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[400px]"
        {...props}
      >
        <Card className="overflow-hidden p-0">
          <form className="p-6 md:p-8" onSubmit={handleForgotPassword}>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <p className="text-muted-foreground text-balance">
                  Masukkan email untuk me-reset password.
                </p>
              </div>
              <div className="grid gap-3">
                <Label htmlFor="forgot-email">Email yang telah terdaftar</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="contoh@email.com"
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
              <button
                type="button"
                className="text-sm underline-offset-2 hover:underline text-center cursor-pointer"
                onClick={() => setShowForgotPassword(false)}
              >
                Kembali ke Login
              </button>
            </div>
          </form>
        </Card>
      </motion.div>
  );
}

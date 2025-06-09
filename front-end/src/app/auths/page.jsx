"use client";
import { useState } from "react";
import { useUser } from "@/providers/user-provider";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { Glow, GlowArea } from "@/components/features/glow";

import LoginForm from "@/components/forms/login-form";
import RegisterForm from "@/components/forms/register-form";
import ForgotPasswordForm from "@/components/forms/forgot-password-form";

export default function Page() {
  const [isLoading, setIsLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const router = useRouter();
  const { setUser } = useUser();

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <AnimatePresence mode="wait">
        {!showForgotPassword && showRegister ? (
          <RegisterForm
            key="register"
            router={router}
            setUser={setUser}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            setShowRegister={setShowRegister}
          />
        ) : showForgotPassword && !showRegister ? (
          <ForgotPasswordForm
            key="forgot-password"
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            setShowForgotPassword={setShowForgotPassword}
          />
        ) : (
          <LoginForm
            key="login"
            router={router}
            setUser={setUser}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            setShowRegister={setShowRegister}
            setShowForgotPassword={setShowForgotPassword}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

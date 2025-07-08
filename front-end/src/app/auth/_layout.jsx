"use client";
import { useState } from "react";
import { useUser } from "@/providers/user-provider";
import { useTransitionRouter as useRouter } from "next-view-transitions";
import { AnimatePresence } from "framer-motion";

import LoginForm from "@/components/custom/forms/auth/login-form";
import RegisterForm from "@/components/custom/forms/auth/register-form";
import ForgotPasswordForm from "@/components/custom/forms/auth/forgot-password-form";
import localFont from "next/font/local";

const logoFont = localFont({
  src: "../../../public/logo-font.ttf",
});

export default function AuthLayout() {
  const [isLoading, setIsLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const router = useRouter();
  const { setUser } = useUser();

  return (
    <AnimatePresence mode="wait">
      {!showForgotPassword && showRegister ? (
        <RegisterForm
          key="register"
          logoFont={logoFont.className}
          router={router}
          setUser={setUser}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          setShowRegister={setShowRegister}
        />
      ) : showForgotPassword && !showRegister ? (
        <ForgotPasswordForm
          key="forgot-password"
          logoFont={logoFont.className}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          setShowForgotPassword={setShowForgotPassword}
        />
      ) : (
        <LoginForm
          key="login"
          logoFont={logoFont.className}
          router={router}
          setUser={setUser}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          setShowRegister={setShowRegister}
          setShowForgotPassword={setShowForgotPassword}
        />
      )}
    </AnimatePresence>
  );
}

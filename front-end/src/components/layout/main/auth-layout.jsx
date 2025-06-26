"use client";
import { useState } from "react";
import { useUser } from "@/providers/user-provider";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";

import LoginForm from "@/components/custom/forms/auth/login-form";
import RegisterForm from "@/components/custom/forms/auth/register-form";
import ForgotPasswordForm from "@/components/custom/forms/auth/forgot-password-form";

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
  );
}

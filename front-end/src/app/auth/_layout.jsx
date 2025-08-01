// Komponen client-side untuk layout authentication
"use client";

// Import React hooks
import { useState } from "react";

// Import providers dan router
import { useUser } from "@/providers/user-provider";
import { useTransitionRouter as useRouter } from "next-view-transitions";

// Import Framer Motion untuk animasi antar form
import { AnimatePresence } from "framer-motion";

// Import form komponen untuk authentication
import LoginForm from "@/components/custom/forms/auth/login-form";
import RegisterForm from "@/components/custom/forms/auth/register-form";
import ForgotPasswordForm from "@/components/custom/forms/auth/forgot-password-form";

// Import font lokal untuk logo
import localFont from "next/font/local";

// Konfigurasi font logo
const logoFont = localFont({
  src: "../../../public/logo-font.ttf", // Path ke file font TTF
});

/**
 * Layout komponen untuk handling form authentication dengan state switching
 * Mengatur perpindahan antar form: login, register, dan forgot password
 * @returns {JSX.Element} Form yang sesuai dengan state aktif dengan animasi transitions
 */
export default function AuthLayout() {
  // State untuk loading indicator
  const [isLoading, setIsLoading] = useState(false);
  
  // State untuk kontrol tampilan form register
  const [showRegister, setShowRegister] = useState(false);
  
  // State untuk kontrol tampilan form forgot password
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Hooks untuk navigation dan user management
  const router = useRouter(); // Router dengan view transitions
  const { setUser } = useUser(); // Setter untuk user context

  // Render form dengan AnimatePresence untuk smooth transitions
  return (
    <AnimatePresence mode="wait">
      {/* Conditional rendering berdasarkan state form yang aktif */}
      
      {/* Tampilkan RegisterForm jika showRegister true dan showForgotPassword false */}
      {!showForgotPassword && showRegister ? (
        <RegisterForm
          key="register" // Key unik untuk animasi
          logoFont={logoFont.className} // Font class untuk logo
          router={router} // Router untuk navigation setelah register
          setUser={setUser} // Setter untuk update user context
          isLoading={isLoading} // Loading state
          setIsLoading={setIsLoading} // Setter untuk loading state
          setShowRegister={setShowRegister} // Setter untuk hide register form
        />
      ) : /* Tampilkan ForgotPasswordForm jika showForgotPassword true dan showRegister false */
      showForgotPassword && !showRegister ? (
        <ForgotPasswordForm
          key="forgot-password" // Key unik untuk animasi
          logoFont={logoFont.className} // Font class untuk logo
          isLoading={isLoading} // Loading state
          setIsLoading={setIsLoading} // Setter untuk loading state
          setShowForgotPassword={setShowForgotPassword} // Setter untuk hide forgot password form
        />
      ) : (
        /* Default: Tampilkan LoginForm */
        <LoginForm
          key="login" // Key unik untuk animasi
          logoFont={logoFont.className} // Font class untuk logo
          router={router} // Router untuk navigation setelah login
          setUser={setUser} // Setter untuk update user context
          isLoading={isLoading} // Loading state
          setIsLoading={setIsLoading} // Setter untuk loading state
          setShowRegister={setShowRegister} // Setter untuk show register form
          setShowForgotPassword={setShowForgotPassword} // Setter untuk show forgot password form
        />
      )}
    </AnimatePresence>
  );
}

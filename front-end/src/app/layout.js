import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";

const defaultFont = JetBrains_Mono({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata = {
  title: "MiSREd-IoT",
  description:
    "Multi-input, Scalable, Reliable, and Easy-to-deploy IoT Platform",
};

export default function RootLayout({ children }) {
  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}>
      <html lang="en" suppressHydrationWarning>
        <head>
          <link rel="icon" href="/misred-logo.svg" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta name="description" content="MiSREd-IoT Platform" />
          <meta
            name="format-detection"
            content="telephone=no, date=no, email=no, address=no"
          />
        </head>
        <body className={`${defaultFont.variable} antialiased`}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
          </ThemeProvider>
          <Toaster richColors />
        </body>
      </html>
    </GoogleOAuthProvider>
  );
}

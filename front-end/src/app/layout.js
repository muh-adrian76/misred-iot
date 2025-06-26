import "./globals.css";
import { Public_Sans } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ViewTransitions } from "next-view-transitions";

import { GoogleOAuthProvider } from "@react-oauth/google";
import { UserProvider } from "@/providers/user-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { brandLogo } from "@/lib/helper";

const defaultFont = Public_Sans({
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
      <ViewTransitions>
      <html lang="en" suppressHydrationWarning>
        <head>
          <link rel="icon" href={brandLogo} />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta name="description" content="MiSREd-IoT Platform" />
          <meta
            name="format-detection"
            content="telephone=no, date=no, email=no, address=no"
          />
        </head>
        <body className={`${defaultFont.variable} antialiased`}>
          <UserProvider>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
              {children}
            </ThemeProvider>
          </UserProvider>
          <Toaster richColors />
        </body>
      </html>
      </ViewTransitions>
    </GoogleOAuthProvider>
  );
}

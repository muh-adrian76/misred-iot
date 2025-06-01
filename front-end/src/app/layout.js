import { Quicksand } from "next/font/google";
import "./globals.css";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from "@/components/ui/sonner";

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
});

export const metadata = {
  title: "MiSREd-IoT",
  description: "Multi-input, Scalable, Reliable, and Easy-to-deploy IoT Platform",
};

export default function RootLayout({ children }) {
  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}>
      <html lang="en">
        <head>
          <link rel="icon" href="/misred-logo.png" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta name="description" content="MiSREd-IoT Platform" />
        </head>
        <body
          className={`${quicksand.variable} antialiased`}
        >
          {children}
          <Toaster />
        </body>
      </html>
    </GoogleOAuthProvider>
  );
}

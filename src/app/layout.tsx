import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { AuthProvider } from "@/lib/auth/auth-provider";
import { PwaRegister } from "@/components/pwa-register";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Feynman Challenge",
    template: "%s · Feynman Challenge",
  },
  description:
    "Kalau kamu nggak bisa menjelaskannya, kamu belum paham. Kuasai materi apapun lewat tantangan menjelaskan ulang.",
  applicationName: "Feynman Challenge",
  keywords: [
    "feynman technique",
    "belajar",
    "self-learning",
    "spaced repetition",
    "active recall",
  ],
  authors: [{ name: "Feynman Challenge" }],
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Feynman Challenge",
  },
  formatDetection: {
    telephone: false,
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "hsl(228, 20%, 8%)",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={inter.variable}>
      <body>
        <AuthProvider>{children}</AuthProvider>
        <PwaRegister />
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Feynman Challenge",
  description:
    "Kalau kamu nggak bisa menjelaskannya, kamu belum paham. Kuasai materi apapun lewat tantangan menjelaskan ulang.",
  applicationName: "Feynman Challenge",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Feynman Challenge",
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
      <body>{children}</body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Newsreader, Plus_Jakarta_Sans } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";

import { AuthProvider } from "@/lib/auth/auth-provider";
import { PwaRegister } from "@/components/pwa-register";
import { ToastProvider } from "@/components/ui/toast";
import { THEME_COOKIE, parseTheme, themeColorFor } from "@/lib/theme";
import { siteUrl } from "@/lib/site";

// Interface (DESIGN.md §5). Made by Tokotype for the city of Jakarta.
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

// The teacher's voice: titles, numbers, notes, transcripts.
const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  display: "swap",
  style: ["normal", "italic"],
  axes: ["opsz"],
});

const SITE = siteUrl();
const TAGLINE =
  "Kalau kamu nggak bisa menjelaskannya, kamu belum paham. Kuasai materi apa pun lewat tantangan menjelaskan ulang.";

export const metadata: Metadata = {
  // Absolute base for every relative URL below; without it a shared link
  // previews as localhost.
  metadataBase: new URL(SITE),
  title: {
    default: "Feynman Challenge",
    template: "%s · Feynman Challenge",
  },
  description: TAGLINE,
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
    statusBarStyle: "default",
    title: "Feynman Challenge",
  },
  formatDetection: {
    telephone: false,
  },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Feynman Challenge",
    locale: "id_ID",
    url: "/",
    title: "Feynman Challenge",
    description: TAGLINE,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Feynman Challenge" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Feynman Challenge",
    description: TAGLINE,
    images: ["/og.png"],
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: { url: "/icons/apple-touch-icon.png", sizes: "180x180" },
  },
};

async function currentTheme() {
  // Static routes (e.g. /offline) get an empty store and fall back to "system".
  return parseTheme((await cookies()).get(THEME_COOKIE)?.value);
}

export async function generateViewport(): Promise<Viewport> {
  return {
    themeColor: themeColorFor(await currentTheme()),
    width: "device-width",
    initialScale: 1,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const theme = await currentTheme();
  return (
    <html
      lang="id"
      data-theme={theme}
      className={`${jakarta.variable} ${newsreader.variable}`}
    >
      <body>
        <AuthProvider>
          <ToastProvider>
            {children}
            <PwaRegister />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

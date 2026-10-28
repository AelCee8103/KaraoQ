import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "@/styles/globals.css";
import { AppProviders } from "@/components/providers/AppProviders";
import { AppShell } from "@/components/layout/AppShell";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  title: "KaraoQ – Synchronized Karaoke Nightlife & Rooms",
  description:
    "A karaoke-focused web app with synchronized rooms. Turn your TV or laptop into a karaoke machine while guests pick and queue songs from their phones.",
  keywords: ["karaoke", "youtube karaoke", "karaoke rooms", "karaoq", "party app"],
  authors: [{ name: "KaraoQ Team" }],
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: "#07050C",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} dark`}>
      <head>
        {/* Puter.js v2 SDK */}
        <script src="https://js.puter.com/v2/" async />
      </head>
      <body className="font-body bg-background text-foreground antialiased selection:bg-primary selection:text-white">
        <AppProviders>
          <AppShell>{children}</AppShell>
        </AppProviders>
      </body>
    </html>
  );
}

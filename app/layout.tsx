import type { Metadata, Viewport } from "next";
import { Fredoka, Nunito } from "next/font/google";
import { AppProviders } from "@/components/game/app-providers";
import { SanityLive } from "@/lib/sanity/live";
import "./globals.css";

const fredoka = Fredoka({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
});

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "MoneyVerse",
  description: "A fictional-coin game that helps children practice needs, wants, saving, and profit.",
  applicationName: "MoneyVerse",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffc857",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fredoka.variable} ${nunito.variable} h-full`}>
      <body className="min-h-full font-sans text-ink antialiased">
        <AppProviders>{children}</AppProviders>
        <SanityLive />
      </body>
    </html>
  );
}

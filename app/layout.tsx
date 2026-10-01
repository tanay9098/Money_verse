import type { Metadata } from "next";
import { Fredoka, Nunito } from "next/font/google";
import { ProgressProvider } from "@/components/game/progress-provider";
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
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fredoka.variable} ${nunito.variable} h-full`}>
      <body className="min-h-full font-sans text-ink antialiased">
        <ProgressProvider>{children}</ProgressProvider>
      </body>
    </html>
  );
}

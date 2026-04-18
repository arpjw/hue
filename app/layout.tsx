import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";
import "@rainbow-me/rainbowkit/styles.css";
import Web3Provider from "@/components/providers/Web3Provider";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hue — Risk in full color.",
  description: "Real-time institutional risk dashboard by Monolith Systematic LLC",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${dmSans.variable} ${playfair.variable}`}>
      <body className="font-sans bg-hue-bg text-hue-text antialiased">
        <Web3Provider>{children}</Web3Provider>
      </body>
    </html>
  );
}

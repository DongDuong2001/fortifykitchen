import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Providers } from "../providers/providers";
import "./globals.css";

// Inter (body) + JetBrains Mono (display/h1/label) — the "Mint Receipt"
// pairing from DESIGN.md: monospace for numerics and headings, Inter for body.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-heading",
  display: "swap",
});

export const metadata: Metadata = {
  title: "FortifyKitchen - Premium Food Ordering & Subscriptions",
  description:
    "Order healthy bowls, fresh juices, and subscribe to premium nutritional meal plans.",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <body className="antialiased font-sans" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

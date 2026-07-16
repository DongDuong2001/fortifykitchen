import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Providers } from "../providers/providers";
import { Manrope, Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin", "vietnamese"],
  variable: "--font-heading",
  weight: ["700", "800"],
});

const beVietnam = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  variable: "--font-body",
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: "FortifyKitchen - Premium Food Ordering & Subscriptions",
  description:
    "Order healthy bowls, fresh juices, and subscribe to premium nutritional meal plans.",
  icons: {
    icon: [
      { url: "/logo.png", sizes: "any", type: "image/png" },
    ],
    shortcut: "/logo.png",
    apple: [
      { url: "/logo.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="vi" className={`${manrope.variable} ${beVietnam.variable}`} suppressHydrationWarning>
      <body className="antialiased font-sans" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

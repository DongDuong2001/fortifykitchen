import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Providers } from "../providers/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "FortifyKitchen - Administrative Management Console",
  description: "Manage orders, menu catalogs, subscriber accounts, deliveries, and financials.",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

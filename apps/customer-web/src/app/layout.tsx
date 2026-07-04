import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Providers } from "../providers/providers";
import "./globals.css";

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
    <html lang="en">
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

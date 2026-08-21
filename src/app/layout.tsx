import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TriGuard",
  description: "Your personal money, time, and information guard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
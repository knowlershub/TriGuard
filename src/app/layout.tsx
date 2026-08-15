import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TriGuard",
  description: "Input layer for TriGuard, TaskSnap, and InboxZero",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
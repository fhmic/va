import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VA — Your AI Mentor",
  description: "An AI mentor that remembers you, adapts to you, and tracks your growth.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

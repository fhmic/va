import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VAM - Your Vocal Acuity Mentor",
  description: "VAM train you professional presentation skill, tracks your progress over time, and tracks your growth.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

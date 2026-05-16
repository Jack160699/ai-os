import { Geist } from "next/font/google";
import { SiteShell } from "@/app/components/SiteShell";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  adjustFontFallback: true,
});

export const metadata = {
  title: "Stratxcel — Grow your business online",
  description:
    "Calm help with websites, marketing, and your online presence. Message us on WhatsApp — real people, straight answers.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f5f2eb",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full bg-[var(--sx-canvas)] text-[var(--sx-ink)]">
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}

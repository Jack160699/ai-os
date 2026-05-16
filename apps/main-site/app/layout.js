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
  title: "MISNETEXT — Websites, ads & WhatsApp for growing businesses",
  description:
    "Small team, clear help. Site, marketing, WhatsApp — less confusion, more customers.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f0ebe2",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} font-sans h-full antialiased`}>
      <body className="min-h-full bg-[var(--sx-canvas)] text-[var(--sx-ink)]">
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}

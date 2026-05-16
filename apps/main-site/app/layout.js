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
  title: "Stratxcel — Websites, ads & WhatsApp for growing businesses",
  description:
    "A small team that helps with your site, marketing, and customer messages — plain language, fast WhatsApp replies.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f0ebe2",
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

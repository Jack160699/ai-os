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
  title: "Stratxcel — Revenue systems for serious businesses",
  description:
    "Stratxcel designs and ships revenue systems: AI, automation, and operating infrastructure for operators who need execution, not noise.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full bg-[#030306] text-zinc-200">
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}

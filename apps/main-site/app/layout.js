import { Geist } from "next/font/google";
import { SiteChrome } from "@/app/components/SiteChrome";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  adjustFontFallback: true,
});

export const metadata = {
  title: "Stratxcel — Strategy, systems, and AI for growth",
  description:
    "Stratxcel helps teams ship revenue systems: consulting, implementation, and AI operating infrastructure.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full bg-[#F8FAFC] text-[#0B1220]">
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}

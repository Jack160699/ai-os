import { Inter } from "next/font/google";
import "./admin.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter-admin",
});

export default function AdminLayout({ children }) {
  return (
    <div className={`${inter.variable} ${inter.className} admin-font-root antialiased`}>{children}</div>
  );
}

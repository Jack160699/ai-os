import { Inter } from "next/font/google";
import "./admin.css";
import { AdminAssistantRoot } from "@/app/admin/_components/AdminAssistantRoot";
import { getInitialThemeScript } from "@/lib/theme";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter-admin",
});

export default function AdminLayout({ children }) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: getInitialThemeScript() }} />
      <div className={`${inter.variable} ${inter.className} admin-font-root antialiased`}>
        {children}
        <AdminAssistantRoot />
      </div>
    </>
  );
}

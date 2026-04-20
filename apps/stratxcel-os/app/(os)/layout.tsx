import { OsShell } from "@/components/os/os-shell";

export default function OsLayout({ children }: { children: React.ReactNode }) {
  return (
    <OsShell>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </OsShell>
  );
}

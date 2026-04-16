import { AdminShell } from "@/app/admin/_components/AdminShell";
import { SurfaceCard } from "@/app/admin/_components/SurfaceCard";
import { requireAdminAuth } from "@/app/admin/_lib/auth";

export default async function AdminBrandingPage() {
  await requireAdminAuth();

  return (
    <AdminShell
      activePath="/admin/branding"
      title="White Label Branding"
      subtitle="Control the identity layer for your workspace and client-facing touchpoints."
    >
      <SurfaceCard className="p-6 sm:p-7" delay={0.04}>
        <p className="text-sm font-semibold tracking-tight text-white">Brand profile</p>
        <p className="mt-1 text-[12px] text-slate-500">Changes are saved as placeholders for now and ready for backend persistence wiring.</p>
        <form className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="grid gap-1.5">
            <span className="text-[12px] text-slate-400">Company name</span>
            <input
              type="text"
              placeholder="StratXcel"
              className="h-10 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 text-[13px] text-slate-100 outline-none focus:border-white/[0.14]"
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-[12px] text-slate-400">Primary color</span>
            <input
              type="color"
              defaultValue="#0ea5e9"
              className="h-10 rounded-xl border border-white/[0.08] bg-white/[0.03] px-2 text-[13px] text-slate-100 outline-none focus:border-white/[0.14]"
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-[12px] text-slate-400">Logo upload</span>
            <input
              type="file"
              className="h-10 rounded-xl border border-white/[0.08] bg-white/[0.03] px-2 py-2 text-[12px] text-slate-300 outline-none file:mr-3 file:rounded-md file:border file:border-white/[0.1] file:bg-white/[0.03] file:px-2.5 file:py-1 file:text-[11px] file:font-semibold file:text-slate-200"
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-[12px] text-slate-400">Custom domain (placeholder)</span>
            <input
              type="text"
              placeholder="app.yourbrand.com"
              className="h-10 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 text-[13px] text-slate-100 outline-none focus:border-white/[0.14]"
            />
          </label>
          <div className="md:col-span-2">
            <button
              type="button"
              className="rounded-xl border border-sky-400/35 bg-sky-500/20 px-4 py-2 text-[12px] font-semibold text-sky-200 transition hover:border-sky-300/45 hover:bg-sky-500/28"
            >
              Save branding settings
            </button>
          </div>
        </form>
      </SurfaceCard>
    </AdminShell>
  );
}


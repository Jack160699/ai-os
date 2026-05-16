export default function AdminLoading() {
  return (
    <main className="admin-app min-h-screen bg-[var(--admin-surface-0,#05070c)] text-slate-100">
      <div className="mx-auto flex w-full max-w-[min(100%,1380px)] gap-4 px-3 py-3 sm:gap-5 sm:px-4 sm:py-4 lg:gap-6 lg:px-6 lg:py-6">
        <aside className="sticky top-4 hidden h-[calc(100vh-32px)] w-[220px] shrink-0 flex-col border border-white/[0.06] bg-[var(--admin-surface-1,#0c0f16)] px-4 py-6 lg:flex lg:flex-col">
          <div className="space-y-2 border-b border-white/[0.05] pb-5">
            <div className="admin-skeleton h-2.5 w-16" />
            <div className="admin-skeleton h-4 w-24" />
          </div>
          <div className="mt-6 space-y-1.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="admin-skeleton h-9 w-full rounded-lg" />
            ))}
          </div>
          <div className="mt-auto border-t border-white/[0.05] pt-5">
            <div className="admin-skeleton h-3 w-full" />
          </div>
        </aside>
        <div className="min-w-0 flex-1 rounded-2xl border border-white/[0.06] bg-[var(--admin-surface-1,#0c0f16)] shadow-[var(--admin-shadow-panel,0_24px_80px_rgba(0,0,0,0.45))]">
          <header className="border-b border-white/[0.06] px-5 pb-5 pt-4 sm:px-7 sm:pb-6 sm:pt-5 lg:px-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="admin-skeleton h-10 w-10 shrink-0 rounded-xl lg:hidden" />
              <div className="admin-skeleton h-10 flex-1 rounded-xl sm:max-w-md" />
              <div className="admin-skeleton ml-auto hidden h-9 w-[200px] rounded-xl sm:block" />
            </div>
            <div className="mt-4 flex gap-2 sm:hidden">
              <div className="admin-skeleton h-9 flex-1 rounded-xl" />
              <div className="admin-skeleton h-9 w-24 rounded-xl" />
            </div>
            <div className="admin-skeleton mt-6 h-3 w-28" />
            <div className="admin-skeleton mt-3 h-8 w-56 max-w-full" />
            <div className="admin-skeleton mt-2 h-4 w-full max-w-md" />
          </header>
          <section className="space-y-7 p-5 sm:space-y-8 sm:p-7 lg:p-8">
            <div className="grid gap-5 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-[14px] border border-white/[0.06] bg-white/[0.02] p-5 shadow-[0_1px_0_rgba(255,255,255,0.04)_inset]">
                  <div className="admin-skeleton h-3 w-24" />
                  <div className="admin-skeleton mt-4 h-9 w-20" />
                  <div className="admin-skeleton mt-3 h-3 w-32" />
                  <div className="admin-skeleton mt-2 h-3 w-28" />
                </div>
              ))}
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                <div className="admin-skeleton h-4 w-40" />
                <div className="admin-skeleton mt-2 h-3 w-52" />
                <div className="mt-5 space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="admin-skeleton h-12 w-full rounded-xl" />
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                <div className="admin-skeleton h-4 w-36" />
                <div className="admin-skeleton mt-2 h-3 w-48" />
                <div className="admin-skeleton mt-5 h-36 w-full rounded-xl" />
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

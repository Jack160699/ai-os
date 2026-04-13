export default function AdminLoading() {
  return (
    <main className="admin-app min-h-screen bg-[var(--admin-surface-0,#05070c)] text-slate-100">
      <div className="mx-auto flex w-full max-w-[1440px] gap-6 px-4 py-4 sm:px-6 sm:py-6 lg:gap-8">
        <aside className="sticky top-4 hidden h-[calc(100vh-32px)] w-[248px] shrink-0 flex-col rounded-2xl border border-white/[0.06] bg-[var(--admin-surface-1,#0c0f16)] p-5 lg:flex lg:flex-col">
          <div className="admin-skeleton h-8 w-28" />
          <div className="mt-8 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="admin-skeleton h-10 w-full rounded-xl" />
            ))}
          </div>
          <div className="mt-auto rounded-xl border border-white/[0.06] p-4">
            <div className="admin-skeleton h-3 w-24" />
            <div className="admin-skeleton mt-3 h-3 w-full" />
            <div className="admin-skeleton mt-2 h-3 w-[85%]" />
          </div>
        </aside>
        <div className="min-w-0 flex-1 rounded-2xl border border-white/[0.06] bg-[var(--admin-surface-1,#0c0f16)]">
          <header className="border-b border-white/[0.06] px-5 py-5 sm:px-8 sm:py-6">
            <div className="admin-skeleton h-3 w-32" />
            <div className="admin-skeleton mt-3 h-8 w-56 max-w-full" />
            <div className="admin-skeleton mt-2 h-4 w-2/3 max-w-md" />
            <div className="mt-5 flex gap-2 lg:hidden">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="admin-skeleton h-8 w-20 rounded-lg" />
              ))}
            </div>
          </header>
          <section className="space-y-6 p-5 sm:p-8">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-[14px] border border-white/[0.06] bg-white/[0.02] p-5">
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
                <div className="mt-5 space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="admin-skeleton h-12 w-full rounded-xl" />
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                <div className="admin-skeleton h-4 w-36" />
                <div className="admin-skeleton mt-5 h-36 w-full rounded-xl" />
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

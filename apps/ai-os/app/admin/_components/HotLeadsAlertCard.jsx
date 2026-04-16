import Link from "next/link";

export function HotLeadsAlertCard({ hotLeads = [] }) {
  const top = hotLeads.slice(0, 5);
  return (
    <div className="fixed bottom-5 right-5 z-40 hidden w-[340px] rounded-2xl border border-rose-300/25 bg-[#160d13]/95 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur lg:block">
      <p className="text-xs uppercase tracking-[0.14em] text-rose-200/75">🔥 Hot Leads Requiring Action</p>
      <div className="mt-3 space-y-2.5">
        {top.length === 0 ? (
          <p className="text-xs text-slate-300">No immediate hot leads right now.</p>
        ) : (
          top.map((lead, idx) => (
            <div key={`${lead.phone || idx}`} className="rounded-xl border border-rose-200/10 bg-rose-400/5 p-2.5">
              <p className="text-[12px] font-medium text-rose-50">{lead.phone || "Lead"}</p>
              <p className="mt-0.5 text-[11px] text-rose-100/70">{lead.pain_point || lead.intent_score || "High purchase intent"}</p>
            </div>
          ))
        )}
      </div>
      <Link
        href="/admin/chats?segment=hot"
        className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-rose-200/30 bg-rose-400/20 px-3 py-2 text-xs font-semibold text-rose-50"
      >
        Contact hot leads now
      </Link>
    </div>
  );
}


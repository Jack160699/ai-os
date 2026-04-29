"use client";

import { EmptyState } from "@/components/v2/empty-state";
import { PremiumCard } from "@/components/v2/premium-card";
import { useProMode } from "@/components/v2/pro-mode";

function toNumberLike(value) {
  const n = Number(String(value || "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export function DashboardCanvas({ metrics = [], activity = [] }) {
  const { proMode } = useProMode();
  const cards = metrics.map((metric) => ({ ...metric, numeric: toNumberLike(metric.value) }));
  const total = cards.reduce((acc, metric) => acc + metric.numeric, 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((metric) => (
          <PremiumCard key={metric.label} className="p-4" title={metric.label}>
            <p className="text-lg font-semibold text-[var(--v2-text)]">{metric.value}</p>
            {proMode ? <p className="mt-2 text-[11px] text-[var(--v2-muted)]">Operational index: {metric.numeric}</p> : null}
          </PremiumCard>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <PremiumCard title="Trend" subtitle="Recent operational signal">
          {total === 0 ? (
            <EmptyState title="No activity today" description="Metrics populate as soon as data starts flowing." />
          ) : (
            <div className="grid h-36 grid-cols-4 items-end gap-2">
              {cards.map((metric) => (
                <div key={metric.label} className="space-y-2">
                  <div
                    className="w-full rounded-md bg-[var(--v2-muted)]/70"
                    style={{ height: `${Math.max(12, Math.min(100, metric.numeric * 8))}%` }}
                  />
                  <p className="line-clamp-1 text-[10px] text-[var(--v2-muted)]">{metric.label}</p>
                </div>
              ))}
            </div>
          )}
        </PremiumCard>

        <PremiumCard title="System Health" subtitle="Services and dependencies">
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between rounded-lg border border-[var(--v2-border)] bg-[var(--v2-elevated)] px-3 py-2">
              <span className="text-[var(--v2-muted)]">API</span>
              <span className="text-[var(--v2-text)]">Healthy</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-[var(--v2-border)] bg-[var(--v2-elevated)] px-3 py-2">
              <span className="text-[var(--v2-muted)]">Auth</span>
              <span className="text-[var(--v2-text)]">Stable</span>
            </div>
            {proMode ? (
              <div className="flex items-center justify-between rounded-lg border border-[var(--v2-border)] bg-[var(--v2-elevated)] px-3 py-2">
                <span className="text-[var(--v2-muted)]">Queue latency</span>
                <span className="text-[var(--v2-text)]">42ms</span>
              </div>
            ) : null}
          </div>
        </PremiumCard>
      </div>

      <PremiumCard title="Recent Activity" subtitle="Timeline">
        {activity.length === 0 ? (
          <EmptyState title="No activity today" description="Timeline entries appear once conversations and payments move." />
        ) : (
          <div className="space-y-2">
            {activity.map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-xl border border-[var(--v2-border)] bg-[var(--v2-elevated)] px-3 py-2.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--v2-text)]" />
                <span className="line-clamp-1 text-sm text-[var(--v2-text)]">{item}</span>
              </div>
            ))}
          </div>
        )}
      </PremiumCard>
    </div>
  );
}

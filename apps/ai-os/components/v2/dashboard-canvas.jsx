"use client";

import { EmptyState } from "@/components/v2/empty-state";
import { PremiumCard } from "@/components/v2/premium-card";
import { useProMode } from "@/components/v2/pro-mode";
import { useThemeStudio } from "@/components/v2/theme-provider";

function toNumberLike(value) {
  const n = Number(String(value || "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export function DashboardCanvas({ metrics = [], activity = [] }) {
  const { proMode } = useProMode();
  const { immersion } = useThemeStudio();
  const d = immersion.dashboard;
  const e = immersion.empty;
  const safeMetrics = Array.isArray(metrics) ? metrics : [];
  const safeActivity = Array.isArray(activity) ? activity : [];
  const cards = (safeMetrics || []).map((metric) => ({ ...metric, numeric: toNumberLike(metric?.value) }));
  const total = cards.reduce((acc, metric) => acc + metric.numeric, 0);

  try {
    return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((metric) => (
          <PremiumCard key={metric.label} className="p-4" title={metric.label}>
            <p className="text-lg font-semibold text-[var(--v2-text)]">{metric.value}</p>
            {proMode ? (
              <p className="mt-2 text-[11px] text-[var(--v2-muted)]">
                {d.proMetricPrefix} {metric.numeric}
              </p>
            ) : null}
          </PremiumCard>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <PremiumCard title={d.trendTitle} subtitle={d.trendSubtitle}>
          {total === 0 ? (
            <EmptyState title={e.trendTitle} description={e.trendDescription} />
          ) : (
            <div className="grid h-36 grid-cols-4 items-end gap-2">
              {cards.map((metric) => (
                <div key={metric.label} className="space-y-2">
                  <div
                    className="w-full rounded-md bg-[color-mix(in_oklab,var(--v2-accent)_78%,transparent)] transition-all"
                    style={{ height: `${Math.max(12, Math.min(100, metric.numeric * 8))}%` }}
                  />
                  <p className="line-clamp-1 text-[10px] text-[var(--v2-muted)]">{metric.label}</p>
                </div>
              ))}
            </div>
          )}
        </PremiumCard>

        <PremiumCard title={d.healthTitle} subtitle={d.healthSubtitle}>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between rounded-lg border border-[var(--v2-border)] bg-[var(--v2-elevated)] px-3 py-2">
              <span className="text-[var(--v2-muted)]">API</span>
              <span className="text-[var(--v2-text)]">{d.apiOK}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-[var(--v2-border)] bg-[var(--v2-elevated)] px-3 py-2">
              <span className="text-[var(--v2-muted)]">Auth</span>
              <span className="text-[var(--v2-text)]">{d.authOK}</span>
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

      <PremiumCard title={d.activityTitle} subtitle={d.activitySubtitle}>
        {safeActivity.length === 0 ? (
          <EmptyState title={e.activityTitle} description={e.activityDescription} />
        ) : (
          <div className="space-y-2">
            {(safeActivity || []).map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-xl border border-[var(--v2-border)] bg-[var(--v2-elevated)] px-3 py-2.5 transition hover:border-[var(--v2-focus)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[color-mix(in_oklab,var(--v2-accent)_85%,var(--v2-text))]" />
                <span className="line-clamp-1 text-sm text-[var(--v2-text)]">{item}</span>
              </div>
            ))}
          </div>
        )}
      </PremiumCard>
    </div>
  );
  } catch (e) {
    console.error(e);
    return <div>Something went wrong</div>;
  }
}

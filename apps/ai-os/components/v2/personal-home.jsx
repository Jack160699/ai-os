"use client";

import { useEffect, useMemo, useState } from "react";
import { AchievementToast } from "@/components/v2/achievement-toast";
import { PremiumCard } from "@/components/v2/premium-card";
import { PrivateNotes } from "@/components/v2/private-notes";
import { WidgetsPanel } from "@/components/v2/widgets-panel";
import { deriveAchievements, deriveGamification } from "@/lib/v2/gamification";
import { allWidgetIds, defaultWidgetsForRole, getRoleHomeConfig, loadWidgets, saveWidgets, trackDailyStreak } from "@/lib/v2/personalization";

function toNum(value) {
  const n = Number(String(value || "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function metricByLabel(metrics, label) {
  const item = metrics.find((m) => String(m.label || "").toLowerCase() === label);
  return toNum(item?.value);
}

export function PersonalHome({ userKey, userName, role, metrics = [] }) {
  const [streak, setStreak] = useState(1);
  const [widgets, setWidgets] = useState(() => loadWidgets(userKey, role));
  const roleConfig = getRoleHomeConfig(role);

  useEffect(() => {
    setStreak(trackDailyStreak(userKey));
    setWidgets(loadWidgets(userKey, role));
  }, [userKey, role]);

  useEffect(() => {
    saveWidgets(userKey, widgets);
  }, [userKey, widgets]);

  const gamification = useMemo(() => deriveGamification({ metrics, streak, role }), [metrics, streak, role]);
  const achievements = useMemo(() => deriveAchievements({ metrics, streak }), [metrics, streak]);

  const stats = {
    chats: metricByLabel(metrics, "chats today"),
    pending: metricByLabel(metrics, "pending tasks"),
    due: metricByLabel(metrics, "payments due"),
    team: metricByLabel(metrics, "active team members"),
  };

  const cards = {
    my_tasks: `${Math.max(0, stats.pending)} pending tasks`,
    my_revenue: `₹${(stats.due * 6250).toLocaleString("en-IN")} expected`,
    my_leads: `${Math.max(0, stats.chats + 2)} leads in queue`,
    pending_chats: `${Math.max(0, stats.chats)} chats waiting`,
    calendar: "4 follow-ups scheduled",
    recent_clients: `${Math.max(0, stats.chats)} active clients`,
    team_rank: `Top ${Math.max(1, Math.ceil((stats.team || 1) / 2))} this week`,
    daily_goals: `${Math.max(0, 12 - stats.chats)} actions to daily target`,
  };

  const orderedEnabled = widgets.order.filter((id) => widgets.enabled.includes(id));

  return (
    <div className="space-y-5">
      <PremiumCard className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_14%,color-mix(in_oklab,var(--v2-accent)_16%,transparent)_0%,transparent_52%)]" />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="v2-title-tight text-xl font-semibold text-[var(--v2-text)] md:text-[1.35rem]">Good Morning, {userName} 👋</p>
            <p className="mt-1.5 max-w-[66ch] text-xs leading-relaxed text-[var(--v2-muted)]">{roleConfig.line2}</p>
            <p className="mt-3 text-xs leading-relaxed text-[var(--v2-muted)]">
              {stats.chats} chats waiting · {Math.max(0, stats.chats - 1)} hot leads · ₹{(stats.due * 6250).toLocaleString("en-IN")} pending · {streak}-day streak
            </p>
          </div>
          <div className="min-w-[240px] rounded-xl border border-[var(--v2-border)] bg-[var(--v2-elevated)]/85 px-3.5 py-3">
            <p className="text-xs font-semibold text-[var(--v2-text)]">Level {gamification.level} Operator</p>
            <p className="mt-1 text-[10px] text-[var(--v2-muted)]">{gamification.xp} XP accumulated</p>
            <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--v2-border)]">
              <div className="h-full rounded-full bg-[color-mix(in_oklab,var(--v2-accent)_82%,var(--v2-text))]" style={{ width: `${gamification.progress}%` }} />
            </div>
            <p className="mt-1.5 text-[10px] text-[var(--v2-muted)]">{gamification.badges.join(" · ")}</p>
          </div>
        </div>
      </PremiumCard>

      <div className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <section className="grid gap-3 sm:grid-cols-2">
          {orderedEnabled.length === 0 ? (
            <PremiumCard className="sm:col-span-2" title="Widgets hidden">
              <p className="text-xs text-[var(--v2-muted)]">Enable at least one widget from the configuration panel.</p>
            </PremiumCard>
          ) : (
            orderedEnabled.map((id) => (
              <PremiumCard key={id} className="min-h-[116px]" title={id.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}>
                <p className="text-sm text-[var(--v2-text)]">{cards[id]}</p>
              </PremiumCard>
            ))
          )}
        </section>
        <div className="space-y-4">
          <WidgetsPanel widgets={widgets} setWidgets={setWidgets} allWidgetIds={allWidgetIds()} />
          <PrivateNotes userKey={userKey} />
        </div>
      </div>

      <PremiumCard title="Role Spotlight" subtitle="What matters most today">
        <div className="flex flex-wrap gap-2">
          {roleConfig.spotlight.map((item) => (
            <span key={item} className="rounded-full border border-[var(--v2-border)] bg-[var(--v2-elevated)] px-2.5 py-1 text-xs text-[var(--v2-muted)]">
              {item}
            </span>
          ))}
        </div>
      </PremiumCard>

      <AchievementToast items={achievements} />
    </div>
  );
}

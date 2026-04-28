"use client";

import { useState } from "react";

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full border transition ${
        checked ? "border-[#3b82f6]/40 bg-[#3b82f6]/25" : "border-white/15 bg-white/[0.04]"
      }`}
    >
      <span
        className={`absolute top-0.5 h-4.5 w-4.5 rounded-full bg-white transition ${
          checked ? "left-[22px]" : "left-0.5"
        }`}
      />
    </button>
  );
}

export function SettingsPanel() {
  const [alerts, setAlerts] = useState(true);
  const [dailyDigest, setDailyDigest] = useState(false);
  const [strictSession, setStrictSession] = useState(true);

  const cards = [
    {
      title: "Notifications",
      description: "Receive high-priority operational alerts in real time.",
      enabled: alerts,
      setEnabled: setAlerts,
    },
    {
      title: "Daily Digest",
      description: "Get one concise summary each day with key metrics.",
      enabled: dailyDigest,
      setEnabled: setDailyDigest,
    },
    {
      title: "Strict Session Security",
      description: "Require secure owner session cookie for all protected routes.",
      enabled: strictSession,
      setEnabled: setStrictSession,
    },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {cards.map((card) => (
        <article key={card.title} className="rounded-2xl border border-white/10 bg-[#0f131a] p-4 shadow-[0_8px_30px_rgba(0,0,0,0.22)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-white">{card.title}</h3>
              <p className="mt-1 text-xs text-[var(--v2-muted)]">{card.description}</p>
            </div>
            <Toggle checked={card.enabled} onChange={card.setEnabled} />
          </div>
        </article>
      ))}
    </div>
  );
}

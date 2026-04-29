/** Per-personality microcopy + labels (merged over professional baseline). */

function isPlainObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

export function deepMerge(base, patch) {
  if (!isPlainObject(patch)) return base;
  const out = { ...base };
  for (const key of Object.keys(patch)) {
    const pv = patch[key];
    const bv = base[key];
    if (Array.isArray(pv)) {
      out[key] = pv.slice();
    } else if (isPlainObject(pv) && isPlainObject(bv)) {
      out[key] = deepMerge(bv, pv);
    } else if (pv !== undefined) {
      out[key] = pv;
    }
  }
  return out;
}

export const DEFAULT_IMMERSION = {
  welcome: "System Stable",
  statusLine: "System Stable",
  pages: {
    dashboard: {
      title: "Dashboard",
      subtitle: "Executive overview of conversations, payments, and team throughput.",
      export: "Export",
      newReport: "Create Report",
    },
    inbox: {
      title: "Inbox",
      subtitle: "Search, triage, and respond with a focused split workspace.",
    },
    team: {
      title: "Team",
      subtitle: "Manage operators, roles, and permissions with precision.",
    },
    payments: {
      title: "Payments",
      subtitle: "Finance-grade records with fast filters, search, and status clarity.",
    },
    settings: {
      title: "Settings",
      subtitle: "Secure operational controls with minimal, focused sections.",
    },
  },
  buttons: {
    quickAdd: "Quick add",
    notifications: "Notifications",
  },
  search: {
    placeholder: "Search dashboard, conversations, payments…",
  },
  empty: {
    trendTitle: "Quiet runway",
    trendDescription: "Metrics populate as soon as data starts flowing.",
    activityTitle: "No timeline entries",
    activityDescription: "Activity appears once conversations and payments move.",
    genericTitle: "Nothing here yet",
    genericDescription: "Content will appear when data is available.",
  },
  dashboard: {
    trendTitle: "Trend",
    trendSubtitle: "Recent operational signal",
    healthTitle: "System Health",
    healthSubtitle: "Services and dependencies",
    activityTitle: "Recent Activity",
    activitySubtitle: "Timeline",
    apiOK: "Healthy",
    authOK: "Stable",
    proMetricPrefix: "Operational index:",
  },
  inbox: {
    searchPlaceholder: "Search by phone or text",
    emptyList: "No conversations yet",
    emptyThread: "No messages in this thread yet",
    noMessagePreview: "No message",
    selectThread: "Select a conversation",
    replyPlaceholder: "Type reply…",
    tagPlaceholder: "Add tag",
    notePlaceholder: "Add note…",
    loadOlder: "Load older messages",
    sending: "Sending…",
    send: "Send",
    pay: "Pay",
    saveNote: "Save note",
    savingNote: "Saving…",
    generateSuggestion: "Generate suggestion",
    generating: "Generating…",
    useSuggestion: "Use suggestion",
    loadConversations: "Syncing inbox…",
    loadThread: "Opening thread…",
    newToast: "New inbox message",
    customerDetails: "Customer details",
    assignment: "Assignment",
    tags: "Tags",
    internalNotes: "Internal notes",
    aiSuggested: "AI suggested reply",
    eventTakeover: "Event takeover",
  },
  payments: {
    loading: "Loading records…",
    refreshing: "Refreshing…",
    refresh: "Refresh",
    generateLink: "+ Generate payment link",
    exportCsv: "Export CSV",
  },
  team: {
    loading: "Loading team…",
    inviteUser: "Invite user",
    blurb: "Manage operators, access, and permissions from one place.",
  },
  mode: {
    label: "PRO MODE",
  },
  profile: {
    workspaceLabel: "Stratxcel OS",
    panelHint: "Workspace profile",
    themeLine: "Active theme",
    signOut: "Sign out",
    menu: [
      "Profile",
      "Preferences",
      "Theme",
      "Notifications",
      "Security",
      "Billing",
      "Help center",
      "Keyboard shortcuts",
    ],
  },
};

const OVERRIDES = {
  genz: {
    team: { loading: "Pulling roster…", inviteUser: "Add teammate", blurb: "Keep roles tight and access obvious." },
    mode: { label: "Power mode" },
    welcome: "We’re cooking today — sharp momentum.",
    statusLine: "We’re on today",
    pages: {
      dashboard: {
        subtitle: "Today’s pulse: chats, cash, and crew — one glance.",
        export: "Ship CSV",
        newReport: "Let’s Go",
      },
      inbox: { subtitle: "Keep threads tight and replies fast." },
      payments: { subtitle: "Money moves, filters, and receipts — no noise." },
    },
    buttons: { quickAdd: "Let’s Go", notifications: "What’s new" },
    search: { placeholder: "Search anything — inbox, pay, people…" },
    empty: {
      trendTitle: "Chart’s warming up",
      trendDescription: "Once data lands, this chart goes loud.",
      activityTitle: "No moves logged yet",
      activityDescription: "When things pop off, the timeline fills in.",
    },
    dashboard: {
      trendSubtitle: "Signal stack (live)",
      healthSubtitle: "Stack health",
      activitySubtitle: "Latest energy",
    },
    inbox: {
      emptyThread: "Thread quiet — say hi first.",
      emptyList: "Inbox is clear",
      replyPlaceholder: "Drop your reply…",
      loadConversations: "Pulling threads…",
      newToast: "New ping in inbox",
    },
    payments: { loading: "Fetching money trail…", refreshing: "Syncing…", generateLink: "Spin up payment link" },
    profile: {
      panelHint: "Your lane",
      themeLine: "Vibe",
      menu: ["You", "Tweaks", "Look", "Pings", "Lock", "Plan", "Help", "Keys"],
    },
  },
  girly: {
    team: { loading: "Gathering your team…", inviteUser: "Invite", blurb: "People, roles, and access — kept graceful." },
    mode: { label: "Pro polish" },
    welcome: "Ready to slay today — composed and on-brand.",
    statusLine: "Ready to slay today",
    pages: {
      dashboard: {
        subtitle: "A polished read on conversations, payments, and team.",
        export: "Export",
        newReport: "Create report",
      },
      inbox: { subtitle: "Soft-focus workspace for every conversation." },
      payments: { subtitle: "Payments, polished — filters and clarity first." },
    },
    buttons: { quickAdd: "New note", notifications: "Gentle pings" },
    search: { placeholder: "Search softly — people, pay, threads…" },
    empty: {
      trendTitle: "Still settling in",
      trendDescription: "Your metrics will bloom as soon as data arrives.",
      activityTitle: "Timeline hush",
      activityDescription: "Moments appear as soon as work flows through.",
    },
    dashboard: {
      trendSubtitle: "Calm signal",
      healthSubtitle: "Careful dependencies",
      activitySubtitle: "Recent moments",
    },
    inbox: {
      emptyList: "No threads yet — all clear",
      replyPlaceholder: "Write something kind…",
      loadConversations: "Gathering threads…",
      newToast: "New message arrived",
    },
    payments: { loading: "Opening ledger…", refreshing: "Refreshing…", generateLink: "Create payment link" },
    profile: {
      panelHint: "Your space",
      themeLine: "Look & feel",
      menu: ["Profile", "Preferences", "Theme", "Alerts", "Security", "Billing", "Help", "Shortcuts"],
    },
  },
  aesthetic: {
    team: { loading: "Loading roster…", inviteUser: "Invite", blurb: "A calm surface for roles and permissions." },
    mode: { label: "Depth mode" },
    welcome: "Flow state. Quiet productivity.",
    statusLine: "Today’s energy",
    pages: {
      dashboard: {
        subtitle: "Soft contrast overview — conversations, revenue, rhythm.",
        export: "Export",
        newReport: "Compose report",
      },
      inbox: { subtitle: "Breathing room for triage and thoughtful replies." },
      payments: { subtitle: "Ledger with calm spacing and clear status." },
    },
    buttons: { quickAdd: "Flow State", notifications: "Signals" },
    search: { placeholder: "Search with intention…" },
    empty: {
      trendTitle: "Still waters",
      trendDescription: "Numbers surface gently as data arrives.",
      activityTitle: "Empty canvas",
      activityDescription: "The timeline fills as work moves through.",
    },
    dashboard: {
      trendSubtitle: "Light signal",
      healthSubtitle: "Quiet dependencies",
      activitySubtitle: "Soft timeline",
    },
    inbox: {
      emptyList: "No threads — space to think",
      replyPlaceholder: "Reply with care…",
      loadConversations: "Gathering quietly…",
    },
    payments: { loading: "Opening records…", generateLink: "Create payment link" },
    profile: {
      panelHint: "Studio profile",
      themeLine: "Palette",
      menu: ["Profile", "Tuning", "Theme", "Notices", "Security", "Billing", "Guide", "Shortcuts"],
    },
  },
  executive: {
    team: { loading: "Synchronizing roster…", inviteUser: "Add operator", blurb: "Governance for operators, roles, and access." },
    mode: { label: "Ops depth" },
    welcome: "Operational signals ready — priorities in view.",
    statusLine: "Operational Signals Ready",
    pages: {
      dashboard: {
        subtitle: "Board-level read: pipeline, collections, and coverage.",
        export: "Export data",
        newReport: "Revenue overview",
      },
      inbox: { subtitle: "High-signal triage for inbound conversations." },
      payments: { subtitle: "Collections, exceptions, and audit-friendly records." },
    },
    buttons: { quickAdd: "Revenue overview", notifications: "Priority alerts" },
    search: { placeholder: "Search records, counterparties, IDs…" },
    empty: {
      trendTitle: "No variance yet",
      trendDescription: "Trendlines populate when operational data lands.",
      activityTitle: "No audit trail entries",
      activityDescription: "Events register as transactions and messages flow.",
    },
    dashboard: {
      trendSubtitle: "Variance & throughput",
      healthSubtitle: "Dependency posture",
      activitySubtitle: "Audit trail",
    },
    inbox: {
      emptyList: "Queue empty",
      replyPlaceholder: "Draft response…",
      loadConversations: "Synchronizing queue…",
      newToast: "Inbound priority",
    },
    payments: { loading: "Retrieving ledger…", generateLink: "Issue payment link" },
    profile: {
      panelHint: "Executive profile",
      themeLine: "Workspace theme",
      menu: ["Profile", "Preferences", "Theme", "Alerts", "Security", "Billing", "Support", "Shortcuts"],
    },
  },
  hacker: {
    team: { loading: "GET /team …", inviteUser: "useradd", blurb: "operators[] — roles — ACL" },
    mode: { label: "PRO //" },
    welcome: "Systems Online",
    statusLine: "Systems Online",
    pages: {
      dashboard: {
        subtitle: "Live ops: traffic, settlements, operator load.",
        export: "dump.csv",
        newReport: "Deploy report",
      },
      inbox: { subtitle: "Session view — capture, reply, assign." },
      payments: { subtitle: "Ledger stream with status hashes." },
    },
    buttons: { quickAdd: "Deploy Ready", notifications: "watch()" },
    search: { placeholder: "grep workspace…" },
    empty: {
      trendTitle: "no signal()",
      trendDescription: "await metrics — stream idle.",
      activityTitle: "log empty",
      activityDescription: "append events when traffic hits.",
    },
    dashboard: {
      trendTitle: "signal()",
      trendSubtitle: "rolling window",
      healthTitle: "healthcheck",
      healthSubtitle: "deps",
      activityTitle: "event_log",
      activitySubtitle: "tail -f",
      apiOK: "ok",
      authOK: "ok",
      proMetricPrefix: "load:",
    },
    inbox: {
      emptyThread: "0 msgs",
      searchPlaceholder: "filter /phone|text/",
      emptyList: "0 threads",
      replyPlaceholder: "> compose_reply",
      loadConversations: "fetching inbox…",
      loadThread: "hydrating thread…",
      newToast: "new_message",
    },
    payments: { loading: "SELECT * …", refreshing: "re-fetch…", generateLink: "mklink" },
    profile: {
      workspaceLabel: "stratxcel::root",
      panelHint: "session",
      themeLine: "theme",
      signOut: "logout",
      menu: ["whoami", "prefs", "theme", "alerts", "acl", "billing", "man", "keys"],
    },
  },
  minimal: {
    team: { loading: "Loading…", inviteUser: "Invite", blurb: "Team." },
    mode: { label: "Pro" },
    welcome: "Ready.",
    statusLine: "Ready",
    pages: {
      dashboard: {
        subtitle: "Overview.",
        export: "Export",
        newReport: "Report",
      },
      inbox: { title: "Inbox", subtitle: "Messages." },
      team: { title: "Team", subtitle: "People." },
      payments: { title: "Payments", subtitle: "Records." },
      settings: { title: "Settings", subtitle: "Preferences." },
    },
    buttons: { quickAdd: "New", notifications: "Alerts" },
    search: { placeholder: "Search" },
    empty: {
      trendTitle: "Empty",
      trendDescription: "Data will appear here.",
      activityTitle: "Empty",
      activityDescription: "No entries.",
    },
    dashboard: {
      trendTitle: "Trend",
      trendSubtitle: "Summary",
      healthTitle: "Health",
      healthSubtitle: "Services",
      activityTitle: "Activity",
      activitySubtitle: "List",
    },
    inbox: {
      emptyList: "Empty",
      replyPlaceholder: "Message",
      loadConversations: "Loading…",
    },
    payments: { loading: "Loading…", refreshing: "…", generateLink: "Link", exportCsv: "CSV" },
    profile: {
      workspaceLabel: "Account",
      panelHint: "You",
      themeLine: "Theme",
      signOut: "Sign out",
      menu: ["Profile", "Preferences", "Theme", "Notifications", "Security", "Billing", "Help", "Shortcuts"],
    },
  },
};

export function getImmersion(themeId) {
  const patch = OVERRIDES[themeId];
  return patch ? deepMerge(DEFAULT_IMMERSION, patch) : DEFAULT_IMMERSION;
}

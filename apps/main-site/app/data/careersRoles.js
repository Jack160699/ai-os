/** Open roles — single source for /careers and /careers/[slug]. */

export const CAREERS_ROLES = [
  {
    slug: "creative-ads-operator",
    title: "Creative Ads Operator",
    teaser: "Turn vague offers into ads people actually understand.",
    intro:
      "You’ll own the messy middle between a real business and Meta / Google: clear hooks, honest creative, and tracking that doesn’t lie. No “growth hacking” slides — just ads that match how people actually buy.",
    expect: [
      "Comfort writing short copy and tightening hooks without sounding fake",
      "Basic comfort with ad dashboards — enough to spot what’s working",
      "Bias toward shipping: test small, learn, adjust",
    ],
    howWeWork: [
      "Async updates + WhatsApp for fast questions",
      "Weekly rhythm: what ran, what we learned, what we change",
      "You work with the same small team — no random handoffs",
    ],
    workType: "Hybrid · India (remote-friendly weeks)",
  },
  {
    slug: "website-experience-designer",
    title: "Website Experience Designer",
    teaser: "Make sites feel obvious on mobile — not pretty but confusing.",
    intro:
      "Most visitors decide in seconds. You’ll structure pages, tighten mobile flows, and make the next step (message, call, book) stupidly clear — without turning the site into a brochure wall.",
    expect: [
      "Strong layout sense and typography judgment (we use our system — you bring taste)",
      "Comfort prototyping in Figma or equivalent",
      "You care about load, clutter, and thumb-first layouts",
    ],
    howWeWork: [
      "Pair with clients’ real content — not lorem ipsum fantasies",
      "Short reviews with sharp notes — we respect focus time",
      "Ship in slices: hero → proof → action, then refine",
    ],
    workType: "Hybrid · India",
  },
  {
    slug: "client-communication-lead",
    title: "Client Communication Lead",
    teaser: "Keep clients calm, informed, and moving — without theatre.",
    intro:
      "You’re the person who turns vague worry into next steps: clear updates, honest timelines, and replies that feel human. Think operator, not account-manager performance.",
    expect: [
      "Excellent written English + voice notes that don’t ramble",
      "Comfort saying “not sure yet — here’s when we’ll know”",
      "Organized follow-ups across WhatsApp, email, and calls",
    ],
    howWeWork: [
      "We default to WhatsApp + short Looms for clarity",
      "No daily standup theatre — tight async + one weekly sync where needed",
      "You’ll see real SMB operators — gyms, clinics, local heroes",
    ],
    workType: "Remote · India",
  },
  {
    slug: "whatsapp-automation-builder",
    title: "WhatsApp Automation Builder",
    teaser: "Flows that feel human — not bot spam.",
    intro:
      "You’ll design reply flows, quick replies, and light automation so customers get answers fast — without feeling trapped in a machine. Practical over fancy every time.",
    expect: [
      "You’ve built or maintained real WhatsApp / messaging flows before",
      "You think in “if customer says X, we do Y” — not jargon",
      "Careful with compliance and opt-in — we don’t cut corners",
    ],
    howWeWork: [
      "Test with real numbers in staging before clients see it",
      "Document every flow so anyone can debug at 9pm",
      "Pair with Client Communication when tone matters",
    ],
    workType: "Remote · India",
  },
  {
    slug: "content-visual-editor",
    title: "Content & Visual Editor",
    teaser: "Make posts and decks look like one calm brand.",
    intro:
      "You polish what the team ships: carousels, simple motion, PDFs, email graphics. Consistency beats clever — you make Stratxcel and client work feel intentional, not patched together.",
    expect: [
      "Sharp Figma (or similar) + basic motion sense",
      "Fast iteration: version 3 is normal, ego isn’t",
      "Eye for hierarchy — what reads first on a phone",
    ],
    howWeWork: [
      "Brand tokens and templates so you’re not reinventing wheels",
      "Async feedback with timestamps — no vague “make it pop”",
      "You’ll touch real deliverables clients actually post",
    ],
    workType: "Hybrid · India",
  },
  {
    slug: "brand-story-researcher",
    title: "Brand Story Researcher",
    teaser: "Turn interviews and reviews into one clear story.",
    intro:
      "You talk to owners, read reviews, and find the honest wedge: why customers pick them. Then you hand creatives and copy a tight brief — not a 40-page strategy doc nobody reads.",
    expect: [
      "Curious interviewer — you like listening more than talking",
      "Strong note-taking → synthesis (bullet briefs, not essays)",
      "Comfort with Indian SMB context — Hindi/English mix is normal",
    ],
    howWeWork: [
      "Light research sprints: 3–5 calls → one-page story",
      "You work beside ads + web folks so insights become shipping work",
      "We protect client trust — discretion is non-negotiable",
    ],
    workType: "Remote · India",
  },
];

/** @type {Record<string, (typeof CAREERS_ROLES)[number]>} */
export const CAREERS_BY_SLUG = Object.fromEntries(CAREERS_ROLES.map((r) => [r.slug, r]));

export function getCareerRole(slug) {
  return CAREERS_BY_SLUG[slug] ?? null;
}

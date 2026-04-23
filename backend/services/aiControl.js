function escapeForPrompt(s) {
  return String(s || "").replace(/```/g, "``\u200b`");
}

const BOT_NAME = String(process.env.AI_BOT_NAME || "Stratxcel AI Growth Partner").trim();

const HINGLISH_HINTS = [
  "hai",
  "nahi",
  "chahiye",
  "karna",
  "kaise",
  "kya",
  "kitna",
  "ho",
  "aap",
  "mera",
  "hum",
  "leads",
  "website",
  "ads",
];

const HIGH_INTENT_KEYWORDS = ["price", "start", "payment", "cost", "kitna", "link", "ready"];

const SERVICE_PACKAGES = {
  website: {
    serviceLabel: "Website Development",
    packageName: "Website Growth Launch",
    outcomes: ["premium conversion-focused website", "WhatsApp + lead form integration", "basic SEO + speed setup"],
    priceInr: 19999,
    timeline: "5-7 days",
  },
  ads: {
    serviceLabel: "Lead Generation Ads",
    packageName: "Leadflow Ads Sprint",
    outcomes: ["campaign + targeting setup", "high-intent lead funnel", "daily optimization with reporting"],
    priceInr: 24999,
    timeline: "48 hours setup + 30 days management",
  },
  bot: {
    serviceLabel: "AI WhatsApp Bot",
    packageName: "AI Bot Conversion Stack",
    outcomes: ["WhatsApp auto-reply + lead qualification", "instant follow-up flow", "handoff rules for hot leads"],
    priceInr: 14999,
    timeline: "3-5 days",
  },
  seo: {
    serviceLabel: "SEO / Google Growth",
    packageName: "Local SEO Momentum",
    outcomes: ["Google ranking optimization", "location pages + keyword structure", "monthly growth roadmap"],
    priceInr: 12999,
    timeline: "30 days initial cycle",
  },
  branding: {
    serviceLabel: "Branding & Design",
    packageName: "Premium Brand Starter",
    outcomes: ["logo + visual identity", "social brand kit", "positioning-aligned creatives"],
    priceInr: 9999,
    timeline: "4-6 days",
  },
  automation: {
    serviceLabel: "Automation Systems",
    packageName: "Business Automation Core",
    outcomes: ["lead capture to CRM automation", "follow-up automation workflows", "manual effort reduction setup"],
    priceInr: 17999,
    timeline: "5-8 days",
  },
  growth: {
    serviceLabel: "Full Growth Package",
    packageName: "Stratxcel Growth Engine",
    outcomes: ["offer + funnel strategy", "lead gen + close support", "execution dashboard + weekly optimization"],
    priceInr: 29999,
    timeline: "7 days kickoff + ongoing optimization",
  },
};

const INDUSTRY_LINES = {
  salon: "For salons: faster local booking flow + repeat client follow-ups.",
  gym: "For gyms: trial-to-membership conversion and faster lead callbacks.",
  clinic: "For clinics: appointment trust signals + compliant patient follow-up flow.",
  real_estate: "For real estate: higher-intent lead filtering and site-visit conversion flow.",
  ecommerce: "For ecommerce: higher ROAS traffic + cart recovery and repeat purchase push.",
  general: "For your segment: lead quality, conversion, and follow-up speed improve together.",
};

const INDUSTRY_AUTHORITY_LINES = {
  salon: "Salons usually lose leads after hours. Booking automation fixes that fastest.",
  gym: "Gyms lose trial leads due to slow follow-up. Instant WhatsApp conversion works best.",
  clinic: "Clinics grow fastest with reminders + repeat booking automation.",
  ecommerce: "D2C brands win with abandoned cart recovery + repeat purchase flows.",
  real_estate: "Property leads die on delayed response. Instant qualification works best.",
  general: "Service businesses convert faster with instant response and structured follow-up.",
};

const INDUSTRY_BUNDLE_MAP = {
  salon: {
    primaryService: "ads",
    bundleName: "Salon Local Booking Accelerator",
    roiOutcomes: ["more local appointment leads", "higher repeat booking rate", "faster WhatsApp close cycle"],
    upsellService: "bot",
    upsellReason: "bot auto-followups reduce no-shows and lift booking conversion",
  },
  gym: {
    primaryService: "ads",
    bundleName: "Gym Trial-to-Membership Engine",
    roiOutcomes: ["higher trial lead volume", "better trial show-up rate", "more paid membership closes"],
    upsellService: "automation",
    upsellReason: "automation improves lead callback speed and conversion consistency",
  },
  clinic: {
    primaryService: "website",
    bundleName: "Clinic Trust + Appointment Growth Bundle",
    roiOutcomes: ["more appointment bookings", "higher patient trust conversion", "stronger local lead capture"],
    upsellService: "seo",
    upsellReason: "SEO adds steady high-intent appointment traffic",
  },
  real_estate: {
    primaryService: "ads",
    bundleName: "Real Estate Site-Visit Funnel Bundle",
    roiOutcomes: ["more qualified buyer leads", "higher site-visit booking rate", "faster deal pipeline movement"],
    upsellService: "bot",
    upsellReason: "bot qualifies inquiries instantly and filters low-intent chats",
  },
  ecommerce: {
    primaryService: "ads",
    bundleName: "Ecommerce ROAS + Recovery Bundle",
    roiOutcomes: ["higher purchase intent traffic", "better cart recovery conversion", "improved revenue per campaign"],
    upsellService: "automation",
    upsellReason: "automation improves abandoned cart and repeat purchase recovery",
  },
  general: {
    primaryService: "growth",
    bundleName: "Revenue Growth Starter Bundle",
    roiOutcomes: ["higher lead-to-sale conversion", "better sales consistency", "faster time to first revenue wins"],
    upsellService: "automation",
    upsellReason: "automation supports scale without increasing manual effort",
  },
};

function low(s) {
  return String(s || "").toLowerCase().trim();
}

function humanStyleVariant(seed = "") {
  const lines = [
    "Straight answer — starter plan is enough.",
    "Honestly, for your stage I'd keep it lean.",
    "Best ROI move right now: booking automation first.",
    "Quickest win: follow-up automation.",
  ];
  const s = String(seed || "x");
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return lines[h % lines.length];
}

export function isHighIntentMessage(message) {
  const text = low(message);
  if (!text) return false;
  return HIGH_INTENT_KEYWORDS.some((kw) => text.includes(kw));
}

export function detectRequestedService(message, memoryBlock = "") {
  const text = `${low(message)} ${low(memoryBlock)}`;
  if (/\b(website|site|landing page|web)\b/.test(text)) return "website";
  if (/\b(ad|ads|meta ads|facebook ads|google ads|lead gen)\b/.test(text)) return "ads";
  if (/\b(bot|whatsapp bot|chatbot|ai bot)\b/.test(text)) return "bot";
  if (/\b(seo|google ranking|gmb|google my business)\b/.test(text)) return "seo";
  if (/\b(brand|branding|logo|design)\b/.test(text)) return "branding";
  if (/\b(automation|crm|workflow|system)\b/.test(text)) return "automation";
  if (/\b(growth package|full service|full growth|complete package)\b/.test(text)) return "growth";
  return "growth";
}

export function getServicePackage(serviceKey) {
  return SERVICE_PACKAGES[serviceKey] || SERVICE_PACKAGES.growth;
}

export function isAgreementMessage(message) {
  const text = low(message);
  return /\b(yes|ok|okay|done|confirm|confirmed|go ahead|proceed|let's do it|lets do it|start now|kar do|theek hai|thik hai|start|ready|buy|send link|lets begin)\b/.test(
    text
  );
}

export function getIndustryBundle({ industry = "general", requestedService = "growth" }) {
  const base = INDUSTRY_BUNDLE_MAP[industry] || INDUSTRY_BUNDLE_MAP.general;
  const primaryService = requestedService && requestedService !== "growth" ? requestedService : base.primaryService;
  const pkg = getServicePackage(primaryService);
  const upsellService = base.upsellService;
  const upsellPkg = getServicePackage(upsellService);
  const showUpsell = upsellService && upsellService !== primaryService;
  return {
    industry,
    primaryService,
    packageName: base.bundleName,
    roiOutcomes: base.roiOutcomes,
    priceInr: pkg.priceInr,
    timeline: pkg.timeline,
    upsell: showUpsell
      ? {
          serviceKey: upsellService,
          packageName: upsellPkg.packageName,
          reason: base.upsellReason,
          priceInr: upsellPkg.priceInr,
        }
      : null,
  };
}

export function buildBundleRecommendationReply({
  language = "english",
  industry = "general",
  requestedService = "growth",
  previousNeed = "",
  returningClient = false,
}) {
  const bundle = getIndustryBundle({ industry, requestedService });
  const price = `₹${Number(bundle.priceInr || 0).toLocaleString("en-IN")}`;
  const roiLine = bundle.roiOutcomes.slice(0, 2).join(", ");
  const authorityLine = INDUSTRY_AUTHORITY_LINES[industry] || INDUSTRY_AUTHORITY_LINES.general;
  const resumeLine = previousNeed
    ? `Continuing your earlier need: ${String(previousNeed).replace(/_/g, " ")}.`
    : "";
  const trustLine = `Done-for-you setup, live in ${bundle.timeline}, with fast onboarding.`;
  const urgencyLine = "I'm onboarding a few setups this week, so timing is good if you're planning this.";
  const upsellLine = bundle.upsell
    ? `If this performs as expected, the smart add-on is ${bundle.upsell.packageName} (${`₹${Number(bundle.upsell.priceInr || 0).toLocaleString("en-IN")}`}) for compounding ROI.`
    : "";
  const returningUpsellLine =
    returningClient && bundle.upsell
      ? `Since you're returning, I would add ${bundle.upsell.packageName} early for faster gains.`
      : "";

  return [
    `Got it — ${industry.replace(/_/g, " ")} context makes sense.`,
    authorityLine,
    `Recommended for your business: ${bundle.packageName} at ${price}.`,
    resumeLine,
    `This works because ${roiLine}.`,
    trustLine,
    humanStyleVariant(`${industry}:${requestedService}:${previousNeed}`),
    urgencyLine,
    returningClient ? returningUpsellLine : upsellLine,
    "Should I get this started for you?",
  ]
    .filter(Boolean)
    .join("\n");
}

export function detectObjectionType(message) {
  const text = low(message);
  if (/\b(expensive|costly|high price|too much|mehenga|mahenga|price high|budget low)\b/.test(text)) return "expensive";
  if (/\b(later|baad me|bad me|next month|next week|phir|not today|abhi nahi)\b/.test(text)) return "later";
  if (/\b(trust|proof|real|genuine|fake|scam|bharosa|guarantee|reviews?)\b/.test(text)) return "trust";
  if (/\b(not now|no need|nahi chahiye|skip|not interested|mat karo)\b/.test(text)) return "not_now";
  return null;
}

export function buildObjectionReply({
  language = "english",
  objectionType = null,
  industry = "general",
  serviceKey = "growth",
}) {
  if (!objectionType) return "";
  const pkg = getServicePackage(serviceKey);
  const price = `₹${Number(pkg.priceInr || 0).toLocaleString("en-IN")}`;
  const anchorPrice = `₹${Number(Math.round((pkg.priceInr || 0) * 1.35)).toLocaleString("en-IN")}`;
  const industryLine = INDUSTRY_LINES[industry] || INDUSTRY_LINES.general;
  const authorityLine = "We run this playbook daily across Indian SMBs with measurable conversion lift.";
  const trustSignals = "Timeline locked, dedicated support, revisions included, and milestone-based delivery.";
  const urgencyLine = "Better to start early — these systems compound over time.";

  const objectionMap = {
    expensive: `Anchor is ${anchorPrice}; your optimized execution investment is ${price} for ${pkg.packageName} so ROI starts faster without wasted spend.`,
    later: `I recommend securing ${pkg.packageName} now so we can start execution on priority and avoid momentum loss.`,
    trust: `I recommend ${pkg.packageName} with a milestone-based delivery plan so you get transparent progress from day one.`,
    not_now: `I recommend a lean start with ${pkg.packageName} so you move forward without heavy commitment risk.`,
  };
  const core = objectionMap[objectionType] || objectionMap.expensive;

  return [
    "Understood. Most businesses at your stage face this.",
    core,
    industryLine,
    authorityLine,
    `Delivery stays clear: ${pkg.timeline}, with done-for-you support and revisions.`,
    urgencyLine,
    "Want me to set this up for you?",
  ].join("\n");
}

export function buildIntentRoutedReply({
  language = "english",
  intentBand = "cold",
  industry = "general",
  serviceKey = "growth",
  previousNeed = "",
}) {
  const bundle = getIndustryBundle({ industry, requestedService: serviceKey });
  const price = `₹${Number(bundle.priceInr || 0).toLocaleString("en-IN")}`;
  const anchorPrice = `₹${Number(Math.round((bundle.priceInr || 0) * 1.4)).toLocaleString("en-IN")}`;
  const authorityLine = INDUSTRY_AUTHORITY_LINES[industry] || INDUSTRY_AUTHORITY_LINES.general;
  const trustSignals = "Done-for-you setup. Proven for service businesses. Minimal effort from your side.";
  const urgencyLine = "I'm onboarding a few setups this week, so timing is good if you're planning this.";

  if (intentBand === "hot") {
    return [
      "Got it — this is a high-intent stage.",
      authorityLine,
      `Best option is: ${bundle.packageName} (${price}).`,
      `This works because ${bundle.roiOutcomes.slice(0, 2).join(", ")}.`,
      `Anchor is ${anchorPrice}, current execution plan is ${price}.`,
      `Live in ${bundle.timeline}.`,
      trustSignals,
      urgencyLine,
      "Should I get this started for you?",
    ].join("\n");
  }

  if (intentBand === "warm") {
    return [
      "Got it — this is common and fixable.",
      authorityLine,
      `Recommended for your business: ${bundle.packageName} (${price}).`,
      `Fastest route: ${bundle.roiOutcomes.slice(0, 2).join(", ")}.`,
      `Anchor is ${anchorPrice}, your plan is ${price}.`,
      `Live in ${bundle.timeline}.`,
      trustSignals,
      urgencyLine,
      "Want me to set this up for you?",
    ].join("\n");
  }

  return [
    "Understood. Most businesses at your stage face this.",
    authorityLine,
    `I'd start with: ${bundle.packageName} (${price}).`,
    `Primary outcome: ${bundle.roiOutcomes[0]}.`,
    previousNeed ? `Resume context: continuing your earlier need on ${String(previousNeed).replace(/_/g, " ")}.` : "",
    trustSignals,
    "Should I get this started for you?",
  ].join("\n");
}

export function buildCloseModeReply({
  language = "english",
  serviceKey = "growth",
  paymentLink = "",
  requiresEmail = false,
}) {
  const pkg = getServicePackage(serviceKey);
  const price = `₹${Number(pkg.priceInr || 0).toLocaleString("en-IN")}`;
  const anchorPrice = `₹${Number(Math.round((pkg.priceInr || 0) * 1.4)).toLocaleString("en-IN")}`;
  const outcomeLine = pkg.outcomes.map((x) => `✅ ${x}`).join("\n");
  const persuasionBlock = [
    "Authority: executed repeatedly for high-intent growth conversations.",
    `Price anchor: ${anchorPrice} | Your plan: ${price}`,
    "Risk reduction: timeline committed, dedicated support, revisions included.",
    "Ethical urgency: limited onboarding capacity this week.",
  ].join("\n");
  const cta = paymentLink
    ? `Perfect 👍\n\nSecure payment link:\n${paymentLink}\n\nAfter payment:\n1. Onboarding form\n2. Assets collection\n3. Setup starts immediately`
    : requiresEmail
      ? "Before I generate the payment link, share billing email once."
      : "Perfect — generating your live Razorpay payment link now.";

  if (language === "hinglish" || language === "hindi") {
    return [
      `Perfect. ${pkg.serviceLabel} ke liye close-ready plan:`,
      "",
      `Package: ${pkg.packageName}`,
      `Outcomes:`,
      outcomeLine,
      persuasionBlock,
      `Timeline: ${pkg.timeline}`,
      "",
      cta,
    ].join("\n");
  }

  return [
    `Perfect. Here is the close-ready plan for ${pkg.serviceLabel}:`,
    "",
    `Package: ${pkg.packageName}`,
    "Outcomes:",
    outcomeLine,
    persuasionBlock,
    `Timeline: ${pkg.timeline}`,
    "",
    cta,
  ].join("\n");
}

export function detectUserLanguage(message) {
  const input = String(message || "");
  if (/[\u0900-\u097F]/.test(input)) return "hindi";
  const lower = low(input);
  const hasHinglishWord = HINGLISH_HINTS.some((x) => lower.includes(x));
  const hasEnglishSignal = /\b(need|website|marketing|price|cost|growth|service|seo|automation)\b/.test(lower);
  if (hasHinglishWord && hasEnglishSignal) return "hinglish";
  if (hasHinglishWord) return "hinglish";
  return "english";
}

export function routeStrategicIntent(message) {
  const text = low(message);
  const wantsServices = /^(services|help|offerings)\b/.test(text) || /\b(what do you do|kya karte ho)\b/.test(text);
  const wantsPricing = /\b(price|pricing|cost|charges|kitna|kitne|budget)\b/.test(text);
  const wantsWebsite = /\b(website chahiye|need website|website banana)\b/.test(text);
  const wantsLeadsFix = /\b(leads nahi aa rahe|no leads|not getting leads)\b/.test(text);
  const isInterested = /\b(interested|let's start|lets start|ready to start|ready)\b/.test(text);

  if (wantsServices) return "services_menu";
  if (wantsWebsite) return "website_interest";
  if (wantsLeadsFix) return "leads_issue";
  if (isInterested) return "interested";
  if (wantsPricing) return "pricing";
  return "general";
}

export function directIntentReply(intent, language = "english") {
  if (intent === "services_menu") {
    return [
      "Understood. Most service businesses need faster response and better follow-up first.",
      "Best route is website conversion + lead generation + WhatsApp automation in one stack.",
      "Should I map the best setup for your business?",
    ].join("\n");
  }

  if (intent === "pricing") {
    return [
      "Got it — pricing clarity first.",
      "Best option is Website Growth Launch at ₹19,999.",
      "Anchor is ₹27,999, so current plan is value-optimized for this stage.",
      "Want me to set this up for you?",
    ].join("\n");
  }

  if (intent === "website_interest") {
    return [
      "Got it — website + conversion focus, makes sense.",
      "Best fix is a conversion-first rollout so traffic turns into enquiries faster.",
      "Live in 5-7 days with done-for-you setup, support, and revisions.",
      "Should I get this started for you?",
    ].join("\n");
  }

  if (intent === "leads_issue") {
    return [
      "Got it — leads issue, understood.",
      "Usually this happens due to weak targeting, funnel gaps, or slow follow-up.",
      "Fastest route is fixing response flow first, then scaling traffic.",
      "Want me to set this up for you?",
    ].join("\n");
  }

  if (intent === "interested") {
    return [
      "Great — understood.",
      "Recommended for your business: the best-fit ROI bundle for your stage.",
      "Execution is done-for-you with clear onboarding and fast launch.",
      "Should I get this started for you?",
    ].join("\n");
  }
  return "";
}

function languageInstruction(language) {
  if (language === "hindi") return "User language is Hindi. Reply fully in natural Hindi (Devanagari).";
  if (language === "hinglish") return "User language is Hinglish. Reply in natural Indian Hinglish (Roman Hindi + English mix).";
  return "User language is English. Reply in clear conversational English.";
}

export function buildPrompt(mode, userMessage, memoryBlock = "", options = {}) {
  const mem = (memoryBlock || "").trim();
  const memorySection = mem ? `\n${escapeForPrompt(mem)}\n` : "\nNo memory context available.\n";
  const language = detectUserLanguage(userMessage);
  const intent = routeStrategicIntent(userMessage);
  const closeMode = Boolean(options.closeMode);
  const serviceKey = String(options.serviceKey || "");
  const packageName = String(options.packageName || "");
  const packagePrice = options.packagePrice != null ? `₹${Number(options.packagePrice).toLocaleString("en-IN")}` : "";
  const packageTimeline = String(options.packageTimeline || "");
  const paymentLink = String(options.paymentLink || "");
  const modeHint =
    closeMode
      ? "CLOSE_MODE: no questions unless mandatory field is missing. Give package, outcomes, price, timeline, and direct payment CTA."
      : mode === "SALES_MODE"
      ? "User is price or decision focused. Give concise option guidance with one smart qualifying question."
      : mode === "SUGGESTION_MODE"
        ? "User is unsure. Recommend practical growth path with one next step."
        : "Focus on understanding user need before proposing.";

  return `
You are Stratxcel AI — a premium Indian business growth partner on WhatsApp.

Your mission is to convert incoming leads into paying customers for Stratxcel by guiding conversations naturally, building trust, qualifying leads, and closing sales.

━━━━━━━━━━━━━━━━━━
🧠 CORE IDENTITY
━━━━━━━━━━━━━━━━━━

You are NOT a robotic assistant.

You are:
• Smart growth consultant
• Sales closer
• Friendly strategist
• Indian market expert
• Fast problem solver

Tone:
• Human
• Confident
• Helpful
• Premium
• Sharp
• Warm
• Trustworthy

Never sound boring, corporate, robotic, desperate, or overly formal.

Talk like a successful consultant who genuinely helps businesses grow.

━━━━━━━━━━━━━━━━━━
🎯 PRIMARY GOAL
━━━━━━━━━━━━━━━━━━

Turn WhatsApp inquiries into:

1. Qualified leads
2. Phone calls
3. Payments
4. Long-term clients

Every reply should move the user one step closer to buying.

━━━━━━━━━━━━━━━━━━
💼 SERVICES TO SELL
━━━━━━━━━━━━━━━━━━

Stratxcel provides:

1. Website Development
2. Lead Generation Ads
3. Google My Business Growth
4. SEO
5. Branding & Logo Design
6. Social Media Growth
7. AI WhatsApp Bots
8. Automation Systems
9. Funnel Building
10. CRM Setup
11. Full Business Growth Packages

━━━━━━━━━━━━━━━━━━
🇮🇳 LANGUAGE RULES
━━━━━━━━━━━━━━━━━━

If user writes English → reply English

If user writes Hindi → reply Hindi

If user writes Hinglish → reply Hinglish

Examples:

User: website banana hai  
Reply: Great choice 👍 Aajkal website sirf design nahi, lead machine honi chahiye.

User: price kya hai  
Reply: Depends on your goal 👍 Leads chahiye ya branding?

User: I need leads  
Reply: Perfect. What business are you in?

Sound natural like a real Indian consultant.

━━━━━━━━━━━━━━━━━━
💬 WHATSAPP STYLE RULES
━━━━━━━━━━━━━━━━━━

Use short readable messages.

Good format:

✅ Point 1  
✅ Point 2  
✅ Point 3

Use spacing.

Avoid long boring paragraphs.

Use occasional emojis:
👍 🚀 👌 📈 🔥 😊

Never overuse emojis.

━━━━━━━━━━━━━━━━━━
🧲 SALES PSYCHOLOGY RULES
━━━━━━━━━━━━━━━━━━

Use these triggers naturally:

1. Trust
“We help businesses grow daily.”

2. Authority
“This strategy works especially well for clinics / gyms / local brands.”

3. Curiosity
“There may be a faster way to get leads for your business.”

4. Simplicity
“We handle everything for you.”

5. Urgency
“Starting early gives faster results.”

6. Personalization
Based on their business type.

7. Outcome focus
Leads, sales, trust, bookings, growth.

━━━━━━━━━━━━━━━━━━
🧠 LEAD QUALIFICATION FLOW
━━━━━━━━━━━━━━━━━━

When user shows interest, collect naturally:

1. Business type
2. City/location
3. Current challenge
4. Goal
5. Urgency
6. Budget range
7. Preferred service

Never interrogate.

Ask one question at a time.

Example:

What business do you run?  
Which city are you targeting?  
Main goal leads hai ya branding?

━━━━━━━━━━━━━━━━━━
💰 PRICING RULES
━━━━━━━━━━━━━━━━━━

Never dump price list immediately.

Use value first.

Then price.

Example:

Website packages usually start from ₹9,999 depending on pages + features.

If I know your business type, I can suggest the best value option 👍

Ads management usually starts from ₹12,999/month.

AI bots start from ₹14,999.

Always continue conversation after price.

━━━━━━━━━━━━━━━━━━
🚀 CTA RULES
━━━━━━━━━━━━━━━━━━

Every conversation must end with a next step.

Use:

• Want best package recommendation?
• Shall I suggest 3 options?
• Want a quick call today?
• Want examples?
• Want to start this week?
• Can I make a growth plan for you?

Never end cold.

━━━━━━━━━━━━━━━━━━
🛑 HANDLE OBJECTIONS
━━━━━━━━━━━━━━━━━━

If expensive:

Totally understand 👍  
We also have starter plans that work well for many businesses.

If trust issue:

Happy to explain process clearly and show examples.

If thinking later:

No problem 👍 Starting earlier usually gives faster results. Want me to share options now so you can compare?

If not interested:

No worries 😊 If growth becomes priority later, just message anytime.

━━━━━━━━━━━━━━━━━━
🏆 INDUSTRY-SPECIFIC SELLING
━━━━━━━━━━━━━━━━━━

If clinic:
Appointments + trust + maps + leads

If gym:
Membership leads + trial bookings

If restaurant:
Orders + local discovery + reviews

If real estate:
Qualified leads + landing pages

If coaching:
Admissions + webinar funnel

If local shop:
Nearby customers + WhatsApp inquiries

━━━━━━━━━━━━━━━━━━
👑 FOUNDER COMMANDS
━━━━━━━━━━━━━━━━━━

If owner/admin sends:

today status
revenue
hot leads
stats

Return internal metrics only for owner numbers.

Never expose admin commands to customers.

━━━━━━━━━━━━━━━━━━
⚠️ NEVER DO
━━━━━━━━━━━━━━━━━━

Do not sound robotic.
Do not overtalk.
Do not write essays.
Do not give fake guarantees.
Do not say “As an AI language model.”
Do not say “Please wait while I process.”
Do not end conversation without CTA.
Do not push too aggressively.

━━━━━━━━━━━━━━━━━━
🔥 EXAMPLES
━━━━━━━━━━━━━━━━━━

User: Hi

Reply:

👋 Welcome to Stratxcel AI

We help businesses grow with:

✅ More Leads  
✅ High-Converting Websites  
✅ Branding  
✅ Automation

What would you like to grow today?

━━━━━━━━━━━━━━━━━━

User: website banana hai

Reply:

Great choice 👍

Aaj website sirf design nahi — trust + lead tool honi chahiye.

Aapka business kya hai?

━━━━━━━━━━━━━━━━━━

User: price kya hai

Reply:

Website plans ₹9,999 se start hote hain depending on features.

Aap business bata do, best option suggest karta hoon 👍

━━━━━━━━━━━━━━━━━━

User: leads nahi aa rahe

Reply:

Samjha 👍 Usually leads low hone ke common reasons:

✅ Wrong targeting  
✅ Weak offer  
✅ Poor follow-up  
✅ No trust system

Aapka business kya hai? I’ll suggest best fix.

━━━━━━━━━━━━━━━━━━

FINAL RULE:

You are here to grow businesses and close deals professionally.
Every message should feel valuable, human, and conversion-focused.

Mandatory conversion controls:
- Ask zero questions by default.
- Ask at most one question only when a mandatory field is missing to execute next step.
- Stay focused only on the service the user requested in this message.
- Use confident, direct, premium sales closer tone.
- Replace passive questions with clear recommendations.
- Include trust signals naturally: timeline, support, revisions.
- Add soft urgency without sounding pushy.
- Keep replies short and high-impact; prefer bullets over long paragraphs.
- End every sales reply with one next step: demo, payment, call, WhatsApp audit, or setup start.
- Avoid weak phrases: maybe, perhaps, let me know, if interested, we can try, what do you think.

━━━━━━━━━━━━━━━━━━
📌 RUNTIME CONTEXT (apply on top of the above)
━━━━━━━━━━━━━━━━━━
${languageInstruction(language)}

Mode: ${modeHint}
Intent tag: ${intent}
Close mode: ${closeMode ? "ON" : "OFF"}
Focused service: ${serviceKey || "auto"}
Package name: ${packageName || "auto"}
Package price: ${packagePrice || "auto"}
Package timeline: ${packageTimeline || "auto"}
Payment link: ${paymentLink || "pending"}

[CONTEXT MEMORY]
${memorySection}

[CURRENT USER MESSAGE — reply to this only]
${escapeForPrompt(userMessage)}
`;
}

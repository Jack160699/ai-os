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

function low(s) {
  return String(s || "").toLowerCase().trim();
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
      "🚀 Stratxcel can help with:",
      "",
      "1️⃣ Website Development",
      "2️⃣ More Leads with Ads",
      "3️⃣ AI WhatsApp Bots",
      "4️⃣ Branding & Design",
      "5️⃣ SEO / Google Growth",
      "6️⃣ Automation Systems",
      "7️⃣ Full Growth Packages",
      "",
      "Reply with a number 👍",
    ].join("\n");
  }

  if (intent === "pricing") {
    if (language === "english") {
      return [
        "Here are starting plans:",
        "- Website starts ₹9,999",
        "- AI Bot starts ₹14,999",
        "- Ads Management starts ₹12,999/month",
        "- Branding starts ₹2,999",
        "",
        "Best option depends on your business goal and current stage.",
        "What are you looking to grow first?",
      ].join("\n");
    }
    return [
      "Starting pricing ye hai:",
      "- Website starts ₹9,999",
      "- AI Bot starts ₹14,999",
      "- Ads Management starts ₹12,999/month",
      "- Branding starts ₹2,999",
      "",
      "Best option aapke business goal aur current stage pe depend karta hai.",
      "Abhi sabse pehle kya grow karna hai?",
    ].join("\n");
  }

  if (intent === "website_interest") {
    return [
      "Great choice 👌",
      "Aajkal website sirf design nahi - trust + lead tool honi chahiye.",
      "Aapka business type kya hai?",
    ].join("\n");
  }

  if (intent === "leads_issue") {
    return [
      "Samajh gaya 👍 Usually issue hota hai:",
      "",
      "1. weak ads targeting",
      "2. no funnel",
      "3. slow follow-up",
      "",
      "Isko improve kiya ja sakta hai.",
    ].join("\n");
  }

  if (intent === "interested") {
    return [
      "Great 👍",
      "Can I know:",
      "1. your business type",
      "2. current goal",
      "3. budget range",
      "",
      "Then I'll suggest the best fit.",
    ].join("\n");
  }
  return "";
}

function languageInstruction(language) {
  if (language === "hindi") return "User language is Hindi. Reply fully in natural Hindi (Devanagari).";
  if (language === "hinglish") return "User language is Hinglish. Reply in natural Indian Hinglish (Roman Hindi + English mix).";
  return "User language is English. Reply in clear conversational English.";
}

export function buildPrompt(mode, userMessage, memoryBlock = "") {
  const mem = (memoryBlock || "").trim();
  const memorySection = mem ? `\n${escapeForPrompt(mem)}\n` : "\nNo memory context available.\n";
  const language = detectUserLanguage(userMessage);
  const intent = routeStrategicIntent(userMessage);
  const modeHint =
    mode === "SALES_MODE"
      ? "User is price or decision focused. Give concise option guidance with one smart qualifying question."
      : mode === "SUGGESTION_MODE"
        ? "User is unsure. Recommend practical growth path with one next step."
        : "Focus on understanding user need before proposing.";

  return `
You are ${BOT_NAME}.

[IDENTITY]
- Premium Indian-market sales and growth consultant for: websites, lead generation, Meta ads, AI bots, branding, SEO, automation, growth consulting.
- Sound like a smart human assistant, not a robotic support bot.

[LANGUAGE]
${languageInstruction(language)}

[WHATSAPP STYLE]
- Keep response short and readable: 2-5 short paragraphs max.
- Use bullets only when helpful.
- Allowed occasional emojis only: 👍🔥🚀📈👋
- Tone mix: 40% consultant, 30% friendly, 20% sales expert, 10% premium brand.
- Be calm, confident, practical, trustworthy.

[SALES BEHAVIOR]
- Never hard sell.
- Understand need first.
- Ask smart questions such as: business type, main goal, leads vs branding vs website vs automation, ads running status, city served.
- Sell outcomes not services.

[PRICING RULE]
- If user asks pricing, use only these starting points:
  - Website starts ₹9,999
  - AI Bot starts ₹14,999
  - Ads Management starts ₹12,999/month
  - Branding starts ₹2,999
- Then ask: what they want to grow first.

[LEAD QUALIFICATION]
- On buying intent, ask for: Name, Business type, City, Main goal, Budget range, Preferred call time.
- If likely serious, naturally move to next step.

[SAFETY]
- Never promise guaranteed results.
- Never use spammy urgency or fake scarcity.
- Avoid desperate or pushy phrasing.

[MODE]
- ${modeHint}
- Detected intent: ${intent}

[CONTEXT MEMORY]
${memorySection}

[USER MESSAGE]
${escapeForPrompt(userMessage)}
`;
}

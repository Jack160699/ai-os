/**
 * Service deep pages — spoken pain, practical build list, process, CTA.
 * Keys match route slugs (e.g. websites, ads, automation).
 */

const T = {
  websites: {
    hi: {
      eyebrow: "Websites",
      title: "Site hai. Kaam nahi aa rahi?",
      painLines:
        "Website hai.\nTraffic bhi aa raha hai.\nFir bhi inquiry nahi.\n\nKabhi slow, kabhi confusing, kabhi mobile pe toot-ta lagta hai.",
      buildTitle: "Hum kya banate hain",
      buildItems: [
        "Landing pages jo seedhi baat karein",
        "Booking / lead forms jo actually chalte hain",
        "Small business sites — fast, clean, maintainable",
        "Mobile pe readable layout (zoom-zoom nahi)",
        "Analytics jo tum samajh sako",
      ],
      visualsTitle: "Kaisa output dikhta hai",
      visualCaptions: ["Clean marketing site", "Simple booking screen", "Mobile layout"],
      process: [
        { t: "Pehle samajhte hain", d: "Kya chal raha hai, kahan atak rahe ho." },
        { t: "Fir structure set karte hain", d: "Pages, flow, content blocks." },
        { t: "Fir launch + handover", d: "Taaki tum team se sambhal sako." },
      ],
      ctaTitle: "Aapki site pe sabse zyada dikkat kahan hai?",
      ctaSub: "Chhota message bhi chalega — hum padh ke reply karte hain.",
    },
    en: {
      eyebrow: "Websites",
      title: "Site’s up — still not working?",
      painLines:
        "You have a site.\nTraffic shows up sometimes.\nStill no real inquiries.\n\nSlow, confusing, or rough on phones — we’ve seen all of it.",
      buildTitle: "What we actually build",
      buildItems: [
        "Landing pages that say what you mean",
        "Booking / lead flows that don’t break",
        "Small business sites — fast and maintainable",
        "Layouts that read well on mobile",
        "Analytics you can actually read",
      ],
      visualsTitle: "What the work tends to look like",
      visualCaptions: ["Clean marketing site", "Simple booking UI", "Mobile-first layout"],
      process: [
        { t: "We understand first", d: "What’s broken, where it hurts." },
        { t: "Then we structure", d: "Pages, flow, blocks." },
        { t: "Then ship + handover", d: "So your team can run it." },
      ],
      ctaTitle: "Where does your site hurt most?",
      ctaSub: "A short message is enough — we read everything.",
    },
  },
  ads: {
    hi: {
      eyebrow: "Ads",
      title: "Paise ja rahe hain… pata nahi kya chal raha?",
      painLines:
        "Boost chal raha hai.\nClick aa rahe hain.\nFir banda gayab.\n\nCreative aur landing alag lag rahe hain?",
      buildTitle: "Hum kya set karte hain",
      buildItems: [
        "Simple campaign structure (zyada layers nahi)",
        "Landing + ad message align",
        "Conversion tracking jo tum dekh sako",
        "Budget guardrails — overspend se bachna",
        "WhatsApp / form handoff clean",
      ],
      visualsTitle: "Control room jaisa feel",
      visualCaptions: ["Campaign overview", "Ad + landing match", "Spend vs leads"],
      process: [
        { t: "Pehle numbers dekhte hain", d: "Kya chal raha hai, kya nahi." },
        { t: "Fir message tight karte hain", d: "Ad + page ek hi story." },
        { t: "Fir monitor + adjust", d: "Weekly sanity, not panic." },
      ],
      ctaTitle: "Ads mein sabse zyada dimaag kahan kharab hota hai?",
      ctaSub: "Bata do — seedhi planning shuru kar sakte hain.",
    },
    en: {
      eyebrow: "Ads",
      title: "Spend’s moving… hard to tell what’s real?",
      painLines:
        "Campaigns are on.\nClicks happen.\nThen silence.\n\nCreative and landing feel like different worlds?",
      buildTitle: "What we set up",
      buildItems: [
        "Simple campaign structure (no maze)",
        "Landing + ad message aligned",
        "Tracking you can read",
        "Budget guardrails",
        "Clean handoff to WhatsApp / forms",
      ],
      visualsTitle: "What we aim for visually",
      visualCaptions: ["Campaign snapshot", "Ad + landing match", "Spend vs leads"],
      process: [
        { t: "Look at the numbers", d: "What’s working, what isn’t." },
        { t: "Tighten the message", d: "Ad + page tell one story." },
        { t: "Monitor calmly", d: "Weekly checks, not chaos." },
      ],
      ctaTitle: "What part of ads annoys you most?",
      ctaSub: "Tell us — we can plan from there.",
    },
  },
  automation: {
    hi: {
      eyebrow: "Automation · WhatsApp · CRM",
      title: "Bar bar wahi manual kaam?",
      painLines:
        "Excel + WhatsApp + dimaag = same cheez 50 baar.\n\nLead aata hai… fir bikhar jaata hai?\nTeam ko pata hi nahi kisne kya bola.",
      buildTitle: "Hum kya connect karte hain",
      buildItems: [
        "WhatsApp auto-replies + routing (sensible, spam nahi)",
        "CRM setup — lead stages, owners, reminders",
        "Sheets / forms → CRM sync jahan zarurat ho",
        "Simple dashboards: kitne leads, kahan atke",
        "n8n / Zapier-style flows — practical, documented",
      ],
      anchorWhatsapp: "WhatsApp systems",
      anchorCrm: "CRM systems",
      visualsTitle: "Systems dikhte kaise hain",
      visualCaptions: ["WhatsApp + inbox calm", "CRM pipeline", "Automation flow"],
      process: [
        { t: "Pehle flow map", d: "As-is process, pain points." },
        { t: "Fir tools choose", d: "Jo team actually use kare." },
        { t: "Fir go-live + training", d: "Chhota doc, chhota demo." },
      ],
      ctaTitle: "Sabse pehle kaunsa mess fix karna hai?",
      ctaSub: "WhatsApp, CRM, ya dono — bata do.",
    },
    en: {
      eyebrow: "Automation · WhatsApp · CRM",
      title: "Same manual work on repeat?",
      painLines:
        "Spreadsheets + WhatsApp + memory = exhaustion.\n\nLeads arrive… then vanish?\nNobody knows who said what.",
      buildTitle: "What we wire together",
      buildItems: [
        "WhatsApp auto-replies + routing (sensible, not spammy)",
        "CRM setup — stages, owners, reminders",
        "Sheets / forms → CRM where it helps",
        "Simple dashboards: leads, bottlenecks",
        "n8n / Zapier-style flows — documented",
      ],
      anchorWhatsapp: "WhatsApp systems",
      anchorCrm: "CRM systems",
      visualsTitle: "What it tends to look like",
      visualCaptions: ["WhatsApp + inbox calm", "CRM pipeline", "Automation flow"],
      process: [
        { t: "Map the flow", d: "As-is, pain points." },
        { t: "Pick tools", d: "What your team will use." },
        { t: "Go-live + train", d: "Short doc, short demo." },
      ],
      ctaTitle: "Which mess should we fix first?",
      ctaSub: "WhatsApp, CRM, or both — say it plainly.",
    },
  },
  "mobile-apps": {
    hi: {
      eyebrow: "Mobile apps",
      title: "App chahiye… par scope clear nahi?",
      painLines:
        "Idea strong hai.\nPar screen-by-screen socha nahi.\n\nPlay Store / App Store ka scene bhi alag hai.",
      buildTitle: "Hum kya deliver karte hain",
      buildItems: [
        "React Native apps (iOS + Android ek codebase)",
        "Auth, profiles, basic dashboards",
        "Push notifications jahan zarurat ho",
        "API wiring tumhare backend se",
        "Release checklist — crash-free basics",
      ],
      visualsTitle: "UI ka rough shape",
      visualCaptions: ["App shell + nav", "List + detail screens", "Settings / profile"],
      process: [
        { t: "Pehle scope lock", d: "MVP vs baad mein." },
        { t: "Fir build in slices", d: "Har slice test ho." },
        { t: "Fir store prep", d: "Icons, copy, review." },
      ],
      ctaTitle: "App mein pehla version kya hona chahiye?",
      ctaSub: "MVP bata do — realistic plan banate hain.",
    },
    en: {
      eyebrow: "Mobile apps",
      title: "You want an app — scope still fuzzy?",
      painLines:
        "The idea is strong.\nScreens aren’t thought through yet.\n\nStores have their own headaches too.",
      buildTitle: "What we ship",
      buildItems: [
        "React Native apps (iOS + Android, one codebase)",
        "Auth, profiles, simple dashboards",
        "Push where it makes sense",
        "API wiring to your backend",
        "Release checklist — basics solid",
      ],
      visualsTitle: "Rough UI shape",
      visualCaptions: ["App shell + nav", "List + detail", "Settings / profile"],
      process: [
        { t: "Lock scope", d: "MVP vs later." },
        { t: "Build in slices", d: "Each slice tested." },
        { t: "Store prep", d: "Icons, copy, review." },
      ],
      ctaTitle: "What should v1 do first?",
      ctaSub: "Tell us the MVP — we’ll plan honestly.",
    },
  },
  "ai-systems": {
    hi: {
      eyebrow: "AI systems",
      title: "AI use karna hai… par process kahan hai?",
      painLines:
        "Tool try kar liye.\nTeam confused.\n\nData bhi sensitive hai — kahan lagana hai, samajh nahi aa raha.",
      buildTitle: "Hum kya banate hain",
      buildItems: [
        "Internal copilots — docs, FAQs, SOPs",
        "Ticket / email triage helpers (human final say)",
        "RAG on your own files (access control ke saath)",
        "WhatsApp + AI handoff jahan safe ho",
        "Logging + guardrails — pata rahe kya hua",
      ],
      visualsTitle: "System ka surface",
      visualCaptions: ["Chat + sources panel", "Human review step", "Usage log"],
      process: [
        { t: "Risk check", d: "Data, access, truth." },
        { t: "Pilot chhota", d: "Ek team, ek use-case." },
        { t: "Fir expand", d: "Jab confidence aaye." },
      ],
      ctaTitle: "AI se pehle kaunsa kaam hal karna hai?",
      ctaSub: "Internal tool ya customer-facing — dono alag game hain.",
    },
    en: {
      eyebrow: "AI systems",
      title: "You want AI — but where’s the process?",
      painLines:
        "Tools were tried.\nThe team’s unsure.\n\nData is sensitive — hard to know what’s safe.",
      buildTitle: "What we build",
      buildItems: [
        "Internal copilots — docs, FAQs, SOPs",
        "Ticket / email triage helpers (humans approve)",
        "RAG on your files (with access control)",
        "WhatsApp + AI handoff where it’s safe",
        "Logging + guardrails",
      ],
      visualsTitle: "What the surface looks like",
      visualCaptions: ["Chat + sources", "Human review step", "Usage log"],
      process: [
        { t: "Risk check", d: "Data, access, truth." },
        { t: "Small pilot", d: "One team, one job." },
        { t: "Expand when calm", d: "No rush theatre." },
      ],
      ctaTitle: "Which job should AI tackle first?",
      ctaSub: "Internal vs customer-facing — different games.",
    },
  },
  branding: {
    hi: {
      eyebrow: "Branding",
      title: "Logo hai… par feel consistent nahi?",
      painLines:
        "Har jagah alag font, alag colour.\nWhatsApp pe ek tone, site pe doosra.\n\nCustomer ko lagta hai alag-alag company.",
      buildTitle: "Hum kya tighten karte hain",
      buildItems: [
        "Simple brand kit: type, colour, spacing rules",
        "Social templates jo team use kar sake",
        "Pitch / one-pager layout (PDF bhi)",
        "Website tone + visuals align",
        "Chhota style guide — lamba manifesto nahi",
      ],
      visualsTitle: "Kit jaisa feel",
      visualCaptions: ["Colour + type strip", "Social template", "One-pager layout"],
      process: [
        { t: "Pehle audit", d: "Kahan mismatch hai." },
        { t: "Fir kit banate hain", d: "Useable files." },
        { t: "Fir roll-out help", d: "Site + social sync." },
      ],
      ctaTitle: "Sabse zyada mismatch kahan dikhta hai?",
      ctaSub: "Site, social, ya dono — bata do.",
    },
    en: {
      eyebrow: "Branding",
      title: "You have a logo — but nothing feels consistent?",
      painLines:
        "Fonts and colours jump around.\nWhatsApp sounds one way, the site another.\n\nCustomers feel like it’s different companies.",
      buildTitle: "What we tighten",
      buildItems: [
        "Simple brand kit: type, colour, spacing",
        "Social templates your team can reuse",
        "Pitch / one-pager layout",
        "Site tone + visuals aligned",
        "A short style guide — not a novel",
      ],
      visualsTitle: "What a kit feels like",
      visualCaptions: ["Colour + type strip", "Social template", "One-pager layout"],
      process: [
        { t: "Audit", d: "Where it drifts." },
        { t: "Build the kit", d: "Files you’ll use." },
        { t: "Roll-out help", d: "Site + social sync." },
      ],
      ctaTitle: "Where does it feel most off-brand?",
      ctaSub: "Site, social, or both — say it plainly.",
    },
  },
};

export const SERVICE_PAGE_COPY = T;
export const SERVICE_SLUGS = Object.keys(SERVICE_PAGE_COPY);

export function getServiceCopy(slug) {
  return SERVICE_PAGE_COPY[slug] ?? null;
}

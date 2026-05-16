"use client";

import Link from "next/link";
import {
  getStoredLanguageExperience,
  LANGUAGE_HINGLISH,
  useLanguagePreference,
} from "./LanguagePreferenceProvider";

const CARDS = [
  {
    href: "/websites",
    icon: "web",
    hi: {
      title: "Website bani hui hai…\npar kaam nahi aa rahi?",
      hint: "Speed, mobile, message clear",
    },
    en: {
      title: "Site’s live…\nbut it’s not pulling weight?",
      hint: "Speed, mobile, clear next step",
    },
  },
  {
    href: "/ads",
    icon: "ads",
    hi: {
      title: "Boost chal raha hai…\npar end mein shor?",
      hint: "Spend, message, landing match",
    },
    en: {
      title: "Ads are on…\nstill noisy at the end?",
      hint: "Spend, message, landing match",
    },
  },
  {
    href: "/ai-systems",
    icon: "ai",
    hi: {
      title: "AI try kiya…\nteam confused?",
      hint: "Internal tools, safe pilots",
    },
    en: {
      title: "Tried AI…\nteam still unsure?",
      hint: "Internal tools, safe pilots",
    },
  },
  {
    href: "/automation#whatsapp",
    icon: "wa",
    hi: {
      title: "WhatsApp pe sab\nbikhar jaata hai?",
      hint: "Replies, labels, routing",
    },
    en: {
      title: "WhatsApp\nall over the place?",
      hint: "Replies, labels, routing",
    },
  },
  {
    href: "/mobile-apps",
    icon: "app",
    hi: {
      title: "App chahiye…\npar scope clear nahi?",
      hint: "React Native, honest MVP",
    },
    en: {
      title: "Want an app…\nscope still fuzzy?",
      hint: "React Native, honest MVP",
    },
  },
  {
    href: "/automation#crm",
    icon: "crm",
    hi: {
      title: "Lead aata hai…\nfir gayab?",
      hint: "CRM stages, owners, reminders",
    },
    en: {
      title: "Leads show up…\nthen vanish?",
      hint: "CRM stages, owners, reminders",
    },
  },
  {
    href: "/branding",
    icon: "brand",
    hi: {
      title: "Har jagah alag feel?\nConsistency nahi?",
      hint: "Type, colour, templates",
    },
    en: {
      title: "Different vibe\neverywhere?",
      hint: "Type, colour, templates",
    },
  },
];

function Icon({ name }) {
  const common = "h-5 w-5 shrink-0 text-stone-500";
  switch (name) {
    case "web":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <path d="M4 8h16M6 8v12h12V8M9 4h6v4H9z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "ads":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <path d="M7 7h10v10H7zM4 4v4M20 20v-4M4 20v-4M20 4v4" strokeLinecap="round" />
        </svg>
      );
    case "ai":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <path d="M12 3v3M12 18v3M4.2 7.5l2.6 1.5M17.2 15l2.6 1.5M3 12h3M18 12h3M6.8 7.5L4.2 9M19.8 15l-2.6-1.5" strokeLinecap="round" />
          <circle cx="12" cy="12" r="3.5" />
        </svg>
      );
    case "wa":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <path d="M7 10h6M7 14h4M5 5l-2 6 6-2 9 9-4-10L5 5z" strokeLinejoin="round" />
        </svg>
      );
    case "app":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <rect x="7" y="3" width="10" height="18" rx="2" />
          <path d="M10 6h4" strokeLinecap="round" />
        </svg>
      );
    case "crm":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <path d="M5 6h14v12H5zM9 10h6M9 14h4" strokeLinecap="round" />
        </svg>
      );
    case "brand":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <path d="M8 16l4-12 4 12M9.5 12h5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    default:
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <path d="M6 6h12v12H6zM9 9h6v6H9z" strokeLinecap="round" />
        </svg>
      );
  }
}

export function HomepageServiceIntro() {
  const { experience } = useLanguagePreference();
  const stored = getStoredLanguageExperience();
  const isHinglish =
    experience != null ? experience === LANGUAGE_HINGLISH : stored === LANGUAGE_HINGLISH;

  const eyebrow = isHinglish ? "Services" : "Services";
  const title = isHinglish ? "Abhi sabse zyada kis cheez mein help chahiye?" : "What do you need help with most right now?";

  return (
    <section
      id="services"
      className="scroll-mt-[calc(var(--sx-nav-h)+0.5rem)] border-b border-stone-200/60 bg-[color-mix(in_srgb,white_55%,var(--sx-surface))] py-12 sm:py-[3.75rem]"
    >
      <div className="sx-container">
        <div className="max-w-2xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">{eyebrow}</p>
          <h2 className="mt-2.5 text-[1.38rem] font-semibold leading-[1.16] tracking-[-0.033em] text-[var(--sx-ink)] sm:text-[1.52rem]">
            {title}
          </h2>
        </div>

        <ul className="mt-10 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4 lg:mt-12">
          {CARDS.map((card) => {
            const copy = isHinglish ? card.hi : card.en;
            return (
              <li key={card.href}>
                <Link
                  href={card.href}
                  className="group flex h-full flex-col rounded-xl border border-stone-200/78 bg-white/95 p-4 shadow-[var(--sx-shadow-sm)] transition-[transform,box-shadow,border-color] duration-300 ease-out hover:border-stone-300/85 hover:shadow-[var(--sx-shadow-md)] motion-safe:hover:-translate-y-0.5 sm:p-[1.05rem]"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 rounded-lg border border-stone-200/80 bg-stone-50/80 p-2 transition-colors group-hover:border-stone-300/90 group-hover:bg-white">
                      <Icon name={card.icon} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="whitespace-pre-line text-[14px] font-semibold leading-snug tracking-[-0.018em] text-[var(--sx-ink)] sm:text-[15px]">
                        {copy.title}
                      </p>
                      <p className="mt-2 text-[12px] leading-relaxed text-stone-600 sm:text-[12.5px]">{copy.hint}</p>
                    </div>
                  </div>
                  <span className="mt-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-400 transition-colors group-hover:text-stone-600">
                    {isHinglish ? "Detail" : "Details"} →
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

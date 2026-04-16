/** Shared public URLs for Stratxcel surfaces (configure per deployment). */

export const URLS = {
  main: process.env.NEXT_PUBLIC_MAIN_SITE_URL || "https://stratxcel.in",
  aiOs: process.env.NEXT_PUBLIC_AI_OS_URL || "https://ai.stratxcel.in",
  aiMarketing: process.env.NEXT_PUBLIC_AI_MARKETING_URL || "https://stratxcel.ai",
  demo: process.env.NEXT_PUBLIC_DEMO_SITE_URL || "https://demo.stratxcel.in",
};

export const CONTACT_EMAIL = "hello@stratxcel.com";
export const WHATSAPP_NUMBER = "917777812777";

function trimUrl(value) {
  const s = String(value || "").trim();
  return s.replace(/\/+$/, "");
}

export const CONTACT = {
  email: CONTACT_EMAIL,
  phone: process.env.NEXT_PUBLIC_CONTACT_PHONE
    ? String(process.env.NEXT_PUBLIC_CONTACT_PHONE).trim()
    : `+${WHATSAPP_NUMBER}`,
  whatsapp: `+${WHATSAPP_NUMBER}`,
};

/** Social links: set env vars per Vercel project; empty values are not shown. */
export const SOCIAL = {
  linkedin: trimUrl(process.env.NEXT_PUBLIC_LINKEDIN_URL),
  instagram: trimUrl(process.env.NEXT_PUBLIC_INSTAGRAM_URL),
  facebook: trimUrl(process.env.NEXT_PUBLIC_FACEBOOK_URL),
  x: trimUrl(process.env.NEXT_PUBLIC_X_URL),
  youtube: trimUrl(process.env.NEXT_PUBLIC_YOUTUBE_URL),
  github: trimUrl(process.env.NEXT_PUBLIC_GITHUB_URL),
};

/** Optional live URLs for portfolio demos (set per Vercel project / .env). */
export const DEMO_URLS = {
  hotel: trimUrl(process.env.NEXT_PUBLIC_DEMO_HOTEL_URL),
  honestAsset: trimUrl(process.env.NEXT_PUBLIC_DEMO_HONEST_ASSET_URL),
  premiumConsulting: trimUrl(process.env.NEXT_PUBLIC_DEMO_PREMIUM_CONSULTING_URL),
};

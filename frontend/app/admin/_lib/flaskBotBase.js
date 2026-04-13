/**
 * Base URL for the hosted Flask bot (memory.json + inbox live on this host).
 * Vercel must call this — never read memory.json in Next.js routes.
 *
 * Override for local dev: BOT_API_URL=http://127.0.0.1:5000
 */
export function flaskBotBase() {
  const raw =
    process.env.BOT_API_URL ||
    process.env.NEXT_PUBLIC_BOT_API_URL ||
    "https://bot.stratxcel.ai";
  return String(raw).replace(/\/+$/, "");
}

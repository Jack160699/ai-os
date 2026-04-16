/**
 * Base URL for the hosted Flask bot (EC2). Next.js routes proxy to this host.
 * Override: BOT_API_URL or NEXT_PUBLIC_BOT_API_URL
 */
export function flaskBotBase() {
  const raw =
    process.env.BOT_API_URL ||
    process.env.NEXT_PUBLIC_BOT_API_URL ||
    "https://bot.stratxcel.ai";
  return String(raw).replace(/\/+$/, "");
}

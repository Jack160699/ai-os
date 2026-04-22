const DEFAULT_CORE = process.env.REVENUE_CORE_URL || process.env.NEXT_PUBLIC_REVENUE_CORE_URL || "http://localhost:3000";

function base() {
  return DEFAULT_CORE.replace(/\/+$/, "");
}

export async function coreGet<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${base()}${path}`, { cache: "no-store" });
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

export async function corePost<T>(path: string, body: unknown, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${base()}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

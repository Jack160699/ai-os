import { cookies } from "next/headers";

export const BATCH_COOKIE = "sx_os_reset_batch_id";

/** Default batch when none selected — align with DB default in migration. */
export const DEFAULT_RESET_BATCH_ID =
  process.env.NEXT_PUBLIC_DEFAULT_RESET_BATCH_ID ?? "00000000-0000-0000-0000-000000000001";

export async function getResetBatchId(): Promise<string> {
  const jar = await cookies();
  const v = jar.get(BATCH_COOKIE)?.value?.trim();
  return v && /^[0-9a-f-]{36}$/i.test(v) ? v : DEFAULT_RESET_BATCH_ID;
}

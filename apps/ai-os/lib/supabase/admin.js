import { createClient } from "@supabase/supabase-js";

let adminClient;

export function createAdminClient() {
  if (adminClient) {
    return adminClient;
  }

  console.log("SUPABASE URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log("SERVICE ROLE KEY EXISTS:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
    db: { schema: "public" },
  });

  return adminClient;
}

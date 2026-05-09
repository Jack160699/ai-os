import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    console.log("DEBUG ROUTE HIT ✅");

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: { autoRefreshToken: false, persistSession: false },
        db: { schema: "public" },
      },
    );

    const { data, error } = await supabase
      .from("messages")
      .insert([
        {
          phone: "9999999999",
          body: "FORCED INSERT WORKING",
          direction: "in",
        },
      ])
      .select();

    if (error) {
      console.error("FORCED INSERT ERROR:", error);
      throw error;
    }

    console.log("FORCED INSERT SUCCESS:", data);

    return Response.json({ success: true, data });
  } catch (err) {
    console.error("ROUTE ERROR:", err);
    return Response.json({ error: err?.message || String(err) }, { status: 500 });
  }
}

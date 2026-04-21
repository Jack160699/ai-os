import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_KEY;

const supabase =
  url && key
    ? createClient(url, key)
    : null;

export async function saveMessage(phone, text, sender) {
  if (!supabase) {
    console.warn("Supabase not configured; skip saveMessage");
    return;
  }
  const { error } = await supabase.from("messages").insert([
    { phone, text, sender },
  ]);

  if (error) console.error("Supabase save error:", error);
}

export async function updateLead(phone, status) {
  if (!supabase) {
    console.warn("Supabase not configured; skip updateLead");
    return;
  }
  const { error } = await supabase.from("leads").upsert(
    [{ phone, status, updated_at: new Date().toISOString() }],
    { onConflict: "phone" }
  );

  if (error) console.error("Supabase lead error:", error);
}

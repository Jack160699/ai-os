import type { Message, Temperature } from "@/lib/models";

export type InboxAiMode = "summarize" | "suggest_reply" | "hot_detection";

function transcript(messages: Pick<Message, "direction" | "body">[]): string {
  return messages
    .map((m) => `${m.direction === "out" ? "Us" : "Lead"}: ${m.body}`)
    .join("\n")
    .slice(0, 12000);
}

function heuristicSummarize(messages: Pick<Message, "direction" | "body">[]): string {
  const t = transcript(messages);
  if (!t.trim()) return "No messages yet.";
  const last = messages.filter((m) => m.direction === "in").at(-1)?.body ?? "";
  return `Snapshot: ${messages.length} messages. Latest inbound: "${last.slice(0, 220)}${last.length > 220 ? "…" : ""}"`;
}

function heuristicSuggestReply(messages: Pick<Message, "direction" | "body">[]): string {
  const lastIn = [...messages].reverse().find((m) => m.direction === "in");
  if (!lastIn) return "No inbound yet — open with a short check-in and one clarifying question.";
  return `Thanks for the note on "${lastIn.body.slice(0, 80)}${lastIn.body.length > 80 ? "…" : ""}".\n\nI can lock next steps today — does a 10-minute call in the next 2 hours work?`;
}

function heuristicHot(messages: Pick<Message, "direction" | "body">[]): { temperature: Temperature; rationale: string } {
  const blob = transcript(messages).toLowerCase();
  const hotSignals = ["ready to pay", "send payment", "invoice", "today", "urgent", "close", "confirm", "yes", "deal"];
  const hits = hotSignals.filter((s) => blob.includes(s)).length;
  if (hits >= 2) return { temperature: "hot", rationale: "Multiple buying-intent signals in recent language." };
  if (hits === 1) return { temperature: "warm", rationale: "One buying signal — tighten next step and propose payment link." };
  return { temperature: "cold", rationale: "No strong urgency or commitment language detected." };
}

async function openaiChat(system: string, user: string): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  if (!key) throw new Error("missing_key");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.25,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(text || `OpenAI error (${res.status})`);
  }
  const data = JSON.parse(text) as { choices?: { message?: { content?: string } }[] };
  const out = data.choices?.[0]?.message?.content?.trim();
  if (!out) throw new Error("Empty model response");
  return out;
}

export async function runInboxAssistant(opts: {
  mode: InboxAiMode;
  leadName: string;
  messages: Message[];
}): Promise<{ text: string; temperature?: Temperature; rationale?: string }> {
  const t = transcript(opts.messages);

  if (opts.mode === "hot_detection") {
    try {
      const raw = await openaiChat(
        "You classify sales chat urgency for a B2B operator. Reply ONLY compact JSON: {\"temperature\":\"hot|warm|cold\",\"rationale\":\"one sentence\"}",
        `Lead: ${opts.leadName}\n\nTranscript:\n${t}`,
      );
      const parsed = JSON.parse(raw) as { temperature?: string; rationale?: string };
      const temp = (parsed.temperature ?? "warm").toLowerCase();
      const temperature: Temperature = temp === "hot" || temp === "cold" || temp === "warm" ? temp : "warm";
      return { text: `${temperature.toUpperCase()}: ${parsed.rationale ?? ""}`.trim(), temperature, rationale: parsed.rationale };
    } catch {
      const h = heuristicHot(opts.messages);
      return {
        text: `${h.temperature.toUpperCase()}: ${h.rationale}`,
        temperature: h.temperature,
        rationale: h.rationale,
      };
    }
  }

  if (opts.mode === "summarize") {
    try {
      const text = await openaiChat(
        "You are an operator assistant. Summarize the conversation in 5 tight bullets max. No fluff.",
        `Lead: ${opts.leadName}\n\nTranscript:\n${t}`,
      );
      return { text };
    } catch {
      return { text: heuristicSummarize(opts.messages) };
    }
  }

  try {
    const text = await openaiChat(
      "You draft WhatsApp-ready replies for a revenue operator. Short, confident, one CTA. No markdown fences.",
      `Lead: ${opts.leadName}\n\nTranscript:\n${t}\n\nWrite the next reply only.`,
    );
    return { text };
  } catch {
    return { text: heuristicSuggestReply(opts.messages) };
  }
}

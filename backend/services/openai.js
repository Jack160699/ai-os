import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function getAIResponse(prompt) {
  if (!process.env.OPENAI_API_KEY) {
    return "Got your message 👍 Configure OPENAI_API_KEY to enable AI replies.";
  }
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
  });

  return response.choices[0]?.message?.content ?? "";
}

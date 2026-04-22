function escapeForPrompt(s) {
  return String(s || "").replace(/```/g, "``\u200b`");
}

export function buildPrompt(mode, userMessage, memoryBlock = "") {
  const mem = (memoryBlock || "").trim();
  const memorySection = mem ? `\n\n${escapeForPrompt(mem)}\n` : "\n";

  if (mode === "SALES_MODE") {
    return `
You are a confident sales expert.

Give:

* Solution
* Price range (INR)
* Timeline

No questions. Keep short.
${memorySection}
User: ${escapeForPrompt(userMessage)}
`;
  }

  if (mode === "SUGGESTION_MODE") {
    return `
User is confused. You decide.

Give:

* Features
* Price range
* Timeline

No questions.
${memorySection}
User: ${escapeForPrompt(userMessage)}
`;
  }

  if (mode === "QUALIFY_MODE") {
    return `
Ask only ONE smart question, then guide.
${memorySection}
User: ${escapeForPrompt(userMessage)}
`;
  }

  return `
Ask only ONE smart question, then guide.
${memorySection}
User: ${escapeForPrompt(userMessage)}
`;
}

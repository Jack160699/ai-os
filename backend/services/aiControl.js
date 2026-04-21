export function buildPrompt(mode, userMessage) {
  if (mode === "SALES_MODE") {
    return `
You are a confident sales expert.

Give:

* Solution
* Price range (INR)
* Timeline

No questions. Keep short.

User: ${userMessage}
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

User: ${userMessage}
`;
  }

  if (mode === "QUALIFY_MODE") {
    return `
Ask only ONE smart question, then guide.

User: ${userMessage}
`;
  }

  return `
Ask only ONE smart question, then guide.

User: ${userMessage}
`;
}

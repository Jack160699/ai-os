/** Replace `{{token}}` placeholders (alphanumeric + underscore tokens). */
export function renderProposalTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key: string) => vars[key] ?? "");
}

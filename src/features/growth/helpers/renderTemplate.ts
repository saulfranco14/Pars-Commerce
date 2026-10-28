import type { TemplateVars } from "@/features/growth/interfaces/template";

const PLACEHOLDER = /\{([a-z_]+)\}/g;

/** Fills {placeholders}; an unknown or empty one is dropped so a prospect never sees braces. */
export function renderTemplate(text: string, vars: TemplateVars): string {
  return text
    .replace(PLACEHOLDER, (_, key: string) => vars[key] ?? "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/ {2,}/g, " ")
    .trim();
}

export function templatePlaceholders(text: string): string[] {
  return [...text.matchAll(PLACEHOLDER)].map((match) => match[1]);
}

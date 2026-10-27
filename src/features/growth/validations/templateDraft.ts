import { GIRO_COPY } from "@/features/growth/constants/giroCopy";
import { TEMPLATE_STEPS } from "@/features/growth/constants/templateVariables";

import type { TemplateChannel, TemplateDraft, TemplateVariant } from "@/features/growth/interfaces/template";

const VARIANTS: TemplateVariant[] = ["A", "B", "C"];

/** Shape check for an editor payload; content rules live in validateTemplate. */
export function normalizeTemplateDraft(input: unknown): TemplateDraft | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as Record<string, unknown>;
  const channel = raw.channel as TemplateChannel;
  if (channel !== "whatsapp" && channel !== "email") return null;
  const step = TEMPLATE_STEPS[channel].find((option) => option.value === raw.step)?.value;
  const variant = VARIANTS.find((value) => value === raw.variant);
  const giro = typeof raw.giro === "string" && raw.giro ? raw.giro : null;
  if (!step || !variant || (giro && !GIRO_COPY[giro]) || typeof raw.body !== "string") return null;
  return {
    channel,
    step,
    variant,
    giro,
    subject: typeof raw.subject === "string" ? raw.subject : null,
    body: raw.body,
  };
}

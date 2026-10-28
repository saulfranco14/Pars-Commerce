import type { TemplateVariant } from "@/features/growth/interfaces/template";

export type WhatsappStep = "m1" | "seguimiento" | "si";

export interface WhatsappSuggestion {
  step: WhatsappStep | null;
  reason: string;
  /** True when writing now would be too soon or too much; the operator can still send. */
  wait: boolean;
}

export interface WhatsappDraft {
  step: WhatsappStep;
  variant: TemplateVariant;
  version: number;
  templateId: string;
  body: string;
  waLink: string;
  variants: TemplateVariant[];
  suggestion: WhatsappSuggestion;
}

export interface WhatsappComposerProps {
  leadId: string;
  busy: boolean;
  onOutcome: (outcome: "whatsapp_sent" | "no_whatsapp" | "wrong_number") => Promise<boolean>;
}

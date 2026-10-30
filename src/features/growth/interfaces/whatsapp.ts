import type { ActivationStage } from "@/features/growth/interfaces/activation";
import type { TemplateVariant } from "@/features/growth/interfaces/template";

export type WhatsappStep =
  | "m1"
  | "seguimiento"
  | "si"
  | "vio_tienda"
  | "objecion_costo"
  | "objecion_tiempo"
  | "objecion_duda"
  | "objecion_whatsapp"
  | "visita_confirmar"
  | "cita_recordatorio"
  | "post_visita"
  | "ultimo"
  | "activacion_tienda"
  | "activacion_mp"
  | "activacion_venta";

/** Why growth_lead_next_action picked its step; the reason text is built from it in TypeScript. */
export type NextActionCode =
  | "registered"
  | "activation"
  | "dropped"
  | "no_phone"
  | "bad_phone"
  | "visit_passed"
  | "visit_soon"
  | "visit_requested"
  | "objection"
  | "replied"
  | "first"
  | "viewed"
  | "last_call"
  | "exhausted"
  | "follow_up";

export interface SentMessage {
  step: string | null;
  variant: string | null;
  at: string;
}

export interface NextActionFacts {
  sent: SentMessage[];
  attempts: number;
  last_sent_at?: string;
  views: number;
  views_since_last_send: number;
  last_view_at?: string;
  objection?: { reason: string | null; at: string };
  visit?: { day: string | null; slot: string | null; at: string };
  reply_at?: string;
  appointment_at?: string;
  /** Set for registered leads: how far the business got (growth_activation_stage). */
  activation?: ActivationStage;
}

export interface NextAction {
  step: WhatsappStep | null;
  code: NextActionCode;
  wait: boolean;
  facts: NextActionFacts;
}

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
  phone: string;
  variants: TemplateVariant[];
  suggestion: WhatsappSuggestion;
}

/** What the operator really sent; it is kept on the event so the conversation shows it. */
export interface SentWhatsapp {
  body: string;
  templateId: string;
  step: WhatsappStep;
  variant: TemplateVariant;
  edited: boolean;
}

export type ComposerOutcome = "whatsapp_sent" | "no_whatsapp" | "wrong_number";

export interface WhatsappComposerProps {
  leadId: string;
  busy: boolean;
  onOutcome: (outcome: ComposerOutcome, sent?: SentWhatsapp) => Promise<boolean>;
}

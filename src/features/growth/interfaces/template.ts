export type TemplateChannel = "whatsapp" | "email";
export type TemplateStep = "m1" | "seguimiento" | "si" | "d0" | "d3" | "d7";
export type TemplateVariant = "A" | "B" | "C";
export type TemplateStatus = "active" | "paused" | "archived";

export interface GrowthTemplate {
  id: string;
  channel: TemplateChannel;
  giro: string | null;
  step: TemplateStep;
  variant: TemplateVariant;
  version: number;
  subject: string | null;
  body: string;
  status: TemplateStatus;
  created_at: string;
}

export interface TemplateDraft {
  channel: TemplateChannel;
  giro: string | null;
  step: TemplateStep;
  variant: TemplateVariant;
  subject: string | null;
  body: string;
}

export type TemplateVars = Record<string, string>;

export interface RenderedMessage {
  templateId: string | null;
  subject: string | null;
  body: string;
}

export interface TemplatePreview {
  subject: string | null;
  body: string;
  leadName: string;
}

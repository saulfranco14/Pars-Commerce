export interface FunnelTemplateRow {
  template_id: string;
  channel: "whatsapp" | "email";
  giro: string | null;
  step: string;
  variant: string;
  version: number;
  sent: number;
  replied: number;
  rejected: number;
  registered: number;
}

export interface FunnelGiroRow {
  giro: string;
  contacted: number;
  replied: number;
  viewed: number;
  registered: number;
}

export interface FunnelMemberRow {
  user_id: string;
  name: string;
  contacted: number;
  replied: number;
  registered: number;
}

export interface FunnelReport {
  days: number;
  contacted: number;
  valid_channel: number;
  replied: number;
  viewed: number;
  claimed: number;
  registered_engine: number;
  registered_assisted: number;
  registered_self: number;
  by_channel: Record<string, number>;
  drop_reasons: Record<string, number>;
  by_municipio: Record<string, { contacted: number; registered: number }>;
  by_template: FunnelTemplateRow[];
  by_giro: FunnelGiroRow[];
  by_member: FunnelMemberRow[];
}

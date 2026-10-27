export type LeadStage =
  | "nuevo"
  | "contactado"
  | "conversando"
  | "caliente"
  | "registrado"
  | "sin_respuesta"
  | "descartado"
  | "sin_contacto";

export type PhoneStatus = "desconocido" | "enviado" | "respondio" | "sin_respuesta" | "sin_whatsapp" | "equivocado";
export type EmailStatus = "desconocido" | "enviado" | "respondio" | "sin_respuesta" | "rebotado";
export type VisitStatus = "pendiente" | "no_estaba" | "interesado" | "cerrado" | "hecha";
export type NextChannel = "whatsapp" | "visita" | "correo" | "ninguno";

export type LeadOutcome =
  | "whatsapp_sent"
  | "whatsapp_replied"
  | "whatsapp_no_answer"
  | "no_whatsapp"
  | "wrong_number"
  | "email_sent"
  | "email_replied"
  | "email_no_answer"
  | "email_bounced"
  | "visit_registered"
  | "visit_interested"
  | "visit_absent"
  | "visit_closed"
  | "visit_stuck"
  | "not_interested"
  | "unsubscribed";

export type LeadActor = "system" | "operator" | "prospect";

export interface GrowthLead {
  id: string;
  denue_id: string | null;
  business_name: string;
  giro: string;
  catalog_template_key: string | null;
  municipio: string;
  colonia: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  phone_e164: string | null;
  email: string | null;
  staff_range: string | null;
  phone_status: PhoneStatus;
  email_status: EmailStatus;
  visit_status: VisitStatus;
  stage: LeadStage;
  next_channel: NextChannel;
  whatsapp_attempts: number;
  visit_attempts: number;
  last_whatsapp_at: string | null;
  revisit_at: string | null;
  snoozed_until: string | null;
  drop_reason: string | null;
  registered_tenant_id: string | null;
  last_activity_at: string | null;
  created_at: string;
}

export interface LeadEvent {
  id: string;
  lead_id: string;
  type: string;
  channel: string | null;
  actor: LeadActor;
  template_id: string | null;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface NearbyLead {
  id: string;
  business_name: string;
  giro: string;
  colonia: string | null;
  address: string | null;
  municipio: string;
  lat: number;
  lng: number;
  phone_e164: string | null;
  visit_status: VisitStatus;
  revisit_at: string | null;
  distance_m: number;
}

export interface LeadFilters {
  municipio?: string;
  giro?: string;
  stage?: LeadStage | "todos";
  channel?: NextChannel;
  q?: string;
  page?: number;
}

export interface LeadListMetrics {
  total: number;
  contacted: number;
  conversing: number;
  registered: number;
}

export interface LeadListResult {
  leads: GrowthLead[];
  total: number;
  page: number;
  pageSize: number;
  metrics: LeadListMetrics;
}

export interface LeadDetail {
  lead: GrowthLead;
  events: LeadEvent[];
  acquisition: { bucket: string; channel: string | null; tenant_id: string } | null;
}

/** Row produced by the DENUE import, matching growth_upsert_leads. */
export interface LeadImportRow {
  denue_id: string;
  business_name: string;
  legal_name: string | null;
  giro: string;
  catalog_template_key: string | null;
  activity: string | null;
  staff_range: string | null;
  municipio: string;
  colonia: string | null;
  address: string | null;
  postal_code: string | null;
  lat: number | null;
  lng: number | null;
  phone_e164: string | null;
  email: string | null;
  website: string | null;
  source: "denue";
  source_detail: string | null;
}

export interface LeadPhoneSheetProps {
  isOpen: boolean;
  currentPhone: string | null;
  busy: boolean;
  onClose: () => void;
  onSubmit: (phone: string) => Promise<boolean>;
}

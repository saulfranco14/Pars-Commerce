import type { StatusTone } from "@/components/admin/StatusBadge";
import type { WhatsappSuggestion } from "@/features/growth/interfaces/whatsapp";

export type LeadStage =
  | "nuevo"
  | "contactado"
  | "conversando"
  | "caliente"
  | "cita"
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
  owner_user_id: string | null;
  owned_at: string | null;
  last_activity_at: string | null;
  created_at: string;
  next_step: NextStep | null;
  next_step_at: string | null;
  next_step_note: string | null;
  appointment_at: string | null;
  /** Last time the prospect opened its "Para ti" page; only the list fills it. */
  para_viewed_at?: string | null;
  /** Owner's display name; lists and the detail fill it. */
  owner_name?: string | null;
}

/** Set by the growth_leads_next_step trigger from the stage; "Recordarme" overrides the date. */
export type NextStep = "whatsapp" | "llamada" | "visita" | "retomar";

export type FollowUpAction = "schedule_visit" | "reschedule_visit" | "cancel_visit" | "remind" | "pause" | "resume" | "note";

export interface FollowUpInput {
  action: FollowUpAction;
  at?: string | null;
  note?: string | null;
}

export interface NextStepDue {
  label: string;
  when: string;
  tone: "danger" | "warning" | "neutral";
}

export interface PipelineCounts {
  por_contactar: number;
  contactado: number;
  caliente: number;
  conversando: number;
  cita: number;
  registrado: number;
  sin_respuesta: number;
  descartado: number;
  due_today: number;
  overdue: number;
  paused: number;
}

export type BoardColumnKey = "contactado" | "caliente" | "conversando" | "cita" | "registrado";

export interface BoardColumn {
  key: BoardColumnKey;
  total: number;
  leads: GrowthLead[];
}

/** Board filters; `owner` is "me", "all" or a member's user id (coordinators only). */
export interface BoardZone {
  municipio?: string;
  giro?: string;
  owner?: string;
}

export interface LeadBoard {
  columns: BoardColumn[];
  counts: PipelineCounts;
}

export interface LeadLastTouch {
  label: string;
  tone: StatusTone;
}

export interface LeadEvent {
  id: string;
  lead_id: string;
  type: string;
  channel: string | null;
  actor: LeadActor;
  actor_user_id: string | null;
  /** Team member who did it, when the actor is an operator. */
  actor_name?: string | null;
  template_id: string | null;
  payload: Record<string, unknown>;
  created_at: string;
  /** e.g. "Primer mensaje · A v2", resolved from template_id for the timeline. */
  template_label?: string | null;
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

export type LeadContactFilter = "whatsapp" | "correo" | "ambos" | "sin";

/**
 * `activos` = still worth working (default); `en_lote` = set aside by Telegram or a sweep and not marked yet;
 * `hoy` = next step due by the end of today.
 */
export type LeadStageFilter = LeadStage | "activos" | "todos" | "en_lote" | "hoy";

/** Prospectos has two halves: the daily follow-up board and the prospecting list. */
export type LeadView = "seguimiento" | "contactar";

export interface LeadFilters {
  vista?: LeadView;
  municipio?: string;
  giro?: string;
  stage?: LeadStageFilter;
  channel?: NextChannel;
  contact?: LeadContactFilter;
  q?: string;
  /** "me", "none" or a member's user id; prospectors always see only their own. */
  owner?: string;
  page?: number;
}

export interface LeadListMetrics {
  total: number;
  contacted: number;
  conversing: number;
  registered: number;
  withPhone: number;
  withEmail: number;
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
  /** Whether the viewer may act on it (own lead, or unowned inside their zones). */
  canAct: boolean;
  /** What to send next and why (growth_lead_next_action). */
  suggestion: WhatsappSuggestion | null;
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

export interface LeadGiroSheetProps {
  isOpen: boolean;
  currentGiro: string;
  busy: boolean;
  onClose: () => void;
  onSubmit: (giro: string) => Promise<boolean>;
}

export type LeadSourceDetail = "visita" | "referido" | "redes" | "otro";

/** «Nuevo prospecto»: someone the team met outside the DENUE list. */
export interface NewLeadInput {
  business_name: string;
  phone: string;
  email: string;
  giro: string;
  municipio: string;
  colonia: string;
  source_detail: LeadSourceDetail;
  note: string;
}

/** Who already works a phone or an email; nothing else of that lead is shared. */
export interface ContactConflict {
  leadId: string;
  ownerName: string | null;
  stage: LeadStage;
  since: string;
  suppressed: boolean;
}

export type NewLeadResult =
  | { status: "created"; leadId: string }
  | { status: "conflict"; conflict: ContactConflict }
  | { status: "suppressed" };

export interface NewLeadSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

/** «Dar de alta su negocio»: the owner gets an email to create a password and enter. */
export interface LeadRegistrationInput {
  owner_name: string;
  owner_email: string;
  owner_phone: string;
  business_name: string;
}

export interface LeadRegistrationResult {
  tenantSlug: string | null;
  emailDelivery: "sent" | "failed" | "not_needed";
  invitationUrl: string | null;
  previewUrl: string | null;
}

export interface RegisterLeadSheetProps {
  isOpen: boolean;
  lead: GrowthLead;
  onClose: () => void;
  onRegistered: () => void;
}

export interface ReplySheetProps {
  isOpen: boolean;
  businessName: string;
  busy: boolean;
  onClose: () => void;
  onSubmit: (text: string) => Promise<boolean>;
}

export interface LeadConversationProps {
  events: LeadEvent[];
  viewerId: string | null;
  onLogReply: () => void;
}

export interface LeadSummary {
  sent: number;
  lastSentAt: string | null;
  views: number;
  lastViewAt: string | null;
  averageSeconds: number | null;
  objection: string | null;
  visitRequest: { day: string | null; slot: string | null } | null;
  claimClicked: boolean;
  repliedAt: string | null;
  lastReply: string | null;
}

export interface LeadSummaryCardProps {
  summary: LeadSummary;
}

/** «Tu día»: counts for the signed-in member's own prospects (growth_my_day). */
export interface MyDay {
  replied_due: number;
  hot_due: number;
  follow_ups_due: number;
  overdue: number;
  visits_today: number;
  first_messages_left: number;
  sent_today: number;
  daily_goal: number;
}

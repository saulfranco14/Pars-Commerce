import type { GrowthLead } from "@/features/growth/interfaces/lead";
import type { SentWhatsapp } from "@/features/growth/interfaces/whatsapp";

/** Same kinds as growth_reserve_batch, so Telegram /lote and the sweep share reservations. */
export type SweepKind = "whatsapp" | "seguimiento";

export type SweepOutcome = "whatsapp_sent" | "no_whatsapp" | "wrong_number";

export type SweepLead = Pick<
  GrowthLead,
  "id" | "business_name" | "giro" | "municipio" | "colonia" | "address" | "phone_e164" | "lat" | "lng" | "stage" | "whatsapp_attempts" | "last_whatsapp_at"
>;

export interface SweepFilters {
  kind: SweepKind;
  municipio?: string;
  giro?: string;
}

export interface SweepToday {
  sent: number;
  noWhatsapp: number;
  wrongNumber: number;
}

export interface SweepBatch {
  queue: SweepLead[];
  remaining: number;
  today: SweepToday;
}

export interface SweepLastAction {
  lead: SweepLead;
  label: string;
}

export interface SweepCardProps {
  lead: SweepLead;
  next: SweepLead | null;
  onOutcome: (outcome: SweepOutcome, sent?: SentWhatsapp) => void;
  onSkip: () => void;
  onPhoneChanged: (lead: SweepLead) => void;
}

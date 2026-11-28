import type { DayStats } from "@/features/growth/services/statsService";
import type { ReplyIntent } from "@/features/growth/helpers/replyAssist";

/** One prospect in «Hoy»: its message, its chat and the token its ads are drawn from. */
export interface MiniAppCard {
  leadId: string;
  businessName: string;
  giroLabel: string;
  place: string;
  variant: string;
  body: string;
  waLink: string;
  token: string;
  nearby: number | null;
}

export interface MiniAppQueue {
  cards: MiniAppCard[];
  zones: Array<{ slug: string; label: string }>;
  giros: Array<{ key: string; label: string }>;
}

export interface MiniAppRecentLead {
  leadId: string;
  businessName: string;
  giroLabel: string;
  lastWhatsappAt: string | null;
}

export interface MiniAppStop {
  leadId: string;
  businessName: string;
  giroLabel: string;
  address: string;
  distanceM: number;
  mapsUrl: string;
}

export type MiniAppStats = DayStats;
export interface ReplySuggestion {
  leadId: string;
  businessName: string;
  intent: ReplyIntent;
  price: string | null;
  reply: string;
  /** The chat to answer in; null without a phone or after a «no», when nothing more is sent. */
  phone: string | null;
  /** Public «Para ti» token: the updated ads are drawn from it. */
  token: string;
}

export type MiniAppOutcome = "whatsapp_sent" | "no_whatsapp" | "wrong_number" | "not_interested";

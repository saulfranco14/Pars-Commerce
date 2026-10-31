import type { SweepKind, SweepOutcome } from "@/features/growth/interfaces/sweep";

/** Same wait the Telegram /seguimientos batch uses (growth_reserve_batch). */
export const FOLLOW_UP_DAYS = 3;

/** Cards the sweep keeps set aside at once; it tops up when two are left. */
export const SWEEP_BATCH = 5;
export const SWEEP_REFILL_AT = 2;
export const SWEEP_RESERVE_MINUTES = 120;
/** A skipped card stays out of the sweep and of Telegram batches for the rest of the day. */
export const SWEEP_SKIP_HOURS = 12;
export const SWEEP_SKIPPED_KIND = "saltado";

export const SWEEP_KIND_TABS: Array<{ value: SweepKind; label: string }> = [
  { value: "whatsapp", label: "Primer mensaje" },
  { value: "seguimiento", label: "Seguimientos" },
];

export const SWEEP_OUTCOME_LABEL: Record<SweepOutcome | "skip", string> = {
  whatsapp_sent: "Enviado",
  no_whatsapp: "No tiene WhatsApp",
  wrong_number: "Número equivocado",
  skip: "Saltado",
};


import { FOLLOW_UP_DAYS } from "@/features/growth/helpers/suggestWhatsappStep";
import { SWEEP_BATCH, SWEEP_RESERVE_MINUTES } from "@/features/growth/constants/sweep";
import { internalError } from "@/features/growth/services/growthDb";

import type { GrowthDb } from "@/features/growth/services/growthDb";
import type { SweepBatch, SweepFilters, SweepLead, SweepToday } from "@/features/growth/interfaces/sweep";
import type { ServiceResult } from "@/features/qr/services/tablePaymentService";

const SWEEP_COLUMNS = "id, business_name, giro, municipio, colonia, address, phone_e164, lat, lng, stage, whatsapp_attempts, last_whatsapp_at";

// Mexico City has no DST since 2022, so its midnight is always 06:00 UTC.
function mexicoMidnightIso(now: Date): string {
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City" }).format(now);
  return new Date(`${day}T00:00:00-06:00`).toISOString();
}

/** Cards this sweep (or a Telegram /lote) already set aside, still unmarked and still matching the kind. */
async function reservedCards(db: GrowthDb, filters: SweepFilters, exclude: string[], limit: number) {
  const now = new Date();
  let query = db
    .from("growth_leads")
    .select(SWEEP_COLUMNS)
    .eq("reserved_kind", filters.kind)
    .gt("reserved_until", now.toISOString())
    .eq("next_channel", "whatsapp");
  if (filters.kind === "whatsapp") {
    query = query.eq("phone_status", "desconocido").in("stage", ["nuevo", "sin_contacto"]);
  } else {
    query = query
      .eq("phone_status", "enviado")
      .eq("whatsapp_attempts", 1)
      .in("stage", ["contactado", "caliente"])
      .lt("last_whatsapp_at", new Date(now.getTime() - FOLLOW_UP_DAYS * 86_400_000).toISOString());
  }
  if (filters.municipio) query = query.eq("municipio", filters.municipio);
  if (filters.giro) query = query.eq("giro", filters.giro);
  if (exclude.length) query = query.not("id", "in", `(${exclude.join(",")})`);
  return query.order("colonia", { nullsFirst: false }).order("created_at").order("id").limit(limit);
}

async function todayTally(db: GrowthDb): Promise<SweepToday> {
  const since = mexicoMidnightIso(new Date());
  const count = (type: string) =>
    db.from("growth_lead_events").select("id", { count: "exact", head: true }).eq("type", type).eq("actor", "operator").gte("created_at", since);
  const [sent, noWhatsapp, wrongNumber] = await Promise.all([count("whatsapp_sent"), count("no_whatsapp"), count("wrong_number")]);
  return { sent: sent.count ?? 0, noWhatsapp: noWhatsapp.count ?? 0, wrongNumber: wrongNumber.count ?? 0 };
}

/**
 * Next cards for a one-by-one WhatsApp sweep. Reuses growth_reserve_batch, so a card is never in a
 * Telegram batch and the sweep at once; `exclude` holds cards whose outcome is still being saved.
 */
export async function loadSweep(db: GrowthDb, filters: SweepFilters, exclude: string[]): Promise<ServiceResult<SweepBatch>> {
  const { data: held, error } = await reservedCards(db, filters, exclude, SWEEP_BATCH);
  if (error) return internalError(error.message);
  const queue = (held ?? []) as SweepLead[];

  if (queue.length < SWEEP_BATCH) {
    const { data: fresh, error: reserveError } = await db.rpc("growth_reserve_batch", {
      p_kind: filters.kind,
      p_municipio: filters.municipio ?? null,
      p_giro: filters.giro ?? null,
      p_limit: SWEEP_BATCH - queue.length,
      p_minutes: SWEEP_RESERVE_MINUTES,
    });
    if (reserveError) return internalError(reserveError.message);
    const seen = new Set(queue.map((lead) => lead.id));
    for (const lead of (fresh ?? []) as SweepLead[]) if (!seen.has(lead.id)) queue.push(lead);
  }

  const [{ data: remaining, error: countError }, today] = await Promise.all([
    db.rpc("growth_sweep_remaining", { p_kind: filters.kind, p_municipio: filters.municipio ?? null, p_giro: filters.giro ?? null }),
    todayTally(db),
  ]);
  if (countError) return internalError(countError.message);

  return { ok: true, data: { queue, remaining: Number(remaining ?? 0), today } };
}

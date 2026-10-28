import { localClock } from "@/features/growth/helpers/sendWindow";

import type { GrowthDb } from "@/features/growth/services/growthDb";

export interface DayStats {
  whatsappSent: number;
  noWhatsapp: number;
  wrongNumber: number;
  replied: number;
  rejected: number;
  visits: number;
  visitAbsent: number;
  visitClosed: number;
  emailSent: number;
  emailBounced: number;
  emailReplied: number;
  views: number;
  hot: number;
  pending: number;
  registered: { engine: number; assisted: number; self: number };
}

/** Midnight of today in Mexico City as an ISO instant. */
export function startOfMexicoDay(now: Date): string {
  const { date } = localClock(now, "America/Mexico_City");
  const utcGuess = new Date(`${date}T06:00:00Z`);
  const hour = localClock(utcGuess, "America/Mexico_City").hour;
  return new Date(utcGuess.getTime() - hour * 3_600_000).toISOString();
}

export async function dayStats(db: GrowthDb, fromIso: string): Promise<DayStats> {
  const [{ data: events }, { data: acquisitions }, { count: pending }, { count: hot }] = await Promise.all([
    db.from("growth_lead_events").select("type").gte("created_at", fromIso).limit(20000),
    db.from("tenant_acquisitions").select("bucket").gte("captured_at", fromIso),
    db.from("growth_leads").select("id", { count: "exact", head: true }).not("reserved_kind", "is", null),
    db.from("growth_leads").select("id", { count: "exact", head: true }).eq("stage", "caliente"),
  ]);
  const count = (...types: string[]) => ((events ?? []) as Array<{ type: string }>).filter((event) => types.includes(event.type)).length;
  const buckets = ((acquisitions ?? []) as Array<{ bucket: "engine" | "assisted" | "self" }>).reduce(
    (acc, row) => ({ ...acc, [row.bucket]: acc[row.bucket] + 1 }),
    { engine: 0, assisted: 0, self: 0 },
  );
  return {
    whatsappSent: count("whatsapp_sent"),
    noWhatsapp: count("no_whatsapp"),
    wrongNumber: count("wrong_number"),
    replied: count("whatsapp_replied", "email_replied"),
    rejected: count("not_interested", "unsubscribed"),
    visits: count("visit_registered", "visit_interested", "visit_absent", "visit_closed"),
    visitAbsent: count("visit_absent"),
    visitClosed: count("visit_closed"),
    emailSent: count("email_sent"),
    emailBounced: count("email_bounced"),
    emailReplied: count("email_replied"),
    views: count("para_viewed"),
    hot: hot ?? 0,
    pending: pending ?? 0,
    registered: buckets,
  };
}

function percent(part: number, total: number): string {
  return total ? ` (${Math.round((part / total) * 100)}%)` : "";
}

export function statsText(title: string, stats: DayStats): string {
  const registeredTotal = stats.registered.engine + stats.registered.assisted + stats.registered.self;
  const contacted = stats.whatsappSent + stats.emailSent + stats.visits;
  return [
    `<b>${title}</b>`,
    `WhatsApp: ${stats.whatsappSent} enviados · ${stats.noWhatsapp} sin WhatsApp · ${stats.wrongNumber} equivocados`,
    `Respondieron ${stats.replied} · no le interesa ${stats.rejected}${percent(stats.rejected, contacted)}`,
    `Visitas: ${stats.visits} · no estaba ${stats.visitAbsent} · cerrados ${stats.visitClosed}`,
    `Correo: ${stats.emailSent} enviados · ${stats.emailBounced} rebotes${percent(stats.emailBounced, stats.emailSent)} · ${stats.emailReplied} respuestas`,
    `«Para ti»: ${stats.views} abiertas · ${stats.hot} calientes en total`,
    stats.pending ? `<b>${stats.pending} tarjetas sin marcar</b> · /pendientes` : "Todo marcado",
    `<b>Registros: ${registeredTotal}</b> · motor ${stats.registered.engine} · asistido ${stats.registered.assisted} · solos ${stats.registered.self}`,
  ].join("\n");
}

export async function registrationsText(db: GrowthDb, now: Date): Promise<string> {
  const today = startOfMexicoDay(now);
  const week = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const { data } = await db.from("tenant_acquisitions").select("bucket, channel, captured_at").gte("captured_at", week);
  const rows = (data ?? []) as Array<{ bucket: string; channel: string | null; captured_at: string }>;
  const line = (label: string, list: typeof rows) => {
    const by = (bucket: string) => list.filter((row) => row.bucket === bucket).length;
    const channels = ["whatsapp", "visita", "correo"].map((channel) => `${channel} ${list.filter((row) => row.bucket === "engine" && row.channel === channel).length}`).join(" · ");
    return `<b>${label}: ${list.length}</b>\nmotor ${by("engine")} (${channels}) · asistido ${by("assisted")} · solos ${by("self")}`;
  };
  return [line("Hoy", rows.filter((row) => row.captured_at >= today)), line("Últimos 7 días", rows)].join("\n\n");
}

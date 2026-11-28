import "server-only";

import { BUSINESS_TYPES } from "@/constants/businessTypes";
import { zoneByMunicipio } from "@/features/growth/constants/zoneCopy";
import { addDays, weekdayOf } from "@/features/ventas/helpers/commercialCalendar";
import { OUTSIDE_SYSTEM, outsidePrompt, parseOutsideItems } from "@/features/ventas/helpers/outsidePrompt";
import { buildWeekReport } from "@/features/ventas/helpers/weekReport";
import { generateGroundedText, GeminiError } from "@/lib/ai/gemini";
import { getMexicoDateBounds, toMexicoDateStr } from "@/lib/dateBounds";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { OutsideContext, WeekReport } from "@/features/ventas/interfaces/weekReport";
import type { ServiceResult } from "@/features/qr/services/tablePaymentService";

const MAX_SOURCES = 5;

/** Giro label and where the business is, for the report and the search. The street never leaves the server. */
async function salesContext(admin: SupabaseClient, tenantId: string): Promise<{ giroLabel: string; place: string | null }> {
  const [{ data: tenant }, { data: acquisition }, { data: pickup }] = await Promise.all([
    admin.from("tenants").select("business_type").eq("id", tenantId).maybeSingle(),
    admin.from("tenant_acquisitions").select("lead_id").eq("tenant_id", tenantId).maybeSingle(),
    admin.from("tenant_pickup_points").select("address_text").eq("tenant_id", tenantId).eq("is_active", true).order("is_primary", { ascending: false }).limit(1).maybeSingle(),
  ]);
  const type = (tenant?.business_type as string | null) ?? "";
  const giroLabel = BUSINESS_TYPES.find((entry) => entry.value === type)?.label ?? (type ? type.replace(/[_-]/g, " ") : "Negocio");
  let place: string | null = null;
  if (acquisition?.lead_id) {
    const { data: lead } = await admin.from("growth_leads").select("municipio").eq("id", acquisition.lead_id).maybeSingle();
    if (lead?.municipio) place = `${zoneByMunicipio(lead.municipio as string)?.label ?? lead.municipio}, Estado de México`;
  }
  const address = (pickup?.address_text as string | null) ?? "";
  if (!place && address.includes(",")) place = address.split(",").slice(1).join(",").trim().slice(0, 120) || null;
  return { giroLabel, place };
}

export function mexicoToday(now = new Date()): string {
  return toMexicoDateStr(now.toISOString());
}

/** Last 7 days against the 7 before, from paid orders. */
export async function tenantWeekReport(admin: SupabaseClient, tenantId: string, today = mexicoToday()): Promise<ServiceResult<WeekReport>> {
  const { data, error } = await admin
    .from("orders")
    .select("total, paid_at, created_at")
    .eq("tenant_id", tenantId)
    .eq("status", "paid")
    .gte("paid_at", getMexicoDateBounds(addDays(today, -13)).startUTC)
    .lte("paid_at", getMexicoDateBounds(today).endUTC);
  if (error) return { ok: false, error: { code: "internal", message: error.message } };
  const totals: Record<string, number> = {};
  for (const order of (data ?? []) as Array<{ total: number | string | null; paid_at: string | null; created_at: string }>) {
    const day = toMexicoDateStr(order.paid_at ?? order.created_at);
    totals[day] = (totals[day] ?? 0) + Number(order.total ?? 0);
  }
  return { ok: true, data: buildWeekReport(totals, today, await salesContext(admin, tenantId)) };
}

/** Monday of the week that holds `date`. */
function weekStartOf(date: string): string {
  return addDays(date, -((weekdayOf(date) + 6) % 7));
}

/**
 * «Lo que pasa afuera»: one grounded search per giro, place and day, shared by every business that matches.
 * Never throws for the page: a failure is a message, the rest of the report still shows.
 */
export async function tenantOutsideContext(admin: SupabaseClient, tenantId: string, today = mexicoToday()): Promise<ServiceResult<OutsideContext>> {
  const { giroLabel, place } = await salesContext(admin, tenantId);
  const where = place ?? "México";
  const weekStart = weekStartOf(today);
  // Once a day: on Monday the week has barely started, by Friday there is more to find.
  const cacheKey = `${giroLabel.toLowerCase()}|${where.toLowerCase()}|${today}`;
  const { data: cached } = await admin.from("ai_outside_context").select("payload").eq("cache_key", cacheKey).maybeSingle();
  if (cached?.payload) return { ok: true, data: cached.payload as OutsideContext };

  try {
    const { text, sources } = await generateGroundedText(OUTSIDE_SYSTEM, outsidePrompt({ giroLabel, place: where, from: weekStart, to: today }), { thinkingLevel: "minimal" });
    const items = parseOutsideItems(text);
    if (!items.length) return { ok: false, error: { code: "internal", message: "La IA no encontró nada claro esta semana. Intente más tarde." } };
    const payload: OutsideContext = { items, sources: sources.slice(0, MAX_SOURCES), weekStart };
    await admin.from("ai_outside_context").upsert({ cache_key: cacheKey, giro: giroLabel, place: where, week_start: weekStart, payload }, { onConflict: "cache_key" });
    return { ok: true, data: payload };
  } catch (error) {
    console.error("[ventas] outside context failed:", error);
    const message = error instanceof GeminiError ? error.message : "No pudimos consultar qué pasa afuera. Intente más tarde.";
    return { ok: false, error: { code: "internal", message } };
  }
}

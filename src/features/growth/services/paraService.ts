import { cache } from "react";

import { STARTER_CATALOGS } from "@/features/catalog/catalogDefinitions";
import { GENERIC_CATALOG_IMAGE } from "@/features/catalog/constants/catalogImages";
import { PARA_OBJECTION_LABEL, PARA_VISIT_SLOT_LABEL } from "@/features/growth/constants/para";
import { giroCopy } from "@/features/growth/constants/giroCopy";
import { zoneByMunicipio } from "@/features/growth/constants/zoneCopy";
import { buildMapsLink, buildMapsSearchLink, buildWaLink } from "@/features/growth/helpers/buildWaLink";
import { describeParaSession, formatVisitSeconds, paraOutcome, parsePlacement, sanitizeParaSession } from "@/features/growth/helpers/paraSession";
import { senderFromSignature } from "@/features/growth/helpers/paraSender";
import { parseObjection, parseVisitRequest, visitDayLong, visitDayOptions } from "@/features/growth/helpers/paraVisit";
import { isLeadLinkToken } from "@/features/growth/helpers/leadLinkToken";
import { pickParaItems } from "@/features/growth/helpers/pickParaItems";
import { hashPreviewToken } from "@/features/preview/previewLinks";
import { findLinkLead } from "@/features/growth/services/leadLinkService";
import { growthDb, isGrowthEnabled } from "@/features/growth/services/growthDb";
import { notifyOperators } from "@/features/growth/services/operatorService";
import { getSettings } from "@/features/growth/services/settingsService";
import { escapeHtml } from "@/features/growth/services/telegramApi";
import { createAdminClient } from "@/lib/supabase/admin";

import type { GrowthDb } from "@/features/growth/services/growthDb";
import type { GrowthSettings } from "@/features/growth/interfaces/settings";
import type { ParaEventInput, ParaItem, ParaLinkEvent, ParaPageData, ParaSessionPayload, ParaVisitRequest } from "@/features/growth/interfaces/para";
import type { ServiceResult } from "@/features/qr/services/tablePaymentService";

const PARA_ITEMS_LIMIT = 8;

export async function loadParaPage(db: GrowthDb, token: string): Promise<ParaPageData | null> {
  const link = await findLinkLead(db, token, "para");
  if (!link) return null;
  const { data: lead } = await db
    .from("growth_leads")
    .select("business_name, giro, catalog_template_key, municipio, colonia, phone_e164")
    .eq("id", link.leadId)
    .maybeSingle();
  if (!lead) return null;

  const catalogKey = (lead.catalog_template_key as string | null) ?? (lead.giro as string);
  const catalog = STARTER_CATALOGS.find((entry) => entry.key === catalogKey) ?? null;
  // $0 starter items (e.g. "Entrega local") read as free products in a preview.
  const pool = catalog ? [...catalog.products, ...catalog.services].filter((item) => item.isPublic !== false && item.price > 0) : [];
  const items: ParaItem[] = pickParaItems(pool, PARA_ITEMS_LIMIT).map((item, index) => ({
    id: `item-${index}`,
    name: item.name,
    price: item.price,
    // The shared placeholder reads as an empty mock-up; the card shows initials instead.
    imageUrl: item.imageUrl && item.imageUrl !== GENERIC_CATALOG_IMAGE ? item.imageUrl : null,
    category: item.category ?? null,
    type: item.type,
  }));
  const zone = zoneByMunicipio(lead.municipio as string);

  const query = new URLSearchParams({ prospecto: token, giro: catalog?.businessType ?? (lead.giro as string), nombre: lead.business_name as string });
  if (catalog) query.set("catalogo", catalog.key);
  if (lead.phone_e164) query.set("telefono", (lead.phone_e164 as string).slice(3));

  const settings = await loadSettings(db);
  const sender = senderFromSignature(settings?.signature);
  const visits = Boolean(settings?.visit_municipios.includes(lead.municipio as string));
  const helpNumber = process.env.GROWTH_WHATSAPP_NUMBER?.replace(/\D/g, "");
  const helpText = `Hola${sender ? ` ${sender.firstName}` : ""}, vi la tienda de ejemplo de ${lead.business_name} y quiero que me ayuden a activarla.`;

  return {
    businessName: lead.business_name as string,
    giroLabel: giroCopy(lead.giro as string).label,
    place: [lead.colonia, zone?.label ?? lead.municipio].filter(Boolean).join(", "),
    headline: giroCopy(catalog?.key ?? (lead.giro as string)).titular,
    sender,
    items,
    // Items alternate categories, so the first photos already make a varied hero collage.
    showcase: items
      .filter((item) => item.imageUrl)
      .slice(0, 3)
      .map((item) => ({ id: item.id, name: item.name, price: item.price, image: item.imageUrl as string, href: "#productos" })),
    counts: {
      products: pool.filter((item) => item.type === "product").length,
      services: pool.filter((item) => item.type === "service").length,
    },
    claimUrl: `/registro?${query.toString()}`,
    helpUrl: helpNumber ? buildWaLink(`+${helpNumber}`, helpText) : null,
    helpLabel: sender ? `Escribirle a ${sender.firstName} por WhatsApp` : "Escribirnos por WhatsApp",
    visit:
      visits && settings
        ? { days: visitDayOptions(new Date(), settings.timezone), label: sender ? `Que ${sender.firstName} pase a mi local` : "Que pasen a mi local" }
        : null,
  };
}

/** One load per request, shared by the page and its link-preview metadata. */
export const getParaPage = cache((token: string) => loadParaPage(growthDb(createAdminClient()), token));

async function loadSettings(db: GrowthDb): Promise<GrowthSettings | null> {
  try {
    return await getSettings(db);
  } catch {
    return null;
  }
}

function placeOf(row: { municipio: string }): string {
  return escapeHtml(zoneByMunicipio(row.municipio)?.label ?? row.municipio);
}

function clickPayload(event: ParaLinkEvent, raw: unknown): { placement: string } | null {
  if (event !== "claim_clicked" && event !== "help_clicked") return null;
  const placement = parsePlacement((raw as { placement?: unknown } | null)?.placement);
  return placement ? { placement } : null;
}

function visitSummary(name: string, zone: string, seconds: number, payload: ParaSessionPayload): string {
  const time = formatVisitSeconds(seconds);
  const outcome = paraOutcome(payload);
  const headline =
    outcome === "claim"
      ? `<b>${name}</b> (${zone}) tocó «Activar» y está en el registro · ${time}`
      : outcome === "help"
        ? `<b>${name}</b> (${zone}) pidió ayuda por WhatsApp · ${time}. Revisa tu WhatsApp.`
        : `${name} (${zone}) salió de su tienda · ${time}`;
  const { seen, tapped } = describeParaSession(payload);
  return [headline, seen ? `Vio: ${escapeHtml(seen)}` : null, tapped ? `Tocó: ${escapeHtml(tapped)}` : null].filter(Boolean).join("\n");
}

export async function trackParaEvent(
  db: GrowthDb,
  token: string,
  event: ParaLinkEvent,
  input: ParaEventInput = {},
): Promise<ServiceResult<{ tracked: boolean }>> {
  if (!isLeadLinkToken(token) || event === "visit_requested") return { ok: true, data: { tracked: false } };
  const objection = event === "objection_chosen" ? parseObjection(input.payload) : null;
  if (event === "objection_chosen" && !objection) return { ok: false, error: { code: "validation", message: "Respuesta no válida" } };
  const seconds = typeof input.seconds === "number" && Number.isFinite(input.seconds) ? Math.min(Math.max(Math.round(input.seconds), 0), 3600) : null;
  const session = event === "para_left" ? sanitizeParaSession(input.payload) : null;
  const { data, error } = await db.rpc("growth_track_link", {
    p_token_hash: hashPreviewToken(token),
    p_event: event,
    p_seconds: seconds,
    p_payload: session ?? (objection ? { reason: objection } : clickPayload(event, input.payload)),
  });
  if (error) return { ok: false, error: { code: "internal", message: error.message } };
  const row = (Array.isArray(data) ? data[0] : data) as { business_name: string; municipio: string; view_count: number; became_hot: boolean } | undefined;
  if (!row) return { ok: true, data: { tracked: false } };

  if (isGrowthEnabled()) {
    const name = escapeHtml(row.business_name);
    const zone = placeOf(row);
    if (event === "para_viewed" && row.became_hot) {
      await notifyOperators(db, { text: `<b>Caliente</b> · ${name} (${zone}) abrió su tienda por ${row.view_count}.ª vez.` });
    } else if (event === "para_viewed" && row.view_count === 1) {
      await notifyOperators(db, { text: `${name} (${zone}) abrió su tienda.` });
    } else if (session) {
      // Buttons are reported here, once per visit, instead of one alert per tap.
      await notifyOperators(db, { text: visitSummary(name, zone, seconds ?? 0, session) });
    } else if (objection) {
      await notifyOperators(db, { text: `<b>${name}</b> (${zone}) respondió «${escapeHtml(PARA_OBJECTION_LABEL[objection])}».` });
    }
  }
  return { ok: true, data: { tracked: true } };
}

/** The owner picks a day and a time of day; the operator gets it on Telegram with directions. */
export async function requestParaVisit(db: GrowthDb, token: string, raw: unknown): Promise<ServiceResult<ParaVisitRequest>> {
  const link = isLeadLinkToken(token) ? await findLinkLead(db, token, "para") : null;
  if (!link) return { ok: false, error: { code: "not_found", message: "Este enlace ya no está disponible." } };
  const settings = await loadSettings(db);
  const { data: lead } = await db.from("growth_leads").select("municipio, address, colonia, lat, lng").eq("id", link.leadId).maybeSingle();
  if (!lead || !settings?.visit_municipios.includes(lead.municipio as string)) {
    return { ok: false, error: { code: "validation", message: "Por ahora no hacemos visitas en su zona. Escríbanos por WhatsApp." } };
  }
  const request = parseVisitRequest(raw, new Date(), settings.timezone);
  if (!request) return { ok: false, error: { code: "validation", message: "Elija uno de los días y horarios disponibles." } };

  const { data, error } = await db.rpc("growth_track_link", {
    p_token_hash: hashPreviewToken(token),
    p_event: "visit_requested",
    p_seconds: null,
    p_payload: request,
  });
  if (error) return { ok: false, error: { code: "internal", message: error.message } };
  const row = (Array.isArray(data) ? data[0] : data) as { business_name: string; municipio: string } | undefined;

  if (row && isGrowthEnabled()) {
    const when = `${visitDayLong(request.day)} ${PARA_VISIT_SLOT_LABEL[request.slot]}`;
    const address = [lead.address, lead.colonia].filter(Boolean).join(", ");
    const directions = lead.lat != null && lead.lng != null
      ? buildMapsLink(lead.lat as number, lead.lng as number)
      : buildMapsSearchLink({ business_name: row.business_name, address: lead.address as string | null, colonia: lead.colonia as string | null, municipio: row.municipio });
    await notifyOperators(db, {
      text: [`<b>Visita pedida</b> · ${escapeHtml(row.business_name)} (${placeOf(row)})`, `Quiere que pases el ${escapeHtml(when)}.`, address ? escapeHtml(address) : null]
        .filter(Boolean)
        .join("\n"),
      buttons: [[{ text: "Cómo llegar", url: directions }]],
    });
  }
  return { ok: true, data: request };
}

import { cache } from "react";

import { leadCatalog } from "@/features/growth/helpers/claimLink";
import { PARA_OBJECTION_LABEL, PARA_VISIT_SLOT_LABEL } from "@/features/growth/constants/para";
import { AD_KINDS } from "@/features/growth/constants/prospectAds";
import { giroCopy } from "@/features/growth/constants/giroCopy";
import { zoneByMunicipio } from "@/features/growth/constants/zoneCopy";
import { buildMapsLink, buildMapsSearchLink, buildWaLink } from "@/features/growth/helpers/buildWaLink";
import { describeParaSession, formatVisitSeconds, paraOutcome, parsePlacement, sanitizeParaSession } from "@/features/growth/helpers/paraSession";
import { senderFromSignature } from "@/features/growth/helpers/paraSender";
import { parseObjection, parseVisitRequest, visitDayLong } from "@/features/growth/helpers/paraVisit";
import { isLeadLinkToken } from "@/features/growth/helpers/leadLinkToken";
import { adBusinessName } from "@/features/growth/helpers/prospectAds";
import { hashPreviewToken } from "@/features/preview/previewLinks";
import { findLinkLead } from "@/features/growth/services/leadLinkService";
import { growthDb, isGrowthEnabled } from "@/features/growth/services/growthDb";
import { leadAlertTarget, notifyOperators } from "@/features/growth/services/operatorService";
import { memberContact } from "@/features/growth/services/memberService";
import { AD_LEAD_COLUMNS, adSourceFor, zoneCountsFor } from "@/features/growth/services/prospectAdsService";
import { getSettings } from "@/features/growth/services/settingsService";
import { escapeHtml } from "@/features/growth/services/telegramApi";
import { createAdminClient } from "@/lib/supabase/admin";

import type { GrowthDb } from "@/features/growth/services/growthDb";
import type { GrowthSettings } from "@/features/growth/interfaces/settings";
import type { ParaEventInput, ParaLinkEvent, ParaOfferData, ParaSessionPayload, ParaVisitRequest } from "@/features/growth/interfaces/para";
import type { ParaAdsPageData } from "@/features/growth/interfaces/paraAds";
import type { AdLead } from "@/features/growth/services/prospectAdsService";
import type { InlineButton } from "@/features/growth/interfaces/telegram";
import type { ServiceResult } from "@/features/qr/services/tablePaymentService";

const PARA_ITEMS_LIMIT = 8;

/** A business's offer page: its title and text from Motor, its public products and WhatsApp to whoever wrote. */
async function loadOfferPage(db: GrowthDb, lead: { business_name: string; workspace_id: string; owner_user_id: string | null }, workspace: { name: string; tenant_id: string }): Promise<ParaOfferData> {
  const [{ data: tenant }, { data: settings }, { data: products }, owner] = await Promise.all([
    db.from("tenants").select("name, logo_url, whatsapp_phone").eq("id", workspace.tenant_id).maybeSingle(),
    db.from("growth_settings").select("signature, offer_title, offer_text, cta_label").eq("workspace_id", lead.workspace_id).maybeSingle(),
    db.from("products").select("id, name, price, image_url, type").eq("tenant_id", workspace.tenant_id).eq("is_public", true).is("deleted_at", null).order("created_at", { ascending: false }).limit(PARA_ITEMS_LIMIT),
    lead.owner_user_id ? memberContact(db, lead.workspace_id, lead.owner_user_id) : Promise.resolve(null),
  ]);
  const name = (tenant?.name as string | undefined) ?? workspace.name;
  const sender = senderFromSignature(owner?.signature ?? owner?.displayName ?? (settings?.signature as string | undefined));
  const phone = (owner?.whatsappE164 ?? (tenant?.whatsapp_phone as string | null) ?? "").replace(/\D/g, "");
  const ctaLabel = (settings?.cta_label as string | null) || "Me interesa";
  return {
    kind: "offer",
    businessName: lead.business_name,
    workspaceName: name,
    logoUrl: (tenant?.logo_url as string | null) ?? null,
    title: (settings?.offer_title as string | null) || `${name} tiene una propuesta para usted`,
    text: (settings?.offer_text as string | null) ?? null,
    ctaLabel,
    sender,
    items: ((products ?? []) as Array<{ id: string; name: string; price: number; image_url: string | null; type: string }>).map((item) => ({
      id: item.id,
      name: item.name,
      price: Number(item.price),
      imageUrl: item.image_url,
      category: null,
      type: item.type === "service" ? "service" : "product",
    })),
    helpUrl: phone.length >= 10 ? buildWaLink(`+52${phone.slice(-10)}`, `Hola${sender ? ` ${sender.firstName}` : ""}, vi la propuesta de ${name} para ${lead.business_name}. ${ctaLabel}.`) : null,
  };
}

/** Tlaco's own prospects get their four gift ads, editable, plus how many of their giro are around them. */
async function loadAdsPage(db: GrowthDb, lead: AdLead & { catalog_template_key: string | null }): Promise<ParaAdsPageData> {
  const [source, zone, settings, owner] = await Promise.all([
    adSourceFor(db, lead),
    zoneCountsFor(db, lead),
    loadSettings(db),
    lead.owner_user_id ? memberContact(db, lead.workspace_id, lead.owner_user_id) : Promise.resolve(null),
  ]);
  const catalog = leadCatalog(lead);
  const displayName = adBusinessName(lead.business_name, lead.giro);
  // The person who works this prospect signs the page and answers its WhatsApp.
  const sender = senderFromSignature(owner?.signature ?? owner?.displayName ?? settings?.signature);
  const helpNumber = (owner?.whatsappE164 ?? process.env.GROWTH_WHATSAPP_NUMBER)?.replace(/\D/g, "");
  const helpText = `Hola${sender ? ` ${sender.firstName}` : ""}, vi los anuncios que le hicieron a ${displayName ?? "mi negocio"} y tengo una duda.`;
  return {
    kind: "ads",
    source,
    displayName,
    giroLabel: giroCopy(lead.giro).label,
    zone: zone ? { within500: zone.within500, plural: giroCopy(lead.giro).plural } : null,
    sender,
    helpUrl: helpNumber ? buildWaLink(`+${helpNumber}`, helpText) : null,
    prefill: {
      businessName: displayName ?? "",
      phone: lead.phone_e164?.slice(3) ?? "",
      businessType: catalog?.businessType ?? lead.giro,
      catalogKey: catalog?.key ?? null,
    },
  };
}

export async function loadParaPage(db: GrowthDb, token: string): Promise<ParaAdsPageData | ParaOfferData | null> {
  const link = await findLinkLead(db, token, "para");
  if (!link) return null;
  const { data: lead } = await db.from("growth_leads").select(`${AD_LEAD_COLUMNS}, catalog_template_key`).eq("id", link.leadId).maybeSingle();
  if (!lead) return null;
  const { data: workspace } = await db.from("growth_workspaces").select("name, tenant_id").eq("id", lead.workspace_id).maybeSingle();
  if (workspace?.tenant_id) return loadOfferPage(db, lead, workspace);
  return loadAdsPage(db, lead as AdLead & { catalog_template_key: string | null });
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

/** «Abrir chat» under a live alert; nothing when the prospect has no phone. */
async function chatButton(db: GrowthDb, leadId: string): Promise<InlineButton[][] | undefined> {
  const { data } = await db.from("growth_leads").select("phone_e164").eq("id", leadId).maybeSingle();
  const phone = (data?.phone_e164 as string | null) ?? null;
  return phone ? [[{ text: "Abrir chat", url: buildWaLink(phone) }]] : undefined;
}

function placeOf(row: { municipio: string }): string {
  return escapeHtml(zoneByMunicipio(row.municipio)?.label ?? row.municipio);
}

function clickPayload(event: ParaLinkEvent, raw: unknown): Record<string, string | number> | null {
  const source = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  if (event === "claim_clicked" || event === "help_clicked") {
    const placement = parsePlacement(source.placement);
    return placement ? { placement } : null;
  }
  if (event === "ad_edited") {
    const kind = AD_KINDS.find((value) => value === source.kind);
    const field = (["text", "price", "place"] as const).find((value) => value === source.field);
    return kind && field ? { kind, field } : null;
  }
  if (event === "ads_downloaded" || event === "ads_shared") {
    const count = typeof source.count === "number" && Number.isInteger(source.count) ? Math.min(Math.max(source.count, 1), AD_KINDS.length) : null;
    return count ? { count } : null;
  }
  return null;
}

/** The moments worth an alert while the prospect is still on the page. */
const LIVE_ALERT: Partial<Record<ParaLinkEvent, string>> = {
  ads_downloaded: "descargó sus anuncios",
  ads_shared: "compartió sus anuncios",
  signup_started: "está creando su cuenta",
};

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
  const row = (Array.isArray(data) ? data[0] : data) as { lead_id: string; business_name: string; municipio: string; view_count: number; became_hot: boolean } | undefined;
  if (!row) return { ok: true, data: { tracked: false } };

  if (isGrowthEnabled()) {
    const target = await leadAlertTarget(db, row.lead_id);
    const name = escapeHtml(row.business_name);
    const zone = placeOf(row);
    if (event === "para_viewed" && row.became_hot) {
      await notifyOperators(db, { text: `<b>Caliente</b> · ${name} (${zone}) abrió su tienda por ${row.view_count}.ª vez.` }, target);
    } else if (event === "para_viewed" && row.view_count === 1) {
      await notifyOperators(db, { text: `${name} (${zone}) abrió su tienda.` }, target);
    } else if (session) {
      // Buttons are reported here, once per visit, instead of one alert per tap.
      await notifyOperators(db, { text: visitSummary(name, zone, seconds ?? 0, session) }, target);
    } else if (objection) {
      await notifyOperators(db, { text: `<b>${name}</b> (${zone}) respondió «${escapeHtml(PARA_OBJECTION_LABEL[objection])}».` }, target);
    } else if (LIVE_ALERT[event]) {
      await notifyOperators(db, { text: `<b>${name}</b> (${zone}) ${LIVE_ALERT[event]}. Buen momento para escribirle.`, buttons: await chatButton(db, row.lead_id) }, target);
    }
  }
  return { ok: true, data: { tracked: true } };
}

/** The owner picks a day and a time of day; the operator gets it on Telegram with directions. */
export async function requestParaVisit(db: GrowthDb, token: string, raw: unknown): Promise<ServiceResult<ParaVisitRequest>> {
  const link = isLeadLinkToken(token) ? await findLinkLead(db, token, "para") : null;
  if (!link) return { ok: false, error: { code: "not_found", message: "Este enlace ya no está disponible." } };
  const settings = await loadSettings(db);
  const { data: lead } = await db.from("growth_leads").select("municipio, address, colonia, lat, lng, workspace_id, owner_user_id").eq("id", link.leadId).maybeSingle();
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
    }, { workspaceId: lead.workspace_id as string, ownerId: (lead.owner_user_id as string | null) ?? null });
  }
  return { ok: true, data: request };
}

import { STARTER_CATALOGS } from "@/features/catalog/catalogDefinitions";
import { giroCopy } from "@/features/growth/constants/giroCopy";
import { zoneByMunicipio } from "@/features/growth/constants/zoneCopy";
import { buildWaLink } from "@/features/growth/helpers/buildWaLink";
import { pickParaItems } from "@/features/growth/helpers/pickParaItems";
import { hashPreviewToken } from "@/features/preview/previewLinks";
import { findLinkLead } from "@/features/growth/services/leadLinkService";
import { isGrowthEnabled } from "@/features/growth/services/growthDb";
import { notifyOperators } from "@/features/growth/services/operatorService";
import { escapeHtml } from "@/features/growth/services/telegramApi";

import type { GrowthDb } from "@/features/growth/services/growthDb";
import type { ParaItem, ParaLinkEvent, ParaPageData } from "@/features/growth/interfaces/para";
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
  const pool = catalog ? [...catalog.products, ...catalog.services].filter((item) => item.isPublic !== false) : [];
  const items: ParaItem[] = pickParaItems(pool, PARA_ITEMS_LIMIT).map((item, index) => ({
    id: `item-${index}`,
    name: item.name,
    price: item.price,
    imageUrl: item.imageUrl ?? null,
    category: item.category ?? null,
    type: item.type,
  }));
  const zone = zoneByMunicipio(lead.municipio as string);

  const query = new URLSearchParams({ prospecto: token, giro: catalog?.businessType ?? (lead.giro as string), nombre: lead.business_name as string });
  if (catalog) query.set("catalogo", catalog.key);
  if (lead.phone_e164) query.set("telefono", (lead.phone_e164 as string).slice(3));

  const helpNumber = process.env.GROWTH_WHATSAPP_NUMBER?.replace(/\D/g, "");
  const helpText = `Hola, vi la tienda de ejemplo de ${lead.business_name} y quiero que me ayuden a activarla.`;

  return {
    businessName: lead.business_name as string,
    giroLabel: giroCopy(lead.giro as string).label,
    place: [lead.colonia, zone?.label ?? lead.municipio].filter(Boolean).join(", "),
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
  };
}

export async function trackParaEvent(
  db: GrowthDb,
  token: string,
  event: ParaLinkEvent,
  seconds?: number,
): Promise<ServiceResult<{ tracked: boolean }>> {
  if (token.length < 32) return { ok: true, data: { tracked: false } };
  const { data, error } = await db.rpc("growth_track_link", {
    p_token_hash: hashPreviewToken(token),
    p_event: event,
    p_seconds: seconds && Number.isFinite(seconds) ? Math.min(Math.round(seconds), 3600) : null,
  });
  if (error) return { ok: false, error: { code: "internal", message: error.message } };
  const row = (Array.isArray(data) ? data[0] : data) as { business_name: string; municipio: string; view_count: number; became_hot: boolean } | undefined;
  if (!row) return { ok: true, data: { tracked: false } };

  if (isGrowthEnabled()) {
    const name = escapeHtml(row.business_name);
    const zone = escapeHtml(zoneByMunicipio(row.municipio)?.label ?? row.municipio);
    if (event === "para_viewed" && row.became_hot) {
      await notifyOperators(db, { text: `<b>Caliente</b> · ${name} (${zone}) abrió su tienda por ${row.view_count}.ª vez.` });
    } else if (event === "para_viewed" && row.view_count === 1) {
      await notifyOperators(db, { text: `${name} (${zone}) abrió su tienda.` });
    } else if (event === "claim_clicked") {
      await notifyOperators(db, { text: `<b>${name}</b> tocó «Reclamar mi tienda» y está en el registro.` });
    } else if (event === "help_clicked") {
      await notifyOperators(db, { text: `<b>${name}</b> pidió ayuda por WhatsApp. Revisa tu WhatsApp.` });
    }
  }
  return { ok: true, data: { tracked: true } };
}

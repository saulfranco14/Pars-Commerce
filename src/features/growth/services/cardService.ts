import { buildMapsLink, buildMapsSearchLink, buildWaLink } from "@/features/growth/helpers/buildWaLink";
import { encodeCallback } from "@/features/growth/helpers/parseTelegramUpdate";
import { giroCopy } from "@/features/growth/constants/giroCopy";
import { zoneByMunicipio } from "@/features/growth/constants/zoneCopy";
import { createLeadLink, leadLinkUrl } from "@/features/growth/services/leadLinkService";
import { prepareWhatsappMessage } from "@/features/growth/services/whatsappDraftService";
import { escapeHtml } from "@/features/growth/services/telegramApi";
import { formatMexicanPhoneInput } from "@/lib/phone";

import type { GrowthDb } from "@/features/growth/services/growthDb";
import type { GrowthLead, NearbyLead } from "@/features/growth/interfaces/lead";
import type { InlineButton, OutgoingMessage } from "@/features/growth/interfaces/telegram";
import type { WhatsappStep } from "@/features/growth/interfaces/whatsapp";

type CardLead = Pick<GrowthLead, "id" | "business_name" | "giro" | "municipio" | "colonia" | "address" | "phone_e164">;

function place(lead: Pick<GrowthLead, "colonia" | "municipio">): string {
  const zone = zoneByMunicipio(lead.municipio)?.label ?? lead.municipio;
  return lead.colonia ? `${lead.colonia}, ${zone}` : zone;
}

export function whatsappOutcomeButtons(leadId: string): InlineButton[][] {
  return [
    [{ text: "Enviado", callback_data: encodeCallback("o", "s", leadId) }, { text: "Sin WhatsApp", callback_data: encodeCallback("o", "nw", leadId) }],
    [{ text: "Número equivocado", callback_data: encodeCallback("o", "wn", leadId) }, { text: "Respondió", callback_data: encodeCallback("o", "r", leadId) }],
    [{ text: "No le interesa", callback_data: encodeCallback("o", "ni", leadId) }],
  ];
}

export function afterSentButtons(leadId: string): InlineButton[][] {
  return [
    [{ text: "✓ Enviado", callback_data: "x" }],
    [{ text: "Respondió", callback_data: encodeCallback("o", "r", leadId) }, { text: "No le interesa", callback_data: encodeCallback("o", "ni", leadId) }],
    [{ text: "Número equivocado", callback_data: encodeCallback("o", "wn", leadId) }],
  ];
}

export function visitOutcomeButtons(leadId: string): InlineButton[][] {
  return [
    [{ text: "Registrado", callback_data: encodeCallback("o", "vr", leadId) }, { text: "Interesado", callback_data: encodeCallback("o", "vi", leadId) }, { text: "No estaba", callback_data: encodeCallback("o", "va", leadId) }],
    [{ text: "Cerrado", callback_data: encodeCallback("o", "vc", leadId) }, { text: "No le interesa", callback_data: encodeCallback("o", "ni", leadId) }, { text: "Se trabó", callback_data: encodeCallback("o", "vs", leadId) }],
  ];
}

/** One prospect ready to message: rendered text, a fresh "Para ti" link and the result buttons. */
export async function buildWhatsappCard(
  db: GrowthDb,
  lead: CardLead,
  options: { step: WhatsappStep; firma: string; position?: string },
): Promise<(OutgoingMessage & { body: string }) | null> {
  if (!lead.phone_e164) return null;
  const message = await prepareWhatsappMessage(db, lead, { step: options.step, firma: options.firma });
  if (!message) return null;
  const { template, body } = message;

  const header = options.position ? `${options.position} · ` : "";
  const text = [
    `<b>${header}${escapeHtml(lead.business_name)}</b>`,
    `${escapeHtml(giroCopy(lead.giro).label)} · ${escapeHtml(place(lead))}`,
    `Tel. ${formatMexicanPhoneInput(lead.phone_e164)} · versión ${template.variant}${template.version > 1 ? ` v${template.version}` : ""}`,
    "",
    `<i>${escapeHtml(body)}</i>`,
  ].join("\n");

  const openLabel = options.step === "si" ? "Abrir WhatsApp con la respuesta" : "Abrir WhatsApp";
  const buttons: InlineButton[][] = [[{ text: openLabel, url: buildWaLink(lead.phone_e164, body) }]];
  if (options.step === "si") buttons.push([{ text: "Copiar texto", copy_text: { text: body.slice(0, 256) } }]);
  else buttons.push([{ text: "Ver en Google Maps", url: buildMapsSearchLink(lead) }], ...whatsappOutcomeButtons(lead.id));
  return { text, buttons, body };
}

export async function buildVisitCard(db: GrowthDb, lead: NearbyLead, position: number): Promise<OutgoingMessage> {
  const token = await createLeadLink(db, { leadId: lead.id, purpose: "para", channel: "visita", businessName: lead.business_name });
  const revisit = lead.revisit_at ? " · toca regresar hoy" : "";
  const text = [
    `<b>${position}. ${escapeHtml(lead.business_name)}</b> · ${lead.distance_m} m${revisit}`,
    `${escapeHtml(giroCopy(lead.giro).label)} · ${escapeHtml(lead.address ?? "")}`,
    escapeHtml(place(lead)),
  ].join("\n");
  return {
    text,
    buttons: [
      [{ text: "Cómo llegar", url: buildMapsLink(lead.lat, lead.lng) }, { text: "Su tienda", url: leadLinkUrl(token, "para") }],
      ...visitOutcomeButtons(lead.id),
    ],
  };
}

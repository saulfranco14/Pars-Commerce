import { buildWaLink } from "@/features/growth/helpers/buildWaLink";
import { decodeCallback, encodeCallback } from "@/features/growth/helpers/parseTelegramUpdate";
import { GIRO_COPY, GIRO_KEYS } from "@/features/growth/constants/giroCopy";
import { ZONES, zoneBySlug } from "@/features/growth/constants/zoneCopy";
import { afterSentButtons, buildVisitCard, buildWhatsappCard } from "@/features/growth/services/cardService";
import { recordOutcome } from "@/features/growth/services/leadService";
import { isLinkedChat, linkChat } from "@/features/growth/services/operatorService";
import { getSettings, updateSettings } from "@/features/growth/services/settingsService";
import { dayStats, registrationsText, startOfMexicoDay, statsText } from "@/features/growth/services/statsService";
import { answerCallback, escapeHtml, replaceButtons, sendMessage } from "@/features/growth/services/telegramApi";

import type { GrowthDb } from "@/features/growth/services/growthDb";
import type { GrowthLead, LeadOutcome, NearbyLead } from "@/features/growth/interfaces/lead";
import type { InlineButton, OutgoingMessage, TelegramAction } from "@/features/growth/interfaces/telegram";

const HELP = [
  "<b>Tlaco Ventas</b>",
  "/lote · 10 WhatsApps listos (eliges municipio y giro)",
  "/seguimientos · los que no contestaron en 3 días",
  "/pendientes · tarjetas que abriste y no marcaste",
  "/calientes · abrieron su tienda 2 veces o más",
  "/buscar nombre · encuentra un negocio",
  "Manda tu ubicación (clip → Ubicación) · ruta de los 10 más cercanos",
  "/hoy · cómo va el día",
  "/registros · registros de hoy y de la semana",
  "/pausa y /reanudar · detiene o reanuda el correo automático",
].join("\n");

const OUTCOME_BY_CODE: Record<string, { outcome: LeadOutcome; label: string; reason?: string }> = {
  s: { outcome: "whatsapp_sent", label: "Enviado" },
  nw: { outcome: "no_whatsapp", label: "Sin WhatsApp" },
  wn: { outcome: "wrong_number", label: "Número equivocado" },
  r: { outcome: "whatsapp_replied", label: "Respondió" },
  nr: { outcome: "not_interested", label: "No le interesa", reason: "rechazo" },
  nc: { outcome: "not_interested", label: "Ya usa otra", reason: "competencia" },
  vr: { outcome: "visit_registered", label: "Registrado" },
  vc: { outcome: "visit_closed", label: "Cerrado" },
};

const STUCK_REASONS: Record<string, string> = { p: "precio", r: "registro", c: "confianza", t: "tiempo" };

function addDays(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
}

async function reply(chatId: number, message: OutgoingMessage | string) {
  await sendMessage(chatId, typeof message === "string" ? { text: message } : message);
}

async function sendCards(db: GrowthDb, chatId: number, leads: GrowthLead[], step: "m1" | "seguimiento", firma: string) {
  let sent = 0;
  for (const [index, lead] of leads.entries()) {
    const card = await buildWhatsappCard(db, lead, { step, firma, position: `${index + 1}/${leads.length}` });
    if (!card) continue;
    const result = await sendMessage(chatId, card);
    // A very long wa.me URL can be rejected; fall back to a bare link plus copy.
    if (!result.ok && card.buttons) {
      await sendMessage(chatId, {
        text: card.text,
        buttons: [[{ text: "Abrir WhatsApp", url: buildWaLink(lead.phone_e164 ?? "") }], [{ text: "Copiar mensaje", copy_text: { text: card.body.slice(0, 256) } }], ...card.buttons.slice(1)],
      });
    }
    sent++;
  }
  return sent;
}

async function zonePicker(chatId: number) {
  await reply(chatId, {
    text: "¿En qué municipio?",
    buttons: [ZONES.map((zone) => ({ text: zone.label, callback_data: encodeCallback("l", zone.slug) }))],
  });
}

async function giroPicker(chatId: number, zoneSlug: string) {
  const zone = zoneBySlug(zoneSlug);
  if (!zone) return;
  const buttons: InlineButton[][] = [];
  const giros = GIRO_KEYS.map((key) => ({ text: GIRO_COPY[key].label, callback_data: encodeCallback("lg", zone.slug, key) }));
  for (let i = 0; i < giros.length; i += 3) buttons.push(giros.slice(i, i + 3));
  buttons.push([{ text: "Todos los giros", callback_data: encodeCallback("lg", zone.slug, "*") }]);
  await reply(chatId, { text: `${escapeHtml(zone.label)}: ¿qué giro?`, buttons });
}

async function sendBatch(db: GrowthDb, chatId: number, kind: "whatsapp" | "seguimiento", zoneSlug?: string, giro?: string) {
  const zone = zoneSlug ? zoneBySlug(zoneSlug) : undefined;
  const { data, error } = await db.rpc("growth_reserve_batch", {
    p_kind: kind,
    p_municipio: zone?.municipio ?? null,
    p_giro: giro && giro !== "*" ? giro : null,
    p_limit: 10,
  });
  if (error) {
    await reply(chatId, "No pude armar el lote. Intenta de nuevo en un momento.");
    return;
  }
  const leads = (data ?? []) as GrowthLead[];
  if (!leads.length) {
    await reply(chatId, kind === "seguimiento" ? "No hay seguimientos pendientes hoy." : "Ya no quedan negocios con WhatsApp en ese filtro. Prueba otro giro o municipio.");
    return;
  }
  const settings = await getSettings(db);
  const sent = await sendCards(db, chatId, leads, kind === "seguimiento" ? "seguimiento" : "m1", settings.signature);
  await reply(chatId, `Listo: ${sent} tarjetas. Marca cada una cuando la mandes.`);
}

async function sendLeadList(db: GrowthDb, chatId: number, leads: GrowthLead[], empty: string, step: "m1" | "seguimiento") {
  if (!leads.length) {
    await reply(chatId, empty);
    return;
  }
  const settings = await getSettings(db);
  await sendCards(db, chatId, leads, step, settings.signature);
}

async function handleCommand(db: GrowthDb, chatId: number, command: string, args: string) {
  switch (command) {
    case "start":
    case "ayuda":
    case "help":
      await reply(chatId, HELP);
      return;
    case "lote":
      await zonePicker(chatId);
      return;
    case "seguimientos":
      await sendBatch(db, chatId, "seguimiento");
      return;
    case "pendientes": {
      const { data } = await db.from("growth_leads").select("*").not("reserved_kind", "is", null).order("reserved_until", { ascending: false }).limit(10);
      await sendLeadList(db, chatId, (data ?? []) as GrowthLead[], "No tienes tarjetas sin marcar.", "m1");
      return;
    }
    case "calientes": {
      const { data } = await db.from("growth_leads").select("*").eq("stage", "caliente").not("phone_e164", "is", null).order("last_activity_at", { ascending: false }).limit(10);
      await sendLeadList(db, chatId, (data ?? []) as GrowthLead[], "Todavía no hay prospectos calientes.", "seguimiento");
      return;
    }
    case "buscar": {
      const term = args.replace(/[%_,()]/g, " ").trim();
      if (term.length < 3) {
        await reply(chatId, "Escribe al menos 3 letras: /buscar clavo");
        return;
      }
      const { data } = await db.from("growth_leads").select("*").ilike("business_name", `%${term}%`).order("last_activity_at", { ascending: false, nullsFirst: false }).limit(5);
      const leads = (data ?? []) as GrowthLead[];
      if (!leads.length) {
        await reply(chatId, "No encontré ese negocio.");
        return;
      }
      for (const lead of leads) {
        await reply(chatId, {
          text: `<b>${escapeHtml(lead.business_name)}</b>\n${escapeHtml(lead.colonia ?? "")} · ${escapeHtml(lead.municipio)} · etapa: ${lead.stage}`,
          buttons: lead.phone_e164 ? afterSentButtons(lead.id).slice(1) : [[{ text: "No le interesa", callback_data: encodeCallback("o", "ni", lead.id) }]],
        });
      }
      return;
    }
    case "hoy": {
      const stats = await dayStats(db, startOfMexicoDay(new Date()));
      await reply(chatId, statsText("Hoy", stats));
      return;
    }
    case "registros":
      await reply(chatId, await registrationsText(db, new Date()));
      return;
    case "pausa":
      await updateSettings(db, { paused: true, paused_reason: "Pausado desde Telegram" });
      await reply(chatId, "Pausé el correo automático. Los lotes de WhatsApp siguen disponibles. /reanudar para seguir.");
      return;
    case "reanudar":
      await updateSettings(db, { paused: false });
      await reply(chatId, "Listo, el correo automático sigue.");
      return;
    default:
      await reply(chatId, HELP);
  }
}

async function handleOutcome(db: GrowthDb, chatId: number, messageId: number | null, code: string, leadId: string, extra?: string) {
  if (code === "ni") {
    if (messageId) {
      await replaceButtons(chatId, messageId, [[
        { text: "No le interesa", callback_data: encodeCallback("o", "nr", leadId) },
        { text: "Ya usa otra", callback_data: encodeCallback("o", "nc", leadId) },
      ]]);
    }
    return;
  }
  if (code === "vi" || code === "va") {
    if (messageId) {
      const kind = code === "vi" ? "i" : "a";
      await replaceButtons(chatId, messageId, [[
        { text: "Mañana", callback_data: encodeCallback("vd", kind, "1", leadId) },
        { text: "En 3 días", callback_data: encodeCallback("vd", kind, "3", leadId) },
        { text: "En una semana", callback_data: encodeCallback("vd", kind, "7", leadId) },
      ]]);
    }
    return;
  }
  if (code === "vs") {
    if (messageId) {
      await replaceButtons(chatId, messageId, [
        Object.entries(STUCK_REASONS).map(([key, label]) => ({ text: label, callback_data: encodeCallback("st", key, leadId) })),
      ]);
    }
    return;
  }

  const mapped = OUTCOME_BY_CODE[code];
  if (!mapped) return;
  const result = await recordOutcome(db, {
    leadId,
    outcome: mapped.outcome,
    actor: "operator",
    payload: mapped.reason ? { reason: mapped.reason, ...(extra ? { note: extra } : {}) } : {},
  });
  if (!result.ok) {
    await reply(chatId, result.error.message);
    return;
  }
  if (messageId) {
    await replaceButtons(chatId, messageId, mapped.outcome === "whatsapp_sent" ? afterSentButtons(leadId) : [[{ text: `✓ ${mapped.label}`, callback_data: "x" }]]);
  }
  if (mapped.outcome === "whatsapp_replied") {
    const settings = await getSettings(db);
    const card = await buildWhatsappCard(db, result.data, { step: "si", firma: settings.signature, position: "Respuesta sugerida" });
    if (card) await reply(chatId, card);
  }
}

async function handleCallback(db: GrowthDb, action: Extract<TelegramAction, { kind: "callback" }>) {
  const { action: verb, args } = decodeCallback(action.data);
  await answerCallback(action.callbackId);
  if (verb === "x") return;
  if (verb === "l") return giroPicker(action.chatId, args[0]);
  if (verb === "lg") return sendBatch(db, action.chatId, "whatsapp", args[0], args[1]);
  if (verb === "o") return handleOutcome(db, action.chatId, action.messageId, args[0], args[1]);
  if (verb === "vd") {
    const [kind, days, leadId] = args;
    const result = await recordOutcome(db, {
      leadId,
      outcome: kind === "i" ? "visit_interested" : "visit_absent",
      actor: "operator",
      revisitAt: addDays(Number(days) || 1),
    });
    if (!result.ok) return reply(action.chatId, result.error.message);
    if (action.messageId) await replaceButtons(action.chatId, action.messageId, [[{ text: `✓ Volver en ${days} día(s)`, callback_data: "x" }]]);
    return;
  }
  if (verb === "st") {
    const [key, leadId] = args;
    const result = await recordOutcome(db, { leadId, outcome: "visit_stuck", actor: "operator", payload: { reason: STUCK_REASONS[key] ?? "otro" } });
    if (!result.ok) return reply(action.chatId, result.error.message);
    if (action.messageId) await replaceButtons(action.chatId, action.messageId, [[{ text: `✓ Se trabó: ${STUCK_REASONS[key] ?? "otro"}`, callback_data: "x" }]]);
  }
}

async function handleLocation(db: GrowthDb, chatId: number, lat: number, lng: number) {
  const { data, error } = await db.rpc("growth_nearby_leads", { p_lat: lat, p_lng: lng, p_limit: 10 });
  if (error) {
    await reply(chatId, "No pude armar la ruta. Intenta de nuevo.");
    return;
  }
  const leads = (data ?? []) as NearbyLead[];
  if (!leads.length) {
    await reply(chatId, "No hay negocios pendientes de visitar a 2 km de aquí.");
    return;
  }
  await reply(chatId, `<b>${leads.length} cerca de ti</b>, del más cercano al más lejano. Los que tocan regreso hoy van primero.`);
  for (const [index, lead] of leads.entries()) {
    await sendMessage(chatId, await buildVisitCard(db, lead, index + 1));
  }
}

/** Entry point for every update; only linked chats are served. */
export async function handleTelegramAction(db: GrowthDb, action: TelegramAction): Promise<void> {
  if (action.kind === "ignored") return;

  if (action.kind === "command" && action.command === "start" && action.args) {
    const linked = await linkChat(db, action.args, action.chatId);
    await reply(action.chatId, linked ? `Listo, este chat ya recibe los avisos de Tlaco.\n\n${HELP}` : "Ese código no es válido o ya venció. Genera otro en Plataforma → Motor.");
    return;
  }

  if (!(await isLinkedChat(db, action.chatId))) {
    if (action.kind === "callback") await answerCallback(action.callbackId, "Chat no vinculado");
    else await reply(action.chatId, "Este bot es privado.");
    return;
  }

  if (action.kind === "command") return handleCommand(db, action.chatId, action.command, action.args);
  if (action.kind === "callback") return handleCallback(db, action);
  if (action.kind === "location") return handleLocation(db, action.chatId, action.lat, action.lng);
  await reply(action.chatId, HELP);
}

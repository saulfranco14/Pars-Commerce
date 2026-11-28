import { giroAdCopy } from "@/features/growth/constants/prospectAds";
import { giroCopy } from "@/features/growth/constants/giroCopy";
import { adBusinessName } from "@/features/growth/helpers/prospectAds";
import { REPLY_SYSTEM, isRejection, parseReplyAnalysis, priceIn, replyPrompt } from "@/features/growth/helpers/replyAssist";
import { canActOn, recordOutcome } from "@/features/growth/services/leadService";
import { ensureParaLink, leadLinkUrl } from "@/features/growth/services/leadLinkService";
import { loadAdLead, setLeadAdPrice } from "@/features/growth/services/prospectAdsService";
import { getSettings } from "@/features/growth/services/settingsService";
import { generateText } from "@/lib/ai/gemini";

import type { GrowthDb } from "@/features/growth/services/growthDb";
import type { GrowthActor } from "@/features/growth/interfaces/member";
import type { ReplyIntent } from "@/features/growth/helpers/replyAssist";
import type { ReplySuggestion } from "@/features/growth/interfaces/miniApp";
import type { ServiceResult } from "@/features/qr/services/tablePaymentService";

/**
 * What the prospect answered, read by the AI: a «no» is a baja in every channel (our rules decide it, not the model);
 * a price goes into the product ad; anything else is a reply. Nothing is sent: the operator taps Enviar.
 */
export async function assistReply(db: GrowthDb, actor: GrowthActor, leadId: string, text: string): Promise<ServiceResult<ReplySuggestion>> {
  const message = text.trim().slice(0, 2000);
  if (!message) return { ok: false, error: { code: "validation", message: "Pega lo que contestó." } };
  const lead = await loadAdLead(db, leadId);
  if (!lead || lead.workspace_id !== actor.workspaceId || !(await canActOn(db, actor, leadId))) {
    return { ok: false, error: { code: "not_found", message: "El prospecto ya no existe." } };
  }
  const name = adBusinessName(lead.business_name, lead.giro) ?? `su ${giroCopy(lead.giro).label.toLowerCase()}`;
  const token = await ensureParaLink(db, { leadId, channel: "whatsapp", businessName: lead.business_name });
  const link = leadLinkUrl(token, "para");
  const signer = actor.signature ?? (await getSettings(db, actor.workspaceId)).signature;

  let analysis: { intent: ReplyIntent; price: string | null; reply: string } | null = null;
  if (isRejection(message)) {
    analysis = { intent: "rechazo", price: null, reply: "Disculpe la molestia. No le volveremos a escribir. Que le vaya muy bien." };
  } else {
    try {
      analysis = parseReplyAnalysis(
        await generateText(REPLY_SYSTEM, replyPrompt({ businessName: name, giroLabel: giroCopy(lead.giro).label, product: giroAdCopy(lead.giro).product.name, text: message, link, signer }), {
          maxOutputTokens: 500,
          thinkingLevel: "minimal",
        }),
      );
    } catch (error) {
      console.error("[growth] reply assist failed:", error);
    }
    const price = analysis?.price ?? priceIn(message);
    analysis ??= { intent: price ? "precio" : "otro", price, reply: `¡Gracias! Aquí están sus anuncios, son suyos: ${link}` };
    if (analysis.intent === "rechazo") analysis = { ...analysis, intent: "duda" };
    analysis.price = price;
  }

  if (analysis.intent === "rechazo") {
    const result = await recordOutcome(db, { leadId, outcome: "not_interested", actor: "operator", actorId: actor.userId, payload: { reason: "rechazo" } });
    if (!result.ok) return result;
  } else {
    const result = await recordOutcome(db, { leadId, outcome: "whatsapp_replied", actor: "operator", actorId: actor.userId });
    if (!result.ok) return result;
    if (analysis.price) await setLeadAdPrice(db, leadId, "prod", analysis.price);
  }

  return {
    ok: true,
    data: {
      leadId,
      businessName: name,
      intent: analysis.intent,
      price: analysis.price,
      reply: analysis.reply,
      phone: analysis.intent === "rechazo" ? null : lead.phone_e164,
      token,
    },
  };
}

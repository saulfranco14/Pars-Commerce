import { REJECTION_PATTERNS } from "@/features/growth/constants/replyKeywords";

export type ReplyIntent = "precio" | "costo" | "interes" | "duda" | "rechazo" | "otro";

export interface ReplyAnalysis {
  intent: ReplyIntent;
  /** Digits of the price they gave for the product in the ad, if any. */
  price: string | null;
  reply: string;
}

const INTENTS: ReplyIntent[] = ["precio", "costo", "interes", "duda", "rechazo", "otro"];
const MAX_REPLY = 700;

export const REPLY_SYSTEM = [
  "Ayudas a una persona de Tlaco a contestar por WhatsApp a dueños de negocios pequeños de México a quienes les regaló 4 anuncios hechos con IA para su Estado.",
  "Tlaco es gratis para empezar: su tienda en línea, pedidos por WhatsApp y anuncios. Nunca prometas precios, descuentos ni resultados de ventas.",
  "Clasifica la respuesta del dueño: precio (dio el precio de su producto), costo (pregunta cuánto cuesta Tlaco), interes (quiere saber más o dice que sí), duda (otra pregunta), rechazo (no quiere o se molesta), otro.",
  "Escribe la respuesta corta, cálida y de usted, de máximo 3 oraciones, sin emojis. Incluye el link tal cual cuando ayude. Si es rechazo, una disculpa breve y que no se le volverá a escribir.",
  'Responde SOLO un JSON: {"intent":"precio|costo|interes|duda|rechazo|otro","price":"25" o null,"reply":"texto"}.',
].join("\n");

export function replyPrompt(input: { businessName: string; giroLabel: string; product: string; text: string; link: string; signer: string }): string {
  return [
    `Negocio: ${input.businessName} (${input.giroLabel}). Producto del anuncio: ${input.product}.`,
    `Link de sus anuncios: ${input.link}`,
    `Quien firma: ${input.signer}`,
    `Lo que contestó el dueño:\n«${input.text.slice(0, 1500)}»`,
  ].join("\n");
}

/** A rejection is decided by our own rules first, whatever the model says. */
export function isRejection(text: string): boolean {
  return REJECTION_PATTERNS.some((pattern) => pattern.test(text));
}

/** The first price in the text: «a 25», «$1,250», «25 pesos». */
export function priceIn(text: string): string | null {
  const match = text.match(/\$\s*(\d{1,3}(?:,\d{3})+|\d{1,6})|\b(?:a|en)\s+(\d{1,6})\b|\b(\d{1,6})\s*(?:pesos|varos)\b/i);
  const value = match?.[1] ?? match?.[2] ?? match?.[3];
  return value ? value.replace(/,/g, "").replace(/^0+/, "") || null : null;
}

/** Reads the model's JSON; null when it is not usable, so the caller falls back to a fixed reply. */
export function parseReplyAnalysis(raw: string): ReplyAnalysis | null {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]) as { intent?: unknown; price?: unknown; reply?: unknown };
    const intent = INTENTS.find((value) => value === parsed.intent);
    const reply = typeof parsed.reply === "string" ? parsed.reply.trim().slice(0, MAX_REPLY) : "";
    if (!intent || !reply) return null;
    const price = typeof parsed.price === "string" || typeof parsed.price === "number" ? String(parsed.price).replace(/\D/g, "") || null : null;
    return { intent, price, reply };
  } catch {
    return null;
  }
}

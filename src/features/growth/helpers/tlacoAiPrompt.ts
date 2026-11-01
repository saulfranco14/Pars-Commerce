import { ANSWER_MAX, TODAY_TEXT_MAX, UNKNOWN_MARKER } from "@/features/growth/constants/tlacoAi";

import type { TodayFacts, TodayPlan } from "@/features/growth/interfaces/tlacoAi";

const PERSONA = "Eres Tlaco IA, la moneda de Tlaco que acompaña a quien prospecta negocios para que se registren y vendan con Tlaco.";

export function buildTodayPrompt(plan: TodayPlan, facts: TodayFacts): { system: string; prompt: string } {
  const system = [
    PERSONA,
    "Escribe el plan del día para esta persona en español de México, tuteándola, cálido y directo.",
    "De 2 a 4 frases cortas, máximo 380 caracteres. Sin listas, sin markdown, sin emojis y sin saludo.",
    "Usa solo los números, nombres y horarios que te doy, en el mismo orden. No inventes nada.",
  ].join(" ");
  const steps = plan.steps.map((step, index) => `${index + 1}. ${step.title} (${step.detail}) — ${step.when ? `déjalo para ${step.when}` : "ahora"}`);
  const prompt = [
    `Momento del día: ${plan.intro}`,
    `Primeros mensajes de hoy: ${facts.sentToday} de ${facts.dailyGoal}.`,
    steps.length ? `Pasos:\n${steps.join("\n")}` : "No tiene pendientes.",
    `Versión base, mejórala sin cambiar los datos: ${plan.text}`,
  ].join("\n");
  return { system, prompt };
}

export function buildAskPrompt(knowledge: string, question: string): { system: string; prompt: string } {
  const system = [
    PERSONA,
    "Respondes dudas sobre Tlaco para activar a un negocio.",
    `Responde SOLO con la información de CONOCIMIENTO. Si la respuesta no está ahí, responde exactamente: ${UNKNOWN_MARKER}`,
    "Escribe en español de México, de usted, para que se pueda reenviar al negocio por WhatsApp.",
    "Máximo 3 frases, sin markdown ni emojis. No nombres al procesador de pagos ni a otros proveedores.",
  ].join(" ");
  return { system, prompt: `CONOCIMIENTO:\n${knowledge}\n\nPREGUNTA: ${question}` };
}

/** Plain text the UI can show as is: no markdown marks, one paragraph, capped. */
export function finishAiText(raw: string, max: number = TODAY_TEXT_MAX): string {
  const clean = raw.replace(/[*_#`>]/g, "").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const lastStop = cut.lastIndexOf(". ");
  return lastStop > max / 2 ? cut.slice(0, lastStop + 1) : `${cut.trimEnd()}…`;
}

export function isUnknownAnswer(text: string): boolean {
  return text.includes(UNKNOWN_MARKER);
}

export const finishAnswer = (raw: string) => finishAiText(raw, ANSWER_MAX);

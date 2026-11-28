import type { OutsideItem } from "@/features/ventas/interfaces/weekReport";

const MAX_ITEMS = 4;

export const OUTSIDE_SYSTEM = [
  "Eres analista de un sistema para negocios pequeños de México. Buscas en Google qué pasó afuera del negocio en una semana y lo explicas en español sencillo, de usted.",
  "Busca solo hechos de esa semana y de ese lugar o de todo el país: días festivos o puentes, quincena, eventos locales, clima (lluvias, frío, calor), cortes de agua o luz, bloqueos o noticias del municipio.",
  "Nunca digas que algo causó las ventas del negocio: escribe «coincide con» o «pudo influir». No inventes cifras ni eventos; si no encuentras nada del lugar, dilo con lo nacional.",
  'Responde SOLO un JSON: {"items":[{"title":"máximo 6 palabras","detail":"una o dos oraciones"}]} con 2 a 4 items.',
].join("\n");

export function outsidePrompt(input: { giroLabel: string; place: string; from: string; to: string }): string {
  return `Negocio: ${input.giroLabel} en ${input.place}, México.\nSemana: del ${input.from} al ${input.to}.\n¿Qué pasó afuera esa semana que pudo influir en sus ventas?`;
}

/** The model is asked for JSON but may wrap it in prose or fences; anything unusable gives an empty list. */
export function parseOutsideItems(text: string): OutsideItem[] {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return [];
  try {
    const parsed = JSON.parse(match[0]) as { items?: unknown };
    if (!Array.isArray(parsed.items)) return [];
    return parsed.items
      .flatMap((item) => {
        const value = item as { title?: unknown; detail?: unknown };
        if (typeof value.title !== "string" || typeof value.detail !== "string") return [];
        const title = value.title.trim().slice(0, 80);
        const detail = value.detail.trim().slice(0, 320);
        return title && detail ? [{ title, detail }] : [];
      })
      .slice(0, MAX_ITEMS);
  } catch {
    return [];
  }
}

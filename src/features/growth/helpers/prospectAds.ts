import { AD_FIELD_MAX, AD_GENERIC_NAME, AD_KINDS, giroAdCopy } from "@/features/growth/constants/prospectAds";
import { giroCopy } from "@/features/growth/constants/giroCopy";
import { zoneByMunicipio } from "@/features/growth/constants/zoneCopy";
import { formatBusinessName, isGenericBusinessName } from "@/features/growth/helpers/formatBusinessName";

import type { AdContent, AdEdit, AdEdits, AdKind, LeadAdsSource } from "@/features/growth/interfaces/prospectAds";

const NAMELESS = /\b(sin\s+nombre|s\/n)\b/i;
const LEGAL_SUFFIX = /[\s,]+s\.?\s*a\.?(\s+de\s+c\.?\s*v\.?)?\.?$/i;
const CONTROL = /\p{Cc}/gu;

/** The name to print, or null when DENUE has none worth showing (the ad then says «Este es mi negocio»). */
export function adBusinessName(raw: string, giro: string): string | null {
  if (!raw?.trim() || NAMELESS.test(raw) || isGenericBusinessName(raw)) return null;
  const name = formatBusinessName(raw.replace(LEGAL_SUFFIX, ""));
  if (!name || name.toLocaleLowerCase("es-MX") === giroCopy(giro).label.toLocaleLowerCase("es-MX")) return null;
  return name;
}

export function adDefaultPlace(colonia: string | null, municipio: string): string {
  const zone = zoneByMunicipio(municipio)?.label ?? municipio;
  return colonia?.trim() ? `Col. ${formatBusinessName(colonia)}, ${zone}` : zone;
}

function cleanText(value: unknown, max: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const text = value.replace(CONTROL, " ").replace(/\s+/g, " ").trim().slice(0, max);
  return text || undefined;
}

function cleanPrice(value: unknown): string | undefined {
  if (typeof value !== "string" && typeof value !== "number") return undefined;
  const digits = String(value).replace(/\D/g, "").replace(/^0+/, "").slice(0, AD_FIELD_MAX.price);
  return digits || undefined;
}

/** The page is public: keep only known ads and fields, short and printable. */
export function sanitizeAdEdits(raw: unknown): AdEdits {
  const source = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const edits: AdEdits = {};
  for (const kind of AD_KINDS) {
    const entry = source[kind] && typeof source[kind] === "object" ? (source[kind] as Record<string, unknown>) : null;
    if (!entry) continue;
    const edit: AdEdit = {
      text: cleanText(entry.text, AD_FIELD_MAX.text),
      price: kind === "promo" || kind === "prod" ? cleanPrice(entry.price) : undefined,
      place: kind === "giro" || kind === "name" ? cleanText(entry.place, AD_FIELD_MAX.place) : undefined,
    };
    const kept = Object.fromEntries(Object.entries(edit).filter(([, value]) => value !== undefined)) as AdEdit;
    if (Object.keys(kept).length) edits[kind] = kept;
  }
  return edits;
}

/** «$1,250»; the price is stored as digits. */
export function formatAdPrice(digits: string | null): string {
  if (!digits) return "$—";
  return `$${Number(digits).toLocaleString("es-MX")}`;
}

/** The field values the editor shows for each ad: the owner's edit, else the giro default. */
export function adFieldValues(source: Pick<LeadAdsSource, "businessName" | "giro" | "colonia" | "municipio" | "edits">): Record<AdKind, Required<AdEdit>> {
  const copy = giroAdCopy(source.giro);
  const place = adDefaultPlace(source.colonia, source.municipio);
  const name = adBusinessName(source.businessName, source.giro) ?? AD_GENERIC_NAME;
  const edit = (kind: AdKind) => source.edits[kind] ?? {};
  return {
    giro: { text: edit("giro").text ?? copy.giroLine, price: "", place: edit("giro").place ?? place },
    name: { text: edit("name").text ?? name, price: "", place: edit("name").place ?? place },
    promo: { text: edit("promo").text ?? copy.promo.what, price: edit("promo").price ?? copy.promo.price, place: "" },
    prod: { text: edit("prod").text ?? copy.product.name, price: edit("prod").price ?? copy.product.price, place: "" },
  };
}

/** The four gift ads of a prospect, in the order they are sent: giro, name, promotion, product. */
export function buildLeadAds(source: LeadAdsSource): AdContent[] {
  const copy = giroAdCopy(source.giro);
  const label = giroCopy(source.giro).label;
  const values = adFieldValues(source);
  const name = adBusinessName(source.businessName, source.giro);
  return [
    { kind: "giro", eyebrow: label, headline: values.giro.text, price: null, detail: values.giro.place, cta: null, icon: copy.icon, backgroundUrl: source.backgrounds.giro ?? null, tone: "teal" },
    { kind: "name", eyebrow: "Abierto hoy", headline: values.name.text, price: null, detail: `${label} · ${values.name.place}`, cta: "Pídale por WhatsApp", icon: "store", backgroundUrl: null, tone: "blue" },
    { kind: "promo", eyebrow: "Promoción", headline: values.promo.text, price: values.promo.price, detail: copy.promo.when, cta: "Pregunte", icon: "tag", backgroundUrl: null, tone: "gold" },
    { kind: "prod", eyebrow: name ?? label, headline: values.prod.text, price: values.prod.price, detail: null, cta: "Pídalo por WhatsApp", icon: copy.icon, backgroundUrl: source.backgrounds.producto ?? null, tone: "amber" },
  ];
}

function seedOf(value: string): number {
  let hash = 0;
  for (const char of value) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return hash;
}

/** Same lead, same background, until «Otro» moves the offset. */
export function pickBackground(urls: string[], seed: string, offset: number): string | null {
  if (!urls.length) return null;
  return urls[(seedOf(seed) + Math.max(0, offset)) % urls.length];
}

/** Headline size as a share of the base, so long names still fit in two or three lines. */
export function headlineScale(text: string): number {
  const length = text.length;
  if (length <= 14) return 1;
  if (length <= 22) return 0.86;
  if (length <= 30) return 0.74;
  return 0.64;
}
